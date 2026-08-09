// Autenticación del panel /admin: token largo en variable de entorno (ADMIN_TOKEN),
// separado por completo del sistema de claves de prospectos. Se manda por header
// (no query string) para que nunca quede en logs de acceso ni en URLs compartidas.
function isAdminRequest(req) {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return false;
  const auth = req.headers.authorization || '';
  const provided = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  return provided.length > 0 && provided === token;
}

module.exports = { isAdminRequest };
