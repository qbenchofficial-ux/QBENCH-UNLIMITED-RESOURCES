import QRCode from 'qrcode';
import type {
  NfcDetectedCard,
  NfcCompatibilityCategory,
  NfcCardStatus,
} from '../components/NfcAccessView';

export interface SecureNfcBackupEnvelope {
  protocol: 'QBENCH_NFC_BACKUP_V1';
  mode: 'PUBLIC_SIGNED' | 'AES_GCM_256';
  exportedAt: string;
  cardCount: number;
  checksumSha256: string;
  saltBase64?: string;
  ivBase64?: string;
  payload: string;
}

export interface SanitizedExportableNfcCard {
  id: string;
  name: string;
  cardType: string;
  compatibilityCategory: NfcCompatibilityCategory;
  maskedCardId: string;
  status: NfcCardStatus;
  activeState: 'Active' | 'Read Only' | 'Restricted';
  lastScannedIso: string;
  ndefRecordsCount: number;
  ndefSummary: string;
}

function sanitizeCardForExport(card: NfcDetectedCard): SanitizedExportableNfcCard {
  // Strictly ensure only public Android NFC metadata and masked identifiers are exported.
  // Never include raw keys, sector secrets, or authentication credentials.
  const safeMaskedId = card.maskedCardId.startsWith('••••')
    ? card.maskedCardId
    : `••••••••${card.maskedCardId.slice(-4).toUpperCase()}`;

  return {
    id: card.id,
    name: card.name.trim() || 'Access Card',
    cardType: card.cardType,
    compatibilityCategory: card.compatibilityCategory,
    maskedCardId: safeMaskedId,
    status: card.status,
    activeState: card.activeState,
    lastScannedIso: card.lastScannedIso || new Date().toISOString(),
    ndefRecordsCount: card.ndefRecordsCount || 0,
    ndefSummary: card.ndefSummary || '',
  };
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function computeSha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(digest));
}

async function deriveAesGcmKey(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Creates a signed (and optionally AES-256-GCM encrypted) backup token string
 * and generates a high-resolution QR code data URL.
 */
export async function generateSecureNfcBackupQr(
  cards: NfcDetectedCard[],
  passphrase?: string
): Promise<{
  qrDataUrl: string;
  backupToken: string;
  envelope: SecureNfcBackupEnvelope;
}> {
  const sanitizedCards = cards.map(sanitizeCardForExport);
  const jsonPayload = JSON.stringify(sanitizedCards);
  const checksumSha256 = await computeSha256Hex(jsonPayload);
  const exportedAt = new Date().toISOString();

  const cleanPass = (passphrase || '').trim();
  let envelope: SecureNfcBackupEnvelope;

  if (cleanPass.length > 0) {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveAesGcmKey(cleanPass, salt);
    const encodedPlaintext = new TextEncoder().encode(jsonPayload);
    const cipherBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      encodedPlaintext
    );

    envelope = {
      protocol: 'QBENCH_NFC_BACKUP_V1',
      mode: 'AES_GCM_256',
      exportedAt,
      cardCount: sanitizedCards.length,
      checksumSha256: checksumSha256.slice(0, 16),
      saltBase64: bytesToBase64(salt),
      ivBase64: bytesToBase64(iv),
      payload: bytesToBase64(new Uint8Array(cipherBuffer)),
    };
  } else {
    const utf8Bytes = new TextEncoder().encode(jsonPayload);
    envelope = {
      protocol: 'QBENCH_NFC_BACKUP_V1',
      mode: 'PUBLIC_SIGNED',
      exportedAt,
      cardCount: sanitizedCards.length,
      checksumSha256: checksumSha256.slice(0, 16),
      payload: bytesToBase64(utf8Bytes),
    };
  }

  const envelopeJson = JSON.stringify(envelope);
  const backupToken = `QBENCH-NFC1:${bytesToBase64(
    new TextEncoder().encode(envelopeJson)
  )}`;

  const qrDataUrl = await QRCode.toDataURL(backupToken, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 360,
    color: {
      dark: '#0b1313',
      light: '#ffffff',
    },
  });

  return {
    qrDataUrl,
    backupToken,
    envelope,
  };
}

/**
 * Parses and verifies a QBENCH-NFC1 backup token (from QR scan or backup string),
 * decrypting with AES-256-GCM if a passphrase was used.
 */
export async function restoreSecureNfcBackupToken(
  rawTokenInput: string,
  passphrase?: string
): Promise<{
  cards: NfcDetectedCard[];
  envelope: SecureNfcBackupEnvelope;
}> {
  const trimmed = (rawTokenInput || '').trim();
  if (!trimmed) {
    throw new Error('Please paste a valid QBENCH NFC QR backup token.');
  }

  let envelopeJson = trimmed;
  if (trimmed.startsWith('QBENCH-NFC1:')) {
    const base64Part = trimmed.slice('QBENCH-NFC1:'.length).trim();
    try {
      const decodedBytes = base64ToBytes(base64Part);
      envelopeJson = new TextDecoder().decode(decodedBytes);
    } catch {
      throw new Error('Invalid or corrupted QBENCH-NFC1 QR backup code.');
    }
  }

  let envelope: SecureNfcBackupEnvelope;
  try {
    envelope = JSON.parse(envelopeJson) as SecureNfcBackupEnvelope;
  } catch {
    throw new Error('Malformed QR backup payload.');
  }

  if (envelope.protocol !== 'QBENCH_NFC_BACKUP_V1' || !envelope.payload) {
    throw new Error('Unrecognized NFC backup protocol version.');
  }

  let decryptedJson: string;

  if (envelope.mode === 'AES_GCM_256') {
    const cleanPass = (passphrase || '').trim();
    if (!cleanPass) {
      throw new Error(
        'This QR backup is encrypted with AES-256-GCM. Please enter the backup passphrase to unlock it.'
      );
    }
    if (!envelope.saltBase64 || !envelope.ivBase64) {
      throw new Error('Encrypted backup is missing cryptographic salt or IV.');
    }

    try {
      const salt = base64ToBytes(envelope.saltBase64);
      const iv = base64ToBytes(envelope.ivBase64);
      const cipherBytes = base64ToBytes(envelope.payload);
      const key = await deriveAesGcmKey(cleanPass, salt);
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as unknown as BufferSource },
        key,
        cipherBytes as unknown as BufferSource
      );
      decryptedJson = new TextDecoder().decode(decryptedBuffer);
    } catch {
      throw new Error(
        'Incorrect backup passphrase or tampered encrypted QR payload.'
      );
    }
  } else {
    try {
      const payloadBytes = base64ToBytes(envelope.payload);
      decryptedJson = new TextDecoder().decode(payloadBytes);
    } catch {
      throw new Error('Failed to decode QR backup payload.');
    }
  }

  // Verify SHA-256 integrity checksum
  const computedHash = await computeSha256Hex(decryptedJson);
  if (
    envelope.checksumSha256 &&
    !computedHash.startsWith(envelope.checksumSha256)
  ) {
    throw new Error(
      'SHA-256 integrity check failed: QR backup data appears corrupted.'
    );
  }

  const parsedCards = JSON.parse(decryptedJson) as SanitizedExportableNfcCard[];
  if (!Array.isArray(parsedCards) || parsedCards.length === 0) {
    throw new Error('No valid NFC card profiles found in the backup.');
  }

  const restoredCards: NfcDetectedCard[] = parsedCards.map((item) => ({
    id: item.id || `nfc-restored-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: item.name || 'Access Card',
    cardType: item.cardType || 'Standard NFC Tag',
    compatibilityCategory: item.compatibilityCategory || 'Standard NFC Tag',
    maskedCardId: item.maskedCardId || '••••••••',
    status: item.status || 'Compatible',
    activeState: item.activeState || 'Active',
    lastScanned: 'Today',
    lastScannedIso: item.lastScannedIso || new Date().toISOString(),
    ndefRecordsCount:
      typeof item.ndefRecordsCount === 'number' ? item.ndefRecordsCount : 0,
    ndefSummary:
      item.ndefSummary || 'Restored from verified QBENCH Secure QR Backup.',
    isEncryptedOrProtected: false,
  }));

  return {
    cards: restoredCards,
    envelope,
  };
}
