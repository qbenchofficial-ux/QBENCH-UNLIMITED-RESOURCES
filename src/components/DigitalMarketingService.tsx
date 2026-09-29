import { useState } from 'react';
import { motion } from 'motion/react';
import { Target, TrendingUp, Search, DollarSign, Sliders, Trophy, CheckCircle2, Award, ArrowUpRight } from 'lucide-react';

export default function DigitalMarketingService() {
  const [objective, setObjective] = useState<'awareness' | 'leads' | 'sales'>('leads');
  const [channel, setChannel] = useState<'seo' | 'google' | 'meta'>('google');
  const [budget, setBudget] = useState<number>(50000); // 50k INR default

  // Calculate simulated ROI data
  const calculateSimulatedResult = () => {
    let cpc = 12; // cost per click
    let conversionRate = 0.025; // 2.5%
    let leadValue = 1200;

    if (channel === 'seo') {
      cpc = 4;
      conversionRate = 0.018;
    } else if (channel === 'google') {
      cpc = 22;
      conversionRate = 0.045;
    } else {
      cpc = 14;
      conversionRate = 0.032;
    }

    if (objective === 'awareness') {
      conversionRate = conversionRate * 0.5;
      leadValue = 400;
    } else if (objective === 'sales') {
      conversionRate = conversionRate * 1.4;
      leadValue = 3500;
    }

    const projectedClicks = Math.round(budget / cpc);
    const projectedConversions = Math.round(projectedClicks * conversionRate);
    const calculatedCPA = projectedConversions > 0 ? Math.round(budget / projectedConversions) : 0;
    const projectedValue = projectedConversions * leadValue;
    const roiRatio = budget > 0 ? (projectedValue / budget).toFixed(1) : '0';

    return { projectedClicks, projectedConversions, calculatedCPA, roiRatio };
  };

  const results = calculateSimulatedResult();

  return (
    <div id="tab-digital-marketing-content" className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 animate-fade-in w-full">
      <div className="md:col-span-7 space-y-8">
        <div className="space-y-4">
          <span className="font-tech text-[10px] tracking-widest text-[#00685b] font-bold uppercase flex items-center gap-1.5 bg-[#00685b]/10 w-fit px-2.5 py-1 rounded-full">
            <Target className="h-3.5 w-3.5" /> DIGITAL MARKETING
          </span>
          <h3 className="font-display text-2xl sm:text-3xl font-black text-brand-text">
            Performance Marketing Systems<span className="text-brand-accent">.</span>
          </h3>
          <p className="font-sans text-xs text-[#374151] leading-relaxed">
            Data-backed client outreach and targeted google search ads built to capture real buyer intent.
          </p>
        </div>

        {/* Sub Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5 bg-white/50 border border-brand-outline/20 rounded-xl p-3.5 hover:border-[#00685b]/45 transition-all duration-200">
            <div className="flex items-center space-x-2 text-[#00685b] mb-0.5">
              <Search className="h-4 w-4" />
              <span className="font-tech text-[10px] tracking-wider font-bold">01 / GOOGLE SEARCH ADS</span>
            </div>
            <p className="font-sans text-[11px] text-brand-text-muted leading-relaxed">
              Targeted buyer searches configured to display your link directly at the top.
            </p>
          </div>

          <div className="space-y-1.5 bg-white/50 border border-brand-outline/20 rounded-xl p-3.5 hover:border-[#00685b]/45 transition-all duration-200">
            <div className="flex items-center space-x-2 text-[#00685b] mb-0.5">
              <TrendingUp className="h-4 w-4" />
              <span className="font-tech text-[10px] tracking-wider font-bold">02 / META CAMPAIGNS</span>
            </div>
            <p className="font-sans text-[11px] text-brand-text-muted leading-relaxed">
              Eye-catching picture and video ads designed specifically to engage local audiences.
            </p>
          </div>
        </div>

        {/* Deliverables Checklist */}
        <div id="marketing-deliverables-checklist" className="bg-brand-surface-low border border-brand-outline/20 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-brand-outline/10 pb-2.5 gap-2">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-[#00685b]" />
              <h4 className="font-display text-[10px] font-bold text-brand-text uppercase tracking-wider">
                Marketing Deliverables
              </h4>
            </div>
            <span className="font-tech text-[9px] text-[#00685b] font-bold bg-[#00685b]/10 px-2.5 py-0.5 rounded-full">Duration: Ongoing blocks</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Multi-Platform Ads</p>
                <p className="font-sans text-[10px] text-brand-text-muted">Targeted parameters configured direct on search pipelines</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Semantic SEO Maps</p>
                <p className="font-sans text-[10px] text-brand-text-muted">In-depth high-conversion keyword targeting frameworks</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Centralized Insights</p>
                <p className="font-sans text-[10px] text-brand-text-muted">Centralized Looker visual reports showing explicit CPA attributes</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Lead Funnels & CRM</p>
                <p className="font-sans text-[10px] text-brand-text-muted">High-converting pages connected to lead reporting systems</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[9px] font-display pt-2.5 border-t border-brand-outline/10 text-brand-text-muted">
            <span className="font-tech font-bold uppercase">TERMS //</span>
            <span className="font-semibold text-brand-text">Transparent CPA attribution metrics tracking</span>
          </div>
        </div>
      </div>

      {/* Right Side - Interactive Ads ROI Planner */}
      <div className="md:col-span-5 bg-white border border-brand-outline/30 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold font-tech tracking-wider text-[#00685b] uppercase">Ads ROI Spec Calculator</span>
            <span className="bg-[#00685b]/10 text-[#00685b] text-[8px] font-bold px-2 py-0.5 rounded-full font-tech">PLANNING BOARD</span>
          </div>

          {/* Controls Sandbox */}
          <div className="bg-brand-surface-low rounded-xl p-3 border border-brand-outline/10 space-y-3.5">
            <div>
              <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <Sliders className="h-3 w-3" /> Select Campaign Objective
              </p>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'awareness', label: 'Impressions' },
                  { id: 'leads', label: 'Lead Capture' },
                  { id: 'sales', label: 'Direct Checkouts' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setObjective(opt.id as any)}
                    className={`py-1.5 px-2 rounded-lg text-[9px] font-bold uppercase transition-all duration-150 cursor-pointer ${
                      objective === opt.id
                        ? 'bg-[#00685b] text-white shadow-sm'
                        : 'bg-white hover:bg-brand-outline/10 border border-brand-outline/20 text-brand-text-muted'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Configure Channel Strategy</p>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'seo', label: 'Organic SEO' },
                  { id: 'google', label: 'Google Search' },
                  { id: 'meta', label: 'Meta Campaigns' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setChannel(opt.id as any)}
                    className={`py-1.5 px-1 rounded-lg text-[8.5px] font-extrabold uppercase transition-all duration-150 cursor-pointer ${
                      channel === opt.id
                        ? 'bg-[#00685b] text-white shadow-sm'
                        : 'bg-white hover:bg-brand-outline/10 border border-brand-outline/20 text-brand-text-muted'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest">Monthly Traffic Spend</p>
                <span className="text-[9px] font-mono font-bold text-[#00685b]">₹{(budget).toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="10000"
                max="500000"
                step="5000"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full accent-[#00685b] cursor-pointer"
              />
            </div>
          </div>

          {/* Calculations Results Block */}
          <div className="bg-brand-dark rounded-2xl p-4.5 border border-white/5 space-y-4 text-white">
            <div className="flex justify-between items-center text-[9px] text-[#00c9a7] font-mono border-b border-white/10 pb-2">
              <span className="flex items-center gap-1">PROJECTED ENGINE YIELDS</span>
              <span className="font-bold flex items-center gap-0.5 bg-[#00c9a7]/10 px-1.5 py-0.5 rounded text-white text-[8px]">
                ROI FACTOR: {results.roiRatio}x
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                <span className="text-[8px] uppercase text-white/50 tracking-wider block mb-0.5">Projected Traffic Clickthroughs</span>
                <span className="font-display text-lg font-black text-[#00c9a7]">{(results.projectedClicks).toLocaleString()} Clickouts</span>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                <span className="text-[8px] uppercase text-white/50 tracking-wider block mb-0.5">Estimated Conversions</span>
                <span className="font-display text-lg font-black text-[#00c9a7]">{results.projectedConversions} Nodes</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-[8px] uppercase text-white/50 tracking-wider block">Projected CPA (Acquisition cost)</span>
                <span className="text-[10px] text-white/70">Estimated benchmark value</span>
              </div>
              <div className="text-right">
                <span className="font-display text-sm font-black text-[#00c9a7]">₹{(results.calculatedCPA).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand-outline/10 text-center">
          <div>
            <h5 className="font-tech text-base font-extrabold text-[#00685b]">{results.roiRatio}x</h5>
            <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-wider">Estimated Return Factor</p>
          </div>
          <div>
            <h5 className="font-tech text-base font-extrabold text-[#00685b]">₹{Math.round(results.calculatedCPA * 0.82)}</h5>
            <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-wider">Optimal CPA Target</p>
          </div>
        </div>
      </div>
    </div>
  );
}
