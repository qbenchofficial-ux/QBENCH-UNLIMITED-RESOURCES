import React, { useState, useEffect, useCallback } from 'react';
import {
  listPortfolioMedia,
  uploadPortfolioImage,
  deletePortfolioMediaByPaths,
  validatePortfolioImage,
  formatFileSize,
  MAX_PORTFOLIO_IMAGE_SIZE_MB,
  type StorageFolderTarget,
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

interface StagedMediaFile {
  tempId: string;
  file: File;
  previewUrl: string;
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
  const [targetFolder, setTargetFolder] =
    useState<StorageFolderTarget>('site');
  const [stagedFiles, setStagedFiles] = useState<StagedMediaFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
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

  const stageSelectedFiles = (selected: File[]) => {
    if (!selected || selected.length === 0) return;
    const valid: StagedMediaFile[] = [];
    for (let i = 0; i < selected.length; i++) {
      const file = selected[i];
      const err = validatePortfolioImage(file);
      if (err) {
        onNotify('error', err);
        return;
      }
      valid.push({
        tempId: `media-${Date.now()}-${i}-${Math.random()
          .toString(36)
          .slice(2, 6)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }
    setStagedFiles((prev) => [...prev, ...valid]);
  };

  const handleFileInputSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const selected: File[] = Array.from(fileList);
    e.target.value = '';
    stageSelectedFiles(selected);
  };

  const handleDropFiles = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (uploading) return;
    const dropped: File[] = Array.from(e.dataTransfer.files || []);
    if (dropped.length > 0) {
      stageSelectedFiles(dropped);
    }
  };

  const handleReplaceStaged = (
    idx: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const err = validatePortfolioImage(file);
    if (err) {
      onNotify('error', err);
      return;
    }
    setStagedFiles((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        URL.revokeObjectURL(item.previewUrl);
        return {
          ...item,
          file,
          previewUrl: URL.createObjectURL(file),
        };
      })
    );
  };

  const handleRemoveStaged = (idx: number) => {
    setStagedFiles((prev) => {
      const target = prev[idx];
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleUploadStaged = async () => {
    if (stagedFiles.length === 0) return;
    setUploading(true);
    setUploadProgress(10);

    try {
      for (let i = 0; i < stagedFiles.length; i++) {
        await uploadPortfolioImage(
          stagedFiles[i].file,
          targetFolder,
          (pct) => {
            const overall = Math.round(
              ((i + pct / 100) / stagedFiles.length) * 100
            );
            setUploadProgress(overall);
          }
        );
        URL.revokeObjectURL(stagedFiles[i].previewUrl);
      }
      const count = stagedFiles.length;
      setStagedFiles([]);
      onNotify(
        'success',
        `Uploaded ${count} image${
          count === 1 ? '' : 's'
        } to portfolio-images/${targetFolder}/.`
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
            Upload images from your local computer (Desktop, Downloads, Documents, C: or D: drive) to{' '}
            <code className="font-mono text-[#00685b]">
              portfolio-images/{targetFolder}/
            </code>{' '}
            (JPG, JPEG, PNG, WEBP, sanitized SVG up to {MAX_PORTFOLIO_IMAGE_SIZE_MB} MB).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={targetFolder}
            onChange={(e) =>
              setTargetFolder(e.target.value as StorageFolderTarget)
            }
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 focus:border-[#00685b] focus:outline-none"
          >
            <option value="site">Folder: portfolio-images/site/</option>
            <option value="categories">
              Folder: portfolio-images/categories/
            </option>
            <option value="library">Folder: portfolio-images/library/</option>
          </select>

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
                <span>Upload from Computer</span>
              </>
            )}
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.svg,image/jpeg,image/png,image/webp,image/svg+xml"
              onChange={handleFileInputSelect}
              disabled={uploading}
              className="hidden"
            />
          </label>

          <label className="inline-flex items-center gap-1.5 rounded-xl border border-[#00685b]/30 bg-white hover:bg-[#00685b]/5 px-3.5 py-2.5 font-display text-xs font-bold text-[#00685b] cursor-pointer">
            <ImageIcon className="h-4 w-4" />
            <span>Browse Files</span>
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.svg,image/jpeg,image/png,image/webp,image/svg+xml"
              onChange={handleFileInputSelect}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!uploading) setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
        }}
        onDrop={handleDropFiles}
        className={`rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
          isDragging
            ? 'border-[#00685b] bg-[#00685b]/10'
            : 'border-slate-300 bg-white hover:border-[#00685b]/50'
        }`}
      >
        <div className="max-w-lg mx-auto space-y-1.5">
          <div className="mx-auto h-10 w-10 rounded-xl bg-[#00685b]/10 text-[#00685b] flex items-center justify-center">
            <Upload className="h-5 w-5" />
          </div>
          <p className="font-display text-xs font-bold text-slate-800">
            Drag & drop images from your computer here, or{' '}
            <label className="text-[#00685b] underline cursor-pointer">
              Browse Files
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp,.svg,image/jpeg,image/png,image/webp,image/svg+xml"
                onChange={handleFileInputSelect}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </p>
          <p className="font-sans text-[11px] text-slate-500">
            Supports Desktop, Downloads, Documents, C: drive, D: drive • JPG, JPEG, PNG, WEBP, SVG (max {MAX_PORTFOLIO_IMAGE_SIZE_MB} MB)
          </p>
        </div>
      </div>

      {/* Pre-upload Staged Files Preview */}
      {stagedFiles.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/75 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-200/80 px-2.5 py-0.5 font-tech text-[10px] font-bold uppercase tracking-wider text-amber-950">
                {stagedFiles.length} Local File{stagedFiles.length === 1 ? '' : 's'} Selected — Preview Before Uploading
              </span>
              <p className="text-xs text-amber-900 mt-0.5">
                Target path: <code className="font-mono">portfolio-images/{targetFolder}/</code>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={uploading}
                onClick={handleUploadStaged}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#00685b] hover:bg-[#005348] px-4 py-2 font-display text-xs font-bold text-white cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                <span>Upload {stagedFiles.length} Selected</span>
              </button>

              <button
                type="button"
                disabled={uploading}
                onClick={() => {
                  stagedFiles.forEach((s) => URL.revokeObjectURL(s.previewUrl));
                  setStagedFiles([]);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white hover:bg-red-50 px-3 py-2 font-display text-xs font-bold text-red-700 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {stagedFiles.map((item, idx) => (
              <div
                key={item.tempId}
                className="rounded-xl border border-amber-300 bg-white p-3 space-y-2"
              >
                <div className="aspect-[16/10] rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-[11px] font-mono">
                  <p className="font-bold text-slate-800 truncate" title={item.file.name}>
                    {item.file.name}
                  </p>
                  <p className="text-slate-500">{formatFileSize(item.file.size)}</p>
                </div>
                <div className="flex items-center justify-between gap-1 pt-1">
                  <label className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-bold text-[#00685b] hover:bg-slate-50 cursor-pointer">
                    <RefreshCw className="h-3 w-3" />
                    <span>Replace</span>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.svg,image/jpeg,image/png,image/webp,image/svg+xml"
                      onChange={(e) => handleReplaceStaged(idx, e)}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => handleRemoveStaged(idx)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-100 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
              Click "Upload from Computer" or "Browse Files" above, or upload cover/gallery images inside any project.
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
                    className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 cursor-pointer"
                    title="Delete file"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {previewItem && (
        <div
          onClick={() => setPreviewItem(null)}
          className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="min-w-0">
                <p className="font-display text-sm font-black text-slate-900 truncate">
                  {previewItem.name}
                </p>
                <p className="font-mono text-xs text-slate-500 truncate">
                  portfolio-images/{previewItem.path}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 bg-slate-950 flex items-center justify-center max-h-[75vh]">
              <img
                src={previewItem.url}
                alt={previewItem.name}
                className="max-h-[68vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
