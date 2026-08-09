// GET /api/admin/leads — solicitudes de visita recibidas, más recientes primero.
const { isAdminRequest } = require('../../lib/admin-auth');
const { getSql, ensureTables } = require('../../lib/db');

module.exports = async (req, res) => {
  if (!isAdminRequest(req)) {
    res.status(401).json({ error: 'No autorizado' });
    return;
  }
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    res.status(200).json({ leads: [] });
    return;
  }

  try {
    const sql = getSql();
    await ensureTables(sql);
    const filas = await sql`SELECT * FROM leads ORDER BY creado_en DESC LIMIT 500`;
    res.status(200).json({ leads: filas });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
};
