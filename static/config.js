// Public client config. Fill these in to turn on accounts (Supabase free tier).
// The anon key is designed to be public; Row Level Security in supabase/schema.sql protects the data.
// NEVER put the service_role key here or anywhere in this repo.
// Leave empty to keep accounts off: the site shows "accounts coming soon" and hides favorites/comments.
window.SITE_CONFIG = {
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: ""
};
