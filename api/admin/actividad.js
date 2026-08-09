// GET /api/admin/actividad — sin ?code: ficha resumen por prospecto
// (¿entró?, ¿cuánto tiempo estuvo?, qué escenario le interesó).
// Con ?code=XXX: la bitácora completa de eventos de ese prospecto.
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
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    res.status(200).json({ resumen: [], eventos: [] });
    return;
  }

  const sql = getSql();

  try {
    await ensureTables(sql);

    const codeParam = normalizar(req.query?.code);
    if (codeParam) {
      const eventos = await sql`
        SELECT tipo, payload, creado_en FROM events
        WHERE code = ${codeParam}
        ORDER BY creado_en DESC
        LIMIT 200
      `;
      res.status(200).json({ eventos });
      return;
    }

    const resumen = await sql`
      SELECT
        ac.code, ac.prospect_name, ac.active, ac.expires_at,
        ac.view_count, ac.first_seen_at, ac.last_seen_at,
        (
          SELECT payload FROM events e
          WHERE e.code = ac.code AND e.tipo = 'sesion_fin'
          ORDER BY e.creado_en DESC LIMIT 1
        ) AS ultima_sesion
      FROM access_codes ac
      ORDER BY ac.created_at DESC
    `;
    res.status(200).json({ resumen });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
};
