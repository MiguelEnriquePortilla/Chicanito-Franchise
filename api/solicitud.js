// POST /api/solicitud — guarda la solicitud de visita/llamada (bloque 12).
// Requiere sesión válida (el `code` se adjunta automáticamente desde la
// cookie, nunca desde el cliente). Honeypot: si viene lleno, se responde
// éxito sin guardar nada, para no delatarle al bot que fue detectado.
const { readSession } = require('../lib/session');
const { getSql, ensureTables } = require('../lib/db');
const { notificarMiguel } = require('../lib/email');

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

  const body = req.body || {};
  if (body.empresa) {
    res.status(200).json({ ok: true });
    return;
  }

  const nombre = String(body.nombre || '').trim();
  const telefono = String(body.telefono || '').trim();
  const correo = String(body.correo || '').trim();
  const ciudad = String(body.ciudad || '').trim();
  const capitalRango = String(body.capital_rango || '').trim() || null;
  const comoNosConociste = String(body.como_nos_conociste || '').trim() || null;
  const consentimiento = Boolean(body.consentimiento);

  if (!nombre || !telefono || !correo || !ciudad || !consentimiento) {
    res.status(400).json({ error: 'Faltan campos requeridos' });
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    res.status(500).json({ error: 'DATABASE_URL no configurada' });
    return;
  }

  try {
    const sql = getSql();
    await ensureTables(sql);
    await sql`
      INSERT INTO leads (code, nombre, telefono, correo, ciudad, capital_rango, como_nos_conociste, consentimiento)
      VALUES (${code}, ${nombre}, ${telefono}, ${correo}, ${ciudad}, ${capitalRango}, ${comoNosConociste}, ${consentimiento})
    `;
    res.status(200).json({ ok: true });

    notificarMiguel(
      `Nueva solicitud: ${nombre}`,
      `<p><strong>${nombre}</strong> pidió visita y llamada.</p>
       <p>Clave: ${code}<br>Teléfono: ${telefono}<br>Correo: ${correo}<br>Ciudad: ${ciudad}<br>Capital: ${capitalRango || 'no especificado'}</p>`
    ).catch(() => {});
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
};
