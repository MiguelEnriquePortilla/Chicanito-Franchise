// POST /api/admin/revocar — revoca (o reactiva) una clave de prospecto.
// Va en POST, no PATCH: en producción PATCH con header Authorization
// custom devolvía 401 de forma consistente (probado contra el deploy real;
// GET y POST con el mismo token funcionan bien) — probablemente algún
// intermediario entre el navegador y la función se come el header en
// PATCH. POST es el método que ya usa el resto de la app, así que es la
// opción robusta.
const { isAdminRequest } = require('../../lib/admin-auth');
const { getSql, ensureTables } = require('../../lib/db');

function normalizar(code) {
  return String(code || '').trim().toUpperCase().replace(/\s+/g, '');
}

module.exports = async (req, res) => {
  if (!isAdminRequest(req)) {
    res.status(401).json({ error: 'No autorizado' });
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    res.status(500).json({ error: 'DATABASE_URL no configurada' });
    return;
  }

  const { code, active } = req.body || {};
  const codeNorm = normalizar(code);
  if (!codeNorm || typeof active !== 'boolean') {
    res.status(400).json({ error: 'Falta code o active' });
    return;
  }

  try {
    const sql = getSql();
    await ensureTables(sql);
    await sql`UPDATE access_codes SET active = ${active} WHERE code = ${codeNorm}`;
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
};
