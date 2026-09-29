import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Folder, 
  File, 
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  Presentation, 
  Trash2, 
  Upload, 
  Plus, 
  FolderPlus, 
  FilePlus, 
  ChevronLeft, 
  Search, 
  LogOut, 
  User, 
  ExternalLink,
  Loader2,
  AlertTriangle,
  ArrowRight,
  HardDrive,
  Grid,
  List,
  RefreshCw,
  Home
} from 'lucide-react';
import { googleSignIn, initAuth, logout, getAccessToken } from '../lib/firebaseAuth';
import { User as FirebaseUser } from 'firebase/auth';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  thumbnailLink?: string;
}

export default function DriveView() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // File explorer states
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [folderHistory, setFolderHistory] = useState<{ id: string; name: string }[]>([
    { id: 'root', name: 'My Drive' }
  ]);

  // Modals & Forms
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateDoc, setShowCreateDoc] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  
  // Delete confirmation
  const [fileToDelete, setFileToDelete] = useState<DriveFile | null>(null);

  // Drag and drop state
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentFolder = folderHistory[folderHistory.length - 1];

  // Initialize Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setLoadingAuth(false);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setLoadingAuth(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch files when token or current folder changes
  useEffect(() => {
    if (accessToken) {
      fetchFiles();
    }
  }, [accessToken, currentFolder.id]);

  const fetchFiles = async () => {
    if (!accessToken) return;
    setLoadingFiles(true);
    setErrorMsg(null);
    try {
      // Build Google Drive query
      const parentId = currentFolder.id;
      const q = `'${parentId}' in parents and trashed = false`;
      const fields = 'files(id, name, mimeType, size, modifiedTime, webViewLink, thumbnailLink)';
      const orderBy = 'folder, name';
      
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}&orderBy=${encodeURIComponent(orderBy)}&pageSize=50`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, log out gracefully
          await handleLogout();
          throw new Error('Your Google session has expired. Please sign in again.');
        }
        throw new Error(`Google Drive API error: ${response.statusText}`);
      }

      const data = await response.json();
      setFiles(data.files || []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to load files from Google Drive.');
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMsg(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Login failed. Please verify popup blocker settings and try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setAccessToken(null);
      setFiles([]);
      setFolderHistory([{ id: 'root', name: 'My Drive' }]);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Navigate deeper into a folder
  const handleFolderClick = (id: string, name: string) => {
    setFolderHistory([...folderHistory, { id, name }]);
  };

  // Navigate backward in history
  const handleNavigateBack = () => {
    if (folderHistory.length > 1) {
      setFolderHistory(folderHistory.slice(0, -1));
    }
  };

  const handleNavigateToBreadcrumb = (index: number) => {
    setFolderHistory(folderHistory.slice(0, index + 1));
  };

  // Create a new folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !accessToken) return;
    
    setLoadingFiles(true);
    try {
      const response = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          mimeType: 'application/vnd.google-apps.folder',
          parents: [currentFolder.id],
        }),
      });

      if (!response.ok) throw new Error('Failed to create folder.');

      setNewFolderName('');
      setShowCreateFolder(false);
      await fetchFiles();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating folder.');
    } finally {
      setLoadingFiles(false);
    }
  };

  // Create a new Google Document
  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim() || !accessToken) return;

    setLoadingFiles(true);
    try {
      const response = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newDocName.trim(),
          mimeType: 'application/vnd.google-apps.document',
          parents: [currentFolder.id],
        }),
      });

      if (!response.ok) throw new Error('Failed to create Google Document.');

      setNewDocName('');
      setShowCreateDoc(false);
      await fetchFiles();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating document.');
    } finally {
      setLoadingFiles(false);
    }
  };

  // Upload file to Google Drive using robust 2-step protocol
  const uploadFileToDrive = async (file: File) => {
    if (!accessToken) return;
    setIsUploading(true);
    setUploadProgress(`Preparing metadata for "${file.name}"...`);

    try {
      // Step 1: Create empty file metadata
      const metaResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          parents: [currentFolder.id],
        }),
      });

      if (!metaResponse.ok) throw new Error('Failed to create file metadata.');
      const metaData = await metaResponse.json();
      const fileId = metaData.id;

      setUploadProgress(`Uploading actual file payload (${Math.round(file.size / 1024)} KB)...`);

      // Step 2: Upload raw file content via media endpoint
      const mediaResponse = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': file.type || 'application/octet-stream',
          },
          body: file,
        }
      );

      if (!mediaResponse.ok) throw new Error('Failed to upload file content.');

      setUploadProgress(null);
      await fetchFiles();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Destructive delete confirmation dialog handler (Mandatory)
  const handleDeleteFile = async () => {
    if (!fileToDelete || !accessToken) return;

    setLoadingFiles(true);
    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) throw new Error('Could not delete selected file.');

      setFileToDelete(null);
      await fetchFiles();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error deleting file.');
    } finally {
      setLoadingFiles(false);
    }
  };

  // File Upload Handlers (Drag & Drop + Button Select)
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFileToDrive(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFileToDrive(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Map Google mimeType to elegant Lucide Icons
  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') {
      return <Folder className="h-6 w-6 text-emerald-600 fill-emerald-600/15" />;
    }
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="h-6 w-6 text-sky-500" />;
    }
    if (mimeType === 'application/pdf') {
      return <FileText className="h-6 w-6 text-rose-500" />;
    }
    if (mimeType === 'application/vnd.google-apps.document' || mimeType.includes('document')) {
      return <FileText className="h-6 w-6 text-blue-500" />;
    }
    if (mimeType === 'application/vnd.google-apps.spreadsheet' || mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return <FileSpreadsheet className="h-6 w-6 text-emerald-500" />;
    }
    if (mimeType === 'application/vnd.google-apps.presentation' || mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
      return <Presentation className="h-6 w-6 text-amber-500" />;
    }
    return <File className="h-6 w-6 text-slate-400" />;
  };

  const formatBytes = (bytes?: number) => {
    if (bytes === undefined || bytes === null) return '—';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Filter files based on search
  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="drive-view-container" className="mx-auto max-w-7xl px-6 py-12 lg:px-12">
      
      {/* Dynamic Header */}
      <div id="drive-header-title" className="space-y-4 mb-10 text-center md:text-left">
        <span className="font-tech text-xs tracking-widest text-[#00685b] font-bold uppercase block">
          PROJECT WORKSPACE & CLOUD COLLABORATION
        </span>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-brand-text leading-tight">
          Client Asset Delivery <span className="text-brand-primary">Portal</span>
        </h1>
        <p className="font-sans text-xs sm:text-sm text-brand-text-muted max-w-2xl leading-relaxed">
          Access your digital creative assets, vector design kits, video project briefs, and marketing spreadsheets securely connected directly to your Google Drive.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {loadingAuth ? (
          <motion.div 
            key="auth-loader"
            className="flex flex-col items-center justify-center py-24 space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader2 className="h-10 w-10 text-brand-primary animate-spin" />
            <p className="font-sans text-xs text-brand-text-muted">Authenticating workspace access...</p>
          </motion.div>
        ) : !user ? (
          /* Authentication Sign-In Card */
          <motion.div 
            key="signin-card"
            className="bg-brand-surface-low border border-brand-outline/25 rounded-3xl p-8 md:p-12 text-center max-w-2xl mx-auto space-y-6 shadow-sm"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mx-auto h-16 w-16 bg-[#00685b]/10 rounded-full flex items-center justify-center text-brand-primary mb-2">
              <HardDrive className="h-8 w-8 text-[#00685b]" />
            </div>
            
            <div className="space-y-2">
              <h2 className="font-display text-xl md:text-2xl font-extrabold text-brand-text">
                Connect your Google Drive
              </h2>
              <p className="font-sans text-xs md:text-sm text-brand-text-muted leading-relaxed max-w-md mx-auto">
                Sign in securely via Google to list requirements, upload project briefs, and view design deliverable files on your drive. QBench processes everything securely client-side.
              </p>
            </div>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs py-3 px-4 rounded-xl flex items-center gap-2 max-w-md mx-auto">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="font-sans leading-normal">{errorMsg}</span>
              </div>
            )}

            {/* gsi-style-button */}
            <div className="flex justify-center pt-2">
              <button 
                id="gsi-drive-button"
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="flex items-center justify-center space-x-3 rounded-xl border border-brand-outline/40 bg-white hover:bg-brand-surface-low text-brand-text font-display text-xs font-bold px-6 py-3 shadow-sm cursor-pointer transition-all hover:border-[#00685b]/40 hover:-translate-y-0.5 active:translate-y-0"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-brand-text-muted" />
                    <span>Connecting with Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="pt-4 border-t border-brand-outline/10 text-[10px] font-mono text-brand-text-muted">
              🔒 Standard OAuth 2.0 Client-Side Integration
            </div>
          </motion.div>
        ) : (
          /* Main Interactive Workspace Area */
          <motion.div 
            key="drive-explorer"
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            
            {/* User Profile Bar */}
            <div className="bg-brand-surface border border-brand-outline/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="h-10 w-10 rounded-full border border-[#00685b]/25" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-[#00685b]/10 text-brand-primary flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <h4 className="font-display text-xs font-bold text-brand-text">{user.displayName || 'Workspace Client'}</h4>
                  <p className="font-mono text-[10px] text-brand-text-muted">{user.email}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Disconnect</span>
              </button>
            </div>

            {/* Error notifications */}
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs py-3.5 px-4 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span className="font-sans leading-normal">{errorMsg}</span>
                </div>
                <button 
                  onClick={() => setErrorMsg(null)}
                  className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-800 hover:underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Actions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* File Upload Zone (Left Column) */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                
                {/* Drag-and-Drop Uploader */}
                <div 
                  id="drag-upload-zone"
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center transition-all duration-300 min-h-[220px] select-none ${
                    dragActive 
                      ? 'border-[#00c9a7] bg-[#00c9a7]/5 scale-[1.01]' 
                      : 'border-brand-outline/30 bg-brand-surface-low hover:border-[#00685b]/40 hover:bg-white/30'
                  }`}
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    className="hidden" 
                    onChange={handleFileSelect}
                  />

                  {isUploading ? (
                    <div className="space-y-4">
                      <Loader2 className="mx-auto h-8 w-8 text-brand-primary animate-spin" />
                      <p className="font-sans text-xs text-brand-primary font-bold animate-pulse">
                        {uploadProgress || 'Uploading file...'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 cursor-pointer" onClick={triggerFileInput}>
                      <div className="mx-auto h-10 w-10 bg-[#00685b]/10 text-brand-primary rounded-full flex items-center justify-center">
                        <Upload className="h-5 w-5 text-[#00685b]" />
                      </div>
                      <div>
                        <p className="font-display text-xs font-bold text-brand-text">
                          Drag file here or <span className="text-brand-primary underline">browse</span>
                        </p>
                        <p className="font-sans text-[10px] text-brand-text-muted mt-1">
                          Up to 10MB brief documents, PDFs, logos, sheets.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Create Folder / Document Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => { setShowCreateFolder(true); setShowCreateDoc(false); }}
                    className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-[#00685b]/10 hover:bg-[#00685b]/15 text-[#00685b] border border-brand-outline/10 text-xs font-bold transition-all cursor-pointer"
                  >
                    <FolderPlus className="h-4 w-4" />
                    <span>New Folder</span>
                  </button>
                  <button 
                    onClick={() => { setShowCreateDoc(true); setShowCreateFolder(false); }}
                    className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-brand-primary/5 hover:bg-brand-primary/10 text-brand-primary border border-brand-outline/10 text-xs font-bold transition-all cursor-pointer"
                  >
                    <FilePlus className="h-4 w-4" />
                    <span>New Doc</span>
                  </button>
                </div>

                {/* Inline Folder Creation Form */}
                {showCreateFolder && (
                  <motion.form 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-white border border-brand-outline/25 p-4 rounded-2xl space-y-3 overflow-hidden"
                    onSubmit={handleCreateFolder}
                  >
                    <p className="font-display text-[11px] font-bold text-brand-text uppercase tracking-wider">Create New Folder</p>
                    <input 
                      type="text"
                      required
                      placeholder="Folder Name (e.g. QBench Designs)"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      className="w-full bg-brand-surface-low border border-brand-outline/25 rounded-xl px-3 py-2 text-xs font-display focus:border-[#00685b] focus:outline-none"
                    />
                    <div className="flex justify-end gap-2 text-xs font-semibold">
                      <button 
                        type="button" 
                        onClick={() => setShowCreateFolder(false)}
                        className="px-3 py-1.5 rounded-lg text-brand-text-muted hover:bg-brand-surface-low cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="px-3 py-1.5 rounded-lg bg-[#00685b] text-white hover:bg-[#178373] cursor-pointer"
                      >
                        Create
                      </button>
                    </div>
                  </motion.form>
                )}

                {/* Inline Document Creation Form */}
                {showCreateDoc && (
                  <motion.form 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-white border border-brand-outline/25 p-4 rounded-2xl space-y-3 overflow-hidden"
                    onSubmit={handleCreateDocument}
                  >
                    <p className="font-display text-[11px] font-bold text-brand-text uppercase tracking-wider">Create Google Doc</p>
                    <input 
                      type="text"
                      required
                      placeholder="Document Title (e.g. Project Specs)"
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      className="w-full bg-brand-surface-low border border-brand-outline/25 rounded-xl px-3 py-2 text-xs font-display focus:border-[#00685b] focus:outline-none"
                    />
                    <div className="flex justify-end gap-2 text-xs font-semibold">
                      <button 
                        type="button" 
                        onClick={() => setShowCreateDoc(false)}
                        className="px-3 py-1.5 rounded-lg text-brand-text-muted hover:bg-brand-surface-low cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="px-3 py-1.5 rounded-lg bg-brand-primary text-white hover:bg-brand-primary-light cursor-pointer"
                      >
                        Create Document
                      </button>
                    </div>
                  </motion.form>
                )}

              </div>

              {/* Interactive File Browser (Right Column) */}
              <div className="lg:col-span-8 bg-white border border-brand-outline/25 rounded-3xl p-6 flex flex-col gap-5 shadow-sm min-h-[400px]">
                
                {/* Search & Layout Control Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  
                  {/* Search input */}
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-brand-text-muted" />
                    <input 
                      type="text"
                      placeholder="Search items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-brand-surface-low border border-brand-outline/20 rounded-xl pl-9 pr-3 py-2 text-xs font-display focus:border-[#00685b] focus:outline-none"
                    />
                  </div>

                  {/* Directory Action Tools */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button 
                      onClick={fetchFiles}
                      title="Reload files"
                      className="p-2 bg-brand-surface-low hover:bg-brand-outline/10 text-brand-text-muted hover:text-brand-text rounded-xl border border-brand-outline/15 cursor-pointer transition-all active:scale-95"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${loadingFiles ? 'animate-spin text-brand-primary' : ''}`} />
                    </button>
                    <div className="h-6 w-px bg-brand-outline/25 mx-1" />
                    <button 
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        viewMode === 'grid' 
                          ? 'bg-[#00685b]/10 text-[#00685b] border-brand-outline/30' 
                          : 'bg-brand-surface-low border-brand-outline/15 text-brand-text-muted'
                      }`}
                      title="Grid Layout"
                    >
                      <Grid className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        viewMode === 'list' 
                          ? 'bg-[#00685b]/10 text-[#00685b] border-brand-outline/30' 
                          : 'bg-brand-surface-low border-brand-outline/15 text-brand-text-muted'
                      }`}
                      title="List Layout"
                    >
                      <List className="h-3.5 w-3.5" />
                    </button>
                  </div>

                </div>

                {/* Breadcrumbs Navigation */}
                <div className="flex items-center gap-1.5 flex-wrap font-sans text-xs bg-brand-surface-low p-2 rounded-xl border border-brand-outline/10 text-brand-text-muted">
                  <button 
                    onClick={() => setFolderHistory([{ id: 'root', name: 'My Drive' }])}
                    className="p-1 rounded hover:bg-brand-outline/10 hover:text-brand-text cursor-pointer"
                  >
                    <Home className="h-3.5 w-3.5" />
                  </button>
                  {folderHistory.map((crumb, idx) => (
                    <div key={crumb.id} className="flex items-center gap-1.5">
                      <span className="text-brand-outline font-semibold">/</span>
                      <button 
                        onClick={() => handleNavigateToBreadcrumb(idx)}
                        disabled={idx === folderHistory.length - 1}
                        className={`font-semibold hover:underline cursor-pointer py-0.5 px-1 rounded hover:bg-brand-outline/10 ${
                          idx === folderHistory.length - 1 ? 'text-brand-primary font-bold bg-brand-primary/5' : ''
                        }`}
                      >
                        {crumb.name}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Main Directory Listing */}
                <div className="flex-grow">
                  {loadingFiles ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-3">
                      <Loader2 className="h-8 w-8 text-brand-primary animate-spin" />
                      <p className="font-sans text-[11px] text-brand-text-muted">Loading workspace items...</p>
                    </div>
                  ) : filteredFiles.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-brand-outline/20 rounded-2xl space-y-3 bg-brand-surface-low/30">
                      <Folder className="mx-auto h-8 w-8 text-brand-text-muted/55" />
                      <p className="font-sans text-xs text-brand-text-muted font-bold">
                        {searchQuery ? 'No matching files found' : 'This folder is empty'}
                      </p>
                      <p className="font-sans text-[10px] text-brand-text-muted">
                        {searchQuery ? 'Try matching file names' : 'Upload creative briefs or create folders to begin'}
                      </p>
                    </div>
                  ) : viewMode === 'grid' ? (
                    /* GRID VIEW MODE */
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {filteredFiles.map((file) => {
                        const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                        return (
                          <div 
                            key={file.id}
                            className="group relative bg-brand-surface-low border border-brand-outline/15 hover:border-[#00685b]/35 hover:bg-white p-4 rounded-2xl flex flex-col items-center justify-between text-center min-h-[140px] hover:shadow-sm transition-all duration-200"
                          >
                            {/* Action overlay on top-right */}
                            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                              {file.webViewLink && (
                                <a 
                                  href={file.webViewLink} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  title="Open in Drive"
                                  className="p-1 bg-white hover:bg-brand-surface text-brand-text rounded-md border border-brand-outline/10 cursor-pointer"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                              <button 
                                onClick={() => setFileToDelete(file)}
                                title="Delete item"
                                className="p-1 bg-white hover:bg-rose-50 text-rose-600 rounded-md border border-brand-outline/10 cursor-pointer"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>

                            {/* File / Folder click container */}
                            <div 
                              className="w-full flex-grow flex flex-col items-center justify-center cursor-pointer pt-3 pb-2"
                              onClick={() => {
                                if (isFolder) {
                                  handleFolderClick(file.id, file.name);
                                } else if (file.webViewLink) {
                                  window.open(file.webViewLink, '_blank');
                                }
                              }}
                            >
                              <div className="mb-2">
                                {file.thumbnailLink && !isFolder ? (
                                  <img 
                                    src={file.thumbnailLink} 
                                    alt={file.name} 
                                    className="h-10 w-10 object-cover rounded-md border border-brand-outline/10 shadow-sm"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  getFileIcon(file.mimeType)
                                )}
                              </div>
                              <span className="font-display text-[11px] font-bold text-brand-text group-hover:text-brand-primary line-clamp-2 px-1 max-w-full">
                                {file.name}
                              </span>
                            </div>

                            {/* Metadata Footer */}
                            <div className="w-full flex justify-between items-center text-[9px] font-mono text-brand-text-muted border-t border-brand-outline/10 pt-2 mt-auto">
                              <span>{isFolder ? 'Folder' : formatBytes(file.size ? parseInt(file.size) : undefined)}</span>
                              <span>{formatDate(file.modifiedTime)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* LIST VIEW MODE */
                    <div className="border border-brand-outline/15 rounded-2xl overflow-hidden divide-y divide-brand-outline/10 bg-brand-surface-low">
                      {filteredFiles.map((file) => {
                        const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                        return (
                          <div 
                            key={file.id}
                            className="group flex items-center justify-between p-3.5 bg-white hover:bg-brand-surface-low transition-all"
                          >
                            <div 
                              className="flex items-center gap-3 cursor-pointer flex-grow min-w-0"
                              onClick={() => {
                                if (isFolder) {
                                  handleFolderClick(file.id, file.name);
                                } else if (file.webViewLink) {
                                  window.open(file.webViewLink, '_blank');
                                }
                              }}
                            >
                              {file.thumbnailLink && !isFolder ? (
                                <img 
                                  src={file.thumbnailLink} 
                                  alt={file.name} 
                                  className="h-7 w-7 object-cover rounded border border-brand-outline/10 shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="shrink-0">{getFileIcon(file.mimeType)}</div>
                              )}
                              <span className="font-display text-xs font-bold text-brand-text group-hover:text-brand-primary truncate">
                                {file.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 shrink-0 font-mono text-[10px] text-brand-text-muted pl-4">
                              <span className="hidden sm:inline w-20 text-right">{isFolder ? 'Folder' : formatBytes(file.size ? parseInt(file.size) : undefined)}</span>
                              <span className="hidden md:inline w-24 text-right">{formatDate(file.modifiedTime)}</span>
                              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                {file.webViewLink && (
                                  <a 
                                    href={file.webViewLink} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="p-1 hover:bg-brand-surface text-brand-text-muted hover:text-brand-text rounded-md border border-brand-outline/10 cursor-pointer"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                                <button 
                                  onClick={() => setFileToDelete(file)}
                                  className="p-1 hover:bg-rose-50 text-rose-600 rounded-md border border-brand-outline/10 cursor-pointer"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Strict Destructive Action Confirmation Modal (Google Workspace Mandate) */}
      <AnimatePresence>
        {fileToDelete && (
          <motion.div 
            id="delete-confirmation-modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white rounded-3xl border border-brand-outline/25 max-w-md w-full p-6 space-y-5 shadow-lg"
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
            >
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2 bg-rose-50 rounded-full border border-rose-100">
                  <Trash2 className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-black tracking-tight text-brand-text">
                  Confirm Permanent Deletion
                </h3>
              </div>

              <div className="space-y-2">
                <p className="font-sans text-xs text-brand-text-muted leading-relaxed">
                  Are you absolutely sure you want to delete <span className="font-bold text-brand-text">"{fileToDelete.name}"</span>?
                </p>
                <div className="bg-amber-50 border border-amber-100 text-amber-800 text-[10px] p-3 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <span className="font-sans leading-normal font-medium">
                    This will permanently delete the item from your Google Drive storage. This action cannot be undone.
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 font-semibold text-xs pt-2">
                <button 
                  onClick={() => setFileToDelete(null)}
                  className="px-4 py-2 rounded-xl text-brand-text-muted hover:bg-brand-surface-low border border-brand-outline/10 cursor-pointer"
                >
                  Cancel, Keep File
                </button>
                <button 
                  onClick={handleDeleteFile}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
