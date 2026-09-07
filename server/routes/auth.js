const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Slow down brute-force passphrase guessing.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Please try again later.' }
});

router.post('/login', loginLimiter, async (req, res) => {
  const { passphrase } = req.body || {};
  const hash = process.env.ADMIN_PASSPHRASE_HASH;

  if (!hash) {
    return res.status(500).json({ error: 'Server is not configured with an admin passphrase yet.' });
  }
  if (!passphrase) {
    return res.status(400).json({ error: 'Passphrase is required.' });
  }

  const isValid = await bcrypt.compare(passphrase, hash);
  if (!isValid) {
    return res.status(401).json({ error: 'That passphrase is not recognised.' });
  }

  const token = jwt.sign({ role: 'author' }, process.env.JWT_SECRET, { expiresIn: '12h' });
  res.cookie('pieFixeAdmin', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 12 * 60 * 60 * 1000,
    path: '/'
  });
  res.json({ expiresIn: 12 * 60 * 60 });
});

router.post('/logout', (_req, res) => {
  res.clearCookie('pieFixeAdmin', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/' });
  res.status(204).end();
});

module.exports = router;
