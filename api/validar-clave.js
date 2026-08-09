// POST /api/validar-clave — valida una clave de prospecto en el servidor
// (nunca en el cliente), aplica rate limit por IP, y si es válida emite una
// cookie de sesión httpOnly firmada. No revela si una clave existió alguna vez.
const { getSql, ensureTables } = require('../lib/db');
const { createSessionCookie } = require('../lib/session');
const { notificarMiguel } = require('../lib/email');

const MENSAJE_INVALIDA = 'Esta clave ya no está activa. Escríbenos y te damos una nueva.';
const MAX_INTENTOS = 5;
const VENTANA_MINUTOS = 10;

function normalizar(code) {
  return String(code || '').trim().toUpperCase().replace(/\s+/g, '');
}

function obtenerIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.socket?.remoteAddress || 'desconocida';
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    res.status(500).json({ error: 'DATABASE_URL no configurada' });
    return;
  }

  const sql = getSql();
  const ip = obtenerIp(req);

  try {
    await ensureTables(sql);

    const desde = new Date(Date.now() - VENTANA_MINUTOS * 60 * 1000).toISOString();
    const intentos = await sql`
      SELECT COUNT(*)::int AS n FROM login_attempts
      WHERE ip = ${ip} AND attempted_at > ${desde}
    `;
    if (intentos[0].n >= MAX_INTENTOS) {
      res.status(429).json({ error: 'Demasiados intentos. Espera unos minutos e intenta de nuevo.' });
      return;
    }

    const code = normalizar(req.body?.code);
    if (!code) {
      res.status(400).json({ error: 'Falta la clave' });
      return;
    }

    const filas = await sql`SELECT * FROM access_codes WHERE code = ${code}`;
    const registro = filas[0];

    const ahora = new Date();
    const valida = registro && registro.active && new Date(registro.expires_at) > ahora;

    if (!valida) {
      await sql`INSERT INTO login_attempts (ip) VALUES (${ip})`;
      res.status(401).json({ error: MENSAJE_INVALIDA });
      return;
    }

    const primeraVez = !registro.first_seen_at;

    await sql`
      UPDATE access_codes
      SET
        first_seen_at = COALESCE(first_seen_at, now()),
        last_seen_at = now(),
        view_count = view_count + 1
      WHERE code = ${code}
    `;

    await sql`
      INSERT INTO events (code, tipo, payload)
      VALUES (${code}, 'entrada', ${JSON.stringify({ userAgent: req.headers['user-agent'] || null })})
    `;

    const cookie = createSessionCookie(code, registro.expires_at);
    res.setHeader('Set-Cookie', cookie);
    res.status(200).json({ ok: true, ndaAccepted: Boolean(registro.nda_accepted_at) });

    if (primeraVez) {
      notificarMiguel(
        `Nueva visita: ${registro.prospect_name || code}`,
        `<p>La clave <strong>${code}</strong> (${registro.prospect_name || 'sin nombre'}) se usó por primera vez.</p>`
      ).catch(() => {});
    }
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
};
