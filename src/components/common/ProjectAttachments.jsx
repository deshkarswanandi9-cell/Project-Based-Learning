import React from 'react';
import { Image as ImageIcon, Award, FileText, ExternalLink, Loader2 } from 'lucide-react';
import { useSignedUrls } from '../../utils/storageUtils';

function parseRawUrls(rawUrl) {
  if (!rawUrl) return [];
  if (Array.isArray(rawUrl)) return rawUrl.filter(Boolean);
  if (typeof rawUrl === 'string') {
    const trimmed = rawUrl.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      } catch {
        // fallthrough
      }
    }
    return [trimmed];
  }
  return [];
}

export function ProjectScreenshotsGallery({ rawUrls, colsClass = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' }) {
  const { urls, loading, error } = useSignedUrls(rawUrls);

  if (!rawUrls || rawUrls.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <ImageIcon className="w-3.5 h-3.5" /> Screenshots
      </p>
      {loading ? (
        <div className="flex items-center gap-2 py-3 text-xs text-gray-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />
          <span>Loading secure screenshots...</span>
        </div>
      ) : error && urls.length === 0 ? (
        <p className="text-xs text-gray-400 italic">Unable to load screenshots ({error})</p>
      ) : (
        <div className={`grid ${colsClass} gap-2`}>
          {urls.map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-md overflow-hidden border border-gray-200 aspect-video bg-gray-50 hover:border-gray-400 transition group relative"
            >
              <img
                src={url}
                alt={`Screenshot ${i + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-[10px] text-white font-medium">
                View Full
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProjectCertificateLink({ rawUrl, type }) {
  const rawList = React.useMemo(() => parseRawUrls(rawUrl), [rawUrl]);

  const { urls, loading, error } = useSignedUrls(rawList);

  if (!rawUrl || rawList.length === 0) return null;

  const isHackathon = type?.includes('Hackathon');
  const sectionTitle = isHackathon
    ? `Hackathon Certificate / Proof (${rawList.length})`
    : `Attached Document / Proof (${rawList.length})`;

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <Award className="w-3.5 h-3.5 text-amber-700" />
        {sectionTitle}
      </p>
      {loading ? (
        <div className="flex items-center gap-2 py-1.5 text-xs text-gray-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
          <span>Loading secure document{rawList.length > 1 ? 's' : ''}...</span>
        </div>
      ) : urls.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {urls.map((u, i) => (
            <a
              key={i}
              href={u}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-900 rounded-md text-xs font-medium transition group shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-amber-700" />
              <span>
                {rawList.length === 1
                  ? (isHackathon ? 'View Hackathon Certificate / Proof' : 'View Attached Document / Proof')
                  : `View Certificate ${i + 1}`}
              </span>
              <ExternalLink className="w-3 h-3 text-amber-600 ml-0.5" />
            </a>
          ))}
        </div>
      ) : (
        <span className="text-xs text-red-500 italic">Document link unavailable or unauthorized ({error})</span>
      )}
    </div>
  );
}
