// /api/admin/claves — panel de administración de claves de prospecto.
// GET: lista todas las claves. POST: crea una nueva. PATCH: revoca una existente.
// Protegido por ADMIN_TOKEN (header Authorization: Bearer), separado por
// completo del sistema de claves de prospectos.
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

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    res.status(500).json({ error: 'DATABASE_URL no configurada' });
    return;
  }

  const sql = getSql();

  try {
    await ensureTables(sql);

    if (req.method === 'GET') {
      const filas = await sql`
        SELECT code, prospect_name, prospect_phone, notes, expires_at, active,
               created_at, first_seen_at, last_seen_at, view_count
        FROM access_codes
        ORDER BY created_at DESC
      `;
      res.status(200).json({ claves: filas });
      return;
    }

    if (req.method === 'POST') {
      const { code, prospect_name, prospect_phone, notes, expires_at } = req.body || {};
      const codeNorm = normalizar(code);
      if (!codeNorm || !expires_at) {
        res.status(400).json({ error: 'Falta code o expires_at' });
        return;
      }
      try {
        await sql`
          INSERT INTO access_codes (code, prospect_name, prospect_phone, notes, expires_at)
          VALUES (${codeNorm}, ${prospect_name || null}, ${prospect_phone || null}, ${notes || null}, ${expires_at})
        `;
      } catch (e) {
        if (String(e).includes('23505')) {
          res.status(409).json({ error: 'Esa clave ya existe' });
          return;
        }
        throw e;
      }
      res.status(200).json({ ok: true });
      return;
    }

    if (req.method === 'PATCH') {
      const { code, active } = req.body || {};
      const codeNorm = normalizar(code);
      if (!codeNorm || typeof active !== 'boolean') {
        res.status(400).json({ error: 'Falta code o active' });
        return;
      }
      await sql`UPDATE access_codes SET active = ${active} WHERE code = ${codeNorm}`;
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Método no permitido' });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
};
