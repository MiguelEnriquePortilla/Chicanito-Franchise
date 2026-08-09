// GET/POST /api/admin/tipo-cambio — el default de tipoCambio que usa el
// simulador para prospectos nuevos, editable sin tocar código (brief §6).
const { isAdminRequest } = require('../../lib/admin-auth');
const { getSql, ensureTables } = require('../../lib/db');

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
      const filas = await sql`SELECT value FROM settings WHERE key = 'tipo_cambio'`;
      res.status(200).json({ tipoCambio: filas[0] ? parseFloat(filas[0].value) : 18.5 });
      return;
    }

    if (req.method === 'POST') {
      const valor = parseFloat(req.body?.tipoCambio);
      if (!Number.isFinite(valor) || valor <= 0) {
        res.status(400).json({ error: 'tipoCambio inválido' });
        return;
      }
      await sql`
        INSERT INTO settings (key, value, updated_at) VALUES ('tipo_cambio', ${String(valor)}, now())
        ON CONFLICT (key) DO UPDATE SET value = ${String(valor)}, updated_at = now()
      `;
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Método no permitido' });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
};
