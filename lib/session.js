// Cookies de sesión firmadas con HMAC-SHA256 (crypto nativo de Node, sin
// dependencias extra). Formato: base64url(code).expiresAtEpoch.firma
const crypto = require('crypto');

const COOKIE_NAME = 'inv_session';

function b64url(str) {
  return Buffer.from(str, 'utf8').toString('base64url');
}
function fromB64url(str) {
  return Buffer.from(str, 'base64url').toString('utf8');
}

function sign(payload) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET no configurada');
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

function createSessionCookie(code, expiresAt) {
  const expiresEpoch = Math.floor(new Date(expiresAt).getTime() / 1000);
  const payload = `${b64url(code)}.${expiresEpoch}`;
  const sig = sign(payload);
  const token = `${payload}.${sig}`;
  const maxAge = Math.max(0, expiresEpoch - Math.floor(Date.now() / 1000));
  const parts = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  return parts.join('; ');
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    out[k] = v;
  });
  return out;
}

// Devuelve el `code` si la cookie de la petición es válida y no ha vencido, o null.
function readSession(req) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [codeB64, expiresEpochStr, sig] = parts;
  const payload = `${codeB64}.${expiresEpochStr}`;

  let expectedSig;
  try {
    expectedSig = sign(payload);
  } catch {
    return null;
  }
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  const expiresEpoch = parseInt(expiresEpochStr, 10);
  if (!Number.isFinite(expiresEpoch) || expiresEpoch < Math.floor(Date.now() / 1000)) {
    return null;
  }

  try {
    return fromB64url(codeB64);
  } catch {
    return null;
  }
}

module.exports = { COOKIE_NAME, createSessionCookie, clearSessionCookie, readSession };
