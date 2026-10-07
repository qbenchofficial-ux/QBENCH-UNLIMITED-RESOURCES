/**
 * Web NFC Service (`src/services/nfcService.ts`)
 *
 * Provides a browser-based Web NFC API (`NDEFReader`) implementation for the
 * QBENCH React 19 + Vite 6 PWA.
 *
 * Key responsibilities:
 * - Detects whether the current browser exposes the W3C Web NFC API (`"NDEFReader" in window`).
 * - Starts and stops `NDEFReader` scan sessions only upon explicit user interaction.
 * - Parses readable NDEF records (recordType, mediaType/MIME, URI, text payload) without
 *   attempting to extract cryptographic keys or clone protected access credentials.
 * - Handles permission errors (`NotAllowedError`), disabled/unavailable hardware
 *   (`NotSupportedError`, `NotReadableError`), and unreadable/protected cards (`onreadingerror`).
 */

export type WebNfcScannerStatus =
  | 'READY'
  | 'SCANNING'
  | 'TAG_DETECTED'
  | 'UNSUPPORTED'
  | 'NFC_OFF'
  | 'PERMISSION_DENIED'
  | 'PROTECTED_CARD'
  | 'ERROR';

export interface ParsedNdefRecordItem {
  index: number;
  recordType: string;
  mediaType: string | null;
  id: string | null;
  uri: string | null;
  textPayload: string | null;
  byteLength: number;
}

export interface WebNfcDetectedTag {
  id: string;
  name: string;
  maskedSerialNumber: string;
  technology: string;
  ndefAvailable: boolean;
  status: 'Readable' | 'Unsupported';
  recordsCount: number;
  records: ParsedNdefRecordItem[];
  primaryRecordType: string;
  primaryMimeType: string | null;
  primaryUri: string | null;
  primaryTextPayload: string | null;
  summary: string;
  scannedAtIso: string;
  isProtectedOrUnsupported: boolean;
}

export interface WebNfcErrorInfo {
  status: 'UNSUPPORTED' | 'NFC_OFF' | 'PERMISSION_DENIED' | 'PROTECTED_CARD' | 'ERROR';
  heading: string;
  message: string;
  helpText?: string;
}

export interface WebNfcScanCallbacks {
  onStatusChange?: (status: WebNfcScannerStatus) => void;
  onTagDetected?: (tag: WebNfcDetectedTag) => void;
  onError?: (errorInfo: WebNfcErrorInfo, tagFallback?: WebNfcDetectedTag) => void;
}

/**
 * Checks whether the current browser environment supports the W3C Web NFC API.
 * Note: Web NFC requires a secure context (HTTPS or localhost) and a compatible
 * browser (such as Chrome on Android).
 */
export function isWebNfcSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext !== false &&
    'NDEFReader' in window &&
    typeof window.NDEFReader === 'function'
  );
}

/**
 * Checks whether the user is on an Android browser environment.
 */
export function isAndroidBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android/i.test(navigator.userAgent);
}

/**
 * Masks a raw NFC tag serial number / UID so full hardware identifiers or secrets
 * are never exposed in plain text.
 */
export function maskNfcSerialNumber(serialNumber?: string): string {
  if (!serialNumber || !serialNumber.trim()) {
    return '••••••••';
  }
  const cleanHex = serialNumber.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
  if (cleanHex.length <= 4) {
    return '••••••••';
  }
  return `••••••••${cleanHex.slice(-4)}`;
}

/**
 * Safely decodes an NDEFRecord DataView into readable URI or text when appropriate.
 */
function decodeNdefRecord(record: NDEFRecord, index: number): ParsedNdefRecordItem {
  const recordType = record.recordType || 'unknown';
  const mediaType = record.mediaType || null;
  const id = record.id || null;
  const byteLength = record.data ? record.data.byteLength : 0;

  let uri: string | null = null;
  let textPayload: string | null = null;

  if (record.data && record.data.byteLength > 0) {
    try {
      const decoder = new TextDecoder(record.encoding || 'utf-8');
      const rawBytes = new Uint8Array(
        record.data.buffer,
        record.data.byteOffset,
        record.data.byteLength
      );
      const decoded = decoder.decode(rawBytes).replace(/\0/g, '').trim();

      if (recordType === 'url' || recordType === 'absolute-uri') {
        uri = decoded;
      } else if (
        recordType === 'text' ||
        (mediaType && mediaType.startsWith('text/'))
      ) {
        textPayload = decoded.slice(0, 280);
      } else if (decoded && /^https?:\/\//i.test(decoded)) {
        uri = decoded;
      } else if (decoded && /^[\x20-\x7E\s]+$/.test(decoded)) {
        textPayload = decoded.slice(0, 280);
      }
    } catch {
      // Ignore binary payload that cannot be UTF-8 decoded
    }
  }

  return {
    index,
    recordType,
    mediaType,
    id,
    uri,
    textPayload,
    byteLength,
  };
}

/**
 * Parses a browser `NDEFReadingEvent` into a sanitized `WebNfcDetectedTag`.
 */
export function parseWebNfcReadingEvent(
  event: NDEFReadingEvent,
  customName = 'NFC Tag'
): WebNfcDetectedTag {
  const rawRecords = event.message?.records
    ? Array.from(event.message.records)
    : [];
  const parsedRecords = rawRecords.map((rec, idx) =>
    decodeNdefRecord(rec, idx)
  );

  const ndefAvailable = parsedRecords.length > 0;
  const recordTypes = Array.from(
    new Set(parsedRecords.map((r) => r.recordType))
  );
  const primaryRecordType =
    recordTypes.length > 0 ? recordTypes.join(', ') : 'None (Empty / UID Only)';

  const primaryMimeType =
    parsedRecords.find((r) => Boolean(r.mediaType))?.mediaType || null;
  const primaryUri =
    parsedRecords.find((r) => Boolean(r.uri))?.uri || null;
  const primaryTextPayload =
    parsedRecords.find((r) => Boolean(r.textPayload))?.textPayload || null;

  const technology = ndefAvailable
    ? `Web NFC (NDEF · ${primaryRecordType})`
    : 'Web NFC (ISO 14443 / NFC Forum Tag)';

  const summary = ndefAvailable
    ? `Detected ${parsedRecords.length} NDEF record(s) (${primaryRecordType}) via browser Web NFC API.`
    : 'NFC tag detected via Web NFC API. No readable NDEF records were present on the tag.';

  return {
    id: `nfc-tag-${Date.now()}`,
    name: customName,
    maskedSerialNumber: maskNfcSerialNumber(event.serialNumber),
    technology,
    ndefAvailable,
    status: 'Readable',
    recordsCount: parsedRecords.length,
    records: parsedRecords,
    primaryRecordType,
    primaryMimeType,
    primaryUri,
    primaryTextPayload,
    summary,
    scannedAtIso: new Date().toISOString(),
    isProtectedOrUnsupported: false,
  };
}

class WebNfcService {
  private abortController: AbortController | null = null;
  private activeReader: NDEFReader | null = null;
  private currentStatus: WebNfcScannerStatus = isWebNfcSupported()
    ? 'READY'
    : 'UNSUPPORTED';

  public isSupported(): boolean {
    return isWebNfcSupported();
  }

  public getStatus(): WebNfcScannerStatus {
    if (!this.isSupported() && this.currentStatus === 'READY') {
      return 'UNSUPPORTED';
    }
    return this.currentStatus;
  }

  public stopScan(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.activeReader) {
      this.activeReader.onreading = null;
      this.activeReader.onreadingerror = null;
      this.activeReader = null;
    }
    if (this.currentStatus === 'SCANNING') {
      this.currentStatus = this.isSupported() ? 'READY' : 'UNSUPPORTED';
    }
  }

  public async startScan(callbacks: WebNfcScanCallbacks): Promise<void> {
    this.stopScan();

    if (!this.isSupported() || !window.NDEFReader) {
      this.currentStatus = 'UNSUPPORTED';
      callbacks.onStatusChange?.('UNSUPPORTED');
      callbacks.onError?.({
        status: 'UNSUPPORTED',
        heading: 'NFC NOT SUPPORTED',
        message: 'Web NFC is not supported by this browser or device.',
        helpText:
          'For NFC scanning, use a compatible Android device and supported browser.',
      });
      return;
    }

    try {
      const reader = new window.NDEFReader();
      const controller = new AbortController();
      this.activeReader = reader;
      this.abortController = controller;

      reader.onreading = (event: NDEFReadingEvent) => {
        this.stopScan();
        this.currentStatus = 'TAG_DETECTED';
        callbacks.onStatusChange?.('TAG_DETECTED');
        const parsedTag = parseWebNfcReadingEvent(event);
        callbacks.onTagDetected?.(parsedTag);
      };

      reader.onreadingerror = () => {
        this.stopScan();
        this.currentStatus = 'PROTECTED_CARD';
        callbacks.onStatusChange?.('PROTECTED_CARD');

        const protectedTag: WebNfcDetectedTag = {
          id: `nfc-protected-${Date.now()}`,
          name: 'Protected or Unsupported Card',
          maskedSerialNumber: '••••••••',
          technology: 'Non-NDEF / Protected Access Card',
          ndefAvailable: false,
          status: 'Unsupported',
          recordsCount: 0,
          records: [],
          primaryRecordType: 'Unreadable / Protected',
          primaryMimeType: null,
          primaryUri: null,
          primaryTextPayload: null,
          summary:
            'This NFC card cannot be read by the browser-based NFC scanner.',
          scannedAtIso: new Date().toISOString(),
          isProtectedOrUnsupported: true,
        };

        callbacks.onError?.(
          {
            status: 'PROTECTED_CARD',
            heading: 'PROTECTED OR UNSUPPORTED CARD',
            message:
              'This NFC card cannot be read by the browser-based NFC scanner.',
            helpText:
              'Scanning an NFC card does not automatically create a working digital door credential.',
          },
          protectedTag
        );
      };

      await reader.scan({ signal: controller.signal });
      this.currentStatus = 'SCANNING';
      callbacks.onStatusChange?.('SCANNING');
    } catch (err: unknown) {
      this.stopScan();
      const domErrorName =
        err instanceof Error ? err.name : '';
      const domErrorMessage =
        err instanceof Error ? err.message : '';

      // 1. Permission Denied (`NotAllowedError`)
      if (domErrorName === 'NotAllowedError') {
        this.currentStatus = 'PERMISSION_DENIED';
        callbacks.onStatusChange?.('PERMISSION_DENIED');
        callbacks.onError?.({
          status: 'PERMISSION_DENIED',
          heading: 'NFC SCAN FAILED',
          message:
            'NFC permission was denied. Please allow NFC access and try again.',
          helpText:
            'Unable to start NFC scanning. Please check NFC availability and try again.',
        });
        return;
      }

      // 2. System NFC Disabled or Hardware Unavailable on Android (`NotReadableError` / `NotSupportedError`)
      if (
        domErrorName === 'NotReadableError' ||
        domErrorName === 'NotSupportedError' ||
        /nfc.*disabled|nfc.*off|adapter/i.test(domErrorMessage)
      ) {
        this.currentStatus = 'NFC_OFF';
        callbacks.onStatusChange?.('NFC_OFF');
        callbacks.onError?.({
          status: 'NFC_OFF',
          heading: 'NFC IS OFF',
          message:
            "Please enable NFC in your phone's system settings and return to this page.",
          helpText:
            'Unable to start NFC scanning. Please check NFC availability and try again.',
        });
        return;
      }

      // 3. Generic scan failure
      this.currentStatus = 'ERROR';
      callbacks.onStatusChange?.('ERROR');
      callbacks.onError?.({
        status: 'ERROR',
        heading: 'NFC SCAN FAILED',
        message:
          'Unable to start NFC scanning. Please check NFC availability and try again.',
      });
    }
  }
}

export const nfcService = new WebNfcService();
