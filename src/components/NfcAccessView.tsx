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
  CheckCircle2,
  Cpu,
  QrCode,
  Download,
  Share2,
  Copy,
  Upload,
  KeyRound,
  ArrowLeft,
} from 'lucide-react';
import type { NavSection } from '../types';
import {
  generateSecureNfcBackupQr,
  restoreSecureNfcBackupToken,
  type SecureNfcBackupEnvelope,
} from '../utils/nfcQrBackup';
import {
  queryAndroidNfcAdapterState,
  launchAndroidNfcSettingsIntent,
  getNativeAndroidNfcBridge,
  STORAGE_KEY_NFC_SUPPORTED,
  STORAGE_KEY_NFC_ENABLED,
} from '../utils/androidNfcBridge';

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
    title: 'NFC NOT SUPPORTED',
    message:
      'This device does not have NFC hardware and cannot scan NFC cards.',
  },
  NFC_DISABLED: {
    code: 'NFC_DISABLED',
    title: 'NFC IS OFF',
    message: 'NFC is currently disabled on your phone.',
    extraBanner: 'Turn on NFC in Settings to scan your access card.',
  },
  CARD_NOT_DETECTED: {
    code: 'CARD_NOT_DETECTED',
    title: 'Card Not Detected',
    message: 'Hold the card near the NFC antenna and try again.',
  },
  UNSUPPORTED_CARD: {
    code: 'UNSUPPORTED_CARD',
    title: 'PROTECTED CARD',
    message:
      'This access card uses security technology that cannot be copied or emulated by this app.',
    extraBanner: 'This card technology is not supported by this app.',
  },
  SECURE_CARD: {
    code: 'SECURE_CARD',
    title: 'PROTECTED CARD',
    message:
      'This access card uses security technology that cannot be copied or emulated by this app.',
    extraBanner:
      'This card uses a security system that cannot be copied or emulated by this app.',
  },
};

const STORAGE_KEY_SAVED_CARDS = 'qbench_nfc_saved_access_cards_v1';

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
    subtitle: 'Protected cryptographic access card (triggers PROTECTED CARD state)',
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
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.vibrate === 'function'
  ) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore if blocked by browser gesture policy
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

  // 1. Check `NfcAdapter.getDefaultAdapter(context)` -> `nfcHardwareSupported`
  const [nfcHardwareSupported, setNfcHardwareSupported] = useState<boolean>(
    () => {
      const initial = queryAndroidNfcAdapterState();
      return initial.isSupported;
    }
  );

  // 2. Check `nfcAdapter.isEnabled` -> `nfcEnabled`
  const [nfcEnabled, setNfcEnabled] = useState<boolean>(() => {
    const initial = queryAndroidNfcAdapterState();
    return initial.isEnabled;
  });

  // Tracks whether the user opened Android NFC Settings and returned to the app (`onResume()`)
  const [awaitingSettingsReturn, setAwaitingSettingsReturn] =
    useState<boolean>(false);
  const [verifiedReadyAfterSettings, setVerifiedReadyAfterSettings] =
    useState<boolean>(false);
  const [lastLifecycleCheckLabel, setLastLifecycleCheckLabel] = useState<string>(
    'Initial check: NfcAdapter.getDefaultAdapter(context) & nfcAdapter.isEnabled'
  );

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
  const [rescanTargetCardId, setRescanTargetCardId] = useState<string | null>(
    null
  );

  // Modals for My NFC Cards: View Details, Rename, Phone NFC Settings sheet
  const [viewingCard, setViewingCard] = useState<NfcDetectedCard | null>(null);
  const [renamingCard, setRenamingCard] = useState<NfcDetectedCard | null>(
    null
  );
  const [renameInput, setRenameInput] = useState<string>('');
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [settingsNotice, setSettingsNotice] = useState<string | null>(null);

  // Secure QR Code Export & Restore Modal States
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

  // Restore from QR Backup Token Modal States
  const [qrImportModalOpen, setQrImportModalOpen] = useState<boolean>(false);
  const [importTokenInput, setImportTokenInput] = useState<string>('');
  const [importPassphraseInput, setImportPassphraseInput] =
    useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMessage, setImportSuccessMessage] = useState<
    string | null
  >(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const scannerSectionRef = useRef<HTMLDivElement | null>(null);
  const awaitingSettingsReturnRef = useRef<boolean>(false);

  useEffect(() => {
    awaitingSettingsReturnRef.current = awaitingSettingsReturn;
  }, [awaitingSettingsReturn]);

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
          STORAGE_KEY_NFC_SUPPORTED,
          String(nfcHardwareSupported)
        );
      } catch {
        // Ignore storage errors
      }
    }
  }, [nfcHardwareSupported]);

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
    const nativeBridge = getNativeAndroidNfcBridge();
    if (nativeBridge && typeof nativeBridge.stopReaderMode === 'function') {
      try {
        nativeBridge.stopReaderMode();
      } catch {
        // Ignore
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      stopActiveReaderSession();
    };
  }, [stopActiveReaderSession]);

  /**
   * Re-checks `NfcAdapter.getDefaultAdapter(context)` and `nfcAdapter.isEnabled`
   * when the user returns from Android NFC Settings (`onResume()` / `visibilitychange` / `focus`).
   * Never assumes NFC was enabled—verifies the actual current state.
   */
  const handleReverifyNfcOnResume = useCallback(
    (overrideSupported?: boolean, overrideEnabled?: boolean, sourceLabel = 'onResume()') => {
      const snapshot = queryAndroidNfcAdapterState(
        overrideSupported,
        overrideEnabled
      );

      setNfcHardwareSupported(snapshot.isSupported);
      setNfcEnabled(snapshot.isEnabled);

      if (!snapshot.isSupported) {
        stopActiveReaderSession();
        setScanStage('idle');
        setVerifiedReadyAfterSettings(false);
        setActiveError(null);
        setLastLifecycleCheckLabel(
          `${sourceLabel}: NfcAdapter.getDefaultAdapter(context) == null → NFC NOT SUPPORTED`
        );
        return;
      }

      if (snapshot.isEnabled) {
        if (awaitingSettingsReturnRef.current) {
          setVerifiedReadyAfterSettings(true);
          setAwaitingSettingsReturn(false);
          triggerHapticFeedback([30, 50]);
        }
        setActiveError(null);
        setLastLifecycleCheckLabel(
          `${sourceLabel}: nfcAdapter.isEnabled == true → NFC READY ✓ (Scanner prepared)`
        );
      } else {
        stopActiveReaderSession();
        setScanStage('idle');
        setVerifiedReadyAfterSettings(false);
        setLastLifecycleCheckLabel(
          `${sourceLabel}: nfcAdapter.isEnabled == false → NFC IS OFF`
        );
      }
    },
    [stopActiveReaderSession]
  );

  // Register Android Activity lifecycle (`onResume` / `onPause`) & browser visibility/focus listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Scenario 11: App goes to background during scanning → pause reader safely without crashing
        if (scanStage === 'scanning') {
          stopActiveReaderSession();
          setScanStage('idle');
          setLastLifecycleCheckLabel(
            'onPause(): App moved to background during scan — NFC reader session paused safely.'
          );
        }
      } else if (document.visibilityState === 'visible') {
        // Scenario 5 & 12: App returns to foreground / returns from Android NFC Settings
        handleReverifyNfcOnResume(undefined, undefined, 'onResume()');
      }
    };

    const handleWindowFocus = () => {
      if (awaitingSettingsReturnRef.current) {
        handleReverifyNfcOnResume(undefined, undefined, 'onResume()');
      }
    };

    window.onAndroidNfcResume = () => {
      handleReverifyNfcOnResume(undefined, undefined, 'Activity.onResume()');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      delete window.onAndroidNfcResume;
    };
  }, [scanStage, stopActiveReaderSession, handleReverifyNfcOnResume]);

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

  // Listen for native Android `NfcAdapter.ReaderCallback` tag discovery events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.onAndroidNfcTagDiscovered = (payloadJson: string) => {
      try {
        const parsed = JSON.parse(payloadJson || '{}');
        const isProtected = Boolean(parsed.isProtected);
        const isReadOnly = Boolean(parsed.isReadOnly);
        const cardType = String(parsed.cardType || 'Standard NFC Tag');
        const maskedCardId = String(parsed.maskedCardId || '••••••••');

        const card: NfcDetectedCard = {
          id: rescanTargetCardId || `nfc-${Date.now()}`,
          name: isProtected ? 'Protected Access Card' : 'Access Card',
          cardType,
          compatibilityCategory: isProtected
            ? 'Secure / Encrypted Card'
            : isReadOnly
            ? 'Read-Only Tag'
            : 'Standard NFC Tag',
          maskedCardId,
          status: isProtected
            ? 'Unsupported'
            : isReadOnly
            ? 'Read Only'
            : 'Compatible',
          activeState: isProtected
            ? 'Restricted'
            : isReadOnly
            ? 'Read Only'
            : 'Active',
          lastScanned: 'Today',
          lastScannedIso: new Date().toISOString(),
          ndefRecordsCount: isProtected ? 0 : 1,
          ndefSummary: isProtected
            ? 'This access card uses security technology that cannot be copied or emulated by this app.'
            : `Detected NFC technology: ${cardType}`,
          isEncryptedOrProtected: isProtected,
        };

        completeCardDetection(
          card,
          isProtected ? 'SECURE_CARD' : undefined
        );
      } catch {
        // Ignore malformed bridge payload
      }
    };

    return () => {
      delete window.onAndroidNfcTagDiscovered;
    };
  }, [rescanTargetCardId, completeCardDetection]);

  /**
   * Opens the Android system NFC settings page (`android.settings.NFC_SETTINGS`)
   * when the user taps "Enable NFC" or "Open NFC Settings".
   * Respects Android security restrictions: NEVER silently enables NFC.
   */
  const handleOpenAndroidNfcSettings = () => {
    stopActiveReaderSession();
    setScanStage('idle');
    setSettingsNotice(null);
    setAwaitingSettingsReturn(true);
    awaitingSettingsReturnRef.current = true;

    const result = launchAndroidNfcSettingsIntent();

    // Always open the interactive Android System NFC Settings sheet in the web preview
    // so the user can test enabling NFC or returning with NFC still disabled, and trigger `onResume()`.
    setSettingsModalOpen(true);
    setSettingsNotice(
      result.launchedNativeIntent
        ? `Launched Android System Intent (${result.intentAction}). When you return to the app, onResume() will automatically re-check nfcAdapter.isEnabled.`
        : `Android System Intent: ${result.intentAction} — Toggle NFC below and tap "Return to App (onResume)" to verify automatic NFC status re-checking.`
    );
  };

  /**
   * Simulates returning from the Android System NFC Settings screen (`onResume()`).
   * Does NOT assume NFC was enabled—checks the actual `nfcEnabled` state.
   */
  const handleReturnFromAndroidSettings = (newNfcEnabledState?: boolean) => {
    const targetEnabled =
      typeof newNfcEnabledState === 'boolean' ? newNfcEnabledState : nfcEnabled;
    setSettingsModalOpen(false);
    handleReverifyNfcOnResume(
      nfcHardwareSupported,
      targetEnabled,
      'onResume() after Android NFC Settings'
    );
  };

  // Step-by-step Scan NFC Card handler
  const handleStartScan = async (targetCardForRescan?: NfcDetectedCard) => {
    stopActiveReaderSession();
    setActiveError(null);
    setDetectedCard(null);

    if (targetCardForRescan) {
      setRescanTargetCardId(targetCardForRescan.id);
    } else {
      setRescanTargetCardId(null);
    }

    // 1. Check whether the device supports NFC (`NfcAdapter.getDefaultAdapter(context)`)
    if (!nfcHardwareSupported) {
      setScanStage('idle');
      setActiveError(SCAN_ERROR_MAP.NFC_NOT_SUPPORTED);
      return;
    }

    // 2. Check whether NFC is currently enabled (`nfcAdapter.isEnabled`)
    if (!nfcEnabled) {
      setScanStage('idle');
      setActiveError(SCAN_ERROR_MAP.NFC_DISABLED);
      return;
    }

    // 3. Start NFC reader session
    setScanStage('scanning');
    triggerHapticFeedback(25);

    const nativeBridge = getNativeAndroidNfcBridge();
    if (nativeBridge && typeof nativeBridge.startReaderMode === 'function') {
      try {
        nativeBridge.startReaderMode();
      } catch {
        // Fall through to Web NFC / interactive reader
      }
    }

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
            cardType: `Android NFC · NDEF (${recordTypes || 'ISO 14443'})`,
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
                : 'Tag identifier detected via Android NFC reader session. No unencrypted NDEF payload present.',
            isEncryptedOrProtected: false,
          };

          completeCardDetection(detected);
        };

        reader.onreadingerror = () => {
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
              'This access card uses security technology that cannot be copied or emulated by this app.',
            isEncryptedOrProtected: true,
          };
          completeCardDetection(secureCard, 'SECURE_CARD');
        };
      } catch (err: any) {
        if (err?.name === 'NotAllowedError') {
          setScanStage('idle');
          setNfcEnabled(false);
          setActiveError(SCAN_ERROR_MAP.NFC_DISABLED);
          return;
        }
      }
    }

    // Interactive hardware tap detection timer (2.0s smooth wave scan)
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
        maskedCardId:
          targetCardForRescan?.maskedCardId || preset.card.maskedCardId,
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
    }, 2000);
  };

  const handleCancelScan = () => {
    stopActiveReaderSession();
    setScanStage('idle');
    setRescanTargetCardId(null);
    setActiveError(null);
  };

  const handleBackNavigation = () => {
    stopActiveReaderSession();
    setScanStage('idle');
    setActiveError(null);
    if (onNavigate) {
      onNavigate('home');
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    }
  };

  // Save compatible NFC tag/card profile
  const handleSaveDetectedCard = () => {
    if (!detectedCard) return;

    if (
      detectedCard.isEncryptedOrProtected ||
      detectedCard.status === 'Unsupported'
    ) {
      setActiveError(SCAN_ERROR_MAP.SECURE_CARD);
      return;
    }

    const finalName =
      customCardName.trim() || detectedCard.name || 'Access Card';
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

  // Derive the 3 primary NFC hardware states when not displaying a detected/saved card
  const currentHardwareState: 'NFC_READY' | 'NFC_OFF' | 'NFC_NOT_SUPPORTED' =
    !nfcHardwareSupported
      ? 'NFC_NOT_SUPPORTED'
      : nfcEnabled
      ? 'NFC_READY'
      : 'NFC_OFF';

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

        {/* Top Quick Status Bar with semantic status colors (Enabled = success, Disabled = warning, Unsupported = error/info) */}
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 shadow-2xs ${
              currentHardwareState === 'NFC_READY'
                ? 'border-emerald-200 bg-emerald-50/70'
                : currentHardwareState === 'NFC_OFF'
                ? 'border-amber-200 bg-amber-50/80'
                : 'border-red-200 bg-red-50/70'
            }`}
          >
            <span className="text-xs font-semibold text-slate-600">
              NFC Status:
            </span>
            {currentHardwareState === 'NFC_READY' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <span aria-hidden="true">🟢</span>
                <span>
                  {verifiedReadyAfterSettings ? 'NFC READY ✓' : 'NFC READY (Enabled)'}
                </span>
              </span>
            )}
            {currentHardwareState === 'NFC_OFF' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700">
                <span aria-hidden="true">🟠</span>
                <span>NFC IS OFF (Disabled)</span>
              </span>
            )}
            {currentHardwareState === 'NFC_NOT_SUPPORTED' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700">
                <span aria-hidden="true">🔴</span>
                <span>NFC NOT SUPPORTED</span>
              </span>
            )}
          </div>

          {currentHardwareState !== 'NFC_NOT_SUPPORTED' && (
            <button
              type="button"
              onClick={handleOpenAndroidNfcSettings}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 font-display text-xs font-bold text-slate-800 transition-colors cursor-pointer shadow-2xs"
            >
              <Settings className="h-4 w-4 text-[#00685b]" />
              <span>Open NFC Settings</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Two-Column Architecture */}
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
                  currentHardwareState === 'NFC_READY'
                    ? 'radial-gradient(circle at 50% 32%, rgba(0, 168, 143, 0.28), transparent 68%)'
                    : currentHardwareState === 'NFC_OFF'
                    ? 'radial-gradient(circle at 50% 32%, rgba(245, 158, 11, 0.20), transparent 68%)'
                    : 'radial-gradient(circle at 50% 32%, rgba(239, 68, 68, 0.18), transparent 68%)',
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

              {/* Status Badge in Scanner Header */}
              <div className="flex items-center gap-2.5">
                {currentHardwareState === 'NFC_READY' && (
                  <span
                    id="nfc-status-pill-ready"
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-mono font-bold border bg-emerald-500/15 border-emerald-400/40 text-emerald-300"
                  >
                    <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                    <span>
                      {verifiedReadyAfterSettings ? 'NFC READY ✓' : 'NFC READY'}
                    </span>
                  </span>
                )}

                {currentHardwareState === 'NFC_OFF' && (
                  <span
                    id="nfc-status-pill-off"
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-mono font-bold border bg-amber-500/15 border-amber-400/40 text-amber-300"
                  >
                    <WifiOff className="h-3.5 w-3.5 text-amber-400" />
                    <span>NFC IS OFF</span>
                  </span>
                )}

                {currentHardwareState === 'NFC_NOT_SUPPORTED' && (
                  <span
                    id="nfc-status-pill-unsupported"
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-mono font-bold border bg-red-500/15 border-red-400/40 text-red-300"
                  >
                    <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                    <span>NFC NOT SUPPORTED</span>
                  </span>
                )}
              </div>
            </div>

            {/* Scanner Body */}
            <div className="relative z-10 p-6 sm:p-10">
              <AnimatePresence mode="wait">
                {/* =========================================================
                    STATE 3 — NFC NOT SUPPORTED
                    `NfcAdapter.getDefaultAdapter(context) == null`
                    Do NOT display the Enable NFC button in this state.
                ========================================================= */}
                {(scanStage === 'idle' || scanStage === 'scanning') &&
                  currentHardwareState === 'NFC_NOT_SUPPORTED' && (
                    <motion.div
                      key="nfc-screen-state-not-supported"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="flex flex-col items-center text-center space-y-6 py-4"
                    >
                      <div className="inline-flex items-center gap-2 rounded-lg border border-red-400/40 bg-red-500/15 px-3.5 py-1.5 text-xs font-tech font-extrabold uppercase tracking-widest text-red-300">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <span>NFC NOT SUPPORTED</span>
                      </div>

                      {/* Hardware Unsupported Visual */}
                      <div className="relative flex items-center justify-center w-52 h-52 rounded-full border border-red-400/25 bg-red-950/25">
                        <div className="flex flex-col items-center space-y-3">
                          <div className="h-14 w-14 rounded-2xl bg-red-500/15 border border-red-400/35 flex items-center justify-center text-red-300">
                            <WifiOff className="h-7 w-7" />
                          </div>
                          <span className="font-mono text-[11px] uppercase tracking-widest text-red-300/90">
                            No NFC Adapter Found
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 max-w-md">
                        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                          NFC NOT SUPPORTED
                        </h2>
                        <p className="font-sans text-sm text-slate-300 leading-relaxed">
                          This device does not have NFC hardware and cannot scan
                          NFC cards.
                        </p>
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
                    STATE 2 — NFC AVAILABLE BUT DISABLED (`NFC IS OFF`)
                    `NfcAdapter.getDefaultAdapter(context) != null && !nfcAdapter.isEnabled`
                    Shows:
                    - NFC IS OFF
                    - NFC is currently disabled on your phone.
                    - Turn on NFC in Settings to scan your access card.
                    - Primary Button: Enable NFC (opens Android NFC Settings)
                    - Secondary Button: Cancel
                ========================================================= */}
                {(scanStage === 'idle' || scanStage === 'scanning') &&
                  currentHardwareState === 'NFC_OFF' && (
                    <motion.div
                      key="nfc-screen-state-disabled"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="flex flex-col items-center text-center space-y-6 py-4"
                    >
                      <div className="inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/15 px-3.5 py-1.5 text-xs font-tech font-extrabold uppercase tracking-widest text-amber-300">
                        <WifiOff className="h-4 w-4 text-amber-400" />
                        <span>NFC IS OFF</span>
                      </div>

                      {/* Disabled State Card & Antenna Visual */}
                      <div className="relative flex items-center justify-center w-56 h-56 rounded-full border border-amber-400/30 bg-amber-950/20">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <WifiOff className="h-9 w-9 text-amber-400" />
                          <div className="w-32 h-20 rounded-xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-amber-400/30 p-3 flex flex-col justify-between opacity-80">
                            <div className="flex items-center justify-between">
                              <div className="w-5 h-4 rounded-xs bg-amber-300/60 border border-amber-200/40" />
                              <Radio className="h-3.5 w-3.5 text-amber-300/70" />
                            </div>
                            <div className="text-left">
                              <div className="text-[8px] font-mono uppercase tracking-widest text-amber-200/70">
                                QBENCH ACCESS
                              </div>
                              <div className="text-[10px] font-mono font-bold text-slate-300 tracking-wider">
                                •••• ••••
                              </div>
                            </div>
                          </div>
                          <span className="font-mono text-[11px] uppercase tracking-widest text-amber-300">
                            NFC Radio Disabled
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 max-w-md">
                        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                          NFC IS OFF
                        </h2>
                        <p className="font-sans text-sm text-slate-200">
                          NFC is currently disabled on your phone.
                        </p>
                        <p className="font-display text-sm font-bold text-amber-300">
                          Turn on NFC in Settings to scan your access card.
                        </p>
                      </div>

                      {/* Warning Details Banner */}
                      <div
                        role="alert"
                        className="w-full max-w-md rounded-2xl border border-amber-400/35 bg-amber-950/40 p-4 text-left"
                      >
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                          <div className="space-y-1 text-xs">
                            <p className="font-bold text-amber-200">
                              Android System Settings Required
                            </p>
                            <p className="text-amber-100/85 leading-relaxed">
                              For your security, Android apps cannot silently
                              enable NFC. Tap{' '}
                              <strong className="text-white">Enable NFC</strong>{' '}
                              to open Android NFC Settings, turn on NFC, and
                              return to the app.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Primary Button: Enable NFC | Secondary Button: Cancel */}
                      <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-md pt-2">
                        <button
                          id="nfc-enable-nfc-btn"
                          type="button"
                          onClick={handleOpenAndroidNfcSettings}
                          className="flex-1 min-w-[180px] inline-flex items-center justify-center gap-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-3.5 font-display text-sm font-bold text-slate-950 shadow-lg transition-all cursor-pointer"
                        >
                          <Settings className="h-4 w-4" />
                          <span>Enable NFC</span>
                        </button>

                        <button
                          id="nfc-disabled-cancel-btn"
                          type="button"
                          onClick={() => {
                            setActiveError(null);
                            if (onNavigate) {
                              onNavigate('home');
                            }
                          }}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 px-6 py-3.5 font-display text-sm font-semibold text-white transition-colors cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </motion.div>
                  )}

                {/* =========================================================
                    STATE 1 — NFC AVAILABLE & ENABLED (`NFC READY` / `NFC READY ✓`)
                    `NfcAdapter.getDefaultAdapter(context) != null && nfcAdapter.isEnabled`
                    Shows:
                    - NFC READY (or NFC READY ✓ after returning from Android Settings)
                    - NFC is enabled and ready to scan.
                    - [ Scan NFC Card ]
                ========================================================= */}
                {(scanStage === 'idle' || scanStage === 'scanning') &&
                  currentHardwareState === 'NFC_READY' && (
                    <motion.div
                      key="nfc-screen-state-ready"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="flex flex-col items-center text-center space-y-6"
                    >
                      {/* NFC READY / NFC READY ✓ Status Banner */}
                      <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3.5 py-1.5 text-xs font-tech font-extrabold uppercase tracking-widest text-emerald-300">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span>
                          {verifiedReadyAfterSettings
                            ? 'NFC READY ✓'
                            : 'NFC READY'}
                        </span>
                      </div>

                      <div className="space-y-1.5 max-w-md">
                        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                          {scanStage === 'scanning'
                            ? 'Scanning NFC Card...'
                            : verifiedReadyAfterSettings
                            ? 'NFC READY ✓'
                            : 'NFC READY'}
                        </h2>
                        <p className="font-sans text-sm text-emerald-200 font-medium">
                          NFC is enabled and ready to scan.
                        </p>
                        <p className="font-sans text-xs text-slate-300">
                          “Hold your NFC card against the back of your phone.”
                        </p>
                      </div>

                      {/* Central Subtle Animated NFC Card & Waves Illustration */}
                      <div className="relative flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72 my-1">
                        {/* Subtle ambient pulse in NFC READY idle state */}
                        {scanStage === 'idle' && (
                          <motion.div
                            className="absolute inset-6 rounded-full border border-[#45b88a]/30"
                            animate={{
                              scale: [0.96, 1.06, 0.96],
                              opacity: [0.25, 0.55, 0.25],
                            }}
                            transition={{
                              duration: 2.8,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                          />
                        )}

                        {/* Active Circular Scanning Pulse when scanning */}
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

                        {/* Inner Scanner Ring */}
                        <div
                          className={`relative z-10 flex flex-col items-center justify-center w-52 h-52 rounded-full border transition-all duration-500 ${
                            scanStage === 'scanning'
                              ? 'border-[#45b88a] bg-[#102220]/90 shadow-[0_0_50px_rgba(69,184,138,0.28)]'
                              : 'border-emerald-400/30 bg-emerald-950/20'
                          }`}
                        >
                          {/* Subtle Animated NFC Waves Icon */}
                          <motion.div
                            animate={
                              scanStage === 'scanning'
                                ? { y: [0, -4, 0], opacity: [0.6, 1, 0.6] }
                                : { y: [0, -2, 0], opacity: [0.7, 1, 0.7] }
                            }
                            transition={{
                              duration: scanStage === 'scanning' ? 1.3 : 2.4,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                            className="mb-2"
                          >
                            <Wifi className="h-9 w-9 text-[#45b88a]" />
                          </motion.div>

                          {/* Clean NFC Card Illustration */}
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
                              : 'NFC Ready to Scan'}
                          </span>
                        </div>
                      </div>

                      {/* Active Error Banner (e.g., Card Not Detected) */}
                      {activeError && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          role="alert"
                          className="w-full max-w-lg rounded-2xl border border-amber-400/35 bg-amber-950/50 p-4 text-left space-y-1.5"
                        >
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <h3 className="font-display text-sm font-bold text-amber-200">
                                {activeError.title}
                              </h3>
                              <p className="font-sans text-xs text-amber-100/90 leading-relaxed">
                                {activeError.message}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Card Simulation Profile Selector (for testing supported vs protected cards) */}
                      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor="nfc-tag-profile-select"
                            className="font-tech text-[11px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5"
                          >
                            <Cpu className="h-3.5 w-3.5" />
                            <span>
                              Detected Tag Type (Hardware / Test Profile)
                            </span>
                          </label>
                          <span className="text-[11px] text-slate-400">
                            {hasNativeWebNfc
                              ? 'Android NFC Active'
                              : 'Android Reader Mode'}
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

                      {/* Primary Action Buttons: [ Scan NFC Card ] & Cancel */}
                      <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-md pt-2">
                        {scanStage === 'idle' ? (
                          <button
                            id="nfc-scan-card-btn"
                            type="button"
                            onClick={() => handleStartScan()}
                            className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#008978] hover:bg-[#00a08c] px-6 py-3.5 font-display text-sm font-bold text-white shadow-lg transition-all cursor-pointer"
                          >
                            <Wifi className="h-4 w-4" />
                            <span>Scan NFC Card</span>
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

                {/* =========================================================
                    CARD DETECTED / PROTECTED CARD SCREEN
                ========================================================= */}
                {scanStage === 'detected' && detectedCard && (
                  <motion.div
                    key="scanner-stage-detected"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Header with Checkmark or Protected Shield */}
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
                          detectedCard.isEncryptedOrProtected ||
                          detectedCard.status === 'Unsupported'
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                            : 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        }`}
                      >
                        {detectedCard.isEncryptedOrProtected ||
                        detectedCard.status === 'Unsupported' ? (
                          <ShieldAlert className="h-8 w-8" />
                        ) : (
                          <Check className="h-8 w-8 stroke-[2.5]" />
                        )}
                      </motion.div>

                      <div className="space-y-1">
                        <span
                          className={`font-tech text-sm font-black tracking-widest uppercase block ${
                            detectedCard.isEncryptedOrProtected ||
                            detectedCard.status === 'Unsupported'
                              ? 'text-amber-300'
                              : 'text-emerald-300'
                          }`}
                        >
                          {detectedCard.isEncryptedOrProtected ||
                          detectedCard.status === 'Unsupported'
                            ? 'PROTECTED CARD'
                            : 'CARD DETECTED ✓'}
                        </span>
                        <p className="font-sans text-xs text-slate-300">
                          {detectedCard.isEncryptedOrProtected ||
                          detectedCard.status === 'Unsupported'
                            ? '“This access card uses security technology that cannot be copied or emulated by this app.”'
                            : 'Public Android NFC metadata read complete. Sensitive credentials and authentication secrets are never exposed.'}
                        </p>
                      </div>
                    </div>

                    {/* Protected Card Security Notice */}
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
                              PROTECTED CARD
                            </p>
                            <p className="font-sans text-xs text-amber-100/90 leading-relaxed">
                              “This access card uses security technology that
                              cannot be copied or emulated by this app.”
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

                    {/* Card Details Grid */}
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
                            Card technology
                          </span>
                          <span className="font-mono text-xs font-semibold text-white mt-0.5 block">
                            {detectedCard.cardType}
                          </span>
                        </div>

                        <div>
                          <span className="block font-tech text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Card identifier
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

                {/* =========================================================
                    SAVED SUCCESS TRANSITION
                ========================================================= */}
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

        {/* RIGHT COLUMN (5 cols): Phone NFC Settings, Lifecycle Verification & NFC Compatibility */}
        <div className="lg:col-span-5 space-y-6">
          {/* Phone NFC Settings & Android Lifecycle (`onResume`) Panel */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#00685b] block">
                  ANDROID NFC ADAPTER & SETTINGS
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
                  Hardware (`NfcAdapter.getDefaultAdapter`):
                </span>
                {nfcHardwareSupported ? (
                  <span className="font-mono text-xs font-bold text-emerald-700">
                    Available
                  </span>
                ) : (
                  <span className="font-mono text-xs font-bold text-red-600">
                    null (Not Supported)
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/70">
                <span className="font-sans text-xs font-semibold text-slate-600">
                  NFC Status (`nfcAdapter.isEnabled`):
                </span>
                {currentHardwareState === 'NFC_READY' && (
                  <span className="font-display text-sm font-bold text-emerald-700 flex items-center gap-1.5">
                    <span aria-hidden="true">🟢</span>
                    <span>
                      {verifiedReadyAfterSettings ? 'Enabled (NFC READY ✓)' : 'Enabled'}
                    </span>
                  </span>
                )}
                {currentHardwareState === 'NFC_OFF' && (
                  <span className="font-display text-sm font-bold text-amber-700 flex items-center gap-1.5">
                    <span aria-hidden="true">🟠</span>
                    <span>Disabled (NFC IS OFF)</span>
                  </span>
                )}
                {currentHardwareState === 'NFC_NOT_SUPPORTED' && (
                  <span className="font-display text-sm font-bold text-red-600 flex items-center gap-1.5">
                    <span aria-hidden="true">🔴</span>
                    <span>Unsupported</span>
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200/70 text-[11px] font-mono text-slate-600">
                {lastLifecycleCheckLabel}
              </div>
            </div>

            {settingsNotice && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900 leading-relaxed">
                {settingsNotice}
              </div>
            )}

            {nfcHardwareSupported && (
              <button
                id="open-nfc-settings-btn"
                type="button"
                onClick={handleOpenAndroidNfcSettings}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-3 font-display text-xs font-bold text-white transition-colors cursor-pointer"
              >
                <Settings className="h-4 w-4" />
                <span>
                  {nfcEnabled ? 'Open NFC Settings' : 'Enable NFC (Open Android Settings)'}
                </span>
              </button>
            )}

            {/* Interactive Android Test Scenarios (1–12) */}
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <span className="block font-tech text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Android Lifecycle & Hardware State Verification
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <button
                  id="test-state-nfc-ready-btn"
                  type="button"
                  onClick={() => {
                    handleReverifyNfcOnResume(
                      true,
                      true,
                      'State 1 (NFC Available & Enabled)'
                    );
                  }}
                  className={`rounded-lg border px-2.5 py-2 text-left text-[11px] font-semibold transition-colors cursor-pointer ${
                    currentHardwareState === 'NFC_READY'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  1. State 1: NFC Ready (Enabled)
                </button>

                <button
                  id="test-state-nfc-off-btn"
                  type="button"
                  onClick={() => {
                    setAwaitingSettingsReturn(false);
                    setVerifiedReadyAfterSettings(false);
                    handleReverifyNfcOnResume(
                      true,
                      false,
                      'State 2 (NFC Available but Disabled)'
                    );
                  }}
                  className={`rounded-lg border px-2.5 py-2 text-left text-[11px] font-semibold transition-colors cursor-pointer ${
                    currentHardwareState === 'NFC_OFF'
                      ? 'border-amber-300 bg-amber-50 text-amber-900'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  2. State 2: NFC Is Off (Disabled)
                </button>

                <button
                  id="test-state-nfc-unsupported-btn"
                  type="button"
                  onClick={() => {
                    setAwaitingSettingsReturn(false);
                    setVerifiedReadyAfterSettings(false);
                    handleReverifyNfcOnResume(
                      false,
                      false,
                      'State 3 (Phone Without NFC)'
                    );
                  }}
                  className={`rounded-lg border px-2.5 py-2 text-left text-[11px] font-semibold transition-colors cursor-pointer ${
                    currentHardwareState === 'NFC_NOT_SUPPORTED'
                      ? 'border-red-300 bg-red-50 text-red-900'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  3. State 3: NFC Not Supported
                </button>

                <button
                  id="test-return-settings-enabled-btn"
                  type="button"
                  onClick={() => {
                    setAwaitingSettingsReturn(true);
                    awaitingSettingsReturnRef.current = true;
                    handleReverifyNfcOnResume(
                      true,
                      true,
                      'onResume() (Returned from Settings: Enabled)'
                    );
                  }}
                  className="rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-2 text-left text-[11px] font-semibold text-slate-700 cursor-pointer"
                >
                  4. onResume(): NFC Enabled ✓
                </button>

                <button
                  id="test-return-settings-disabled-btn"
                  type="button"
                  onClick={() => {
                    setAwaitingSettingsReturn(true);
                    awaitingSettingsReturnRef.current = true;
                    handleReverifyNfcOnResume(
                      true,
                      false,
                      'onResume() (Returned from Settings: Still Off)'
                    );
                  }}
                  className="rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-2 text-left text-[11px] font-semibold text-slate-700 cursor-pointer"
                >
                  5. onResume(): Still Disabled
                </button>

                <button
                  id="test-protected-card-btn"
                  type="button"
                  onClick={() => {
                    setNfcHardwareSupported(true);
                    setNfcEnabled(true);
                    const preset = HARDWARE_TAG_PRESETS[3];
                    completeCardDetection(
                      {
                        id: `nfc-sec-${Date.now()}`,
                        name: preset.card.name,
                        cardType: preset.card.cardType,
                        compatibilityCategory:
                          preset.card.compatibilityCategory,
                        maskedCardId: preset.card.maskedCardId,
                        status: preset.card.status,
                        activeState: preset.card.activeState,
                        lastScanned: 'Today',
                        lastScannedIso: new Date().toISOString(),
                        ndefRecordsCount: 0,
                        ndefSummary: preset.card.ndefSummary,
                        isEncryptedOrProtected: true,
                        providerNotice: preset.card.providerNotice,
                      },
                      'SECURE_CARD'
                    );
                  }}
                  className="rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-2 text-left text-[11px] font-semibold text-slate-700 cursor-pointer"
                >
                  6. Test: Protected Card
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
              APIs (`NfcAdapter.getDefaultAdapter(context)`, `nfcAdapter.isEnabled`,
              and `enableReaderMode`) and never bypasses encryption or protected
              card credentials.
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
                  <strong>Protected / Encrypted cards</strong> (e.g. MIFARE
                  DESFire EV3, HID Seos) that cannot be copied or emulated by
                  this app
                </span>
              </li>
            </ul>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3.5 text-[11px] text-slate-600 leading-relaxed flex items-start gap-2.5">
              <Info className="h-4 w-4 text-[#00685b] shrink-0 mt-0.5" />
              <span>
                Manifest permission configured: <code>android.permission.NFC</code>{' '}
                with <code>android.hardware.nfc</code> (<code>required=&quot;false&quot;</code>).
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
                    Card Identifier
                  </span>
                  <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                    {viewingCard.maskedCardId}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 col-span-2">
                  <span className="text-slate-400 block font-tech uppercase text-[10px]">
                    Card Technology
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

      {/* MODAL: ANDROID SYSTEM NFC SETTINGS SHEET (`android.settings.NFC_SETTINGS`) */}
      <AnimatePresence>
        {settingsModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => handleReturnFromAndroidSettings()}
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
                  <div>
                    <span className="font-tech text-[10px] font-bold uppercase tracking-widest text-[#00685b] block">
                      ANDROID SYSTEM SETTINGS
                    </span>
                    <h3 className="font-display text-lg font-extrabold text-slate-900">
                      Connected devices → NFC
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleReturnFromAndroidSettings()}
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
                      Allow data exchange when the phone touches another device
                      or NFC card
                    </span>
                  </div>
                  <button
                    id="android-settings-nfc-toggle-btn"
                    type="button"
                    onClick={() => {
                      setNfcHardwareSupported(true);
                      setNfcEnabled((prev) => !prev);
                    }}
                    className={`px-3.5 py-2 rounded-xl font-display text-xs font-bold cursor-pointer transition-colors ${
                      nfcEnabled
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {nfcEnabled ? '🟢 ON' : '🟠 OFF'}
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                  <span className="font-mono text-[11px] font-bold text-slate-700 block">
                    Android Settings Intent Action:
                  </span>
                  <code className="block font-mono text-[11px] text-[#00685b]">
                    android.provider.Settings.ACTION_NFC_SETTINGS (android.settings.NFC_SETTINGS)
                  </code>
                  <p className="text-[11px] text-slate-500 pt-1">
                    When you return to QBENCH, <code>onResume()</code> re-checks{' '}
                    <code>nfcAdapter.isEnabled</code> automatically.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleReturnFromAndroidSettings(false)}
                  className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 font-display text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Return with NFC Off
                </button>
                <button
                  id="return-from-settings-btn"
                  type="button"
                  onClick={() => handleReturnFromAndroidSettings(true)}
                  className="rounded-xl bg-[#00685b] hover:bg-[#005348] px-5 py-2.5 font-display text-xs font-bold text-white cursor-pointer"
                >
                  Enable NFC &amp; Return to App
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
                        setQrShareStatus(
                          'Shared successfully via device share sheet.'
                        );
                        return;
                      }
                    } catch {
                      // Fallback to clipboard copy
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
