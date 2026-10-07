/**
 * Web NFC API Type Declarations (`src/types/web-nfc.d.ts`)
 *
 * Official W3C Web NFC specification interfaces (`NDEFReader`, `NDEFReadingEvent`,
 * `NDEFMessage`, `NDEFRecord`, `NDEFScanOptions`) for browser environments
 * (e.g., Chrome / Edge / Opera / Samsung Internet on Android over HTTPS).
 */

export {};

declare global {
  interface NDEFRecord {
    readonly recordType: string;
    readonly mediaType?: string;
    readonly id?: string;
    readonly data?: DataView;
    readonly encoding?: string;
    readonly lang?: string;
    toRecords?: () => readonly NDEFRecord[];
  }

  interface NDEFMessage {
    readonly records: readonly NDEFRecord[];
  }

  interface NDEFReadingEvent extends Event {
    readonly serialNumber: string;
    readonly message: NDEFMessage;
  }

  interface NDEFScanOptions {
    signal?: AbortSignal;
  }

  class NDEFReader extends EventTarget {
    constructor();
    onreading: ((this: this, event: NDEFReadingEvent) => void) | null;
    onreadingerror: ((this: this, event: Event) => void) | null;
    scan(options?: NDEFScanOptions): Promise<void>;
  }

  interface Window {
    NDEFReader?: typeof NDEFReader;
  }
}
