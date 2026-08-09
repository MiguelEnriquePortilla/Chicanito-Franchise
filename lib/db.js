// Conexión compartida a Neon Postgres + creación de tablas (auto-migración,
// igual que en chicanito-app: CREATE TABLE IF NOT EXISTS, nunca migraciones a mano).
const { neon } = require('@neondatabase/serverless');

function getSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;
  return neon(databaseUrl);
}

async function ensureTables(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS access_codes (
      id SERIAL PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      prospect_name TEXT,
      prospect_phone TEXT,
      notes TEXT,
      expires_at TIMESTAMPTZ NOT NULL,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      first_seen_at TIMESTAMPTZ,
      last_seen_at TIMESTAMPTZ,
      view_count INTEGER NOT NULL DEFAULT 0
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS login_attempts (
      id SERIAL PRIMARY KEY,
      ip TEXT NOT NULL,
      attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      code TEXT,
      nombre TEXT NOT NULL,
      telefono TEXT NOT NULL,
      correo TEXT NOT NULL,
      ciudad TEXT NOT NULL,
      capital_rango TEXT,
      como_nos_conociste TEXT,
      consentimiento BOOLEAN NOT NULL DEFAULT false,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      code TEXT NOT NULL,
      tipo TEXT NOT NULL,
      payload JSONB,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

// La cookie de sesión es autocontenida (firma HMAC), así que por sí sola no
// se entera si la clave fue revocada después de emitirla. Esto reconfirma
// contra la base en cada petición protegida, para que revocar bloquee de
// inmediato aunque la sesión siga "firmada válida".
async function codeIsActive(sql, code) {
  const filas = await sql`SELECT active, expires_at FROM access_codes WHERE code = ${code}`;
  const registro = filas[0];
  return Boolean(registro && registro.active && new Date(registro.expires_at) > new Date());
}

module.exports = { getSql, ensureTables, codeIsActive };
