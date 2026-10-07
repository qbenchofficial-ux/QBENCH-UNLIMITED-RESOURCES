import { useState, useEffect, useCallback } from 'react';
import {
  nfcService,
  isWebNfcSupported,
  type WebNfcScannerStatus,
  type WebNfcDetectedTag,
  type WebNfcErrorInfo,
} from '../services/nfcService';

export interface UseNfcReturn {
  isSupported: boolean;
  status: WebNfcScannerStatus;
  detectedTag: WebNfcDetectedTag | null;
  errorInfo: WebNfcErrorInfo | null;
  startScan: () => Promise<void>;
  stopScan: () => void;
  recheckSupport: () => boolean;
  resetState: () => void;
}

/**
 * Reusable React hook (`useNFC`) wrapping `src/services/nfcService.ts`
 * for browser-based Web NFC (`NDEFReader`) scanning.
 *
 * - Never starts scanning automatically on page load.
 * - Cleans up active `NDEFReader` scan sessions on unmount or when the tab is hidden.
 */
export function useNFC(): UseNfcReturn {
  const [isSupported, setIsSupported] = useState<boolean>(() =>
    isWebNfcSupported()
  );

  const [status, setStatus] = useState<WebNfcScannerStatus>(() =>
    isWebNfcSupported() ? 'READY' : 'UNSUPPORTED'
  );

  const [detectedTag, setDetectedTag] = useState<WebNfcDetectedTag | null>(
    null
  );
  const [errorInfo, setErrorInfo] = useState<WebNfcErrorInfo | null>(null);

  const stopScan = useCallback(() => {
    nfcService.stopScan();
    setStatus(isWebNfcSupported() ? 'READY' : 'UNSUPPORTED');
  }, []);

  const recheckSupport = useCallback((): boolean => {
    nfcService.stopScan();
    const supported = isWebNfcSupported();
    setIsSupported(supported);
    setErrorInfo(null);
    setDetectedTag(null);
    setStatus(supported ? 'READY' : 'UNSUPPORTED');
    return supported;
  }, []);

  const resetState = useCallback(() => {
    nfcService.stopScan();
    const supported = isWebNfcSupported();
    setIsSupported(supported);
    setErrorInfo(null);
    setDetectedTag(null);
    setStatus(supported ? 'READY' : 'UNSUPPORTED');
  }, []);

  const startScan = useCallback(async () => {
    setErrorInfo(null);
    setDetectedTag(null);

    await nfcService.startScan({
      onStatusChange: (nextStatus) => {
        setStatus(nextStatus);
      },
      onTagDetected: (tag) => {
        if (
          typeof navigator !== 'undefined' &&
          typeof navigator.vibrate === 'function'
        ) {
          try {
            navigator.vibrate([35, 50, 80]);
          } catch {
            // Ignore vibration restrictions
          }
        }
        setDetectedTag(tag);
        setErrorInfo(null);
        setStatus('TAG_DETECTED');
      },
      onError: (err, fallbackTag) => {
        setErrorInfo(err);
        if (fallbackTag) {
          setDetectedTag(fallbackTag);
        }
        setStatus(err.status);
      },
    });
  }, []);

  // Clean up active scan if page goes to background or component unmounts
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && status === 'SCANNING') {
        nfcService.stopScan();
        setStatus(isWebNfcSupported() ? 'READY' : 'UNSUPPORTED');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      nfcService.stopScan();
    };
  }, [status]);

  return {
    isSupported,
    status,
    detectedTag,
    errorInfo,
    startScan,
    stopScan,
    recheckSupport,
    resetState,
  };
}
