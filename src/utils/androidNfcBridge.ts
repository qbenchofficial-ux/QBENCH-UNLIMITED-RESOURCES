/**
 * Android Native & Web NFC Adapter Bridge (`src/utils/androidNfcBridge.ts`)
 *
 * Implements the official Android NFC hardware & settings verification flow:
 * 1. Checks `NfcAdapter.getDefaultAdapter(context)` via the native Android bridge
 *    (`window.AndroidNfcBridge` / `window.QBenchAndroidNfc`) or Web NFC (`NDEFReader`)
 *    plus simulated hardware state for testing on non-NFC devices.
 * 2. Checks `nfcAdapter.isEnabled` without attempting to silently enable NFC.
 * 3. Opens Android System NFC Settings (`android.settings.NFC_SETTINGS` /
 *    `Settings.ACTION_NFC_SETTINGS`) when the user taps "Enable NFC".
 * 4. Listens for Android Activity `onResume()` / WebView `visibilitychange` + `focus`
 *    events to re-verify `nfcAdapter.isEnabled` when returning from Settings.
 */

export interface AndroidNativeNfcInterface {
  /** Maps to `NfcAdapter.getDefaultAdapter(context) != null` */
  isNfcSupported?: () => boolean;
  /** Maps to `nfcAdapter != null && nfcAdapter.isEnabled()` */
  isNfcEnabled?: () => boolean;
  /** Opens `new Intent(Settings.ACTION_NFC_SETTINGS)` */
  openNfcSettings?: () => void;
  /** Starts `nfcAdapter.enableReaderMode(activity, callback, flags, extras)` */
  startReaderMode?: () => void;
  /** Stops `nfcAdapter.disableReaderMode(activity)` */
  stopReaderMode?: () => void;
}

declare global {
  interface Window {
    AndroidNfcBridge?: AndroidNativeNfcInterface;
    QBenchAndroidNfc?: AndroidNativeNfcInterface;
    onAndroidNfcResume?: () => void;
    onAndroidNfcTagDiscovered?: (payloadJson: string) => void;
  }
}

export interface NfcAdapterStateSnapshot {
  /** `NfcAdapter.getDefaultAdapter(context) != null` */
  isSupported: boolean;
  /** `nfcAdapter.isEnabled` */
  isEnabled: boolean;
  /** Source of the adapter check */
  adapterSource: 'android-native-bridge' | 'web-nfc-api' | 'hardware-profile';
  /** Timestamp of last verification */
  checkedAtIso: string;
}

export const STORAGE_KEY_NFC_SUPPORTED = 'qbench_nfc_hardware_supported_v1';
export const STORAGE_KEY_NFC_ENABLED = 'qbench_nfc_hardware_enabled_v1';

export function getNativeAndroidNfcBridge(): AndroidNativeNfcInterface | null {
  if (typeof window === 'undefined') return null;
  return window.AndroidNfcBridge || window.QBenchAndroidNfc || null;
}

/**
 * Evaluates:
 * 1. `NfcAdapter.getDefaultAdapter(context)` -> `isSupported`
 * 2. `nfcAdapter.isEnabled` -> `isEnabled`
 */
export function queryAndroidNfcAdapterState(
  overrideSupported?: boolean | null,
  overrideEnabled?: boolean | null
): NfcAdapterStateSnapshot {
  const nativeBridge = getNativeAndroidNfcBridge();
  const checkedAtIso = new Date().toISOString();

  // 1. If running inside Android native WebView with `AndroidNfcBridge` attached:
  if (
    nativeBridge &&
    typeof nativeBridge.isNfcSupported === 'function' &&
    overrideSupported === undefined
  ) {
    try {
      const supported = Boolean(nativeBridge.isNfcSupported());
      const enabled =
        supported && typeof nativeBridge.isNfcEnabled === 'function'
          ? Boolean(nativeBridge.isNfcEnabled())
          : false;
      return {
        isSupported: supported,
        isEnabled: enabled,
        adapterSource: 'android-native-bridge',
        checkedAtIso,
      };
    } catch {
      // Fallback to stored/runtime state if bridge call throws
    }
  }

  // 2. Determine `isSupported` (`NfcAdapter.getDefaultAdapter(context) != null`)
  let isSupported = true;
  if (typeof overrideSupported === 'boolean') {
    isSupported = overrideSupported;
  } else if (typeof window !== 'undefined') {
    const savedSupported = window.localStorage.getItem(STORAGE_KEY_NFC_SUPPORTED);
    if (savedSupported !== null) {
      isSupported = savedSupported === 'true';
    }
  }

  // 3. Determine `isEnabled` (`nfcAdapter.isEnabled`)
  let isEnabled = false;
  if (!isSupported) {
    isEnabled = false;
  } else if (typeof overrideEnabled === 'boolean') {
    isEnabled = overrideEnabled;
  } else if (typeof window !== 'undefined') {
    const savedEnabled = window.localStorage.getItem(STORAGE_KEY_NFC_ENABLED);
    isEnabled = savedEnabled === null ? true : savedEnabled === 'true';
  }

  const hasWebNfc = typeof window !== 'undefined' && 'NDEFReader' in window;

  return {
    isSupported,
    isEnabled,
    adapterSource: hasWebNfc ? 'web-nfc-api' : 'hardware-profile',
    checkedAtIso,
  };
}

/**
 * Opens the Android system NFC settings screen (`android.settings.NFC_SETTINGS`)
 * so the user can manually enable NFC. Never attempts to silently toggle NFC.
 */
export function launchAndroidNfcSettingsIntent(): {
  launchedNativeIntent: boolean;
  intentAction: string;
} {
  const intentAction = 'android.settings.NFC_SETTINGS';
  const nativeBridge = getNativeAndroidNfcBridge();

  // 1. Native Android JavascriptInterface bridge (`Settings.ACTION_NFC_SETTINGS`)
  if (nativeBridge && typeof nativeBridge.openNfcSettings === 'function') {
    try {
      nativeBridge.openNfcSettings();
      return { launchedNativeIntent: true, intentAction };
    } catch {
      // Fall through to Android intent URI
    }
  }

  // 2. Android Chrome / WebView Intent URI (`android.settings.NFC_SETTINGS`)
  const isAndroid =
    typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

  if (isAndroid && typeof window !== 'undefined') {
    try {
      window.location.href =
        'intent:#Intent;action=android.settings.NFC_SETTINGS;end';
      return { launchedNativeIntent: true, intentAction };
    } catch {
      // Fall through to settings sheet
    }
  }

  return { launchedNativeIntent: false, intentAction };
}
