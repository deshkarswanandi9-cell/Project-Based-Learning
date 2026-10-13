import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

// In-memory cache for generated signed URLs to prevent redundant network requests
// Structure: Map<objectPath, { url: string, expiresAt: number }>
const signedUrlCache = new Map();

const configuredHost = (() => {
  try {
    const envUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 
                   (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL);
    return envUrl ? new URL(envUrl).hostname : null;
  } catch {
    return null;
  }
})();

/**
 * Safely extracts a normalized bucket-relative object path for the 'projects' bucket.
 * 
 * Handles:
 * - Bare object paths: "14-1718293849102-abc.png", "cert-14-1718.pdf", "user-uuid/filename.png"
 * - Full Supabase URLs: "https://<supabase-domain>/storage/v1/object/public/projects/<objectPath>"
 * - Signed Supabase URLs: "https://<supabase-domain>/storage/v1/object/sign/projects/<objectPath>?token=..."
 * 
 * Rejects:
 * - Null / non-string inputs
 * - Foreign domain URLs or URLs targeting other buckets
 * - Path traversal attempts ('..')
 *
 * @param {string} input - Storage path or legacy public URL
 * @returns {string|null} Normalized object path or null if invalid
 */
export function extractProjectsStoragePath(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Passthrough for temporary client-side data / blob URLs (e.g. from local file pickers)
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Case 1: Full URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      
      // Strict domain check: must match configured host or official Supabase domain
      const isAllowedHost = (configuredHost && parsed.hostname === configuredHost) || 
                            parsed.hostname.endsWith('.supabase.co');
      if (!isAllowedHost) {
        return null;
      }

      const marker = '/storage/v1/object/';
      const markerIndex = parsed.pathname.indexOf(marker);

      if (markerIndex !== -1) {
        const remainder = parsed.pathname.slice(markerIndex + marker.length);
        // Format expected: "<mode>/<bucket>/<objectPath...>"
        const segments = remainder.split('/');
        const mode = segments[0]; // 'public', 'authenticated', 'sign'
        const bucket = segments[1]; // 'projects'

        if (['public', 'authenticated', 'sign'].includes(mode) && bucket === 'projects' && segments.length >= 3) {
          const rawPath = segments.slice(2).join('/');
          const decoded = decodeURIComponent(rawPath);
          if (decoded && !decoded.includes('..')) {
            return decoded;
          }
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  // Case 2: Bucket-relative path (e.g. "14-123.png", "cert-14-123.pdf")
  const cleaned = trimmed.replace(/^\/+/, '');
  if (!cleaned || cleaned.includes('..')) {
    return null;
  }

  return cleaned;
}

/**
 * Resolves a short-lived authenticated signed URL for a given project attachment path or legacy URL.
 * Uses the authenticated client so Supabase Storage RLS policies enforce access control.
 *
 * @param {string} pathOrUrl - Object path or legacy URL
 * @param {number} expiresIn - Validity period in seconds (default: 3600 = 1 hour)
 * @returns {Promise<string|null>} Signed URL or null on failure
 */
export async function getSignedViewUrl(pathOrUrl, expiresIn = 3600) {
  if (!pathOrUrl) return null;

  // Passthrough for data/blob URLs
  if (typeof pathOrUrl === 'string' && (pathOrUrl.startsWith('data:') || pathOrUrl.startsWith('blob:'))) {
    return pathOrUrl;
  }

  const objectPath = extractProjectsStoragePath(pathOrUrl);
  if (!objectPath) {
    return null;
  }

  // Check cache (refresh 60 seconds before expiration)
  const cached = signedUrlCache.get(objectPath);
  const now = Date.now();
  if (cached && cached.expiresAt > now + 60 * 1000) {
    return cached.url;
  }

  try {
    const { data, error } = await supabase.storage
      .from('projects')
      .createSignedUrl(objectPath, expiresIn);

    if (error || !data?.signedUrl) {
      console.warn(`[storageUtils] Failed to generate signed URL for "${objectPath}":`, error?.message || 'Not found');
      return null;
    }

    // Cache the resolved signed URL
    signedUrlCache.set(objectPath, {
      url: data.signedUrl,
      expiresAt: now + expiresIn * 1000,
    });

    return data.signedUrl;
  } catch (err) {
    console.error(`[storageUtils] Error creating signed URL for "${objectPath}":`, err);
    return null;
  }
}

/**
 * Resolves signed URLs for an array of project attachment paths or legacy URLs.
 * Preserves the array length and order; failed items resolve to null.
 *
 * @param {string[]} pathsOrUrls - Array of paths or legacy URLs
 * @param {number} expiresIn - Validity in seconds
 * @returns {Promise<(string|null)[]>} Array of signed URLs
 */
export async function getSignedViewUrls(pathsOrUrls = [], expiresIn = 3600) {
  if (!Array.isArray(pathsOrUrls) || pathsOrUrls.length === 0) {
    return [];
  }
  return Promise.all(pathsOrUrls.map(item => getSignedViewUrl(item, expiresIn)));
}

/**
 * React hook to resolve and track signed URLs for an array of attachments.
 * Automatically triggers loading and provides clean error / fallback handling.
 *
 * @param {string[]|string} input - Single path/URL or array of paths/URLs
 * @param {number} expiresIn - Validity in seconds (default: 3600)
 * @returns {{ urls: string[], loading: boolean, error: string|null }}
 */
export function useSignedUrls(input, expiresIn = 3600) {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const inputKey = JSON.stringify(input);

  useEffect(() => {
    let isCancelled = false;

    async function fetchUrls() {
      await Promise.resolve();
      if (isCancelled) return;

      let items = [];
      try {
        const parsed = JSON.parse(inputKey);
        items = Array.isArray(parsed) ? parsed.filter(Boolean) : (parsed ? [parsed] : []);
      } catch {
        items = [];
      }

      if (items.length === 0) {
        setUrls([]);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const resolved = await getSignedViewUrls(items, expiresIn);
        if (isCancelled) return;
        const validUrls = resolved.filter(Boolean);
        setUrls(validUrls);
        if (validUrls.length === 0 && items.length > 0) {
          setError('Unable to load private project attachments. Please verify your access permissions.');
        }
      } catch (err) {
        if (isCancelled) return;
        setError(err.message || 'Error resolving secure document URLs');
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    fetchUrls();

    return () => {
      isCancelled = true;
    };
  }, [inputKey, expiresIn]);

  return { urls, loading, error };
}

/**
 * React hook to resolve a single signed URL for an attachment (e.g. certificate or document).
 *
 * @param {string|null} pathOrUrl
 * @param {number} expiresIn
 * @returns {{ url: string|null, loading: boolean, error: string|null }}
 */
export function useSignedUrl(pathOrUrl, expiresIn = 3600) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    async function fetchUrl() {
      await Promise.resolve();
      if (isCancelled) return;

      if (!pathOrUrl) {
        setUrl(null);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const resolved = await getSignedViewUrl(pathOrUrl, expiresIn);
        if (isCancelled) return;
        setUrl(resolved);
        if (!resolved) {
          setError('Document could not be accessed. Authorization required.');
        }
      } catch (err) {
        if (isCancelled) return;
        setError(err.message || 'Error resolving document URL');
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    fetchUrl();

    return () => {
      isCancelled = true;
    };
  }, [pathOrUrl, expiresIn]);

  return { url, loading, error };
}

