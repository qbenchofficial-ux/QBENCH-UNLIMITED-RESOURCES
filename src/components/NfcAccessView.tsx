import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Smartphone,
  CreditCard,
  Eye,
  Settings,
  AlertCircle,
  Lock,
  Radio,
  Info,
  ExternalLink,
  CheckCircle2,
  Cpu,
  QrCode,
  Download,
  Share2,
  Copy,
  Upload,
  KeyRound,
} from 'lucide-react';
import type { NavSection } from '../types';
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

export type ScanErrorCode =
  | 'NFC_NOT_SUPPORTED'
  | 'NFC_DISABLED'
  | 'CARD_NOT_DETECTED'
  | 'UNSUPPORTED_CARD'
  | 'SECURE_CARD';

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
  providerNotice?: string;
}

interface ScanErrorDetail {
  code: ScanErrorCode;
  title: string;
  message: string;
  extraBanner?: string;
}

const SCAN_ERROR_MAP: Record<ScanErrorCode, ScanErrorDetail> = {
  NFC_NOT_SUPPORTED: {
    code: 'NFC_NOT_SUPPORTED',
    title: 'NFC Not Supported',
    message: 'This device does not support NFC.',
  },
  NFC_DISABLED: {
    code: 'NFC_DISABLED',
    title: 'NFC Disabled',
    message: 'NFC is turned off. Please enable NFC in your phone settings.',
    extraBanner: 'Turn on NFC to scan an NFC card.',
  },
  CARD_NOT_DETECTED: {
    code: 'CARD_NOT_DETECTED',
    title: 'Card Not Detected',
    message: 'Hold the card near the NFC antenna and try again.',
  },
  UNSUPPORTED_CARD: {
    code: 'UNSUPPORTED_CARD',
    title: 'Unsupported Card',
    message: 'This card technology is not supported by this app.',
    extraBanner:
      'This card uses a security system that cannot be copied or emulated by this app.',
  },
  SECURE_CARD: {
    code: 'SECURE_CARD',
    title: 'Secure Card',
    message:
      'This access card uses protected security technology and cannot be copied or emulated.',
    extraBanner:
      'This card uses a security system that cannot be copied or emulated by this app.',
  },
};

const STORAGE_KEY_SAVED_CARDS = 'qbench_nfc_saved_access_cards_v1';
const STORAGE_KEY_NFC_ENABLED = 'qbench_nfc_hardware_enabled_v1';

const INITIAL_SAVED_CARDS: NfcDetectedCard[] = [
  {
    id: 'nfc-card-office-hq',
    name: 'Office Access',
    cardType: 'NFC-A (ISO 14443-3A) · NDEF Tag',
    compatibilityCategory: 'Access-Control Card (Readable Metadata)',
    maskedCardId: '••••••••4A9E',
    status: 'Compatible',
    activeState: 'Active',
    lastScanned: 'Today',
    lastScannedIso: new Date().toISOString(),
    ndefRecordsCount: 2,
    ndefSummary: 'Facility Zone: QBENCH Studio HQ · Door Reader Standard NDEF',
    isEncryptedOrProtected: false,
  },
  {
    id: 'nfc-card-production-suite',
    name: 'Studio Suite Pass',
    cardType: 'NFC Forum Type 2 (MIFARE Ultralight) · Read-Only',
    compatibilityCategory: 'Read-Only Tag',
    maskedCardId: '••••••••8C21',
    status: 'Read Only',
    activeState: 'Read Only',
    lastScanned: 'Today',
    lastScannedIso: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    ndefRecordsCount: 1,
    ndefSummary: 'Zone: Edit Bay & Motion Lab · Read-Only Hardware Lock',
    isEncryptedOrProtected: false,
  },
];

interface SampleHardwareTagPreset {
  id: string;
  label: string;
  subtitle: string;
  card: Omit<NfcDetectedCard, 'id' | 'lastScanned' | 'lastScannedIso'>;
  triggersError?: ScanErrorCode;
}

const HARDWARE_TAG_PRESETS: SampleHardwareTagPreset[] = [
  {
    id: 'preset-compatible-access',
    label: 'Standard Access Card (NDEF / ISO 14443-3A)',
    subtitle: 'Compatible access card exposing public NDEF metadata',
    card: {
      name: 'Access Card',
      cardType: 'NFC-A (ISO 14443-3A / NDEF)',
      compatibilityCategory: 'Access-Control Card (Readable Metadata)',
      maskedCardId: '••••••••7F3B',
      status: 'Compatible',
      activeState: 'Active',
      ndefRecordsCount: 2,
      ndefSummary: 'Android NFC NdefMessage · Public Facility Identifier Record',
      isEncryptedOrProtected: false,
    },
  },
  {
    id: 'preset-readonly-tag',
    label: 'Read-Only NFC Tag (NFC Forum Type 2)',
    subtitle: 'Locked NDEF tag that can be read but not modified',
    card: {
      name: 'Visitor Access Badge',
      cardType: 'NFC Forum Type 2 · Read-Only Tag',
      compatibilityCategory: 'Read-Only Tag',
      maskedCardId: '••••••••2D94',
      status: 'Read Only',
      activeState: 'Read Only',
      ndefRecordsCount: 1,
      ndefSummary: 'Read-Only NDEF Text Record · Guest Floor Access',
      isEncryptedOrProtected: false,
    },
  },
  {
    id: 'preset-standard-ndef',
    label: 'Standard NDEF Smart Tag (NFC-V / ISO 15693)',
    subtitle: 'Standard proximity tag with public URI/text payload',
    card: {
      name: 'Conference Room Key',
      cardType: 'NFC-V (ISO 15693) · NDEF-Compatible Tag',
      compatibilityCategory: 'NDEF-Compatible Tag',
      maskedCardId: '••••••••9B10',
      status: 'Compatible',
      activeState: 'Active',
      ndefRecordsCount: 1,
      ndefSummary: 'NDEF URI Record · Room 402 Smart Lock Metadata',
      isEncryptedOrProtected: false,
    },
  },
  {
    id: 'preset-secure-desfire',
    label: 'Secure Encrypted Access Card (MIFARE DESFire EV3 / HID Seos)',
    subtitle: 'Protected cryptographic access card (triggers security policy notice)',
    card: {
      name: 'Restricted Security Pass',
      cardType: 'ISO 14443-4 (IsoDep / MIFARE DESFire EV3)',
      compatibilityCategory: 'Secure / Encrypted Card',
      maskedCardId: '••••••••E402',
      status: 'Unsupported',
      activeState: 'Restricted',
      ndefRecordsCount: 0,
      ndefSummary:
        'Cryptographic mutual authentication required. Keys & sectors are hardware-protected.',
      isEncryptedOrProtected: true,
      providerNotice:
        'Reading an NFC card and securely emulating an access credential are different capabilities. Please use your building access provider’s official mobile credential app (e.g. HID Mobile Access, Brivo, or Google Wallet Corporate Badge).',
    },
    triggersError: 'SECURE_CARD',
  },
  {
    id: 'preset-unsupported-proprietary',
    label: 'Unsupported Proprietary Card (125 kHz / Non-Standard Protocol)',
    subtitle: 'Legacy or proprietary RF format not supported by Android NFC',
    card: {
      name: 'Unknown Card',
      cardType: 'Proprietary Non-NDEF RF Tag',
      compatibilityCategory: 'Secure / Encrypted Card',
      maskedCardId: '••••••••0000',
      status: 'Unsupported',
      activeState: 'Restricted',
      ndefRecordsCount: 0,
      ndefSummary: 'Unsupported modulation / proprietary command set.',
      isEncryptedOrProtected: true,
    },
    triggersError: 'UNSUPPORTED_CARD',
  },
];

function maskSerialNumber(serial?: string): string {
  if (!serial) {
    const hex = Math.floor(0x1000 + Math.random() * 0xefff)
      .toString(16)
      .toUpperCase();
    return `••••••••${hex}`;
  }
  const clean = serial.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
  if (clean.length <= 4) {
    return '••••••••';
  }
  return `••••••••${clean.slice(-4)}`;
}

function triggerHapticFeedback(pattern: number | number[] = [40, 60, 90]) {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore if blocked by browser autoplay/gesture policy
    }
  }
}

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

interface NfcAccessViewProps {
  onNavigate?: (section: NavSection) => void;
  embeddedInAdmin?: boolean;
}

export default function NfcAccessView({
  onNavigate,
  embeddedInAdmin = false,
}: NfcAccessViewProps) {
  // Hardware & Web NFC support detection
  const [hasNativeWebNfc] = useState<boolean>(() => {
    return typeof window !== 'undefined' && 'NDEFReader' in window;
  });

  // Device support simulation toggle (so user can verify "NFC Not Supported" error state on any device)
  const [nfcHardwareSupported, setNfcHardwareSupported] = useState<boolean>(true);

  // Phone NFC Enabled/Disabled setting
  const [nfcEnabled, setNfcEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = window.localStorage.getItem(STORAGE_KEY_NFC_ENABLED);
    return saved === null ? true : saved === 'true';
  });

  // Saved NFC Access Cards
  const [savedCards, setSavedCards] = useState<NfcDetectedCard[]>(() => {
    if (typeof window === 'undefined') return INITIAL_SAVED_CARDS;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_SAVED_CARDS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback to initial cards
    }
    return INITIAL_SAVED_CARDS;
  });

  // Scanner workflow states: 'idle' | 'scanning' | 'detected' | 'saved_success'
  const [scanStage, setScanStage] = useState<
    'idle' | 'scanning' | 'detected' | 'saved_success'
  >('idle');
  const [detectedCard, setDetectedCard] = useState<NfcDetectedCard | null>(null);
  const [customCardName, setCustomCardName] = useState<string>('Access Card');
  const [activeError, setActiveError] = useState<ScanErrorDetail | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    HARDWARE_TAG_PRESETS[0].id
  );
  const [rescanTargetCardId, setRescanTargetCardId] = useState<string | null>(null);

  // Modals for My NFC Cards: View Details, Rename, Phone NFC Settings sheet
  const [viewingCard, setViewingCard] = useState<NfcDetectedCard | null>(null);
  const [renamingCard, setRenamingCard] = useState<NfcDetectedCard | null>(null);
  const [renameInput, setRenameInput] = useState<string>('');
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [settingsNotice, setSettingsNotice] = useState<string | null>(null);

  // Secure QR Code Export & Restore Modal States
  const [qrExportModalOpen, setQrExportModalOpen] = useState<boolean>(false);
  const [qrExportTargetCards, setQrExportTargetCards] = useState<NfcDetectedCard[]>([]);
  const [qrExportLabel, setQrExportLabel] = useState<string>('');
  const [qrPassphrase, setQrPassphrase] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrBackupToken, setQrBackupToken] = useState<string>('');
  const [qrEnvelope, setQrEnvelope] = useState<SecureNfcBackupEnvelope | null>(null);
  const [qrGenerating, setQrGenerating] = useState<boolean>(false);
  const [qrCopied, setQrCopied] = useState<boolean>(false);
  const [qrShareStatus, setQrShareStatus] = useState<string | null>(null);

  // Restore from QR Backup Token Modal States
  const [qrImportModalOpen, setQrImportModalOpen] = useState<boolean>(false);
  const [importTokenInput, setImportTokenInput] = useState<string>('');
  const [importPassphraseInput, setImportPassphraseInput] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const scannerSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(
          STORAGE_KEY_SAVED_CARDS,
          JSON.stringify(savedCards)
        );
      } catch {
        // Ignore storage quota errors
      }
    }
  }, [savedCards]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(
          STORAGE_KEY_NFC_ENABLED,
          String(nfcEnabled)
        );
      } catch {
        // Ignore storage errors
      }
    }
  }, [nfcEnabled]);

  const stopActiveReaderSession = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (scanTimerRef.current) {
      window.clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopActiveReaderSession();
    };
  }, [stopActiveReaderSession]);

  const handleOpenAndroidNfcSettings = () => {
    setSettingsNotice(null);
    const isAndroid =
      typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

    if (isAndroid) {
      try {
        // Attempt official Android NFC Settings intent URI
        window.location.href =
          'intent:#Intent;action=android.settings.NFC_SETTINGS;end';
        setSettingsNotice(
          'Launched Android System NFC Settings (android.settings.NFC_SETTINGS).'
        );
        return;
      } catch {
        // Fallback to interactive settings modal
      }
    }

    setSettingsModalOpen(true);
    setSettingsNotice(
      'Android Intent: android.settings.NFC_SETTINGS — Use the toggle below or open Settings → Connected devices → Connection preferences → NFC on your phone.'
    );
  };

  const completeCardDetection = useCallback(
    (cardData: NfcDetectedCard, errorCode?: ScanErrorCode) => {
      stopActiveReaderSession();
      triggerHapticFeedback([35, 50, 95]);

      if (errorCode) {
        setActiveError(SCAN_ERROR_MAP[errorCode]);
      } else {
        setActiveError(null);
      }

      setDetectedCard(cardData);
      setCustomCardName(cardData.name || 'Access Card');
      setScanStage('detected');
    },
    [stopActiveReaderSession]
  );

  // Step-by-step Scan Card handler following all 9 specification steps
  const handleStartScan = async (targetCardForRescan?: NfcDetectedCard) => {
    stopActiveReaderSession();
    setActiveError(null);
    setDetectedCard(null);

    if (targetCardForRescan) {
      setRescanTargetCardId(targetCardForRescan.id);
    } else {
      setRescanTargetCardId(null);
    }

    // 1. Check whether NFC is supported
    if (!nfcHardwareSupported) {
      setScanStage('idle');
      setActiveError(SCAN_ERROR_MAP.NFC_NOT_SUPPORTED);
      return;
    }

    // 2. Check whether NFC is enabled
    // 3. If NFC is disabled, display: “NFC is turned off. Please enable NFC in your phone settings.”
    if (!nfcEnabled) {
      setScanStage('idle');
      setActiveError(SCAN_ERROR_MAP.NFC_DISABLED);
      return;
    }

    // 4. Start an NFC reader session
    // 5. Ask the user to place the compatible card near the NFC antenna
    setScanStage('scanning');
    triggerHapticFeedback(25);

    // If Web NFC API (Chrome on Android) is available, start real NDEFReader session
    if (hasNativeWebNfc) {
      try {
        const NDEFReaderClass = (
          window as unknown as {
            NDEFReader: new () => {
              scan: (options?: { signal?: AbortSignal }) => Promise<void>;
              onreading: ((event: any) => void) | null;
              onreadingerror: ((event: any) => void) | null;
            };
          }
        ).NDEFReader;

        const reader = new NDEFReaderClass();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        await reader.scan({ signal: controller.signal });

        reader.onreading = (event: any) => {
          // 6. Detect the NFC card/tag
          // 7. Read only information that the Android NFC framework legally exposes to the app
          //    (Never expose cryptographic keys, sector secrets, or raw credentials)
          const serialNumber: string = event?.serialNumber || '';
          const records = Array.isArray(event?.message?.records)
            ? event.message.records
            : [];

          const recordTypes = records
            .map((r: any) => r.recordType || 'unknown')
            .join(', ');

          const detected: NfcDetectedCard = {
            id: targetCardForRescan?.id || `nfc-${Date.now()}`,
            name: targetCardForRescan?.name || 'Access Card',
            cardType: `Android Web NFC · NDEF (${recordTypes || 'ISO 14443'})`,
            compatibilityCategory:
              records.length > 0
                ? 'NDEF-Compatible Tag'
                : 'Standard NFC Tag',
            maskedCardId: maskSerialNumber(serialNumber),
            status: 'Compatible',
            activeState: 'Active',
            lastScanned: 'Today',
            lastScannedIso: new Date().toISOString(),
            ndefRecordsCount: records.length,
            ndefSummary:
              records.length > 0
                ? `${records.length} public NDEF record(s) exposed by Android NFC framework (${recordTypes}).`
                : 'Tag UID detected via Android NFC reader session. No unencrypted NDEF payload present.',
            isEncryptedOrProtected: false,
          };

          completeCardDetection(detected);
        };

        reader.onreadingerror = () => {
          // Protected / unreadable tag encountered
          const secureCard: NfcDetectedCard = {
            id: `nfc-sec-${Date.now()}`,
            name: 'Protected Access Card',
            cardType: 'Encrypted ISO 14443-4 / Non-NDEF Access Credential',
            compatibilityCategory: 'Secure / Encrypted Card',
            maskedCardId: '••••••••',
            status: 'Unsupported',
            activeState: 'Restricted',
            lastScanned: 'Today',
            lastScannedIso: new Date().toISOString(),
            ndefRecordsCount: 0,
            ndefSummary:
              'This card uses a security system that cannot be copied or emulated by this app.',
            isEncryptedOrProtected: true,
          };
          completeCardDetection(secureCard, 'SECURE_CARD');
        };
      } catch (err: any) {
        if (err?.name === 'NotAllowedError') {
          setScanStage('idle');
          setActiveError(SCAN_ERROR_MAP.NFC_DISABLED);
          return;
        } else if (err?.name === 'NotSupportedError') {
          // Continue with interactive antenna detection below if desktop/webview
        }
      }
    }

    // Interactive hardware tap detection timer (2.2s smooth wave scan)
    scanTimerRef.current = window.setTimeout(() => {
      const preset =
        HARDWARE_TAG_PRESETS.find((p) => p.id === selectedPresetId) ||
        HARDWARE_TAG_PRESETS[0];

      const nowIso = new Date().toISOString();
      const detected: NfcDetectedCard = {
        id: targetCardForRescan?.id || `nfc-${Date.now()}`,
        name: targetCardForRescan?.name || preset.card.name || 'Access Card',
        cardType: preset.card.cardType,
        compatibilityCategory: preset.card.compatibilityCategory,
        maskedCardId: targetCardForRescan?.maskedCardId || preset.card.maskedCardId,
        status: preset.card.status,
        activeState: preset.card.activeState,
        lastScanned: 'Today',
        lastScannedIso: nowIso,
        ndefRecordsCount: preset.card.ndefRecordsCount,
        ndefSummary: preset.card.ndefSummary,
        isEncryptedOrProtected: preset.card.isEncryptedOrProtected,
        providerNotice: preset.card.providerNotice,
      };

      completeCardDetection(detected, preset.triggersError);
    }, 2200);
  };

  const handleCancelScan = () => {
    stopActiveReaderSession();
    setScanStage('idle');
    setRescanTargetCardId(null);
  };

  // 9. Allow the user to save the card as an access-card profile
  const handleSaveDetectedCard = () => {
    if (!detectedCard) return;

    // Prevent saving encrypted/unsupported security cards that cannot be copied or emulated
    if (
      detectedCard.isEncryptedOrProtected ||
      detectedCard.status === 'Unsupported'
    ) {
      setActiveError(SCAN_ERROR_MAP.SECURE_CARD);
      return;
    }

    const finalName = customCardName.trim() || detectedCard.name || 'Access Card';
    const nowIso = new Date().toISOString();

    const cardToSave: NfcDetectedCard = {
      ...detectedCard,
      name: finalName,
      lastScanned: 'Today',
      lastScannedIso: nowIso,
    };

    setSavedCards((prev) => {
      const existingIndex = prev.findIndex(
        (c) => c.id === cardToSave.id || c.id === rescanTargetCardId
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...prev[existingIndex],
          ...cardToSave,
          id: prev[existingIndex].id,
        };
        return updated;
      }
      return [cardToSave, ...prev];
    });

    triggerHapticFeedback([30, 40, 60]);
    setScanStage('saved_success');
    setRescanTargetCardId(null);

    window.setTimeout(() => {
      setScanStage('idle');
      setDetectedCard(null);
    }, 1600);
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

  const handleScanAgainForCard = (card: NfcDetectedCard) => {
    setViewingCard(null);
    if (scannerSectionRef.current) {
      scannerSectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
    handleStartScan(card);
  };

  const handleAddCardClick = () => {
    setActiveError(null);
    setDetectedCard(null);
    setScanStage('idle');
    if (scannerSectionRef.current) {
      scannerSectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  return (
    <div
      id="nfc-access-screen"
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
            <span>NFC ACCESS · SMART ACCESS MANAGER</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            NFC Access Card
          </h1>
          <p className="font-sans text-sm text-slate-600 max-w-2xl leading-relaxed">
            Scan and manage compatible NFC access cards using your phone’s
            built-in NFC hardware. Inspect legally exposed Android NFC tag
            metadata while respecting hardware security boundaries.
          </p>
        </div>

        {/* Top Quick Status Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500">
              NFC Status:
            </span>
            {nfcEnabled && nfcHardwareSupported ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <span aria-hidden="true">🟢</span>
                <span>NFC ON (Enabled)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600">
                <span aria-hidden="true">🔴</span>
                <span>NFC OFF (Disabled)</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleOpenAndroidNfcSettings}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 font-display text-xs font-bold text-slate-800 transition-colors cursor-pointer shadow-2xs"
          >
            <Settings className="h-4 w-4 text-[#00685b]" />
            <span>Open NFC Settings</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Architecture: Left = 1. Dark/Modern NFC Card Scanner & 2. Card Detected Screen | Right = 5. Phone NFC Settings & 4. NFC Compatibility */}
      <div
        ref={scannerSectionRef}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        {/* LEFT COLUMN (7 cols): Dedicated Dark/Modern NFC Scanner & Card Detected Screen */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl bg-[#0b1313] text-white border border-emerald-500/20 shadow-xl overflow-hidden relative">
            {/* Subtle ambient radial glow */}
            <div
              className="absolute inset-0 pointer-events-none opacity-35"
              style={{
                background:
                  'radial-gradient(circle at 50% 32%, rgba(0, 168, 143, 0.28), transparent 68%)',
              }}
            />

            {/* Scanner Top Bar */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-6 sm:px-8 pt-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <CreditCard className="h-4 w-4 text-[#45b88a]" />
                <span className="font-tech text-xs font-extrabold tracking-widest uppercase text-white">
                  NFC ACCESS CARD
                </span>
              </div>

              {/* NFC Status Indicator: NFC ON / NFC OFF */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setNfcEnabled((prev) => !prev);
                    setActiveError(null);
                  }}
                  title="Toggle phone NFC state"
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-mono font-bold transition-colors cursor-pointer border ${
                    nfcEnabled && nfcHardwareSupported
                      ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                      : 'bg-red-500/15 border-red-400/40 text-red-300'
                  }`}
                >
                  {nfcEnabled && nfcHardwareSupported ? (
                    <>
                      <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                      <span>NFC ON</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3.5 w-3.5 text-red-400" />
                      <span>NFC OFF</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Scanner Body */}
            <div className="relative z-10 p-6 sm:p-10">
              <AnimatePresence mode="wait">
                {/* STATE A: IDLE OR SCANNING */}
                {(scanStage === 'idle' || scanStage === 'scanning') && (
                  <motion.div
                    key="scanner-stage-active"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col items-center text-center space-y-7"
                  >
                    <div className="space-y-2 max-w-md">
                      <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        Scan your access card
                      </h2>
                      <p className="font-sans text-sm text-slate-300">
                        “Hold your NFC card against the back of your phone.”
                      </p>
                    </div>

                    {/* Central Animated NFC Card & Waves Illustration */}
                    <div className="relative flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72 my-2">
                      {/* Outer Pulsing Rings when scanning */}
                      {scanStage === 'scanning' && (
                        <>
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
                        </>
                      )}

                      {/* Stationary Outer Ring */}
                      <div
                        className={`relative z-10 flex flex-col items-center justify-center w-52 h-52 rounded-full border transition-all duration-500 ${
                          scanStage === 'scanning'
                            ? 'border-[#45b88a] bg-[#102220]/90 shadow-[0_0_50px_rgba(69,184,138,0.28)]'
                            : 'border-white/15 bg-white/[0.04]'
                        }`}
                      >
                        {/* Animated NFC Waves above Card */}
                        <motion.div
                          animate={
                            scanStage === 'scanning'
                              ? { y: [0, -4, 0], opacity: [0.6, 1, 0.6] }
                              : { opacity: 0.75 }
                          }
                          transition={{
                            duration: 1.4,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                          className="mb-2"
                        >
                          <Wifi className="h-9 w-9 text-[#45b88a]" />
                        </motion.div>

                        {/* Premium NFC Access Card Illustration */}
                        <motion.div
                          animate={
                            scanStage === 'scanning'
                              ? {
                                  rotateX: [0, 8, 0],
                                  rotateY: [-6, 6, -6],
                                  y: [0, -5, 0],
                                }
                              : { rotateX: 0, rotateY: 0, y: 0 }
                          }
                          transition={{
                            duration: 2.2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                          className="w-32 h-20 rounded-xl bg-gradient-to-br from-[#00685b] via-[#0c8575] to-[#123532] border border-emerald-300/30 p-3 flex flex-col justify-between shadow-lg"
                        >
                          <div className="flex items-center justify-between">
                            {/* Smart Card Chip */}
                            <div className="w-5 h-4 rounded-xs bg-amber-300/90 border border-amber-200/60" />
                            <Radio className="h-3.5 w-3.5 text-emerald-200" />
                          </div>
                          <div className="text-left">
                            <div className="text-[8px] font-mono uppercase tracking-widest text-emerald-200/80">
                              QBENCH ACCESS
                            </div>
                            <div className="text-[10px] font-mono font-bold text-white tracking-wider">
                              •••• ••••
                            </div>
                          </div>
                        </motion.div>

                        <span className="mt-3 font-mono text-[11px] uppercase tracking-widest text-emerald-300/90">
                          {scanStage === 'scanning'
                            ? 'Hold Card Near Antenna...'
                            : 'Ready to Scan'}
                        </span>
                      </div>
                    </div>

                    {/* Active Error State Alert Banner (Section 7 Error States) */}
                    {activeError && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        role="alert"
                        className="w-full max-w-lg rounded-2xl border border-red-400/35 bg-red-950/50 p-4 text-left space-y-2"
                      >
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <h3 className="font-display text-sm font-bold text-red-200">
                              {activeError.title}
                            </h3>
                            <p className="font-sans text-xs text-red-100/90 leading-relaxed">
                              {activeError.message}
                            </p>
                            {activeError.extraBanner && (
                              <p className="font-sans text-xs text-amber-200/90 pt-1 border-t border-red-400/20 mt-2">
                                {activeError.extraBanner}
                              </p>
                            )}
                          </div>
                        </div>

                        {activeError.code === 'NFC_DISABLED' && (
                          <div className="pt-2 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setNfcEnabled(true);
                                setActiveError(null);
                              }}
                              className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer"
                            >
                              Enable NFC Now
                            </button>
                            <button
                              type="button"
                              onClick={handleOpenAndroidNfcSettings}
                              className="rounded-lg border border-white/20 bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer"
                            >
                              Open NFC Settings
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Card Simulation Profile Selector (for testing all 5 compatibility types) */}
                    <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="nfc-tag-profile-select"
                          className="font-tech text-[11px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5"
                        >
                          <Cpu className="h-3.5 w-3.5" />
                          <span>Detected Tag Type (Hardware / Test Profile)</span>
                        </label>
                        <span className="text-[11px] text-slate-400">
                          {hasNativeWebNfc
                            ? 'Android Web NFC Active'
                            : 'Interactive Reader Mode'}
                        </span>
                      </div>
                      <select
                        id="nfc-tag-profile-select"
                        value={selectedPresetId}
                        onChange={(e) => setSelectedPresetId(e.target.value)}
                        disabled={scanStage === 'scanning'}
                        className="w-full rounded-xl border border-white/15 bg-[#122020] px-3.5 py-2.5 text-xs text-white focus:border-[#45b88a] focus:outline-none"
                      >
                        {HARDWARE_TAG_PRESETS.map((preset) => (
                          <option key={preset.id} value={preset.id}>
                            {preset.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        {
                          HARDWARE_TAG_PRESETS.find(
                            (p) => p.id === selectedPresetId
                          )?.subtitle
                        }
                      </p>
                    </div>

                    {/* Primary Action Buttons: Scan Card & Cancel */}
                    <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-md pt-2">
                      {scanStage === 'idle' ? (
                        <button
                          id="nfc-scan-card-btn"
                          type="button"
                          onClick={() => handleStartScan()}
                          className="flex-1 min-w-[180px] inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#008978] hover:bg-[#00a08c] px-6 py-3.5 font-display text-sm font-bold text-white shadow-lg transition-all cursor-pointer"
                        >
                          <Wifi className="h-4 w-4" />
                          <span>Scan Card</span>
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled
                            className="flex-1 min-w-[180px] inline-flex items-center justify-center gap-2.5 rounded-xl bg-emerald-700/60 px-6 py-3.5 font-display text-sm font-bold text-emerald-100 cursor-wait"
                          >
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Scanning NFC Antenna...</span>
                          </button>
                          <button
                            id="nfc-cancel-scan-btn"
                            type="button"
                            onClick={handleCancelScan}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 px-5 py-3.5 font-display text-sm font-semibold text-white transition-colors cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                            <span>Cancel</span>
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* STATE B: 2. CARD DETECTED SCREEN */}
                {scanStage === 'detected' && detectedCard && (
                  <motion.div
                    key="scanner-stage-detected"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Header with Checkmark */}
                    <div className="flex flex-col items-center text-center space-y-3">
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 260,
                          damping: 18,
                        }}
                        className={`h-16 w-16 rounded-full flex items-center justify-center border-2 ${
                          detectedCard.status === 'Unsupported'
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                            : 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        }`}
                      >
                        {detectedCard.status === 'Unsupported' ? (
                          <ShieldAlert className="h-8 w-8" />
                        ) : (
                          <Check className="h-8 w-8 stroke-[2.5]" />
                        )}
                      </motion.div>

                      <div className="space-y-1">
                        <span className="font-tech text-sm font-black tracking-widest uppercase text-emerald-300 block">
                          CARD DETECTED ✓
                        </span>
                        <p className="font-sans text-xs text-slate-300">
                          Public Android NFC metadata read complete. Cryptographic
                          keys and authentication secrets are never accessed or
                          exposed.
                        </p>
                      </div>
                    </div>

                    {/* Security Restriction Notice if Encrypted / Unsupported */}
                    {(detectedCard.isEncryptedOrProtected ||
                      detectedCard.status === 'Unsupported') && (
                      <div
                        role="alert"
                        className="rounded-2xl border border-amber-400/40 bg-amber-950/40 p-4 text-left space-y-2"
                      >
                        <div className="flex items-start gap-2.5">
                          <Lock className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="font-display text-xs font-bold text-amber-200">
                              This card uses a security system that cannot be
                              copied or emulated by this app.
                            </p>
                            <p className="font-sans text-xs text-amber-100/85 leading-relaxed">
                              This access card uses protected security technology
                              and cannot be copied or emulated.
                            </p>
                            {detectedCard.providerNotice && (
                              <p className="font-sans text-[11px] text-slate-300 pt-1">
                                {detectedCard.providerNotice}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Card Details Grid (Strictly matching Section 2) */}
                    <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 space-y-4">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="detected-card-name-input"
                          className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-400"
                        >
                          Card Name
                        </label>
                        <input
                          id="detected-card-name-input"
                          type="text"
                          value={customCardName}
                          onChange={(e) => setCustomCardName(e.target.value)}
                          placeholder="Access Card"
                          className="w-full rounded-xl border border-white/15 bg-[#122020] px-4 py-2.5 text-sm font-semibold text-white focus:border-[#45b88a] focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10 text-left">
                        <div>
                          <span className="block font-tech text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Card Type
                          </span>
                          <span className="font-mono text-xs font-semibold text-white mt-0.5 block">
                            {detectedCard.cardType}
                          </span>
                        </div>

                        <div>
                          <span className="block font-tech text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Card ID (Masked)
                          </span>
                          <span className="font-mono text-xs font-semibold text-emerald-300 mt-0.5 block">
                            {detectedCard.maskedCardId}
                          </span>
                        </div>

                        <div>
                          <span className="block font-tech text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Status
                          </span>
                          <span
                            className={`font-display text-xs font-bold mt-0.5 block ${
                              detectedCard.status === 'Compatible'
                                ? 'text-emerald-300'
                                : detectedCard.status === 'Read Only'
                                ? 'text-sky-300'
                                : 'text-amber-300'
                            }`}
                          >
                            {detectedCard.status}
                          </span>
                        </div>

                        <div>
                          <span className="block font-tech text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Compatibility Classification
                          </span>
                          <span className="font-sans text-xs text-slate-200 mt-0.5 block">
                            {detectedCard.compatibilityCategory}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/10 text-left">
                        <span className="block font-tech text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Android NFC Framework Summary
                        </span>
                        <p className="font-sans text-xs text-slate-300 mt-1 leading-relaxed">
                          {detectedCard.ndefSummary}
                        </p>
                      </div>
                    </div>

                    {/* Buttons: Save Card & Scan Again */}
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        id="nfc-save-card-btn"
                        type="button"
                        disabled={
                          detectedCard.isEncryptedOrProtected ||
                          detectedCard.status === 'Unsupported'
                        }
                        onClick={handleSaveDetectedCard}
                        className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#008978] hover:bg-[#00a08c] disabled:opacity-45 disabled:cursor-not-allowed px-6 py-3.5 font-display text-sm font-bold text-white shadow-lg transition-all cursor-pointer"
                      >
                        <Check className="h-4 w-4" />
                        <span>Save Card</span>
                      </button>

                      <button
                        id="nfc-scan-again-btn"
                        type="button"
                        onClick={() => handleStartScan()}
                        className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 px-6 py-3.5 font-display text-sm font-semibold text-white transition-colors cursor-pointer"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span>Scan Again</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STATE C: SAVED SUCCESS TRANSITION */}
                {scanStage === 'saved_success' && (
                  <motion.div
                    key="scanner-stage-saved"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-14 flex flex-col items-center text-center space-y-4"
                  >
                    <div className="h-16 w-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300">
                      <CheckCircle2 className="h-9 w-9" />
                    </div>
                    <h3 className="font-display text-2xl font-bold text-white">
                      Access Card Saved
                    </h3>
                    <p className="font-sans text-xs text-slate-300 max-w-sm">
                      Added to <strong className="text-white">MY NFC CARDS</strong>.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): 5. Phone NFC Settings & 4. NFC Compatibility Matrix */}
        <div className="lg:col-span-5 space-y-6">
          {/* 5. Phone NFC Settings Panel */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#00685b] block">
                  PHONE HARDWARE CONFIGURATION
                </span>
                <h2 className="font-display text-xl font-extrabold text-slate-900">
                  NFC Settings
                </h2>
              </div>
              <Smartphone className="h-6 w-6 text-[#00685b] shrink-0" />
            </div>

            <div className="rounded-xl border border-slate-200/90 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs font-semibold text-slate-600">
                  NFC Status:
                </span>
                {nfcEnabled && nfcHardwareSupported ? (
                  <span className="font-display text-sm font-bold text-emerald-700 flex items-center gap-1.5">
                    <span aria-hidden="true">🟢</span>
                    <span>Enabled</span>
                  </span>
                ) : (
                  <span className="font-display text-sm font-bold text-red-600 flex items-center gap-1.5">
                    <span aria-hidden="true">🔴</span>
                    <span>Disabled</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/70 text-xs">
                <span className="text-slate-500">
                  Device NFC Radio Power
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setNfcEnabled((prev) => !prev);
                    setActiveError(null);
                  }}
                  className={`rounded-lg px-3 py-1 font-display text-xs font-bold transition-colors cursor-pointer ${
                    nfcEnabled
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                  }`}
                >
                  {nfcEnabled ? 'Turn Off' : 'Turn On'}
                </button>
              </div>
            </div>

            {settingsNotice && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900 leading-relaxed">
                {settingsNotice}
              </div>
            )}

            <button
              id="open-nfc-settings-btn"
              type="button"
              onClick={handleOpenAndroidNfcSettings}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-3 font-display text-xs font-bold text-white transition-colors cursor-pointer"
            >
              <Settings className="h-4 w-4" />
              <span>Open NFC Settings</span>
            </button>

            {/* Quick Diagnostics / Error State Verification Controls */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="block font-tech text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Diagnostic Error State Verification
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setNfcHardwareSupported(false);
                    setScanStage('idle');
                    setActiveError(SCAN_ERROR_MAP.NFC_NOT_SUPPORTED);
                  }}
                  className="rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 cursor-pointer"
                >
                  Test: NFC Not Supported
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNfcHardwareSupported(true);
                    setNfcEnabled(false);
                    setScanStage('idle');
                    setActiveError(SCAN_ERROR_MAP.NFC_DISABLED);
                  }}
                  className="rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 cursor-pointer"
                >
                  Test: NFC Disabled
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNfcHardwareSupported(true);
                    setNfcEnabled(true);
                    setScanStage('idle');
                    setActiveError(SCAN_ERROR_MAP.CARD_NOT_DETECTED);
                  }}
                  className="rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 cursor-pointer"
                >
                  Test: Card Not Detected
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNfcHardwareSupported(true);
                    setNfcEnabled(true);
                    setScanStage('idle');
                    setActiveError(SCAN_ERROR_MAP.UNSUPPORTED_CARD);
                  }}
                  className="rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 cursor-pointer"
                >
                  Test: Unsupported Card
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNfcHardwareSupported(true);
                    setNfcEnabled(true);
                    setScanStage('idle');
                    setActiveError(SCAN_ERROR_MAP.SECURE_CARD);
                  }}
                  className="rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 cursor-pointer"
                >
                  Test: Secure Card
                </button>
              </div>
            </div>
          </div>

          {/* 4. NFC Compatibility & Android Security Boundaries */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#00685b]" />
              <h3 className="font-display text-base font-extrabold text-slate-900">
                NFC Compatibility & Security Boundaries
              </h3>
            </div>

            <p className="font-sans text-xs text-slate-600 leading-relaxed">
              Reading an NFC card and securely emulating an access credential
              are different capabilities. This feature uses official Android NFC
              APIs and never bypasses encryption or protected card credentials.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-700">
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Standard NFC tags</strong> that can be read by Android
                  (NFC-A, NFC-B, NFC-F, NFC-V)
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Read-only tags</strong> (hardware-locked NFC Forum
                  tags)
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>NDEF-compatible tags</strong> exposing public records
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Access-control cards</strong> that expose readable
                  public information
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Lock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Secure/encrypted cards</strong> (e.g. MIFARE DESFire
                  EV3, HID Seos) that cannot be copied or emulated by this app
                </span>
              </li>
            </ul>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3.5 text-[11px] text-slate-600 leading-relaxed flex items-start gap-2.5">
              <Info className="h-4 w-4 text-[#00685b] shrink-0 mt-0.5" />
              <span>
                Where Android hardware or your building’s access-control system
                does not support open tag emulation, please use your access
                provider’s official mobile credential system.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: MY NFC CARDS */}
      <section id="my-nfc-cards-section" className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#00685b] block">
              SAVED ACCESS PROFILES
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
                    `All Saved NFC Cards (${savedCards.length} ${
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

            <button
              id="add-nfc-card-btn"
              type="button"
              onClick={handleAddCardClick}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00685b] hover:bg-[#005348] px-5 py-2.5 font-display text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>+ Add NFC Card</span>
            </button>
          </div>
        </div>

        {savedCards.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-4">
            <CreditCard className="h-10 w-10 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-display text-base font-bold text-slate-800">
                No Saved Access Cards Yet
              </h3>
              <p className="font-sans text-xs text-slate-500 max-w-md mx-auto">
                Tap “+ Add NFC Card” or use the scanner above to scan a
                compatible NFC access card and save its profile.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddCardClick}
              className="inline-flex items-center gap-2 rounded-xl bg-[#00685b] px-4 py-2.5 font-display text-xs font-bold text-white cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>+ Add NFC Card</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedCards.map((card) => (
              <div
                key={card.id}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Top Metallic Dark Card Graphic */}
                <div className="bg-gradient-to-br from-[#0d1b1a] via-[#0f2926] to-[#005449] p-5 text-white relative">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-lg font-extrabold text-white tracking-tight">
                        {card.name}
                      </h3>
                      <p className="font-sans text-xs text-emerald-200/90 mt-0.5">
                        NFC Access Card
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
                        Card ID
                      </span>
                      <span className="font-mono text-xs font-bold text-white">
                        {card.maskedCardId}
                      </span>
                    </div>
                    <div className="text-right font-sans text-xs text-emerald-100">
                      <span>Status: {card.activeState}</span>
                      <span className="mx-1.5" aria-hidden="true">
                        ·
                      </span>
                      <span>
                        Last Scanned:{' '}
                        {formatRelativeScanTime(card.lastScannedIso)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Metadata & Actions */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="font-mono text-[11px] text-slate-700 truncate">
                      {card.cardType}
                    </div>
                    <p className="text-slate-500 line-clamp-2 leading-relaxed">
                      {card.ndefSummary}
                    </p>
                  </div>

                  {/* Primary & QR Export Actions */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingCard(card)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-2 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 text-[#00685b]" />
                        <span>View Details</span>
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
                        onClick={() => handleScanAgainForCard(card)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-2 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="h-3.5 w-3.5 text-slate-600" />
                        <span>Scan Again</span>
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

                    {/* Dedicated Export as Secure QR Button */}
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

      {/* MODAL: VIEW CARD DETAILS */}
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
                    NFC ACCESS CARD PROFILE
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
                    Card Name
                  </span>
                  <span className="font-bold text-slate-900 mt-0.5 block">
                    {viewingCard.name}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-400 block font-tech uppercase text-[10px]">
                    Card ID (Masked)
                  </span>
                  <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                    {viewingCard.maskedCardId}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 col-span-2">
                  <span className="text-slate-400 block font-tech uppercase text-[10px]">
                    Card Type / Tag Technology
                  </span>
                  <span className="font-mono font-semibold text-slate-800 mt-0.5 block">
                    {viewingCard.cardType}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-400 block font-tech uppercase text-[10px]">
                    Status
                  </span>
                  <span className="font-bold text-emerald-700 mt-0.5 block">
                    {viewingCard.activeState} ({viewingCard.status})
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-400 block font-tech uppercase text-[10px]">
                    Last Scanned
                  </span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {formatRelativeScanTime(viewingCard.lastScannedIso)}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-4 text-xs space-y-1.5">
                <span className="font-tech text-[10px] font-bold uppercase text-slate-500 block">
                  Readable Public Metadata
                </span>
                <p className="text-slate-700 leading-relaxed">
                  {viewingCard.ndefSummary}
                </p>
                <p className="text-[11px] text-slate-500 pt-1">
                  Sensitive card credentials, cryptographic keys, and
                  authentication secrets are never stored or exposed.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleScanAgainForCard(viewingCard)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Scan Again</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingCard(null)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#00685b] px-5 py-2 text-xs font-bold text-white cursor-pointer"
                >
                  <span>Close</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: RENAME CARD */}
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
                  Rename Access Card
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
                    Card Name
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
                    Save Name
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: ANDROID SYSTEM NFC SETTINGS SHEET */}
      <AnimatePresence>
        {settingsModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setSettingsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 shadow-xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <Settings className="h-5 w-5 text-[#00685b]" />
                  <h3 className="font-display text-lg font-extrabold text-slate-900">
                    Phone NFC Settings
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSettingsModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs text-slate-600">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="font-display text-sm font-bold text-slate-900 block">
                      Use NFC
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Allow data exchange when phone touches another device or
                      NFC reader
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNfcHardwareSupported(true);
                      setNfcEnabled((prev) => !prev);
                      setActiveError(null);
                    }}
                    className={`px-3.5 py-2 rounded-xl font-display text-xs font-bold cursor-pointer transition-colors ${
                      nfcEnabled
                        ? 'bg-emerald-600 text-white'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {nfcEnabled ? '🟢 Enabled' : '🔴 Disabled'}
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                  <span className="font-mono text-[11px] font-bold text-slate-700 block">
                    Android System Intent:
                  </span>
                  <code className="block font-mono text-[11px] text-[#00685b]">
                    android.settings.NFC_SETTINGS
                  </code>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setSettingsModalOpen(false)}
                  className="rounded-xl bg-[#00685b] px-5 py-2.5 font-display text-xs font-bold text-white cursor-pointer"
                >
                  Done
                </button>
              </div>
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
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="font-tech text-[10px] font-bold uppercase tracking-widest text-[#00685b] flex items-center gap-1.5">
                    <QrCode className="h-3.5 w-3.5" />
                    <span>SECURE QR BACKUP & SHARING</span>
                  </span>
                  <h3 className="font-display text-xl font-extrabold text-slate-900 mt-0.5">
                    {qrExportLabel || 'NFC Access Card QR Backup'}
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

              {/* Optional AES-256-GCM Passphrase Protection */}
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
                    placeholder="Leave blank for standard signed QR or enter passphrase..."
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
                <p className="text-[11px] text-slate-500 leading-normal">
                  Only public Android NFC metadata and masked card IDs (••••)
                  are encoded. Cryptographic keys or raw credentials are never
                  included.
                </p>
              </div>

              {/* QR Code Display Canvas */}
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
                    <div className="text-[11px] text-slate-500">
                      {qrEnvelope.cardCount} Card Profile
                      {qrEnvelope.cardCount === 1 ? '' : 's'} ·{' '}
                      {qrEnvelope.mode === 'AES_GCM_256'
                        ? 'AES-256-GCM Encrypted'
                        : 'SHA-256 Integrity Verified'}
                    </div>
                  </div>
                )}
              </div>

              {qrShareStatus && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 text-center font-medium">
                  {qrShareStatus}
                </div>
              )}

              {/* Actions: Download PNG, Share QR, Copy Backup String */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  disabled={!qrDataUrl}
                  onClick={() => {
                    if (!qrDataUrl) return;
                    const link = document.createElement('a');
                    const slug = (qrExportLabel || 'nfc-card')
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
                          title: `QBENCH NFC Card Backup — ${qrExportLabel}`,
                          text: `QBENCH Secure NFC Card Backup (${qrExportLabel})\nToken:\n${qrBackupToken}`,
                        });
                        setQrShareStatus('Shared successfully via device share sheet.');
                        return;
                      }
                    } catch {
                      // Fallback to clipboard copy if user cancels or share API is unavailable
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
                    setQrShareStatus('Copied signed QR backup token to clipboard.');
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

      {/* MODAL: RESTORE / IMPORT NFC CARDS FROM SECURE QR BACKUP */}
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
                    RESTORE SAVED ACCESS PROFILES
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
                    placeholder="Paste the scanned QR code payload or QBENCH-NFC1:... backup token here"
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
                    placeholder="Leave blank unless the QR backup was encrypted with a passphrase"
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
                        `Verified SHA-256 checksum (${restored.envelope.checksumSha256}) and restored ${restored.cards.length} NFC card profile(s).`
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
                  <span>Verify & Restore Cards</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
