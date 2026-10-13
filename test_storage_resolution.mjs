import { extractProjectsStoragePath } from './src/utils/storageUtils.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

console.log('=== Storage Path Normalization & Security Tests ===\n');

// 1. Bare relative path formats
assert(
  extractProjectsStoragePath('14-1718293849102-x8q3k9.png') === '14-1718293849102-x8q3k9.png',
  'Extracts student integer ID filename'
);

assert(
  extractProjectsStoragePath('cert-14-1718293849102-x8q3k9.pdf') === 'cert-14-1718293849102-x8q3k9.pdf',
  'Extracts certificate filename format'
);

assert(
  extractProjectsStoragePath('d3b07384-d113-463e-9c8a-78b1d9d9f1c2-1718.png') === 'd3b07384-d113-463e-9c8a-78b1d9d9f1c2-1718.png',
  'Extracts legacy UUID prefix format'
);

assert(
  extractProjectsStoragePath('d3b07384-d113-463e-9c8a-78b1d9d9f1c2/screenshot1.png') === 'd3b07384-d113-463e-9c8a-78b1d9d9f1c2/screenshot1.png',
  'Extracts folder-based structure'
);

// 2. Legacy Full Supabase Public URLs
const sampleLegacyUrl = 'https://zyfiafbswvltuzplivda.supabase.co/storage/v1/object/public/projects/14-1718293849102-x8q3k9.png';
assert(
  extractProjectsStoragePath(sampleLegacyUrl) === '14-1718293849102-x8q3k9.png',
  'Extracts object path from full legacy public URL'
);

const sampleCertUrl = 'https://zyfiafbswvltuzplivda.supabase.co/storage/v1/object/public/projects/cert-14-1718293849102-x8q3k9.pdf';
assert(
  extractProjectsStoragePath(sampleCertUrl) === 'cert-14-1718293849102-x8q3k9.pdf',
  'Extracts certificate path from full legacy certificate URL'
);

// 3. Encoded paths in URLs
const sampleEncodedUrl = 'https://zyfiafbswvltuzplivda.supabase.co/storage/v1/object/public/projects/folder%20name/my%20file.png';
assert(
  extractProjectsStoragePath(sampleEncodedUrl) === 'folder name/my file.png',
  'Decodes URL-encoded object paths correctly'
);

// 4. Signed URLs
const sampleSignedUrl = 'https://zyfiafbswvltuzplivda.supabase.co/storage/v1/object/sign/projects/14-123.png?token=exp123';
assert(
  extractProjectsStoragePath(sampleSignedUrl) === '14-123.png',
  'Extracts path from signed Supabase URL'
);

// 5. Security & Negative Tests
assert(
  extractProjectsStoragePath('https://malicious.com/storage/v1/object/public/projects/exploit.png') === null,
  'Rejects foreign URL domain'
);

assert(
  extractProjectsStoragePath('https://zyfiafbswvltuzplivda.supabase.co/storage/v1/object/public/other_bucket/file.png') === null,
  'Rejects URLs targeting a different storage bucket'
);

assert(
  extractProjectsStoragePath('../../etc/passwd') === null,
  'Rejects path traversal attempts with ".."'
);

assert(
  extractProjectsStoragePath('https://zyfiafbswvltuzplivda.supabase.co/storage/v1/object/public/projects/../../etc/passwd') === null,
  'Rejects path traversal inside full URL'
);

assert(
  extractProjectsStoragePath(null) === null,
  'Handles null input safely'
);

assert(
  extractProjectsStoragePath('') === null,
  'Handles empty string safely'
);

assert(
  extractProjectsStoragePath('   ') === null,
  'Handles whitespace safely'
);

// 6. getSignedViewUrl negative & edge cases
const { getSignedViewUrl, getSignedViewUrls } = await import('./src/utils/storageUtils.js');

const nullRes = await getSignedViewUrl(null);
assert(nullRes === null, 'getSignedViewUrl returns null for null input');

const invalidRes = await getSignedViewUrl('https://evil.com/fake.png');
assert(invalidRes === null, 'getSignedViewUrl returns null for foreign domain');

const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const dataUrlRes = await getSignedViewUrl(dataUrl);
assert(dataUrlRes === dataUrl, 'getSignedViewUrl returns data URL directly without modification');

const batchEmpty = await getSignedViewUrls([]);
assert(Array.isArray(batchEmpty) && batchEmpty.length === 0, 'getSignedViewUrls returns empty array for empty input');

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
