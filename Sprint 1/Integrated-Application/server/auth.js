import jwt from 'jsonwebtoken';

const COOKIE_NAME = 'ml_evaluator_session';

export function createSessionToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || secret === 'replace-this-with-a-long-random-secret-before-use') {
    throw new Error('JWT_SECRET must be set to a unique secret of at least 32 characters.');
  }
  return jwt.sign({ sub: String(user.id), email: user.email }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
    issuer: 'web-based-ml-model-evaluator',
    audience: 'ml-evaluator-client',
  });
}

export function sessionCookieOptions() {
  const production = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: production,
    sameSite: 'lax',
    path: '/',
    maxAge: 2 * 60 * 60 * 1000,
  };
}

export function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, sessionCookieOptions());
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  const secret = process.env.JWT_SECRET;
  if (!token || !secret || secret.length < 32) {
    return res.status(401).json({ message: 'Please sign in to continue.' });
  }
  try {
    req.auth = jwt.verify(token, secret, {
      issuer: 'web-based-ml-model-evaluator',
      audience: 'ml-evaluator-client',
    });
    return next();
  } catch {
    return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }
}
