const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let client = null;

if (url && serviceKey) {
  // IMPORTANT: the service role key bypasses Row Level Security. It must only
  // ever be used here, on the server. Never send this key to the browser.
  client = createClient(url, serviceKey, { auth: { persistSession: false } });
} else {
  console.warn('⚠️  SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set — database calls will fail until you add them to .env. See .env.example.');
}

// Accessing any property (e.g. supabase.from(...)) before configuration throws a
// clear, catchable error instead of the whole process crashing at startup.
module.exports = new Proxy({}, {
  get(_target, prop) {
    if (!client) {
      const err = new Error('Server is not configured with Supabase credentials yet (see server/.env.example).');
      err.status = 500;
      throw err;
    }
    return client[prop];
  }
});
