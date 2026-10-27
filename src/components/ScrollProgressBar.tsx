import { useEffect, useState } from 'react';

interface ScrollProgressBarProps {
  containerId?: string;
  activeSection?: string;
}

export default function ScrollProgressBar({
  containerId = 'app-main-viewports',
  activeSection,
}: ScrollProgressBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const updateProgress = () => {
      const container = document.getElementById(containerId);
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const containerHeight = container.scrollHeight || container.offsetHeight;
      const windowHeight = window.innerHeight;
      const headerHeight = 80; // height of sticky header (h-20 / 5rem)

      // Total scrollable distance within the container
      const totalScrollable = containerHeight - (windowHeight - headerHeight);

      if (totalScrollable <= 20) {
        setProgress(0);
        return;
      }

      // Distance scrolled past header into container
      const currentScrolled = -rect.top + headerHeight;
      const calculatedPct = Math.min(100, Math.max(0, (currentScrolled / totalScrollable) * 100));

      setProgress(calculatedPct);
    };

    const onScrollOrResize = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateProgress();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);

    // Initial calculation and delayed retries to handle route transitions and lazy content
    updateProgress();
    const timer1 = setTimeout(updateProgress, 100);
    const timer2 = setTimeout(updateProgress, 350);
    const timer3 = setTimeout(updateProgress, 700);

    // ResizeObserver on the container to detect dynamic DOM updates or content rendering
    let resizeObserver: ResizeObserver | null = null;
    const targetElement = document.getElementById(containerId);
    if (targetElement && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        onScrollOrResize();
      });
      resizeObserver.observe(targetElement);
    }

    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [containerId, activeSection]);

  return (
    <div
      id="scroll-progress-container"
      className="sticky top-20 z-40 w-full h-[3px] -mb-[3px] bg-brand-outline/10 pointer-events-none overflow-visible"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
    >
      <div
        id="scroll-progress-bar"
        className="h-full bg-gradient-to-r from-brand-primary via-[#00c9a7] to-brand-accent transition-[width] duration-100 ease-out relative shadow-[0_0_8px_rgba(0,104,91,0.4)]"
        style={{ width: `${progress}%` }}
      >
        {/* Leading glowing pulse tip when actively reading */}
        {progress > 1 && progress < 99.5 && (
          <div
            id="scroll-progress-glow-tip"
            className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_10px_#00c9a7,0_0_4px_#00685b] -mr-1"
          />
        )}
      </div>
    </div>
  );
}
