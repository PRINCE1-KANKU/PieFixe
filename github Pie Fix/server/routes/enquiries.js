const express = require('express');
const rateLimit = require('express-rate-limit');
const supabase = require('../utils/supabaseClient');
const { sendEnquiryEmails } = require('../utils/email');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Prevent the contact form being used as a spam cannon.
const enquiryLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in a few minutes.' }
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value, max) {
  return String(value ?? '').trim().slice(0, max);
}

function toApiShape(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    appliance: row.appliance,
    message: row.message,
    source: row.source,
    createdAt: row.created_at
  };
}

// POST /api/enquiries - public. Validates, stores, and emails the enquiry.
router.post('/', enquiryLimiter, async (req, res, next) => {
  try {
    const body = req.body || {};

    // Honeypot field: real users never fill this in, bots often do.
    if (clean(body.website, 100)) {
      return res.status(200).json({ ok: true }); // pretend success, drop silently
    }

    const enquiry = {
      name: clean(body.name, 100),
      email: clean(body.email, 150),
      phone: clean(body.phone, 40),
      appliance: clean(body.appliance, 60),
      message: clean(body.message, 2000),
      source: clean(body.source, 40) || 'Website'
    };

    if (!enquiry.name || !enquiry.email || !EMAIL_RE.test(enquiry.email)) {
      return res.status(400).json({ error: 'A valid name and email address are required.' });
    }

    const { data, error } = await supabase
      .from('enquiries')
      .insert(enquiry)
      .select()
      .single();
    if (error) throw error;

    const emailResult = await sendEnquiryEmails({ ...enquiry, createdAt: data.created_at });

    res.status(201).json({
      ok: true,
      message: "Thanks — we've got your enquiry and will be in touch soon.",
      emailSent: emailResult.notifiedBusiness,
      warning: emailResult.error || undefined
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/enquiries - protected. Lets the admin workspace review submissions.
router.get('/', requireAdmin, async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('enquiries')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data.map(toApiShape));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
