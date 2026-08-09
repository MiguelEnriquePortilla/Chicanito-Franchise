// TEMPORAL — solo para diagnosticar el 401 intermitente en /admin. Borrar
// después de usarlo. No expone el secreto completo, solo longitudes/hash corto.
module.exports = async (req, res) => {
  const envToken = process.env.ADMIN_TOKEN || '';
  const auth = req.headers.authorization || '';
  const provided = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  res.status(200).json({
    envTokenLen: envToken.length,
    envTokenEdges: envToken.length ? envToken[0] + '...' + envToken[envToken.length - 1] : null,
    providedLen: provided.length,
    providedEdges: provided.length ? provided[0] + '...' + provided[provided.length - 1] : null,
    match: provided === envToken,
    hasAuthHeader: !!req.headers.authorization,
  });
};
