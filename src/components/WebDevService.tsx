import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Code, Cpu, ShieldCheck, Zap, GitBranch, Trophy, CheckCircle2, Check, Server, Terminal, Play, CheckCircle } from 'lucide-react';

export default function WebDevService() {
  const [activeEndpoint, setActiveEndpoint] = useState<string>('lighthouse');
  const [terminalOutput, setTerminalOutput] = useState<string>('// Select an endpoint and click "Execute Payload"');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const endpointPayloads: Record<string, { route: string; response: string; latencyRange: [number, number] }> = {
    lighthouse: {
      route: 'GET /api/v1/audit/lighthouse',
      latencyRange: [120, 240],
      response: `{
  "status": "success",
  "audits": {
    "performance": 100,
    "accessibility": 100,
    "best_practices": 100,
    "seo": 100
  },
  "metrics": {
    "first_contentful_paint": "0.3s",
    "largest_contentful_paint": "0.7s",
    "speed_index": "0.4s",
    "total_blocking_time": "0ms"
  },
  "verdict": "ELITE_OPTIMIZED"
}`
    },
    database: {
      route: 'POST /api/v1/db/query-edge',
      latencyRange: [15, 45],
      response: `{
  "status": "connected",
  "provider": "Firebase_Firestore_Durable",
  "active_instances": 12,
  "transaction": {
    "id": "tx_bench_8a72e9",
    "status": "COMMITTED",
    "affected_rows": 1,
    "latency": "18ms"
  },
  "encryption": "AES_256_GCM"
}`
    },
    dns: {
      route: 'GET /api/v1/edge/dns-routing',
      latencyRange: [50, 110],
      response: `{
  "status": "online",
  "anycast_nodes": [
    {"region": "IN-WEST", "latency": "8ms", "status": "ACTIVE"},
    {"region": "US-EAST", "latency": "14ms", "status": "ACTIVE"},
    {"region": "EU-CENTRAL", "latency": "11ms", "status": "ACTIVE"}
  ],
  "ssl_handshake": "success",
  "gzip_compression": "ENABLED_ROTATED"
}`
    }
  };

  const handleExecute = () => {
    setIsExecuting(true);
    setTerminalOutput('// Connecting to edge proxy...\n// Sending secure handshakes...');
    
    const payload = endpointPayloads[activeEndpoint];
    const latency = Math.floor(Math.random() * (payload.latencyRange[1] - payload.latencyRange[0])) + payload.latencyRange[0];
    
    setTimeout(() => {
      setTerminalOutput(payload.response);
      setExecutionTime(latency);
      setIsExecuting(false);
    }, 1200);
  };

  return (
    <div id="tab-webdev-content" className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 animate-fade-in w-full">
      <div className="md:col-span-7 space-y-8">
        <div className="space-y-4">
          <span className="font-tech text-[10px] tracking-widest text-[#00685b] font-bold uppercase flex items-center gap-1.5 bg-[#00685b]/10 w-fit px-2.5 py-1 rounded-full">
            <Code className="h-3.5 w-3.5" /> WEB DEVELOPMENT
          </span>
          <h3 className="font-display text-2xl sm:text-3xl font-black text-brand-text">
            High-Performance Web Apps<span className="text-brand-accent">.</span>
          </h3>
          <p className="font-sans text-xs text-brand-text-variant leading-relaxed">
            Stunning Figma designs translated directly into production TypeScript codebase configurations.
          </p>
        </div>

        {/* Ecosystem block cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-brand-outline/20 rounded-xl p-3.5 transition-all duration-200">
            <div className="flex items-center space-x-2.5 mb-1.5">
              <span className="p-1 bg-[#00685b]/5 text-[#00685b] rounded shrink-0">
                <Code className="h-4 w-4" />
              </span>
              <h4 className="font-display text-xs font-bold text-brand-text">React & Next.js Builds</h4>
            </div>
            <p className="font-sans text-[11px] text-brand-text-muted leading-relaxed">
              Highly responsive elements built with clean Tailwind utilities and fluid transitions.
            </p>
          </div>

          <div className="bg-white border border-brand-outline/20 rounded-xl p-3.5 transition-all duration-200">
            <div className="flex items-center space-x-2.5 mb-1.5">
              <span className="p-1 bg-[#00685b]/5 text-[#00685b] rounded shrink-0">
                <Cpu className="h-4 w-4" />
              </span>
              <h4 className="font-display text-xs font-bold text-brand-text">Database & GQL APIs</h4>
            </div>
            <p className="font-sans text-[11px] text-brand-text-muted leading-relaxed">
              Durable backend models integrated with fast caching layer protocols.
            </p>
          </div>
        </div>

        {/* Sub items 01-03 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
          <div className="space-y-1 bg-brand-surface-low rounded-xl p-3 border border-brand-outline/15 hover:border-[#00685b]/20 transition-all duration-200">
            <div className="flex items-center space-x-2 text-[#00685b] mb-0.5">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-[9px] font-bold font-tech uppercase">01 / SECURED NODES</span>
            </div>
            <p className="font-sans text-[10.5px] text-brand-text-muted leading-relaxed">
              Durable API rules and strict route permission token checks.
            </p>
          </div>
          <div className="space-y-1 bg-brand-surface-low rounded-xl p-3 border border-brand-outline/15 hover:border-[#00685b]/20 transition-all duration-200">
            <div className="flex items-center space-x-2 text-[#00685b] mb-0.5">
              <Zap className="h-4 w-4" />
              <span className="text-[9px] font-bold font-tech uppercase">02 / LIGHTHOUSE 100</span>
            </div>
            <p className="font-sans text-[10.5px] text-brand-text-muted leading-relaxed">
              Fully optimized code compiling to high performance marks.
            </p>
          </div>
          <div className="space-y-1 bg-brand-surface-low rounded-xl p-3 border border-brand-outline/15 hover:border-[#00685b]/20 transition-all duration-200">
            <div className="flex items-center space-x-2 text-[#00685b] mb-0.5">
              <GitBranch className="h-4 w-4" />
              <span className="text-[9px] font-bold font-tech uppercase">03 / STABLE LABS</span>
            </div>
            <p className="font-sans text-[10.5px] text-brand-text-muted leading-relaxed">
              Robust continuous-integration deploying directly behind CDN.
            </p>
          </div>
        </div>

        {/* Customer-Ready Deliverables Package Checklist */}
        <div id="webdev-deliverables-checklist" className="bg-brand-surface-low border border-brand-outline/20 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-brand-outline/10 pb-2.5 gap-2">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-[#00685b]" />
              <h4 className="font-display text-[10px] font-bold text-brand-text uppercase tracking-wider">
                Web Development Deliverables
              </h4>
            </div>
            <span className="font-tech text-[9px] text-[#00685b] font-bold bg-[#00685b]/10 px-2.5 py-0.5 rounded-full">Duration: 6-10 Weeks</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Modern Web Coding</p>
                <p className="font-sans text-[10px] text-brand-text-muted">TypeScript web page components styled following layout guides</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Content Panel CMS</p>
                <p className="font-sans text-[10px] text-brand-text-muted">Integrated modern dashboard for effortless blog updates</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Durable Security Rules</p>
                <p className="font-sans text-[10px] text-brand-text-muted">Token rate limiting, server-side proxies, and safe credentials handling</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Performance Calibration</p>
                <p className="font-sans text-[10px] text-brand-text-muted">Lighthouse optimization targeting 95+ score brackets</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[9px] font-display pt-2.5 border-t border-brand-outline/10 text-brand-text-muted">
            <span className="font-tech font-bold uppercase">TERMS //</span>
            <span className="font-semibold text-brand-text">GitHub source transfer and active pipeline configured</span>
          </div>
        </div>
      </div>

      {/* Right Side Card Panel - Live API Sandbox Terminal */}
      <div className="md:col-span-5 bg-white border border-brand-outline/30 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
        <div className="space-y-4 w-full">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold font-tech tracking-wider text-[#00685b] uppercase">API Live Console</span>
            <span className="bg-black text-[8px] font-bold px-2 py-0.5 rounded-full font-tech text-white uppercase tracking-wider">Production Edge</span>
          </div>

          {/* Interactive controls */}
          <div className="bg-brand-surface-low rounded-xl p-3 border border-brand-outline/10 space-y-3">
            <div>
              <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Server className="h-3.5 w-3.5 text-[#00685b]" /> Select Route Node
              </p>
              <select
                value={activeEndpoint}
                onChange={(e) => {
                  setActiveEndpoint(e.target.value);
                  setTerminalOutput('// Route selected: ' + endpointPayloads[e.target.value].route + '\n// Click "Execute Payload" to fetch...');
                  setExecutionTime(null);
                }}
                className="w-full bg-white border border-brand-outline/25 rounded-lg px-2.5 py-1.5 text-xs font-display text-brand-text focus:outline-none focus:border-[#00685b]"
              >
                <option value="lighthouse">GET /api/v1/audit/lighthouse</option>
                <option value="database">POST /api/v1/db/query-edge</option>
                <option value="dns">GET /api/v1/edge/dns-routing</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[9px] font-mono text-[#00685b] bg-[#00685b]/10 px-2 py-0.5 rounded-full font-bold">
                {endpointPayloads[activeEndpoint].route}
              </span>
              <button
                type="button"
                onClick={handleExecute}
                disabled={isExecuting}
                className="flex items-center gap-1 text-xs bg-[#00685b] text-white px-3 py-1 rounded-lg hover:bg-opacity-90 transition-all font-bold uppercase cursor-pointer disabled:opacity-50"
              >
                <Play className="h-3 w-3 fill-white" /> Execute Payload
              </button>
            </div>
          </div>
          
          {/* Simulated IDE Terminal */}
          <div className="bg-slate-900 rounded-xl p-4 font-mono text-[10px] text-[#2ebd85] min-h-[170px] overflow-hidden border border-slate-950 flex flex-col justify-between shadow-inner relative">
            <div className="absolute top-2 right-2 flex items-center gap-1">
              <span className={`h-1.5 w-1.5 rounded-full ${isExecuting ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
              <span className="text-[8px] font-mono font-bold text-white/30 uppercase tracking-wide">
                {isExecuting ? 'SERVING...' : 'LIVE_STANDBY'}
              </span>
            </div>

            <div className="space-y-1 text-left flex-grow">
              <div className="flex items-center space-x-1.5 border-b border-white/5 pb-2 text-[8px] text-white/40">
                <Terminal className="h-3 w-3 text-brand-accent-light" />
                <span>BENCH-TERMINAL v1.4 // EDGE PORT 3000</span>
              </div>
              
              <pre className="text-emerald-400 whitespace-pre overflow-x-auto leading-relaxed pt-2 break-all max-h-36 no-scrollbar select-all">
                {terminalOutput}
              </pre>
            </div>

            {executionTime && (
              <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[8px] text-[#45b88a] font-bold">
                <span className="flex items-center gap-1"><CheckCircle className="h-2.5 w-2.5" /> REQUEST COMPLETE</span>
                <span>LATENCY: {executionTime}ms</span>
              </div>
            )}
          </div>
        </div>

        {/* Steps to ship */}
        <div className="bg-brand-surface border border-brand-outline/25 rounded-xl p-4 space-y-2.5">
          <h5 className="font-display text-[10px] font-bold text-brand-text uppercase tracking-widest pl-1">Shipping Cycle</h5>
          <div className="space-y-2 text-[10px] font-display text-brand-text-variant font-medium">
            <div className="flex items-center space-x-2">
              <Check className="h-3 w-3 text-brand-accent" />
              <span>01. Discovery & Database schemas Setup</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-3 w-3 text-brand-accent" />
              <span>02. UI/UX Assembly with code logic hookups</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded-full border border-brand-primary flex items-center justify-center text-[7px] text-[#00685b] border-[#00685b] font-bold">3</div>
              <span className="text-[#00685b] font-bold">03. Automated Stress Testing & CI rollout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
