import assert from 'node:assert';
import fs from 'node:fs';

console.log('=== RSCOE PBL Portal: Vercel Routing & Configuration Verification ===\n');

// 1. Verify vercel.json exists and is valid JSON
assert(fs.existsSync('vercel.json'), 'vercel.json must exist in root directory');
const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));

// 2. Verify rewrites array
assert(Array.isArray(vercelConfig.rewrites), 'vercel.json must define rewrites array');

// 3. Verify /api/(.*) pass-through rule
const apiRewrite = vercelConfig.rewrites.find(r => r.source === '/api/(.*)');
assert(apiRewrite, 'vercel.json must contain rewrite rule preserving /api/(.*)');
assert.strictEqual(apiRewrite.destination, '/api/$1', '/api/(.*) must rewrite to /api/$1');

// 4. Verify SPA catch-all rule
const spaRewrite = vercelConfig.rewrites.find(r => r.source === '/(.*)');
assert(spaRewrite, 'vercel.json must contain SPA catch-all rule /(.*)');
assert.strictEqual(spaRewrite.destination, '/index.html', '/(.*) must route to /index.html');

// 5. Verify .gitignore ignores .env but preserves .env.example
const gitignore = fs.readFileSync('.gitignore', 'utf8');
assert(gitignore.includes('.env'), '.gitignore must ignore .env');
assert(gitignore.includes('!.env.example'), '.gitignore must preserve .env.example');

console.log('[PASS] vercel.json exists and is valid');
console.log('[PASS] Vercel rewrites preserve /api/(.*) serverless endpoints');
console.log('[PASS] Vercel rewrites forward all client SPA routes to /index.html');
console.log('[PASS] .gitignore correctly ignores environment secrets');
console.log('\nAll deployment configuration tests passed successfully!');
