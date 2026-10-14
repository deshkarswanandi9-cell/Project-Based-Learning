import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createClient } from '@supabase/supabase-js';
import { getRecommendations } from './api/aiRecommendationService.js';

// In-memory sliding window rate limiter for development middleware
const devRateLimitMap = new Map();
const DEV_WINDOW_MS = 60 * 1000;
const DEV_MAX_REQUESTS = 6;

function checkDevRateLimit(key) {
  const now = Date.now();
  const timestamps = (devRateLimitMap.get(key) || []).filter(ts => now - ts < DEV_WINDOW_MS);
  if (timestamps.length >= DEV_MAX_REQUESTS) return false;
  timestamps.push(now);
  devRateLimitMap.set(key, timestamps);
  return true;
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  return {
    plugins: [
      react(),
      {
        name: 'ai-recommendations-dev-api',
        configureServer(server) {
          server.middlewares.use('/api/recommendations', async (req, res, next) => {
            if (req.method === 'POST') {
              // 1. Guard against oversized payloads (> 50KB)
              const contentLength = parseInt(req.headers['content-length'] || '0', 10);
              if (contentLength > 50 * 1024) {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 413;
                return res.end(JSON.stringify({ error: 'Payload too large. Maximum allowed size is 50 KB.' }));
              }

              // 2. Enforce Bearer token authorization
              const authHeader = req.headers.authorization;
              if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 401;
                return res.end(
                  JSON.stringify({
                    error: 'Unauthorized: A valid institutional session token is required to generate AI recommendations.'
                  })
                );
              }

              const token = authHeader.replace(/^Bearer\s+/i, '').trim();
              let userId = 'dev-user';

              if (supabaseUrl && supabaseAnonKey && token !== 'test-mock-token') {
                try {
                  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
                  const { data, error } = await supabase.auth.getUser(token);
                  if (error || !data?.user) {
                    res.setHeader('Content-Type', 'application/json');
                    res.statusCode = 401;
                    return res.end(
                      JSON.stringify({
                        error: 'Unauthorized: Session is invalid or expired. Please sign in again.'
                      })
                    );
                  }
                  userId = data.user.id;
                } catch (e) {
                  console.warn('Auth check error in dev middleware:', e.message);
                }
              }

              // 3. User rate limit check
              if (!checkDevRateLimit(userId)) {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 429;
                return res.end(
                  JSON.stringify({
                    error: 'Rate limit exceeded: You can request recommendations up to 6 times per minute.'
                  })
                );
              }

              let body = '';
              req.on('data', chunk => {
                body += chunk;
              });
              req.on('end', async () => {
                try {
                  const payload = body ? JSON.parse(body) : {};
                  const result = await getRecommendations(payload, { ...process.env, ...env });
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = result.status;
                  res.end(JSON.stringify(result.body));
                } catch {
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: 'Internal server error in dev API' }));
                }
              });
            } else {
              next();
            }
          });
        }
      }
    ]
  };
});
