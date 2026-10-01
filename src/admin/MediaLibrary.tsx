import React, { useState, useEffect, useCallback } from 'react';
import {
  listPortfolioMedia,
  uploadPortfolioImage,
  deletePortfolioMediaByPaths,
} from '../services/mediaService';
import type { MediaFile } from '../types/project';
import {
  Upload,
  Copy,
  Check,
  Trash2,
  Eye,
  RefreshCw,
  Loader2,
  X,
  Image as ImageIcon,
} from 'lucide-react';

interface MediaLibraryProps {
  onNotify: (type: 'success' | 'error', message: string) => void;
}

function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === undefined || isNaN(bytes)) return 'Size N/A';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export default function MediaLibrary({ onNotify }: MediaLibraryProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaFile | null>(null);

  const loadMedia = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listPortfolioMedia();
      setFiles(list);
    } catch (err: unknown) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'Failed to load media library.'
      );
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const selected: File[] = Array.from(fileList);
    setUploading(true);
    setUploadProgress(10);

    try {
      for (let i = 0; i < selected.length; i++) {
        await uploadPortfolioImage(selected[i], 'library', (pct) => {
          const overall = Math.round(((i + pct / 100) / selected.length) * 100);
          setUploadProgress(overall);
        });
      }
      onNotify(
        'success',
        `Uploaded ${selected.length} image${selected.length === 1 ? '' : 's'} to portfolio bucket.`
      );
      await loadMedia();
    } catch (err: unknown) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'Image upload failed.'
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      onNotify('success', 'Image URL copied to clipboard.');
      setTimeout(() => setCopiedUrl(null), 2500);
    } catch {
      onNotify('error', 'Could not copy URL to clipboard.');
    }
  };

  const handleDelete = async (item: MediaFile) => {
    try {
      await deletePortfolioMediaByPaths([item.path]);
      setFiles((prev) => prev.filter((f) => f.path !== item.path));
      onNotify('success', `Deleted "${item.name}" from storage.`);
    } catch (err: unknown) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'Failed to delete media file.'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
        <div>
          <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#00685b]">
            SUPABASE STORAGE BUCKET: PORTFOLIO-IMAGES
          </span>
          <h2 className="font-display text-2xl font-black text-slate-900">
            Media Library ({files.length})
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            Upload, preview, copy public URLs, and manage portfolio images (JPG, JPEG, PNG, WEBP).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={loadMedia}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2.5 font-display text-xs font-bold text-slate-700 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <label className="inline-flex items-center gap-2 rounded-xl bg-[#00685b] hover:bg-[#005348] px-4 py-2.5 font-display text-xs font-bold text-white shadow-xs cursor-pointer">
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading ({uploadProgress}%)</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>Upload Image</span>
              </>
            )}
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {uploading && (
        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full bg-[#00685b] transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-7 w-7 text-[#00685b] animate-spin" />
            <p className="font-display text-xs font-bold text-slate-500">
              Loading portfolio images...
            </p>
          </div>
        ) : files.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ImageIcon className="h-6 w-6" />
            </div>
            <p className="font-display text-sm font-bold text-slate-700">
              No uploaded images in the portfolio bucket yet
            </p>
            <p className="font-sans text-xs text-slate-500">
              Click "Upload Image" above or upload cover/gallery images inside any project.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {files.map((item) => (
              <div
                key={item.path}
                className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 flex flex-col justify-between shadow-2xs"
              >
                <div className="space-y-3 p-3">
                  <div
                    onClick={() => setPreviewItem(item)}
                    className="aspect-[16/10] rounded-xl overflow-hidden bg-slate-200/60 border border-slate-200 cursor-pointer relative group"
                  >
                    <img
                      src={item.url}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <p
                      className="font-display text-xs font-bold text-slate-900 truncate"
                      title={item.name}
                    >
                      {item.name}
                    </p>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      <span>{formatBytes(item.size)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-1.5 border-t border-slate-200/80 bg-white px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => setPreviewItem(item)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <Eye className="h-3 w-3" />
                    <span>Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyUrl(item.url)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-[#00685b] hover:bg-slate-50 cursor-pointer"
                  >
                    {copiedUrl === item.url ? (
                      <>
                        <Check className="h-3 w-3" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-700 hover:bg-red-100 cursor-pointer"
                    title="Delete Image"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-display text-sm font-black text-slate-900 truncate">
                  {previewItem.name}
                </h3>
                <p className="font-mono text-[11px] text-slate-500">
                  {formatBytes(previewItem.size)} • Uploaded{' '}
                  {new Date(previewItem.created_at).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-slate-900 max-h-[65vh] flex items-center justify-center">
              <img
                src={previewItem.url}
                alt={previewItem.name}
                className="max-h-[65vh] w-auto object-contain"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <input
                type="text"
                readOnly
                value={previewItem.url}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600"
              />
              <button
                type="button"
                onClick={() => handleCopyUrl(previewItem.url)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#00685b] px-4 py-2 font-display text-xs font-bold text-white cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy URL</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
