import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wifi,
  WifiOff,
  Check,
  X,
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  CreditCard,
  Eye,
  AlertCircle,
  Lock,
  Radio,
  Info,
  CheckCircle2,
  QrCode,
  Download,
  Share2,
  Copy,
  Upload,
  KeyRound,
  ArrowLeft,
  Globe,
} from 'lucide-react';
import type { NavSection } from '../types';
import { useNFC } from '../hooks/useNFC';
import type { WebNfcDetectedTag } from '../services/nfcService';
import {
  generateSecureNfcBackupQr,
  restoreSecureNfcBackupToken,
  type SecureNfcBackupEnvelope,
} from '../utils/nfcQrBackup';

export type NfcCompatibilityCategory =
  | 'Standard NFC Tag'
  | 'Read-Only Tag'
  | 'NDEF-Compatible Tag'
  | 'Access-Control Card (Readable Metadata)'
  | 'Secure / Encrypted Card';

export type NfcCardStatus = 'Compatible' | 'Read Only' | 'Unsupported';

export interface NfcDetectedCard {
  id: string;
  name: string;
  cardType: string;
  compatibilityCategory: NfcCompatibilityCategory;
  maskedCardId: string;
  status: NfcCardStatus;
  activeState: 'Active' | 'Read Only' | 'Restricted';
  lastScanned: string;
  lastScannedIso: string;
  ndefRecordsCount: number;
  ndefSummary: string;
  isEncryptedOrProtected: boolean;
  ndefAvailable?: boolean;
  readableStatus?: 'Readable' | 'Unsupported';
  primaryRecordType?: string;
  primaryMimeType?: string | null;
  primaryUri?: string | null;
  primaryTextPayload?: string | null;
}

const INITIAL_IN_MEMORY_CARDS: NfcDetectedCard[] = [
  {
    id: 'nfc-tag-office-zone',
    name: 'Office Zone Tag',
    cardType: 'Web NFC (NDEF · url, text)',
    compatibilityCategory: 'NDEF-Compatible Tag',
    maskedCardId: '••••••••4A9E',
    status: 'Compatible',
    activeState: 'Active',
    lastScanned: 'Today',
    lastScannedIso: new Date().toISOString(),
    ndefRecordsCount: 2,
    ndefSummary:
      'Public NDEF tag metadata (2 records: url, text). Non-sensitive metadata only.',
    isEncryptedOrProtected: false,
    ndefAvailable: true,
    readableStatus: 'Readable',
    primaryRecordType: 'url, text',
    primaryMimeType: 'text/plain',
    primaryUri: 'https://www.qbench.in/nfc-access',
    primaryTextPayload: 'QBENCH Studio Floor 2 Reference Tag',
  },
  {
    id: 'nfc-tag-studio-suite',
    name: 'Studio Info Tag',
    cardType: 'Web NFC (NFC Forum Type 2 · Read-Only)',
    compatibilityCategory: 'Read-Only Tag',
    maskedCardId: '••••••••8C21',
    status: 'Read Only',
    activeState: 'Read Only',
    lastScanned: 'Today',
    lastScannedIso: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    ndefRecordsCount: 1,
    ndefSummary:
      'Read-only NDEF text record. Non-sensitive tag profile stored in session.',
    isEncryptedOrProtected: false,
    ndefAvailable: true,
    readableStatus: 'Readable',
    primaryRecordType: 'text',
    primaryMimeType: 'text/plain',
    primaryUri: null,
    primaryTextPayload: 'Edit Bay & Motion Lab Tag',
  },
];

function formatRelativeScanTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const isSameDay =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
    if (isSameDay) {
      return 'Today';
    }
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Today';
  }
}

function mapWebNfcTagToCard(
  tag: WebNfcDetectedTag,
  customName?: string
): NfcDetectedCard {
  const isProtected = tag.isProtectedOrUnsupported || tag.status === 'Unsupported';
  return {
    id: tag.id,
    name: customName?.trim() || tag.name || 'NFC Tag',
    cardType: tag.technology,
    compatibilityCategory: isProtected
      ? 'Secure / Encrypted Card'
      : tag.ndefAvailable
      ? 'NDEF-Compatible Tag'
      : 'Standard NFC Tag',
    maskedCardId: tag.maskedSerialNumber,
    status: isProtected ? 'Unsupported' : 'Compatible',
    activeState: isProtected ? 'Restricted' : 'Active',
    lastScanned: 'Today',
    lastScannedIso: tag.scannedAtIso,
    ndefRecordsCount: tag.recordsCount,
    ndefSummary: tag.summary,
    isEncryptedOrProtected: isProtected,
    ndefAvailable: tag.ndefAvailable,
    readableStatus: tag.status,
    primaryRecordType: tag.primaryRecordType,
    primaryMimeType: tag.primaryMimeType,
    primaryUri: tag.primaryUri,
    primaryTextPayload: tag.primaryTextPayload,
  };
}

interface NfcAccessViewProps {
  onNavigate?: (section: NavSection) => void;
  embeddedInAdmin?: boolean;
}

export default function NfcAccessView({
  onNavigate,
  embeddedInAdmin = false,
}: NfcAccessViewProps) {
  const {
    isSupported,
    status: nfcStatus,
    detectedTag,
    errorInfo,
    startScan,
    stopScan,
    recheckSupport,
    resetState,
  } = useNFC();

  // Non-sensitive saved tag metadata kept in React memory (never stores NFC credentials in localStorage)
  const [savedCards, setSavedCards] = useState<NfcDetectedCard[]>(
    INITIAL_IN_MEMORY_CARDS
  );
  const [customTagName, setCustomTagName] = useState<string>('NFC Access Tag');
  const [saveSuccessBanner, setSaveSuccessBanner] = useState<string | null>(
    null
  );

  // Modals for viewing/renaming non-sensitive tag profiles
  const [viewingCard, setViewingCard] = useState<NfcDetectedCard | null>(null);
  const [renamingCard, setRenamingCard] = useState<NfcDetectedCard | null>(
    null
  );
  const [renameInput, setRenameInput] = useState<string>('');

  // Secure QR Code Export & Restore Modal States (for non-sensitive tag metadata)
  const [qrExportModalOpen, setQrExportModalOpen] = useState<boolean>(false);
  const [qrExportTargetCards, setQrExportTargetCards] = useState<
    NfcDetectedCard[]
  >([]);
  const [qrExportLabel, setQrExportLabel] = useState<string>('');
  const [qrPassphrase, setQrPassphrase] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrBackupToken, setQrBackupToken] = useState<string>('');
  const [qrEnvelope, setQrEnvelope] = useState<SecureNfcBackupEnvelope | null>(
    null
  );
  const [qrGenerating, setQrGenerating] = useState<boolean>(false);
  const [qrCopied, setQrCopied] = useState<boolean>(false);
  const [qrShareStatus, setQrShareStatus] = useState<string | null>(null);

  const [qrImportModalOpen, setQrImportModalOpen] = useState<boolean>(false);
  const [importTokenInput, setImportTokenInput] = useState<string>('');
  const [importPassphraseInput, setImportPassphraseInput] =
    useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMessage, setImportSuccessMessage] = useState<
    string | null
  >(null);

  const handleBackNavigation = () => {
    stopScan();
    if (onNavigate) {
      onNavigate('home');
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    }
  };

  const handleScanButtonPress = async () => {
    setSaveSuccessBanner(null);
    await startScan();
  };

  const handleTryAgain = async () => {
    setSaveSuccessBanner(null);
    const available = recheckSupport();
    if (available) {
      await startScan();
    }
  };

  const handleSaveDetectedTag = () => {
    if (!detectedTag || detectedTag.isProtectedOrUnsupported) return;

    const cardToSave = mapWebNfcTagToCard(
      detectedTag,
      customTagName.trim() || 'NFC Access Tag'
    );

    setSavedCards((prev) => [cardToSave, ...prev]);
    setSaveSuccessBanner(
      `Saved non-sensitive tag metadata "${cardToSave.name}" to current session.`
    );
    resetState();
  };

  const handleDeleteCard = (cardId: string) => {
    setSavedCards((prev) => prev.filter((c) => c.id !== cardId));
    if (viewingCard?.id === cardId) {
      setViewingCard(null);
    }
  };

  const handleOpenRenameModal = (card: NfcDetectedCard) => {
    setRenamingCard(card);
    setRenameInput(card.name);
  };

  const handleConfirmRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingCard) return;
    const clean = renameInput.trim();
    if (!clean) return;

    setSavedCards((prev) =>
      prev.map((c) => (c.id === renamingCard.id ? { ...c, name: clean } : c))
    );
    if (viewingCard?.id === renamingCard.id) {
      setViewingCard((prev) => (prev ? { ...prev, name: clean } : null));
    }
    setRenamingCard(null);
  };

  return (
    <div
      id="nfc-access-card-scanner"
      className={
        embeddedInAdmin
          ? 'space-y-8'
          : 'mx-auto max-w-7xl px-6 py-12 lg:px-12 space-y-12'
      }
    >
      {/* Top Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-slate-200/80 pb-8">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-tech font-bold uppercase tracking-widest text-[#00685b]">
            <Radio className="h-4 w-4" />
            <span>WEB NFC API · BROWSER TAG INSPECTOR</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            NFC Access Card Scanner
          </h1>
          <p className="font-sans text-sm text-slate-600 max-w-2xl leading-relaxed">
            Scan compatible NFC tags and inspect public NDEF records directly in
            supported mobile browsers.{' '}
            <strong className="text-slate-800">
              Scanning an NFC card does not automatically create a working
              digital door credential.
            </strong>
          </p>
        </div>

        {/* Browser Web NFC Support Indicator */}
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 shadow-2xs ${
              isSupported
                ? 'border-emerald-200 bg-emerald-50/70 text-emerald-800'
                : 'border-amber-200 bg-amber-50/80 text-amber-900'
            }`}
          >
            <Globe className="h-4 w-4 shrink-0" />
            <span className="text-xs font-semibold">Web NFC API:</span>
            {isSupported ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <span aria-hidden="true">🟢</span>
                <span>Available (`NDEFReader`)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800">
                <span aria-hidden="true">🟠</span>
                <span>Not Available in This Browser</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN (7 cols): Web NFC Scanner Screen */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl bg-[#0b1313] text-white border border-emerald-500/20 shadow-xl overflow-hidden relative">
            <div
              className="absolute inset-0 pointer-events-none opacity-35"
              style={{
                background: isSupported
                  ? 'radial-gradient(circle at 50% 32%, rgba(0, 168, 143, 0.28), transparent 68%)'
                  : 'radial-gradient(circle at 50% 32%, rgba(245, 158, 11, 0.18), transparent 68%)',
              }}
            />

            {/* Scanner Top Header */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-6 sm:px-8 pt-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <CreditCard className="h-4 w-4 text-[#45b88a]" />
                <span className="font-tech text-xs font-extrabold tracking-widest uppercase text-white">
                  NFC ACCESS CARD SCANNER
                </span>
              </div>

              <span
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-mono font-bold border ${
                  nfcStatus === 'READY' || nfcStatus === 'TAG_DETECTED'
                    ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                    : nfcStatus === 'SCANNING'
                    ? 'bg-teal-500/20 border-teal-400/50 text-teal-200'
                    : 'bg-amber-500/15 border-amber-400/40 text-amber-300'
                }`}
              >
                {isSupported ? (
                  <>
                    <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{nfcStatus.replace('_', ' ')}</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3.5 w-3.5 text-amber-400" />
                    <span>NFC NOT SUPPORTED</span>
                  </>
                )}
              </span>
            </div>

            {/* Scanner Body */}
            <div className="relative z-10 p-6 sm:p-10">
              {saveSuccessBanner && (
                <div className="mb-6 rounded-2xl border border-emerald-400/40 bg-emerald-950/50 p-4 text-xs text-emerald-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{saveSuccessBanner}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSaveSuccessBanner(null)}
                    className="text-emerald-300 hover:text-white cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <AnimatePresence mode="wait">
                {/* =========================================================
                    STATE 4 — NFC UNSUPPORTED
                    When `"NDEFReader" in window` is false
                ========================================================= */}
                {nfcStatus === 'UNSUPPORTED' && (
                  <motion.div
                    key="web-nfc-unsupported"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col items-center text-center space-y-6 py-4"
                  >
                    <div className="inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/15 px-3.5 py-1.5 text-xs font-tech font-extrabold uppercase tracking-widest text-amber-300">
                      <WifiOff className="h-4 w-4 text-amber-400" />
                      <span>NFC NOT AVAILABLE</span>
                    </div>

                    <div className="relative flex items-center justify-center w-48 h-48 rounded-full border border-amber-400/25 bg-amber-950/20">
                      <div className="flex flex-col items-center space-y-2.5 px-4">
                        <div className="h-14 w-14 rounded-2xl bg-amber-500/15 border border-amber-400/35 flex items-center justify-center text-amber-300">
                          <WifiOff className="h-7 w-7" />
                        </div>
                        <span className="font-mono text-[11px] uppercase tracking-widest text-amber-200/90">
                          Web NFC Unavailable
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 max-w-md">
                      <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        NFC NOT SUPPORTED
                      </h2>
                      <p className="font-sans text-sm text-slate-200 leading-relaxed">
                        Web NFC is not supported by this browser or device.
                      </p>
                      <p className="font-sans text-xs text-slate-400 leading-relaxed">
                        Your browser or device does not support Web NFC.
                        NFC scanning is available only on compatible browsers/devices.
                      </p>
                    </div>

                    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left text-xs text-slate-300 flex items-start gap-3">
                      <Info className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        For NFC scanning, use a compatible Android device and
                        supported browser.
                      </span>
                    </div>

                    <div className="w-full max-w-xs pt-2">
                      <button
                        id="nfc-unsupported-back-btn"
                        type="button"
                        onClick={handleBackNavigation}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 px-6 py-3.5 font-display text-sm font-bold text-white transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* =========================================================
                    STATE 1 — READY
                    Web NFC API available and ready for user to press "Scan NFC"
                ========================================================= */}
                {nfcStatus === 'READY' && (
                  <motion.div
                    key="web-nfc-ready"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col items-center text-center space-y-6 py-2"
                  >
                    <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3.5 py-1.5 text-xs font-tech font-extrabold uppercase tracking-widest text-emerald-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>NFC READY</span>
                    </div>

                    <div className="space-y-1.5 max-w-md">
                      <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        NFC READY
                      </h2>
                      <p className="font-sans text-sm text-slate-200">
                        Your device/browser is ready to scan an NFC tag.
                      </p>
                    </div>

                    {/* Subtle Animated NFC Icon & Card */}
                    <div className="relative flex items-center justify-center w-60 h-60 my-1">
                      <motion.div
                        className="absolute inset-4 rounded-full border border-[#45b88a]/30"
                        animate={{
                          scale: [0.96, 1.05, 0.96],
                          opacity: [0.25, 0.55, 0.25],
                        }}
                        transition={{
                          duration: 2.8,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />

                      <div className="relative z-10 flex flex-col items-center justify-center w-48 h-48 rounded-full border border-emerald-400/30 bg-emerald-950/20">
                        <Wifi className="h-9 w-9 text-[#45b88a] mb-2" />
                        <div className="w-32 h-20 rounded-xl bg-gradient-to-br from-[#00685b] via-[#0c8575] to-[#123532] border border-emerald-300/30 p-3 flex flex-col justify-between shadow-lg">
                          <div className="flex items-center justify-between">
                            <div className="w-5 h-4 rounded-xs bg-amber-300/90 border border-amber-200/60" />
                            <Radio className="h-3.5 w-3.5 text-emerald-200" />
                          </div>
                          <div className="text-left">
                            <div className="text-[8px] font-mono uppercase tracking-widest text-emerald-200/80">
                              QBENCH NFC
                            </div>
                            <div className="text-[10px] font-mono font-bold text-white tracking-wider">
                              •••• ••••
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-full max-w-xs pt-2">
                      <button
                        id="web-nfc-scan-btn"
                        type="button"
                        onClick={handleScanButtonPress}
                        className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#008978] hover:bg-[#00a08c] px-6 py-3.5 font-display text-sm font-bold text-white shadow-lg transition-all cursor-pointer"
                      >
                        <Wifi className="h-4 w-4" />
                        <span>Scan NFC</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* =========================================================
                    STATE 2 — SCANNING
                    `await reader.scan()` active
                ========================================================= */}
                {nfcStatus === 'SCANNING' && (
                  <motion.div
                    key="web-nfc-scanning"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col items-center text-center space-y-6 py-2"
                  >
                    <div className="inline-flex items-center gap-2 rounded-lg border border-teal-400/40 bg-teal-500/15 px-3.5 py-1.5 text-xs font-tech font-extrabold uppercase tracking-widest text-teal-200">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-teal-300" />
                      <span>SCANNING FOR NFC</span>
                    </div>

                    <div className="space-y-1.5 max-w-md">
                      <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        SCANNING FOR NFC
                      </h2>
                      <p className="font-sans text-sm text-slate-200">
                        Hold your NFC tag near the back of your phone.
                      </p>
                    </div>

                    {/* Animated NFC Waves & Scanning Pulse */}
                    <div className="relative flex items-center justify-center w-64 h-64 my-2">
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-[#45b88a]/50"
                        initial={{ scale: 0.75, opacity: 0.85 }}
                        animate={{ scale: 1.35, opacity: 0 }}
                        transition={{
                          duration: 1.8,
                          repeat: Infinity,
                          ease: 'easeOut',
                        }}
                      />
                      <motion.div
                        className="absolute inset-4 rounded-full border border-[#45b88a]/40"
                        initial={{ scale: 0.8, opacity: 0.7 }}
                        animate={{ scale: 1.25, opacity: 0 }}
                        transition={{
                          duration: 1.8,
                          delay: 0.55,
                          repeat: Infinity,
                          ease: 'easeOut',
                        }}
                      />
                      <motion.div
                        className="absolute inset-8 rounded-full bg-emerald-500/10"
                        animate={{
                          scale: [0.95, 1.08, 0.95],
                          opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />

                      <div className="relative z-10 flex flex-col items-center justify-center w-48 h-48 rounded-full border border-[#45b88a] bg-[#102220]/90 shadow-[0_0_50px_rgba(69,184,138,0.28)]">
                        <motion.div
                          animate={{ y: [0, -4, 0], opacity: [0.6, 1, 0.6] }}
                          transition={{
                            duration: 1.3,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                          className="mb-2"
                        >
                          <Wifi className="h-9 w-9 text-[#45b88a]" />
                        </motion.div>

                        <motion.div
                          animate={{
                            rotateX: [0, 8, 0],
                            rotateY: [-6, 6, -6],
                            y: [0, -4, 0],
                          }}
                          transition={{
                            duration: 2.0,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                          className="w-32 h-20 rounded-xl bg-gradient-to-br from-[#00685b] via-[#0c8575] to-[#123532] border border-emerald-300/30 p-3 flex flex-col justify-between shadow-lg"
                        >
                          <div className="flex items-center justify-between">
                            <div className="w-5 h-4 rounded-xs bg-amber-300/90 border border-amber-200/60" />
                            <Radio className="h-3.5 w-3.5 text-emerald-200" />
                          </div>
                          <div className="text-left">
                            <div className="text-[8px] font-mono uppercase tracking-widest text-emerald-200/80">
                              QBENCH NFC
                            </div>
                            <div className="text-[10px] font-mono font-bold text-white tracking-wider">
                              •••• ••••
                            </div>
                          </div>
                        </motion.div>

                        <span className="mt-3 font-mono text-[11px] uppercase tracking-widest text-emerald-300">
                          Listening for Tag...
                        </span>
                      </div>
                    </div>

                    <div className="w-full max-w-xs pt-2">
                      <button
                        id="web-nfc-cancel-scan-btn"
                        type="button"
                        onClick={stopScan}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 px-6 py-3.5 font-display text-sm font-bold text-white transition-colors cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                        <span>Cancel Scan</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* =========================================================
                    STATE 3 — TAG DETECTED (`NFC TAG DETECTED ✓` / `CARD DETECTED`)
                ========================================================= */}
                {nfcStatus === 'TAG_DETECTED' && detectedTag && (
                  <motion.div
                    key="web-nfc-tag-detected"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-col items-center text-center space-y-2.5">
                      <div className="h-14 w-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300">
                        <Check className="h-7 w-7 stroke-[2.5]" />
                      </div>
                      <span className="font-tech text-xs font-black tracking-widest uppercase text-emerald-300">
                        NFC TAG DETECTED ✓
                      </span>
                      <h2 className="font-display text-2xl font-extrabold text-white">
                        CARD DETECTED
                      </h2>
                      <p className="font-sans text-xs text-slate-300 max-w-md">
                        Scanning an NFC card does not automatically create a
                        working digital door credential. Only public Web NFC
                        metadata is displayed below.
                      </p>
                    </div>

                    {/* Access Card Mode / Tag Metadata Summary */}
                    <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 space-y-4 text-left">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="detected-tag-label-input"
                          className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-400"
                        >
                          Tag Profile Label (Non-Sensitive)
                        </label>
                        <input
                          id="detected-tag-label-input"
                          type="text"
                          value={customTagName}
                          onChange={(e) => setCustomTagName(e.target.value)}
                          placeholder="NFC Access Tag"
                          className="w-full rounded-xl border border-white/15 bg-[#122020] px-4 py-2.5 text-sm font-semibold text-white focus:border-[#45b88a] focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
                        <div>
                          <span className="block font-tech text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Technology
                          </span>
                          <span className="font-mono text-xs font-semibold text-white mt-0.5 block">
                            {detectedTag.technology}
                          </span>
                        </div>

                        <div>
                          <span className="block font-tech text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            NDEF
                          </span>
                          <span className="font-mono text-xs font-semibold text-emerald-300 mt-0.5 block">
                            {detectedTag.ndefAvailable
                              ? 'Available'
                              : 'Not available'}
                          </span>
                        </div>

                        <div>
                          <span className="block font-tech text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Status
                          </span>
                          <span className="font-display text-xs font-bold text-emerald-300 mt-0.5 block">
                            {detectedTag.status}
                          </span>
                        </div>

                        <div>
                          <span className="block font-tech text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            NDEF Record Type
                          </span>
                          <span className="font-mono text-xs text-slate-200 mt-0.5 block">
                            {detectedTag.primaryRecordType}
                          </span>
                        </div>

                        {detectedTag.primaryMimeType && (
                          <div>
                            <span className="block font-tech text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              MIME Type
                            </span>
                            <span className="font-mono text-xs text-slate-200 mt-0.5 block">
                              {detectedTag.primaryMimeType}
                            </span>
                          </div>
                        )}

                        {detectedTag.primaryUri && (
                          <div className="sm:col-span-2">
                            <span className="block font-tech text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              URI
                            </span>
                            <span className="font-mono text-xs text-emerald-300 break-all mt-0.5 block">
                              {detectedTag.primaryUri}
                            </span>
                          </div>
                        )}

                        {detectedTag.primaryTextPayload && (
                          <div className="sm:col-span-2">
                            <span className="block font-tech text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Text Payload
                            </span>
                            <p className="font-sans text-xs text-slate-200 mt-0.5">
                              {detectedTag.primaryTextPayload}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleSaveDetectedTag}
                        className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#008978] hover:bg-[#00a08c] px-6 py-3.5 font-display text-sm font-bold text-white shadow-lg transition-all cursor-pointer"
                      >
                        <Check className="h-4 w-4" />
                        <span>Save Tag Info</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleScanButtonPress}
                        className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 px-6 py-3.5 font-display text-sm font-semibold text-white transition-colors cursor-pointer"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span>Scan Again</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* =========================================================
                    STATE 5 — NFC ERROR / NFC IS OFF / PERMISSION DENIED / PROTECTED CARD
                ========================================================= */}
                {(nfcStatus === 'NFC_OFF' ||
                  nfcStatus === 'PERMISSION_DENIED' ||
                  nfcStatus === 'PROTECTED_CARD' ||
                  nfcStatus === 'ERROR') && (
                  <motion.div
                    key="web-nfc-error-state"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col items-center text-center space-y-6 py-4"
                  >
                    <div className="inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/15 px-3.5 py-1.5 text-xs font-tech font-extrabold uppercase tracking-widest text-amber-300">
                      {nfcStatus === 'PROTECTED_CARD' ? (
                        <>
                          <Lock className="h-4 w-4 text-amber-400" />
                          <span>PROTECTED OR UNSUPPORTED CARD</span>
                        </>
                      ) : nfcStatus === 'NFC_OFF' ? (
                        <>
                          <WifiOff className="h-4 w-4 text-amber-400" />
                          <span>NFC IS OFF</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-amber-400" />
                          <span>NFC SCAN FAILED</span>
                        </>
                      )}
                    </div>

                    <div className="space-y-2 max-w-md">
                      <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        {errorInfo?.heading || 'NFC SCAN FAILED'}
                      </h2>
                      <p className="font-sans text-sm text-slate-200 leading-relaxed">
                        {errorInfo?.message ||
                          'Unable to start NFC scanning. Please check NFC availability and try again.'}
                      </p>
                      {errorInfo?.helpText && (
                        <p className="font-sans text-xs text-slate-400 leading-relaxed">
                          {errorInfo.helpText}
                        </p>
                      )}
                    </div>

                    {nfcStatus === 'PROTECTED_CARD' && (
                      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-white/[0.04] p-4 text-left space-y-2 text-xs">
                        <div className="font-display font-bold text-amber-300">
                          CARD DETECTED
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/10">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase">
                              Technology
                            </span>
                            <span className="font-mono text-white">
                              Non-NDEF / Protected
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase">
                              NDEF
                            </span>
                            <span className="font-mono text-amber-300">
                              Not available
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase">
                              Status
                            </span>
                            <span className="font-mono text-amber-300">
                              Unsupported
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-md pt-2">
                      <button
                        id="web-nfc-try-again-btn"
                        type="button"
                        onClick={handleTryAgain}
                        className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#008978] hover:bg-[#00a08c] px-6 py-3.5 font-display text-sm font-bold text-white shadow-lg transition-all cursor-pointer"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span>Try Again</span>
                      </button>

                      <button
                        id="web-nfc-error-cancel-btn"
                        type="button"
                        onClick={resetState}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 px-6 py-3.5 font-display text-sm font-semibold text-white transition-colors cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): Web NFC Browser Compatibility & Security Boundaries */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#00685b] block">
                  BROWSER ENVIRONMENT CHECK
                </span>
                <h2 className="font-display text-xl font-extrabold text-slate-900">
                  Web NFC Compatibility
                </h2>
              </div>
              <Globe className="h-6 w-6 text-[#00685b] shrink-0" />
            </div>

            <div className="rounded-xl border border-slate-200/90 bg-slate-50 p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">
                  Browser `NDEFReader` API:
                </span>
                <span
                  className={`font-mono font-bold ${
                    isSupported ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {isSupported ? 'Supported' : 'Unsupported'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/70">
                <span className="font-semibold text-slate-600">
                  Current Scanner State:
                </span>
                <span className="font-mono font-bold text-slate-800">
                  {nfcStatus}
                </span>
              </div>
            </div>

            <p className="font-sans text-xs text-slate-600 leading-relaxed">
              NFC scanning is available only on compatible browsers/devices (such
              as Chrome, Edge, Opera, or Samsung Internet on Android over HTTPS).
              Desktop browsers and iOS Safari do not expose the Web NFC API.
            </p>

            <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3.5 text-xs text-amber-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Info className="h-4 w-4 text-amber-700 shrink-0" />
                <span>System NFC Settings</span>
              </div>
              <p className="text-[11px] text-amber-900/90 leading-relaxed">
                A browser application cannot silently enable NFC at the device
                level. If NFC is disabled on your Android phone, enable NFC in
                your phone&apos;s system settings and tap{' '}
                <strong>Try Again</strong>.
              </p>
            </div>
          </div>

          {/* Security & Access Card Notice */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#00685b]" />
              <h3 className="font-display text-base font-extrabold text-slate-900">
                Access Card & Web NFC Security
              </h3>
            </div>

            <p className="font-sans text-xs text-slate-600 leading-relaxed">
              <strong>
                Scanning an NFC card does not automatically create a working
                digital door credential.
              </strong>{' '}
              This browser-based scanner only reads public NDEF records exposed
              by the W3C Web NFC API.
            </p>

            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Reads standard NDEF records (record type, MIME type, URI, and
                  UTF-8 text payloads)
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Starts scanning only after explicit user interaction (pressing{' '}
                  <strong>Scan NFC</strong>)
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Lock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Never clones protected access cards, extracts cryptographic
                  keys, or stores NFC credentials in <code>localStorage</code> or
                  service worker caches
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* SECTION: SAVED NON-SENSITIVE NFC TAG PROFILES */}
      <section id="my-nfc-cards-section" className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#00685b] block">
              NON-SENSITIVE TAG METADATA (SESSION)
            </span>
            <h2 className="font-display text-2xl font-black text-slate-900">
              MY NFC CARDS
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {savedCards.length > 0 && (
              <button
                id="backup-all-nfc-qr-btn"
                type="button"
                onClick={async () => {
                  setQrExportTargetCards(savedCards);
                  setQrExportLabel(
                    `All Saved NFC Tags (${savedCards.length} ${
                      savedCards.length === 1 ? 'Profile' : 'Profiles'
                    })`
                  );
                  setQrPassphrase('');
                  setQrCopied(false);
                  setQrShareStatus(null);
                  setQrExportModalOpen(true);
                  setQrGenerating(true);
                  try {
                    const res = await generateSecureNfcBackupQr(savedCards, '');
                    setQrDataUrl(res.qrDataUrl);
                    setQrBackupToken(res.backupToken);
                    setQrEnvelope(res.envelope);
                  } finally {
                    setQrGenerating(false);
                  }
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 font-display text-xs font-bold text-slate-800 shadow-2xs transition-colors cursor-pointer"
              >
                <QrCode className="h-4 w-4 text-[#00685b]" />
                <span>Backup All as QR</span>
              </button>
            )}

            <button
              id="restore-nfc-qr-btn"
              type="button"
              onClick={() => {
                setImportTokenInput('');
                setImportPassphraseInput('');
                setImportError(null);
                setImportSuccessMessage(null);
                setQrImportModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 font-display text-xs font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              <Upload className="h-4 w-4 text-[#00685b]" />
              <span>Restore from QR Backup</span>
            </button>
          </div>
        </div>

        {savedCards.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
            <CreditCard className="h-10 w-10 text-slate-400 mx-auto" />
            <h3 className="font-display text-base font-bold text-slate-800">
              No Saved NFC Tag Profiles in This Session
            </h3>
            <p className="font-sans text-xs text-slate-500 max-w-md mx-auto">
              Scan a compatible NDEF tag on a supported browser or restore a
              non-sensitive QR backup token.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedCards.map((card) => (
              <div
                key={card.id}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="bg-gradient-to-br from-[#0d1b1a] via-[#0f2926] to-[#005449] p-5 text-white relative">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-lg font-extrabold text-white tracking-tight">
                        {card.name}
                      </h3>
                      <p className="font-sans text-xs text-emerald-200/90 mt-0.5">
                        NFC Tag Profile (Metadata Only)
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          setQrExportTargetCards([card]);
                          setQrExportLabel(card.name);
                          setQrPassphrase('');
                          setQrCopied(false);
                          setQrShareStatus(null);
                          setQrExportModalOpen(true);
                          setQrGenerating(true);
                          try {
                            const res = await generateSecureNfcBackupQr(
                              [card],
                              ''
                            );
                            setQrDataUrl(res.qrDataUrl);
                            setQrBackupToken(res.backupToken);
                            setQrEnvelope(res.envelope);
                          } finally {
                            setQrGenerating(false);
                          }
                        }}
                        title={`Export ${card.name} as Secure QR Code`}
                        className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <QrCode className="h-4 w-4 text-emerald-200" />
                      </button>
                      <div className="h-8 w-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center">
                        <Wifi className="h-4 w-4 text-emerald-300" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-end justify-between text-xs">
                    <div>
                      <span className="block font-mono text-[10px] uppercase tracking-wider text-emerald-200/75">
                        Masked Tag ID
                      </span>
                      <span className="font-mono text-xs font-bold text-white">
                        {card.maskedCardId}
                      </span>
                    </div>
                    <div className="text-right font-sans text-xs text-emerald-100">
                      <span>
                        Status: {card.readableStatus || 'Readable'}
                      </span>
                      <span className="mx-1.5" aria-hidden="true">
                        ·
                      </span>
                      <span>
                        {formatRelativeScanTime(card.lastScannedIso)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="font-mono text-[11px] text-slate-700 truncate">
                      {card.cardType}
                    </div>
                    <p className="text-slate-500 line-clamp-2 leading-relaxed">
                      {card.ndefSummary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingCard(card)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-2 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 text-[#00685b]" />
                        <span>Details</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenRenameModal(card)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-2 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-slate-600" />
                        <span>Rename</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCard(card.id)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50/70 hover:bg-red-100 px-2.5 py-2 text-xs font-semibold text-red-700 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        setQrExportTargetCards([card]);
                        setQrExportLabel(card.name);
                        setQrPassphrase('');
                        setQrCopied(false);
                        setQrShareStatus(null);
                        setQrExportModalOpen(true);
                        setQrGenerating(true);
                        try {
                          const res = await generateSecureNfcBackupQr(
                            [card],
                            ''
                          );
                          setQrDataUrl(res.qrDataUrl);
                          setQrBackupToken(res.backupToken);
                          setQrEnvelope(res.envelope);
                        } finally {
                          setQrGenerating(false);
                        }
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200/80 bg-emerald-50/60 hover:bg-emerald-100/70 px-3 py-2 text-xs font-bold text-[#00685b] transition-colors cursor-pointer"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      <span>Export Secure QR Code (Share / Backup)</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODAL: VIEW TAG DETAILS */}
      <AnimatePresence>
        {viewingCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setViewingCard(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 shadow-xl space-y-5"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="font-tech text-[10px] font-bold uppercase tracking-widest text-[#00685b] block">
                    NFC TAG METADATA
                  </span>
                  <h3 className="font-display text-xl font-extrabold text-slate-900">
                    {viewingCard.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingCard(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-400 block font-tech uppercase text-[10px]">
                    Technology
                  </span>
                  <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                    {viewingCard.cardType}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-400 block font-tech uppercase text-[10px]">
                    NDEF
                  </span>
                  <span className="font-mono font-bold text-emerald-700 mt-0.5 block">
                    {viewingCard.ndefAvailable !== false
                      ? 'Available'
                      : 'Not available'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-400 block font-tech uppercase text-[10px]">
                    Status
                  </span>
                  <span className="font-bold text-emerald-700 mt-0.5 block">
                    {viewingCard.readableStatus || 'Readable'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-400 block font-tech uppercase text-[10px]">
                    Masked ID
                  </span>
                  <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                    {viewingCard.maskedCardId}
                  </span>
                </div>
                {viewingCard.primaryUri && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 col-span-2">
                    <span className="text-slate-400 block font-tech uppercase text-[10px]">
                      URI
                    </span>
                    <span className="font-mono text-xs text-[#00685b] break-all mt-0.5 block">
                      {viewingCard.primaryUri}
                    </span>
                  </div>
                )}
                {viewingCard.primaryTextPayload && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 col-span-2">
                    <span className="text-slate-400 block font-tech uppercase text-[10px]">
                      Text Payload
                    </span>
                    <span className="font-sans text-xs text-slate-800 mt-0.5 block">
                      {viewingCard.primaryTextPayload}
                    </span>
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-4 text-xs space-y-1">
                <p className="text-slate-700 leading-relaxed">
                  {viewingCard.ndefSummary}
                </p>
                <p className="text-[11px] text-slate-500 pt-1">
                  Scanning an NFC card does not automatically create a working
                  digital door credential.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingCard(null)}
                  className="rounded-xl bg-[#00685b] px-5 py-2 text-xs font-bold text-white cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: RENAME TAG */}
      <AnimatePresence>
        {renamingCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setRenamingCard(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-extrabold text-slate-900">
                  Rename NFC Tag Profile
                </h3>
                <button
                  type="button"
                  onClick={() => setRenamingCard(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmRename} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="rename-nfc-card-input"
                    className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-600"
                  >
                    Tag Label
                  </label>
                  <input
                    id="rename-nfc-card-input"
                    type="text"
                    required
                    value={renameInput}
                    onChange={(e) => setRenameInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-[#00685b] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setRenamingCard(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#00685b] hover:bg-[#005348] px-5 py-2 text-xs font-bold text-white cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: SECURE QR CODE EXPORT & SHARE */}
      <AnimatePresence>
        {qrExportModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setQrExportModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl space-y-5 my-8"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="font-tech text-[10px] font-bold uppercase tracking-widest text-[#00685b] flex items-center gap-1.5">
                    <QrCode className="h-3.5 w-3.5" />
                    <span>SECURE QR BACKUP & SHARING</span>
                  </span>
                  <h3 className="font-display text-xl font-extrabold text-slate-900 mt-0.5">
                    {qrExportLabel || 'NFC Tag Metadata QR Backup'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setQrExportModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="qr-passphrase-input"
                    className="font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5"
                  >
                    <KeyRound className="h-3.5 w-3.5 text-[#00685b]" />
                    <span>Optional Backup Passphrase (AES-256-GCM)</span>
                  </label>
                  <span className="font-mono text-[10px] text-slate-500">
                    {qrEnvelope?.mode === 'AES_GCM_256'
                      ? 'Encrypted (AES-256)'
                      : 'SHA-256 Signed'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    id="qr-passphrase-input"
                    type="password"
                    value={qrPassphrase}
                    onChange={(e) => setQrPassphrase(e.target.value)}
                    placeholder="Leave blank for signed QR or enter passphrase..."
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-[#00685b] focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={qrGenerating}
                    onClick={async () => {
                      setQrGenerating(true);
                      setQrShareStatus(null);
                      try {
                        const res = await generateSecureNfcBackupQr(
                          qrExportTargetCards,
                          qrPassphrase
                        );
                        setQrDataUrl(res.qrDataUrl);
                        setQrBackupToken(res.backupToken);
                        setQrEnvelope(res.envelope);
                      } finally {
                        setQrGenerating(false);
                      }
                    }}
                    className="rounded-xl bg-slate-900 hover:bg-slate-800 px-3.5 py-2 font-display text-xs font-bold text-white transition-colors cursor-pointer shrink-0"
                  >
                    {qrPassphrase.trim() ? 'Encrypt QR' : 'Update QR'}
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-[#faf9f9] p-6 space-y-3">
                {qrGenerating ? (
                  <div className="h-56 w-56 flex flex-col items-center justify-center space-y-2">
                    <RefreshCw className="h-7 w-7 text-[#00685b] animate-spin" />
                    <span className="text-xs font-semibold text-slate-500">
                      Generating Secure QR...
                    </span>
                  </div>
                ) : qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`Secure QR Code for ${qrExportLabel}`}
                    className="h-56 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xs"
                  />
                ) : null}

                {qrEnvelope && (
                  <div className="text-center space-y-0.5">
                    <div className="font-mono text-[11px] font-semibold text-slate-700">
                      Checksum (SHA-256): {qrEnvelope.checksumSha256}
                    </div>
                  </div>
                )}
              </div>

              {qrShareStatus && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 text-center font-medium">
                  {qrShareStatus}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  disabled={!qrDataUrl}
                  onClick={() => {
                    if (!qrDataUrl) return;
                    const link = document.createElement('a');
                    const slug = (qrExportLabel || 'nfc-tag')
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-|-$/g, '');
                    link.download = `qbench-${slug || 'nfc'}-qr-backup.png`;
                    link.href = qrDataUrl;
                    link.click();
                    setQrShareStatus('Downloaded QR Code PNG image.');
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00685b] hover:bg-[#005348] px-4 py-2.5 font-display text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PNG</span>
                </button>

                <button
                  type="button"
                  disabled={!qrDataUrl}
                  onClick={async () => {
                    try {
                      if (
                        typeof navigator !== 'undefined' &&
                        typeof navigator.share === 'function'
                      ) {
                        await navigator.share({
                          title: `QBENCH NFC Tag Backup — ${qrExportLabel}`,
                          text: `QBENCH NFC Tag Backup (${qrExportLabel})\nToken:\n${qrBackupToken}`,
                        });
                        setQrShareStatus(
                          'Shared successfully via device share sheet.'
                        );
                        return;
                      }
                    } catch {
                      // Fallback to clipboard
                    }
                    if (navigator.clipboard && qrBackupToken) {
                      await navigator.clipboard.writeText(qrBackupToken);
                      setQrCopied(true);
                      setQrShareStatus(
                        'Backup token copied to clipboard for sharing.'
                      );
                      setTimeout(() => setQrCopied(false), 2000);
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 font-display text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  <Share2 className="h-4 w-4 text-[#00685b]" />
                  <span>Share QR</span>
                </button>

                <button
                  type="button"
                  disabled={!qrBackupToken}
                  onClick={async () => {
                    if (!qrBackupToken) return;
                    await navigator.clipboard.writeText(qrBackupToken);
                    setQrCopied(true);
                    setQrShareStatus(
                      'Copied signed QR backup token to clipboard.'
                    );
                    setTimeout(() => setQrCopied(false), 2000);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 font-display text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  {qrCopied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span>Copied Token</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-slate-600" />
                      <span>Copy Token</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: RESTORE FROM SECURE QR BACKUP */}
      <AnimatePresence>
        {qrImportModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setQrImportModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="font-tech text-[10px] font-bold uppercase tracking-widest text-[#00685b] block">
                    RESTORE TAG METADATA
                  </span>
                  <h3 className="font-display text-xl font-extrabold text-slate-900 mt-0.5">
                    Restore from Secure QR Backup
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setQrImportModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {importError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}

              {importSuccessMessage && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{importSuccessMessage}</span>
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="restore-qr-token-textarea"
                    className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700"
                  >
                    QR Backup Token (`QBENCH-NFC1:...`)
                  </label>
                  <textarea
                    id="restore-qr-token-textarea"
                    rows={4}
                    value={importTokenInput}
                    onChange={(e) => {
                      setImportTokenInput(e.target.value);
                      setImportError(null);
                    }}
                    placeholder="Paste the QBENCH-NFC1:... backup token here"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="restore-qr-passphrase"
                    className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700"
                  >
                    Decryption Passphrase (If Protected)
                  </label>
                  <input
                    id="restore-qr-passphrase"
                    type="password"
                    value={importPassphraseInput}
                    onChange={(e) => {
                      setImportPassphraseInput(e.target.value);
                      setImportError(null);
                    }}
                    placeholder="Leave blank unless encrypted with a passphrase"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQrImportModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 font-display text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setImportError(null);
                    setImportSuccessMessage(null);
                    try {
                      const restored = await restoreSecureNfcBackupToken(
                        importTokenInput,
                        importPassphraseInput
                      );
                      setSavedCards((prev) => {
                        const byId = new Map(prev.map((c) => [c.id, c]));
                        for (const card of restored.cards) {
                          byId.set(card.id, card);
                        }
                        return Array.from(byId.values());
                      });
                      setImportSuccessMessage(
                        `Verified SHA-256 checksum (${restored.envelope.checksumSha256}) and restored ${restored.cards.length} NFC tag profile(s).`
                      );
                      setTimeout(() => {
                        setQrImportModalOpen(false);
                      }, 1200);
                    } catch (err: unknown) {
                      setImportError(
                        err instanceof Error
                          ? err.message
                          : 'Failed to restore QR backup.'
                      );
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#00685b] hover:bg-[#005348] px-5 py-2.5 font-display text-xs font-bold text-white cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span>Verify & Restore</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
