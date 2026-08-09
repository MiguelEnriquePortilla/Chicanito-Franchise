// POST /api/evento — guarda un evento de telemetría ligado al `code` de la
// sesión (nunca confía en un code mandado desde el cliente). Best-effort:
// nunca debe romper la experiencia del prospecto si la base de datos falla.
const { readSession } = require('../lib/session');
const { getSql, ensureTables } = require('../lib/db');

const TIPOS_VALIDOS = new Set([
  'variable_cambio',
  'sesion_fin',
  'form_abierto',
  'form_enviado',
]);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const code = readSession(req);
  if (!code) {
    res.status(401).json({ error: 'Sesión inválida' });
    return;
  }

  const { tipo, payload } = req.body || {};
  if (!TIPOS_VALIDOS.has(tipo)) {
    res.status(400).json({ error: 'Tipo de evento inválido' });
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    res.status(200).json({ saved: false });
    return;
  }

  try {
    const sql = getSql();
    await ensureTables(sql);
    await sql`
      INSERT INTO events (code, tipo, payload)
      VALUES (${code}, ${tipo}, ${JSON.stringify(payload || {})})
    `;
    res.status(200).json({ saved: true });
  } catch (e) {
    res.status(200).json({ saved: false, error: String(e) });
  }
};
