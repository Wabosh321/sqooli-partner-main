// Simple build-time check to ensure required VITE_ env vars are present.
// During Convex → Supabase migration we require Supabase envs instead.
const required = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

const missing = required.filter((k) => !process.env[k]);

if (missing.length) {
  console.warn('\nMissing some recommended environment variables for build: ' + missing.join(', '));
  console.warn('If you are running a migration script that needs Convex, set CONVEX_URL explicitly.');
  // Do not fail hard here to keep local dev iterations smooth.
} else {
  console.log('All required env vars present: ' + required.join(', '));
}
