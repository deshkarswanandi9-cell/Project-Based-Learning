import { createClient } from '@supabase/supabase-js';
import { getRecommendations } from './aiRecommendationService.js';

// In-memory per-user sliding window rate limiter
// Note: In serverless environments, this map is instance-local and guards against rapid client hammering.
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 6;

function checkRateLimit(userId) {
  const now = Date.now();
  const history = (rateLimitMap.get(userId) || []).filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS);

  if (history.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  history.push(now);
  rateLimitMap.set(userId, history);
  return true;
}

export default async function handler(req, res) {
  // 1. CORS headers
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  // 2. Protect against oversized payloads (> 50KB)
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > 50 * 1024) {
    return res.status(413).json({ error: 'Payload Too Large. Maximum allowed request size is 50 KB.' });
  }

  // 3. Authenticate request using Supabase Bearer token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: A valid institutional session token is required to generate AI recommendations.'
    });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[API recommendations] Server configuration error: Supabase environment variables missing.');
    return res.status(500).json({ error: 'Server authentication configuration is incomplete.' });
  }

  let authenticatedUserId = null;
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data, error: authError } = await supabase.auth.getUser(token);
    if (authError || !data?.user) {
      return res.status(401).json({
        error: 'Unauthorized: Session is invalid or has expired. Please log in again.'
      });
    }

    authenticatedUserId = data.user.id;
  } catch (err) {
    console.error('[API recommendations] Auth verification error:', err.message);
    return res.status(401).json({ error: 'Session verification failed.' });
  }

  // 4. Rate limiting per authenticated user
  if (!checkRateLimit(authenticatedUserId)) {
    return res.status(429).json({
      error: 'Rate limit exceeded: You can request AI recommendations up to 6 times per minute. Please review the current suggestions.'
    });
  }

  // 5. Parse body & invoke service
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const result = await getRecommendations(body, process.env);
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[API recommendations] Uncaught handler error:', err.message);
    return res.status(500).json({ error: 'An unexpected internal error occurred.' });
  }
}
