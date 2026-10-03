interface QBenchLogoProps {
  variant?: 'horizontal' | 'stacked' | 'symbol';
  className?: string;
  iconSize?: number;
}

/**
 * The official QBENCH brand emblem mark:
 * Circular Q emblem with Wi-Fi connectivity arcs, collaborative bench, and team nodes
 * styled in the signature QBENCH deep teal to vibrant lime green brand gradient.
 */
export function QBenchEmblemMark({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="260 140 500 500"
      width={size}
      height={size}
      className={`shrink-0 select-none ${className}`}
      aria-label="QBENCH Brand Mark"
    >
      <defs>
        <linearGradient id="qbenchMarkGrad" x1="15%" y1="50%" x2="85%" y2="50%">
          <stop offset="0%" stopColor="#074875" />
          <stop offset="48%" stopColor="#0F7F63" />
          <stop offset="100%" stopColor="#6CE02B" />
        </linearGradient>
      </defs>

      <g fill="url(#qbenchMarkGrad)" stroke="url(#qbenchMarkGrad)">
        {/* Outer Q Ring */}
        <path
          fillRule="evenodd"
          stroke="none"
          d="M 512 156
             A 236 236 0 1 0 512 628
             A 236 236 0 1 0 512 156 Z
             M 512 214
             A 178 178 0 1 1 512 570
             A 178 178 0 1 1 512 214 Z"
        />

        {/* Q Tail */}
        <polygon stroke="none" points="585,548 665,548 746,628 652,628" />

        {/* Bench / Workstation Surface */}
        <rect x="288" y="446" width="448" height="24" rx="8" stroke="none" />
        <rect x="424" y="408" width="176" height="18" rx="8" stroke="none" />

        {/* Wi-Fi Connectivity Arcs */}
        <path d="M 476 246 A 54 54 0 0 1 548 246" fill="none" strokeWidth="11" strokeLinecap="round" />
        <path d="M 488 262 A 36 36 0 0 1 536 262" fill="none" strokeWidth="11" strokeLinecap="round" />
        <path d="M 500 278 A 18 18 0 0 1 524 278" fill="none" strokeWidth="11" strokeLinecap="round" />

        {/* Circuit Nodes & Gear Base */}
        <circle cx="496" cy="292" r="7" stroke="none" />
        <circle cx="528" cy="292" r="7" stroke="none" />
        <circle cx="472" cy="308" r="7" stroke="none" />
        <circle cx="552" cy="308" r="7" stroke="none" />
        <path d="M 496 292 L 504 316 M 528 292 L 520 316 M 472 308 L 492 322 M 552 308 L 532 322" fill="none" strokeWidth="8" strokeLinecap="round" />
        <path d="M 468 320 A 44 44 0 0 0 556 320 L 542 320 A 30 30 0 0 1 482 320 Z" stroke="none" />

        {/* Gear Teeth */}
        <rect x="470" y="334" width="14" height="16" rx="3" transform="rotate(28 477 342)" stroke="none" />
        <rect x="505" y="346" width="14" height="18" rx="3" stroke="none" />
        <rect x="540" y="334" width="14" height="16" rx="3" transform="rotate(-28 547 342)" stroke="none" />

        {/* Left Team Collaborator */}
        <circle cx="424" cy="328" r="22" fill="#FFFFFF" strokeWidth="12" />
        <path
          d="M 404 362
             C 386 364, 372 396, 366 436
             L 424 436
             L 462 504
             A 14 14 0 0 0 486 490
             L 448 418
             L 414 418
             L 424 384
             L 462 406
             A 12 12 0 0 0 476 388
             L 430 362 Z"
          fill="#FFFFFF"
          strokeWidth="12"
          strokeLinejoin="round"
        />
        <path
          d="M 426 456 L 402 496 A 14 14 0 0 0 426 510 L 450 470 Z"
          fill="#FFFFFF"
          strokeWidth="12"
          strokeLinejoin="round"
        />

        {/* Right Team Collaborator */}
        <circle cx="600" cy="328" r="22" fill="#FFFFFF" strokeWidth="12" />
        <path
          d="M 620 362
             C 638 364, 652 396, 658 436
             L 600 436
             L 562 504
             A 14 14 0 0 1 538 490
             L 576 418
             L 610 418
             L 600 384
             L 562 406
             A 12 12 0 0 1 548 388
             L 594 362 Z"
          fill="#FFFFFF"
          strokeWidth="12"
          strokeLinejoin="round"
        />
        <path
          d="M 598 456 L 622 496 A 14 14 0 0 1 598 510 L 574 470 Z"
          fill="#FFFFFF"
          strokeWidth="12"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export default function QBenchLogo({
  variant = 'horizontal',
  className = '',
  iconSize = 40,
}: QBenchLogoProps) {
  if (variant === 'symbol') {
    return <QBenchEmblemMark size={iconSize} className={className} />;
  }

  if (variant === 'stacked') {
    return (
      <div id="qbench-logo-stacked" className={`flex flex-col items-center text-center ${className}`}>
        <QBenchEmblemMark size={iconSize ? Math.max(iconSize, 48) : 56} className="mb-2" />
        <div className="flex flex-col items-center">
          {/* Custom styled QBENCH with letters colored exactly as the logo gradient */}
          <h2 className="font-display font-black tracking-wider text-3xl sm:text-4xl flex justify-center select-none">
            <span className="text-[#1e4657]">Q</span>
            <span className="text-[#0e5c4c]">B</span>
            <span className="text-[#106b53]">E</span>
            <span className="text-[#25855c]">N</span>
            <span className="text-[#59ad72]">C</span>
            <span className="text-[#aacd61]">H</span>
          </h2>
          <span className="text-xs font-display font-medium text-brand-text-muted tracking-[0.25em] uppercase mt-1">
            Unlimited Resources
          </span>
        </div>
      </div>
    );
  }

  // Default: Horizontal row lockup (perfect for headers and smaller cards)
  return (
    <div id="qbench-logo-horizontal" className={`flex items-center gap-2.5 sm:gap-3 select-none leading-none ${className}`}>
      <QBenchEmblemMark size={iconSize} />
      <div className="flex flex-col justify-center">
        <h2 className="font-display font-extrabold tracking-wide text-xl sm:text-2xl flex">
          <span className="text-[#1e4657]">Q</span>
          <span className="text-[#0e5c4c]">B</span>
          <span className="text-[#106b53]">E</span>
          <span className="text-[#25855c]">N</span>
          <span className="text-[#59ad72]">C</span>
          <span className="text-[#aacd61]">H</span>
        </h2>
        <span className="text-[8.5px] font-display font-semibold text-brand-text-muted tracking-[0.15em] uppercase mt-1 whitespace-nowrap">
          Unlimited Resources
        </span>
      </div>
    </div>
  );
}
