const express = require('express');
const multer = require('multer');
const { v4: uuid } = require('uuid');
const supabase = require('../utils/supabaseClient');
const { requireAdmin } = require('../middleware/auth');
const { sendPostUpdateEmail } = require('../utils/email');

const router = express.Router();
const BUCKET = 'post-images';

// Files are held in memory then streamed to Supabase Storage — nothing touches disk,
// which matters because most hosts (Render's free tier included) wipe local disk on redeploy.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    const err = new Error('Only PNG, JPEG or WEBP images are allowed.');
    err.status = 400;
    cb(err);
  }
});

function slugify(title) {
  return String(title)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'post';
}

async function uniqueSlug(baseSlug, ignoreId) {
  let slug = baseSlug;
  let counter = 2;
  // Loop until we find a slug nobody else is using (excluding the post being edited).
  for (;;) {
    let query = supabase.from('posts').select('id').eq('slug', slug);
    if (ignoreId) query = query.neq('id', ignoreId);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (!data) return slug;
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

function sanitisePost(input, existing = {}) {
  const clean = (value, max) => String(value ?? '').trim().slice(0, max);
  return {
    title: clean(input.title, 90) || existing.title,
    type: clean(input.type, 30) || existing.type || 'Repair tip',
    topic: clean(input.topic, 60) || existing.topic,
    reading_time: clean(input.readingTime, 20) || existing.reading_time || '03 min',
    summary: clean(input.summary, 220) || existing.summary,
    body: clean(input.body, 5000) || existing.body,
    status: input.status === 'draft' ? 'draft' : 'published'
  };
}

// Converts a DB row (snake_case) into the camelCase shape the frontend expects.
function toApiShape(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    type: row.type,
    topic: row.topic,
    readingTime: row.reading_time,
    summary: row.summary,
    body: row.body,
    status: row.status,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function uploadImage(file) {
  const ext = (file.originalname.match(/\.[a-zA-Z0-9]+$/) || [''])[0].toLowerCase();
  const path = `${uuid()}${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file.buffer, {
    contentType: file.mimetype,
    upsert: false
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// GET /api/posts - public. Only published posts, unless ?all=true with a valid admin token.
router.get('/', async (req, res, next) => {
  try {
    const wantsAll = req.query.all === 'true';

    if (!wantsAll) {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data.map(toApiShape));
    }

    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Sign in required to view drafts.' });

    return requireAdmin(req, res, async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data.map(toApiShape));
      } catch (error) {
        next(error);
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/posts/:slug - public, single published post.
router.get('/:slug', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', req.params.slug)
      .eq('status', 'published')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Post not found.' });
    res.json(toApiShape(data));
  } catch (error) {
    next(error);
  }
});

// POST /api/posts - protected. Create a new post, optional cover image upload.
router.post('/', requireAdmin, upload.single('image'), async (req, res, next) => {
  try {
    const clean = sanitisePost(req.body);
    if (!clean.title || !clean.topic || !clean.summary || !clean.body) {
      return res.status(400).json({ error: 'Title, topic, summary and body are all required.' });
    }

    const slug = await uniqueSlug(slugify(clean.title));
    const imageUrl = req.file ? await uploadImage(req.file) : null;

    const { data, error } = await supabase
      .from('posts')
      .insert({ ...clean, slug, image_url: imageUrl })
      .select()
      .single();
    if (error) throw error;

    const post = toApiShape(data);
    const emailResult = post.status === 'published'
      ? await sendPostUpdateEmail(post, 'created')
      : { sent: false, error: null };
    res.status(201).json({ ...post, emailSent: emailResult.sent, emailWarning: emailResult.error });
  } catch (error) {
    next(error);
  }
});

// PUT /api/posts/:id - protected. Edit an existing post.
router.put('/:id', requireAdmin, upload.single('image'), async (req, res, next) => {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!existing) return res.status(404).json({ error: 'Post not found.' });

    const clean = sanitisePost(req.body, existing);
    const slug = clean.title !== existing.title
      ? await uniqueSlug(slugify(clean.title), existing.id)
      : existing.slug;
    const imageUrl = req.file ? await uploadImage(req.file) : existing.image_url;

    const { data, error } = await supabase
      .from('posts')
      .update({ ...clean, slug, image_url: imageUrl, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;

    const post = toApiShape(data);
    const emailResult = post.status === 'published'
      ? await sendPostUpdateEmail(post, 'updated')
      : { sent: false, error: null };
    res.json({ ...post, emailSent: emailResult.sent, emailWarning: emailResult.error });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/posts/:id - protected.
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .delete()
      .eq('id', req.params.id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Post not found.' });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
