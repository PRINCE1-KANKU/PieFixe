require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Defense in depth: a bug in any route (ours or a future one) that lets a promise
// rejection go uncaught would otherwise crash the entire process and take the site
// down. Log it loudly instead of letting that happen.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection (server kept running):', reason);
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception (server kept running):', error);
});

const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const enquiriesRoutes = require('./routes/enquiries');

const app = express();
const PORT = process.env.PORT || 4000;

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
});

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  credentials: true,
  origin(origin, callback) {
    // Allow tools like curl/Postman (no origin header), but fail closed for browsers
    // when the production allowlist has not been configured.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} is not allowed by CORS.`));
  }
}));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});
app.use('/api', apiLimiter);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use((req, _res, next) => {
  const cookieHeader = req.headers.cookie || '';
  req.cookies = Object.fromEntries(cookieHeader.split(';').filter((part) => part.includes('=')).map((part) => {
    const separator = part.indexOf('=');
    const value = part.slice(separator + 1).trim();
    try {
      return [part.slice(0, separator).trim(), decodeURIComponent(value)];
    } catch {
      return [part.slice(0, separator).trim(), value];
    }
  }));
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    time: new Date().toISOString()
  });
});

app.use('/api/admin', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/enquiries', enquiriesRoutes);

// Fallback 404 for unknown API routes.
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

// Central error handler (e.g. multer file-type errors, CORS rejections, Supabase failures).
app.use((err, _req, res, _next) => {
  console.error(err);
  // Only expose the specific message for errors we deliberately threw with a status
  // (validation, auth, CORS). Anything else (e.g. a Supabase outage) gets a generic
  // message to the client — the real detail is already in the server logs above.
  const message = err.status ? (err.message || 'Something went wrong.') : 'Something went wrong on our end. Please try again shortly.';
  res.status(err.status || 500).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`Pie Fixe API listening on http://localhost:${PORT}`);
  if (allowedOrigins.length === 0) {
    console.warn('⚠️  CORS_ORIGIN is not set — browser requests are blocked until allowed origins are configured.');
  }
});
