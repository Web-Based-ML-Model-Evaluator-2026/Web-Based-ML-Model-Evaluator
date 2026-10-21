import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { createUser, findUserByEmail, initializeDatabase, publicUser } from './db.js';
import { clearSessionCookie, createSessionToken, requireAuth, setSessionCookie } from './auth.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

app.disable('x-powered-by');
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());

const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use('/api', (req, res, next) => {
  const origin = req.get('origin');
  if (origin && origin !== allowedOrigin && origin !== `http://127.0.0.1:5173`) {
    return res.status(403).json({ message: 'Origin not allowed.' });
  }
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  return next();
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please wait and try again.' },
});

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must contain at least 2 characters.').max(80, 'Name is too long.'),
  email: z.string().trim().email('Enter a valid email address.').max(254, 'Email is too long.'),
  password: z.string().min(8, 'Password must contain at least 8 characters.').max(72, 'Password is too long.'),
});
const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.').max(254),
  password: z.string().min(1, 'Password is required.').max(72),
});

function validationErrors(error) {
  return Object.fromEntries(error.issues.map((issue) => [issue.path[0], issue.message]));
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.post('/api/auth/register', authLimiter, async (req, res, next) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Please correct the highlighted fields.', errors: validationErrors(parsed.error) });
  }

  const name = parsed.data.name;
  const email = parsed.data.email.toLowerCase();
  try {
    const existing = await findUserByEmail(email);
    if (existing) return res.status(409).json({ message: 'An account with this email already exists.' });

    const rounds = Number.parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    if (!Number.isInteger(rounds) || rounds < 10 || rounds > 14) {
      throw new Error('BCRYPT_ROUNDS must be an integer between 10 and 14.');
    }
    const passwordHash = await bcrypt.hash(parsed.data.password, rounds);
    const user = await createUser({ name, email, passwordHash });
    const token = createSessionToken(user);
    setSessionCookie(res, token);
    return res.status(201).json({ message: 'Account created successfully.', user });
  } catch (error) {
    if (error?.code === 'SQLITE_CONSTRAINT' || error?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    return next(error);
  }
});

app.post('/api/auth/login', authLimiter, async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Enter a valid email address and password.', errors: validationErrors(parsed.error) });
  }

  try {
    const user = await findUserByEmail(parsed.data.email.toLowerCase());
    const passwordMatches = user
      ? await bcrypt.compare(parsed.data.password, user.password_hash)
      : false;

    if (!user || !passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = createSessionToken(user);
    setSessionCookie(res, token);
    return res.json({ message: 'Signed in successfully.', user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/auth/logout', (_req, res) => {
  clearSessionCookie(res);
  return res.json({ message: 'Signed out successfully.' });
});

app.get('/api/auth/me', requireAuth, async (req, res, next) => {
  try {
    const user = await findUserByEmail(req.auth.email);
    if (!user || String(user.id) !== String(req.auth.sub)) {
      clearSessionCookie(res);
      return res.status(401).json({ message: 'Please sign in to continue.' });
    }
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

app.use('/api', (_req, res) => res.status(404).json({ message: 'API endpoint not found.' }));

const distPath = path.join(root, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.use((error, _req, res, _next) => {
  // Avoid logging request bodies, passwords, cookies, or session tokens.
  console.error('Request failed:', error?.message || 'Unknown server error');
  res.status(500).json({ message: 'An unexpected server error occurred. Please try again.' });
});

initializeDatabase()
  .then(() => {
    app.listen(port, '127.0.0.1', () => {
      console.log(`Authentication API listening at http://127.0.0.1:${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize authentication database:', error.message);
    process.exit(1);
  });
