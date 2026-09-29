import { useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Globe, DollarSign, Target, Trophy, CheckCircle2, Sliders, ArrowUpRight } from 'lucide-react';

export default function GrowthService() {
  const [outreachSpend, setOutreachSpend] = useState<number>(100000); // IN Rupees, range: 25k to 10L

  const formatRupees = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Strategic estimation formula based on Spend
  const estimatedLeads = Math.round((outreachSpend / 380) * (1 + (outreachSpend > 200000 ? 0.35 : 0)));
  const trafficMultiplier = (1.5 + (outreachSpend / 115000)).toFixed(1);
  const costPerLead = Math.round(380 - (outreachSpend / 5500) > 95 ? 380 - (outreachSpend / 5500) : 95);

  return (
    <div id="tab-growth-content" className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 animate-fade-in w-full">
      <div className="md:col-span-7 space-y-8">
        <div className="space-y-4">
          <span className="font-tech text-[10px] tracking-widest text-[#00685b] font-bold uppercase flex items-center gap-1.5 bg-[#00685b]/10 w-fit px-2.5 py-1 rounded-full">
            <TrendingUp className="h-3.5 w-3.5" /> DIGITAL GROWTH
          </span>
          <h3 className="font-display text-2xl sm:text-3xl font-black text-brand-text">
            Analytics & Organic SEO<span className="text-brand-accent">.</span>
          </h3>
          <p className="font-sans text-xs text-brand-text-variant leading-relaxed">
            Data-backed search engine optimization and meticulous competitive analysis mapped to bypass standard growth limitations.
          </p>
        </div>

        {/* Sub Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5 bg-white/50 border border-brand-outline/20 rounded-xl p-3.5 hover:border-[#00685b]/45 transition-all duration-200">
            <div className="flex items-center space-x-2 text-[#00685b] mb-0.5">
              <TrendingUp className="h-4 w-4" />
              <span className="font-tech text-[10px] tracking-wider font-bold">01 / ORGANIC SEO</span>
            </div>
            <p className="font-sans text-[11px] text-brand-text-muted leading-relaxed">
              Meticulous keyword formatting, meta tag optimization, and semantic search authority builds.
            </p>
          </div>

          <div className="space-y-1.5 bg-white/50 border border-brand-outline/20 rounded-xl p-3.5 hover:border-[#00685b]/45 transition-all duration-200">
            <div className="flex items-center space-x-2 text-[#00685b] mb-0.5">
              <Globe className="h-4 w-4" />
              <span className="font-tech text-[10px] tracking-wider font-bold font-tech">02 / COMPETITOR GAP AUDITS</span>
            </div>
            <p className="font-sans text-[11px] text-brand-text-muted leading-relaxed">
              In-depth research of top market leaders to identify high-yield organic search terms.
            </p>
          </div>
        </div>

        {/* Customer-Ready Deliverables Package Checklist */}
        <div id="growth-deliverables-checklist" className="bg-brand-surface-low border border-brand-outline/20 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-brand-outline/10 pb-2.5 gap-2">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-[#00685b]" />
              <h4 className="font-display text-[10px] font-bold text-brand-text uppercase tracking-wider">
                Growth Deliverables
              </h4>
            </div>
            <span className="font-tech text-[9px] text-[#00685b] font-bold bg-[#00685b]/10 px-2.5 py-0.5 rounded-full">Duration: Sprint blocks</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Content Calendars</p>
                <p className="font-sans text-[10px] text-brand-text-muted">High-density visual layouts and semantic release blueprints</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Engagement Maps</p>
                <p className="font-sans text-[10px] text-brand-text-muted">Comprehensive node metrics outlining active lead profiles</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Creative Copy Assets</p>
                <p className="font-sans text-[10px] text-brand-text-muted">Persuasive outreach banners and high-yield product designs</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Live Audits</p>
                <p className="font-sans text-[10px] text-brand-text-muted">Dynamic reporting dashboards with clear competitors gap metrics</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[9px] font-display pt-2.5 border-t border-brand-outline/10 text-brand-text-muted">
            <span className="font-tech font-bold uppercase">TERMS //</span>
            <span className="font-semibold text-brand-text">Weekly reports with clear competitor benchmark updates</span>
          </div>
        </div>
      </div>

      {/* Right Side Card Panel - Live ROI Estimation Calculator */}
      <div className="md:col-span-5 bg-white border border-brand-outline/35 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
        <div className="space-y-4 w-full">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold font-tech tracking-wider text-[#00685b] uppercase">Outreach Yield Node</span>
            <span className="bg-[#00c9a7]/10 text-emerald-800 text-[8px] font-bold px-2 py-0.5 rounded-full font-tech">LIVE FORECAST</span>
          </div>

          {/* Interactive controls */}
          <div className="bg-brand-surface-low rounded-xl p-3.5 space-y-3.5 border border-brand-outline/15">
            <div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest flex items-center gap-1">
                  <Sliders className="h-3 w-3 text-[#00685b]" /> Monthly Spend Allocation
                </p>
                <span className="text-xs font-bold text-[#00685b] font-mono">{formatRupees(outreachSpend)}</span>
              </div>
              <input
                type="range"
                min="25000"
                max="1000000"
                step="25000"
                value={outreachSpend}
                onChange={(e) => setOutreachSpend(Number(e.target.value))}
                className="w-full accent-[#00685b] cursor-pointer"
              />
              <div className="flex justify-between text-[8px] text-brand-text-muted font-mono mt-0.5">
                <span>₹25K/Mo</span>
                <span>₹10L/Mo</span>
              </div>
            </div>
          </div>

          {/* Metric Projections with Animated Progress Boxes */}
          <div className="space-y-3 pt-1">
            <h4 className="font-display text-[10px] text-brand-text-muted uppercase tracking-widest font-bold">Projected Yield Metrics</h4>
            
            {/* Multiplier */}
            <div className="border border-brand-outline/20 rounded-xl p-3 bg-brand-surface-low flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-wider">Organic Traffic multiplier</p>
                <p className="text-lg font-bold text-brand-text font-mono mt-0.5">{trafficMultiplier}x <span className="text-xs text-brand-text-muted font-normal">Yield</span></p>
              </div>
              <div className="w-16 h-10 flex items-center justify-end">
                <ArrowUpRight className="h-6 w-6 text-[#00c9a7] animate-pulse" />
              </div>
            </div>

            {/* Estimated Leads */}
            <div className="border border-brand-outline/20 rounded-xl p-3 bg-brand-surface-low flex items-center justify-between flex-wrap gap-1">
              <div className="w-full sm:w-auto">
                <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-wider">Estimated Leads / Month</p>
                <p className="text-lg font-bold text-[#00685b] font-mono mt-0.5">~{estimatedLeads} <span className="text-xs text-brand-text-muted font-normal">Qualified</span></p>
              </div>
              
              {/* Custom visual progress bar */}
              <div className="w-full max-w-xs bg-slate-100 rounded-full h-2 overflow-hidden mt-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((estimatedLeads / 2631) * 100, 100)}%` }}
                  transition={{ type: 'spring', stiffness: 90 }}
                  className="bg-[#00685b] h-full rounded-full"
                />
              </div>
            </div>

            {/* CPL */}
            <div className="border border-brand-outline/20 rounded-xl p-3 bg-brand-surface-low flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-wider">Estimated Cost Per Lead (CPL)</p>
                <p className="text-lg font-bold text-brand-text font-mono mt-0.5">₹{costPerLead} <span className="text-xs text-[#00685b] font-bold font-sans">(-{(100 - (costPerLead/380)*100).toFixed(0)}% Decr.)</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-brand-surface rounded-xl p-3 border border-brand-outline/10 flex justify-between items-center gap-2">
          <p className="font-display text-[9px] leading-relaxed text-brand-text-variant italic">
            "By mapping programmatic targeting nodes into CAC/LTV curves, marketing capital outputs are maximized daily."
          </p>
        </div>
      </div>
    </div>
  );
}
