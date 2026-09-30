import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../lib/usePWAInstall';

export const PWAInstallButton: React.FC<{ mobileFullWidth?: boolean }> = ({ mobileFullWidth = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={`flex items-center justify-center gap-2 rounded-xl border border-brand-primary/25 bg-brand-primary/10 px-4 py-2.5 font-display text-xs font-semibold tracking-wider text-brand-primary hover:bg-brand-primary hover:text-white transition-all duration-300 cursor-pointer ${
          mobileFullWidth ? 'w-full py-3 text-sm' : ''
        }`}
        title="Install SSC Prep 2026–27 App"
      >
        <Download className="h-4 w-4 shrink-0" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center justify-center gap-2 rounded-xl border border-brand-primary/25 bg-brand-primary/10 px-3.5 py-2 font-display text-xs font-semibold text-brand-primary hover:bg-brand-primary hover:text-white transition-all duration-300 cursor-pointer ${
            mobileFullWidth ? 'w-full py-3 text-sm' : ''
          }`}
        >
          <Smartphone className="h-4 w-4 shrink-0" />
          <span>Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-brand-outline/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-base font-bold text-brand-text">
                  Install SSC Prep 2026–27
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-lg p-1 text-brand-text-muted hover:bg-brand-surface-low cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-brand-text-muted leading-relaxed">
                1. Tap the <strong>Share</strong> button in your browser toolbar.<br />
                2. Scroll down and tap <strong>Add to Home Screen</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-brand-primary py-2.5 text-xs font-semibold text-white hover:bg-brand-primary-light cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-[#05211c] border border-[#00685b] px-3.5 py-2 text-xs font-semibold text-white shadow-lg">
      <span className="h-2 w-2 rounded-full bg-[#88f8c5] animate-pulse" />
      <span>Offline Mode — Cached content active</span>
    </div>
  );
};
