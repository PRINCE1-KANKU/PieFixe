const jwt = require('jsonwebtoken');

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ')
    ? header.slice(7)
    : req.cookies?.pieFixeAdmin;

  if (!token) {
    return res.status(401).json({ error: 'Sign in required.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'author') {
      return res.status(403).json({ error: 'Not authorised.' });
    }
    req.admin = payload;
    // `next` is sometimes an async callback (e.g. an inline route handler). If it
    // rejects and nobody catches that promise, Node treats it as a fatal, process-
    // crashing error. This safety net makes sure that can never bring the server down,
    // even if a future route forgets its own try/catch.
    const result = next();
    if (result && typeof result.catch === 'function') {
      result.catch((error) => {
        console.error('Unhandled error after requireAdmin:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Something went wrong on our end. Please try again shortly.' });
        }
      });
    }
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }
}

module.exports = { requireAdmin };
