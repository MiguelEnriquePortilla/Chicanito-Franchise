// POST /api/aceptar-terminos — marca que el prospecto de la sesión actual
// leyó y aceptó confidencialidad + aviso de privacidad. Idempotente: si ya
// estaba aceptado, no pisa la fecha original.
const { readSession } = require('../lib/session');
const { getSql, ensureTables, getCodeStatus } = require('../lib/db');

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

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    res.status(500).json({ error: 'DATABASE_URL no configurada' });
    return;
  }

  try {
    const sql = getSql();
    await ensureTables(sql);

    const estado = await getCodeStatus(sql, code);
    if (!estado.active) {
      res.status(401).json({ error: 'Sesión inválida' });
      return;
    }

    await sql`
      UPDATE access_codes
      SET nda_accepted_at = COALESCE(nda_accepted_at, now())
      WHERE code = ${code}
    `;
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
};
