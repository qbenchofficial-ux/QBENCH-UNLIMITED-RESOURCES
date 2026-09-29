interface QBenchLogoProps {
  variant?: 'horizontal' | 'stacked' | 'symbol';
  className?: string;
  iconSize?: number;
}

export default function QBenchLogo({
  variant = 'horizontal',
  className = '',
  iconSize = 40,
}: QBenchLogoProps) {
  if (variant === 'symbol') {
    return (
      <span className={`font-display font-black text-2xl text-[#1e4657] ${className} select-none`}>
        Q
      </span>
    );
  }

  if (variant === 'stacked') {
    return (
      <div id="qbench-logo-stacked" className={`flex flex-col items-center text-center ${className}`}>
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
    <div id="qbench-logo-horizontal" className={`flex flex-col select-none leading-none ${className}`}>
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
  );
}
