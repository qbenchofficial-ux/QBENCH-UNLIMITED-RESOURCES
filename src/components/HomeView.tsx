import { useState, useEffect, FormEvent, useRef } from 'react';
import { NavSection, ServiceTab } from '../types';
import { 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  Search, 
  Target, 
  Layers, 
  Code, 
  Video, 
  Briefcase, 
  Globe, 
  Check, 
  PhoneCall, 
  Sparkles, 
  Linkedin,
  MessageSquare,
  Award,
  ChevronRight
} from 'lucide-react';
import { sendEmailJS } from '../lib/emailService';

interface HomeViewProps {
  onNavigate: (section: NavSection, tab?: ServiceTab) => void;
}

function Typewriter({ 
  words, 
  typingSpeed = 90, 
  deletingSpeed = 45, 
  delayBetweenWords = 2500 
}: { 
  words: string[]; 
  typingSpeed?: number; 
  deletingSpeed?: number; 
  delayBetweenWords?: number; 
}) {
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer: any;
    const currentWord = words[currentWordIdx];

    if (isDeleting) {
      timer = setTimeout(() => {
        setDisplayedText((prev) => prev.slice(0, -1));
      }, deletingSpeed);
    } else {
      timer = setTimeout(() => {
        setDisplayedText(currentWord.slice(0, displayedText.length + 1));
      }, typingSpeed);
    }

    if (!isDeleting && displayedText === currentWord) {
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, delayBetweenWords);
    } else if (isDeleting && displayedText === '') {
      setIsDeleting(false);
      setCurrentWordIdx((prev) => (prev + 1) % words.length);
    }

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentWordIdx, words, typingSpeed, deletingSpeed, delayBetweenWords]);

  return (
    <span className="relative inline-flex items-center">
      <span>{displayedText}</span>
      <span className="ml-[3px] inline-block w-[3px] h-[0.8em] bg-[#00685b] animate-pulse" aria-hidden="true" />
    </span>
  );
}

export default function HomeView({ onNavigate }: HomeViewProps) {
  // Free Audit Form State
  const [formData, setFormData] = useState({
    fullName: '',
    businessName: '',
    phoneNumber: '',
    emailAddress: '',
    websiteUrl: ''
  });
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [formError, setFormError] = useState<string | null>(null);

  // Anti-spam honeypot protection field & double-click submission lock
  const [honeypot, setHoneypot] = useState('');
  const isSubmittingRef = useRef(false);

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (isSubmittingRef.current || formState === 'submitting') {
      return;
    }

    // Honeypot anti-spam check
    if (honeypot.trim() !== '') {
      console.warn('[Audit Form] Spam detected.');
      setFormState('success');
      return;
    }

    // Validation checks
    const trimmedName = formData.fullName.trim();
    const trimmedEmail = formData.emailAddress.trim();
    const trimmedPhone = formData.phoneNumber.trim();
    const trimmedCompany = formData.businessName.trim() || 'Not specified';
    const auditMessage = `Requested brand audit for website/social handle: ${formData.websiteUrl.trim() || 'Not provided'}`;

    if (!trimmedName || !trimmedEmail || !trimmedPhone) {
      setFormError("Please fill in all required fields (Name, Phone Number, and Email).");
      return;
    }

    isSubmittingRef.current = true;
    setFormState('submitting');
    setFormError(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
          service: 'Free Brand Visibility Audit',
          message: auditMessage,
          company: trimmedCompany,
          fullName: trimmedName,
          phoneNumber: trimmedPhone,
          emailAddress: trimmedEmail,
          businessName: trimmedCompany,
          subject: `New QBENCH Website Enquiry — ${trimmedName}`
        })
      });

      const responseData = await response.json();
      if (response.ok && responseData.success === true) {
        setFormState('success');
      } else {
        setFormError("Sorry, we couldn't submit your enquiry. Please try again or contact us on WhatsApp.");
        setFormState('idle');
      }
    } catch {
      setFormError("Sorry, we couldn't submit your enquiry. Please try again or contact us on WhatsApp.");
      setFormState('idle');
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const servicesList: { 
    id: ServiceTab; 
    emoji: string; 
    title: string; 
    desc: string; 
  }[] = [
    {
      id: 'branding',
      emoji: '🎨',
      title: 'Branding & Identity',
      desc: 'Logos, brand identity systems, visual guidelines, and brand assets that create a lasting impression.'
    },
    {
      id: 'social-media',
      emoji: '📱',
      title: 'Social Media Design',
      desc: 'Creative social media designs that strengthen your brand across every platform.'
    },
    {
      id: 'video-editing',
      emoji: '🎬',
      title: 'Video Editing',
      desc: 'Professional editing for promotional videos, product showcases, reels, and brand stories.'
    },
    {
      id: 'webdev',
      emoji: '🌐',
      title: 'Website Development',
      desc: 'Modern, responsive websites designed for performance, usability, and great user experiences.'
    },
    {
      id: 'digital-marketing',
      emoji: '📈',
      title: 'Digital Marketing',
      desc: 'Creative campaigns and digital solutions that help brands build a stronger online presence.'
    },
    {
      id: 'motion',
      emoji: '✨',
      title: 'Motion Graphics',
      desc: 'Eye-catching animations and motion visuals that bring ideas to life.'
    },
    {
      id: 'uiux',
      emoji: '🖥️',
      title: 'UI/UX Design',
      desc: 'User-centered interfaces designed for intuitive, engaging, and seamless digital experiences.'
    },
    {
      id: 'growth',
      emoji: '🚀',
      title: 'Creative Strategy',
      desc: 'Creative direction and digital solutions that help brands communicate with clarity and confidence.'
    },
    {
      id: 'business-support',
      emoji: '💼',
      title: 'Creative Support',
      desc: 'Ongoing design support for presentations, marketing materials, print media, and creative content.'
    }
  ];

  const processSteps = [
    {
      num: '01',
      title: 'Discover',
      desc: 'We learn about your goals, audience, and vision.'
    },
    {
      num: '02',
      title: 'Create',
      desc: 'We design and iterate until it is perfect.'
    },
    {
      num: '03',
      title: 'Deliver',
      desc: 'We hand over the final files and assets.'
    },
    {
      num: '04',
      title: 'Support',
      desc: 'We help you launch and grow your brand.'
    }
  ];

  const latestProjects = [
    {
      id: 'journey-of-a-ring',
      title: 'The Journey of a Ring',
      category: 'Luxury Jewellery · Motion Design',
      imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&h=450&q=80',
      externalUrl: 'https://www.behance.net/gallery/253620337/The-Journey-of-a-Ring-Luxury-Jewellery-Motion-Design?platform=direct'
    },
    {
      id: 'luxora',
      title: 'Luxora Jewellers',
      category: 'Brand Identity · Social Media',
      imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&h=450&q=80'
    },
    {
      id: 'spicehouse',
      title: 'Spice House Restaurant',
      category: 'Branding · Menu · Campaign',
      imageUrl: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?auto=format&fit=crop&w=600&h=450&q=80'
    }
  ];

  const whyChooseItems = [
    {
      title: 'Strategic Thinking',
      desc: 'We focus on business outcomes, not just design.'
    },
    {
      title: 'End-to-End Solutions',
      desc: "From branding to business support, we've got you covered."
    },
    {
      title: 'Growth Focused',
      desc: 'Everything we do is built around visibility, leads and growth.'
    },
    {
      title: 'Scalable Partnership',
      desc: 'Solutions that grow with your business.'
    }
  ];

  return (
    <div id="qbench-homepage" className="w-full">
      
      {/* 1. HERO SECTION */}
      <section id="hero-block" className="mx-auto max-w-7xl px-6 pt-12 pb-20 lg:px-12 lg:pt-20 lg:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Text Detail */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8">
            <span id="hero-badge" className="font-tech text-xs tracking-widest text-[#00685b] font-extrabold uppercase flex items-center gap-2 bg-[#00685b]/10 w-fit px-3 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00685b] animate-pulse" /> WE DESIGN BRANDS THAT PEOPLE REMEMBER
            </span>
            
            <h1 id="hero-title" className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-brand-text leading-[1.1] tracking-tight">
              We Design Brands<br />
              That <span className="text-[#00685b]">People Remember</span>.
            </h1>
            
            <p id="hero-intro" className="font-sans text-sm sm:text-base text-brand-text-muted leading-relaxed max-w-xl">
              QBench is a creative agency specializing in branding, web design, social media, video production, and digital marketing. We create thoughtful visual experiences that help businesses grow and stand out.
            </p>
            
            <div id="hero-actions" className="flex flex-col sm:flex-row gap-4">
              <button
                id="hero-cta-start"
                onClick={() => onNavigate('contact')}
                className="rounded-xl bg-[#00685b] text-white px-7 py-3.5 font-display text-sm font-bold hover:bg-[#178373] transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer group"
              >
                <span>Start a Project</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
              
              <button
                id="hero-cta-portfolio"
                onClick={() => onNavigate('portfolio')}
                className="rounded-xl bg-white border border-brand-outline/40 text-brand-text px-7 py-3.5 font-display text-sm font-semibold hover:border-[#00685b] hover:bg-brand-surface-low transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>View Portfolio</span>
              </button>
            </div>
            
            {/* Social Trust Metrics */}
            <div id="hero-trust" className="pt-6 sm:pt-8 border-t border-brand-outline/15 flex items-center space-x-3.5">
              <div className="flex -space-x-3">
                <img 
                  className="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover" 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80" 
                  alt="Customer 1" 
                  referrerPolicy="no-referrer"
                />
                <img 
                  className="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover" 
                  src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&h=120&q=80" 
                  alt="Customer 2" 
                  referrerPolicy="no-referrer"
                />
                <img 
                  className="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover" 
                  src="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=120&h=120&q=80" 
                  alt="Customer 3" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-xs font-sans text-brand-text-muted">
                <span className="font-bold text-brand-text">Building creative solutions</span> with passion, precision, and purpose.
              </div>
            </div>
          </div>
          
          {/* Right Devices Graphic Representation */}
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end py-6 select-none">
            {/* Custom Interactive Laptop Mockup */}
            <div id="laptop-mockup" className="relative w-full max-w-[480px] sm:max-w-[520px] aspect-[16/10] bg-zinc-800 rounded-3xl p-3 shadow-2xl border border-zinc-700/60 transform hover:scale-[1.01] transition-transform duration-300">
              
              {/* Laptop Screen Content */}
              <div className="relative w-full h-full bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex flex-col justify-between p-4 text-white">
                
                {/* Visual Glow Ambient */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#00685b]/20 rounded-full blur-3xl pointer-events-none" />
                
                {/* Header dashboard row */}
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="h-2 w-2 rounded-full bg-yellow-500" />
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-[10px] font-tech text-white/40 ml-2 font-bold tracking-wider">BUSINESS GROWTH OVERVIEW</span>
                  </div>
                  <span className="text-[9px] font-tech bg-white/10 px-2 py-0.5 rounded text-white/80">LIVE</span>
                </div>
                
                {/* Chart and Leads Segment */}
                <div className="grid grid-cols-12 gap-3 my-auto items-center">
                  <div className="col-span-5 space-y-2">
                    <span className="text-[10px] font-sans text-white/55 block">Total Leads Generated</span>
                    <div className="flex items-baseline gap-1.5">
                      <h4 className="font-display text-2xl sm:text-3xl font-black">1,248</h4>
                      <span className="text-emerald-400 font-sans text-[10px] sm:text-xs font-bold font-mono">+35.4%</span>
                    </div>
                    <p className="text-[9px] font-sans text-white/45">Conversion rate optimized automatically</p>
                  </div>
                  
                  {/* SVG Bezier Line Graphic */}
                  <div className="col-span-7 h-24 relative flex items-end">
                    <svg className="w-full h-full stroke-[2] stroke-emerald-400 fill-none" viewBox="0 0 100 50">
                      <path 
                        d="M0,45 C15,40 25,15 45,28 C65,38 75,10 100,5" 
                        className="stroke-[#45b88a] drop-shadow-[0_2px_8px_rgba(69,184,138,0.4)]"
                      />
                      <path 
                        d="M0,45 C15,40 25,15 45,28 C65,38 75,10 100,5 L100,50 L0,50 Z" 
                        fill="url(#emerald-gradient)" 
                        className="opacity-15"
                      />
                      <defs>
                        <linearGradient id="emerald-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#45b88a" />
                          <stop offset="100%" stopColor="#45b88a" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <circle cx="100" cy="5" r="3" fill="#88f8c5" />
                    </svg>
                  </div>
                </div>
                
                {/* Bottom stats layout indicators */}
                <div className="grid grid-cols-4 gap-1.5 text-center pt-2 border-t border-white/5">
                  <div className="bg-white/5 rounded p-1.5 leading-tight">
                    <span className="text-[8px] font-tech text-white/45 block uppercase">Visibility</span>
                    <span className="text-[10px] font-display font-bold text-emerald-400">↑ 320%</span>
                  </div>
                  <div className="bg-white/5 rounded p-1.5 leading-tight">
                    <span className="text-[8px] font-tech text-white/45 block uppercase">Leads</span>
                    <span className="text-[10px] font-display font-bold text-emerald-400">↑ 180%</span>
                  </div>
                  <div className="bg-white/5 rounded p-1.5 leading-tight">
                    <span className="text-[8px] font-tech text-white/45 block uppercase">Conversions</span>
                    <span className="text-[10px] font-display font-bold text-emerald-300">↑ 65%</span>
                  </div>
                  <div className="bg-white/5 rounded p-1.5 leading-tight">
                    <span className="text-[8px] font-tech text-white/45 block uppercase">Growth</span>
                    <span className="text-[10px] font-display font-bold text-emerald-400">↑ 250%</span>
                  </div>
                </div>
              </div>
              
              {/* Keyboard bottom base */}
              <div className="absolute -bottom-2 -left-6 -right-6 h-3 bg-zinc-700/90 rounded-b-xl border-t border-zinc-600 shadow-xl" />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-2 bg-zinc-900 rounded-b-md" />
            </div>
            
            {/* Floating Mobile Smartphone Mockup on Right */}
            <div id="phone-mockup" className="absolute bottom-[-16px] right-2 md:right-8 w-[140px] sm:w-[150px] aspect-[9/18] bg-zinc-900 rounded-[28px] p-2 shadow-2xl border-2 border-zinc-700/80 transform hover:translate-y-[-5px] transition-transform duration-300 hidden sm:block">
              <div className="relative w-full h-full bg-[#002f29] rounded-[22px] overflow-hidden p-3 text-white flex flex-col justify-between">
                
                {/* Speaker pill notch */}
                <span className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-2.5 bg-zinc-900 rounded-full" />
                
                {/* Header segment inside smartphone */}
                <div className="pt-2 text-center">
                  <h5 className="font-display font-black text-xs tracking-wider">
                    <span className="text-[#aacd61]">Q</span> BENCH
                  </h5>
                  <span className="text-[6.5px] font-sans text-white/45 tracking-widest block uppercase leading-none">Unlimited Resources</span>
                </div>
                
                {/* Smartphone content graphic dots */}
                <div className="space-y-2.5 my-auto">
                  
                  <div className="bg-white/10 rounded-lg p-2 border border-white/5 space-y-1">
                    <div className="h-1 w-8 bg-[#45b88a] rounded" />
                    <h6 className="text-[8.5px] font-display font-bold">Visibility Metrics</h6>
                    <span className="text-[11px] font-mono text-emerald-400 font-extrabold leading-none">320%</span>
                  </div>

                  <ul className="text-[8px] space-y-1.5 text-white/85 font-display font-medium pl-1">
                    <li className="flex items-center gap-1">
                      <Check className="h-2 w-2 text-emerald-300 shrink-0" />
                      <span>Increase Visibility</span>
                    </li>
                    <li className="flex items-center gap-1">
                      <Check className="h-2 w-2 text-emerald-300 shrink-0" />
                      <span>Generate Leads</span>
                    </li>
                    <li className="flex items-center gap-1">
                      <Check className="h-2 w-2 text-emerald-300 shrink-0" />
                      <span>Drive Growth</span>
                    </li>
                  </ul>
                </div>
                
                {/* Smartphone footer lockup */}
                <div className="bg-[#45b88a] rounded-lg p-1 text-center select-none cursor-pointer">
                  <span className="text-[7.5px] font-display font-semibold text-slate-900 block leading-none">Start Now</span>
                </div>
              </div>
            </div>
            
          </div>
          
        </div>
      </section>

      {/* 2. WHAT WE DO (OUR SERVICES) SECTION */}
      <section id="what-we-do-block" className="bg-white border-y border-brand-outline/20 py-20 px-6 lg:px-12">
        <div className="mx-auto max-w-7xl">
          
          <div className="space-y-3.5 text-center max-w-3xl mx-auto mb-16">
            <span className="font-tech text-[10px] tracking-widest text-[#00685b] font-extrabold uppercase bg-[#00685b]/10 px-3 py-1 rounded-full inline-block">
              OUR SERVICES
            </span>
            <h2 id="services-title" className="font-display text-4xl sm:text-5xl font-black text-brand-text tracking-tight">
              What I Create
            </h2>
            <p className="font-sans text-sm sm:text-base text-brand-text-muted leading-relaxed">
              Creative solutions crafted with purpose, combining design, technology, and visual storytelling.
            </p>
          </div>
          
          {/* Services Box Grid (Interactive) */}
          <div id="services-interactive-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {servicesList.map((srv) => {
              return (
                <div
                  id={`srv-block-${srv.id}`}
                  key={srv.id}
                  onClick={() => onNavigate('services', srv.id)}
                  className="group bg-[#faf9f9]/50 border border-brand-outline/15 rounded-2xl p-6 transition-all duration-300 hover:bg-white hover:border-[#00685b]/35 hover:-translate-y-1 hover:shadow-md cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <span className="h-12 w-12 bg-[#00685b]/5 text-2xl rounded-xl flex items-center justify-center w-fit transition-all group-hover:scale-110">
                      {srv.emoji}
                    </span>
                    <h4 className="font-display text-base font-bold text-brand-text tracking-tight">{srv.title}</h4>
                    <p className="font-sans text-xs text-brand-text-muted leading-relaxed">{srv.desc}</p>
                  </div>
                  
                  <div className="flex items-center text-[#00685b] text-[10px] font-tech font-bold uppercase tracking-wider pt-5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-4px] group-hover:translate-x-0">
                    <span>View Work</span>
                    <ChevronRight className="h-3 w-3 ml-0.5" />
                  </div>
                </div>
              );
            })}
          </div>
          
        </div>
      </section>

      {/* 3. OUR PROCESS SECTION */}
      <section id="our-process-block" className="mx-auto max-w-7xl px-6 py-20 lg:px-12">
        <div className="space-y-12">
          
          <div className="space-y-3.5 text-center max-w-2xl mx-auto">
            <span className="font-tech text-[10px] tracking-widest text-[#00685b] font-extrabold uppercase bg-[#00685b]/10 px-3 py-1 rounded-full inline-block">
              OUR PROCESS
            </span>
            <h2 id="process-title" className="font-display text-3xl sm:text-4xl font-black text-brand-text tracking-tight">
              How We Help Businesses Grow
            </h2>
          </div>
          
          {/* Horizontal connecting process graphics */}
          <div id="process-timeline" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            
            {/* Dashed Connecting Line in background (Desktop view only) */}
            <div className="absolute top-[35px] left-[10%] right-[10%] h-[1px] border-t-2 border-dashed border-brand-outline/25 z-0 hidden lg:block" />
            
            {processSteps.map((step, idx) => (
              <div 
                id={`process-step-${idx}`}
                key={step.num}
                className="relative z-10 flex flex-col items-center text-center space-y-4 group"
              >
                {/* Hover animation trigger circle */}
                <div className="h-16 w-16 rounded-full bg-[#faf9f9] border border-brand-outline/25 text-[#00685b] font-display text-lg font-black flex items-center justify-center shadow-xs group-hover:bg-[#00685b] group-hover:text-white group-hover:border-[#00685b] transition-all duration-300">
                  {step.num}
                </div>
                
                <h4 className="font-display text-sm font-bold text-brand-text uppercase tracking-wider">{step.num}. {step.title}</h4>
                <p className="font-sans text-[11px] sm:text-xs text-brand-text-muted leading-relaxed max-w-[210px]">{step.desc}</p>
              </div>
            ))}
          </div>
          
        </div>
      </section>

      {/* 4. RECENT PROJECTS SECTION */}
      <section id="recent-projects-block" className="bg-brand-surface-low/50 border-t border-brand-outline/20 py-20 px-6 lg:px-12">
        <div className="mx-auto max-w-7xl">
          
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div className="space-y-3.5">
              <span className="font-tech text-[10px] tracking-widest text-[#00685b] font-extrabold uppercase bg-[#00685b]/10 px-3 py-1 rounded-full inline-block">
                RECENT PROJECTS
              </span>
              <h2 id="projects-title" className="font-display text-3xl sm:text-4xl font-black text-brand-text tracking-tight">
                Our Latest Work
              </h2>
            </div>
            
            <button
              id="projects-top-action"
              onClick={() => onNavigate('portfolio')}
              className="text-xs font-tech font-bold text-[#00685b] hover:text-[#178373] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>View All Portfolio</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          
          {/* Projects Visual Cards Row */}
          <div id="projects-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestProjects.map((proj) => {
              const cardContent = (
                <>
                  {/* Card Top Image View */}
                  <div className="aspect-[4/3] overflow-hidden bg-brand-surface relative select-none">
                    <img
                      src={proj.imageUrl}
                      alt={proj.title}
                      className="w-full h-full object-cover filter brightness-[0.98] saturate-[0.95] group-hover:scale-102 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>
                  
                  {/* Card Descriptions text fields */}
                  <div className="p-4 space-y-1 border-t border-brand-outline/10">
                    <h4 className="font-display text-sm font-bold text-brand-text group-hover:text-[#00685b] transition-colors duration-200">
                      {proj.title}
                    </h4>
                    <p className="font-sans text-[10.5px] text-brand-text-muted leading-tight">
                      {proj.category}
                    </p>
                  </div>
                </>
              );

              return proj.externalUrl ? (
                <a
                  id={`project-card-${proj.id}`}
                  key={proj.id}
                  href={proj.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white border border-brand-outline/15 rounded-2xl overflow-hidden group shadow-xs hover:shadow-md hover:border-[#00685b]/20 transition-all duration-300 block cursor-pointer"
                >
                  {cardContent}
                </a>
              ) : (
                <div 
                  id={`project-card-${proj.id}`}
                  key={proj.id}
                  onClick={() => onNavigate('portfolio')}
                  className="bg-white border border-brand-outline/15 rounded-2xl overflow-hidden group shadow-xs hover:shadow-md hover:border-[#00685b]/20 transition-all duration-300 cursor-pointer"
                >
                  {cardContent}
                </div>
              );
            })}
            
            {/* View Full Portfolio Box (Final Block space in the row) */}
            <div 
              id="view-portfolio-fallback-block"
              onClick={() => onNavigate('portfolio')}
              className="bg-white border border-brand-outline/20 rounded-2xl p-6 flex flex-col justify-between hover:border-[#00685b]/45 hover:shadow-md transition-all duration-300 cursor-pointer text-left md:col-span-2 lg:col-span-1"
            >
              <div className="space-y-3.5">
                <span className="p-2 bg-[#00685b]/5 text-[#00685b] rounded outline-none h-fit w-fit flex items-center justify-center">
                  <Award className="h-5 w-5" />
                </span>
                <h4 className="font-display text-base font-bold text-brand-text tracking-tight">View Full Portfolio</h4>
                <p className="font-sans text-xs text-brand-text-muted leading-relaxed">
                  See more of our work and success stories in building modern entities.
                </p>
              </div>
              
              <div className="border-t border-brand-outline/10 pt-4 mt-6">
                <span className="font-display text-xs font-bold text-[#00685b] hover:text-[#178373] transition-colors flex items-center gap-1">
                  <span>View Portfolio</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* 5. GET STARTED TODAY (FREE AUDIT FORM & GRAPHIC) */}
      <section id="visibility-audit-block" className="bg-[#002f29] text-white py-20 px-6 lg:px-12 relative overflow-hidden select-none">
        
        {/* Subtle Decorative Ambient Glows */}
        <div className="absolute top-[-100px] left-[-100px] w-96 h-96 rounded-full bg-[#00685b]/20 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 rounded-full bg-[#45b88a]/10 blur-[120px] pointer-events-none" />
        
        <div className="mx-auto max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left informational segment */}
            <div className="lg:col-span-12 xl:col-span-5 space-y-6">
              <span className="font-tech text-[10px] tracking-widest text-[#88f8c5] font-extrabold uppercase bg-white/10 px-3 py-1 rounded-full inline-block">
                GET STARTED TODAY
              </span>
              <h2 id="audit-title" className="font-display text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight">
                Free Brand Visibility Audit
              </h2>
              <p className="font-sans text-sm text-white/70 leading-relaxed max-w-xl">
                Get a detailed review of your brand's online presence and growth opportunities. Our specialists will audit your platforms and send insights direct to your inbox.
              </p>
              
              {/* Bullets mapping */}
              <div id="audit-checklist" className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-[#88f8c5] shrink-0" />
                  <span className="font-sans text-xs font-semibold text-white/95">Branding Review</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-[#88f8c5] shrink-0" />
                  <span className="font-sans text-xs font-semibold text-white/95">Website Review</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-[#88f8c5] shrink-0" />
                  <span className="font-sans text-xs font-semibold text-white/95">Social Media Review</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-[#88f8c5] shrink-0" />
                  <span className="font-sans text-xs font-semibold text-white/95">Growth Recommendations</span>
                </div>
              </div>
            </div>
            
            {/* Right Form Segment */}
            <div className="lg:col-span-12 xl:col-span-7">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 max-w-2xl lg:ml-auto">
                
                {formState === 'success' ? (
                  <div className="text-center py-10 space-y-4 animate-fade-in">
                    <span className="h-16 w-16 bg-[#88f8c5]/15 text-[#88f8c5] rounded-full flex items-center justify-center mx-auto text-3xl animate-bounce">
                      ✓
                    </span>
                    <h4 className="font-display text-xl font-bold">Audit Requested Successfully!</h4>
                    <p className="font-sans text-xs text-white/70 max-w-md mx-auto leading-relaxed">
                      Thank you! Your enquiry has been received. We'll contact you shortly.
                    </p>
                    <button 
                      onClick={() => {
                        setFormData({
                          fullName: '',
                          businessName: '',
                          phoneNumber: '',
                          emailAddress: '',
                          websiteUrl: ''
                        });
                        setFormState('idle');
                      }}
                      className="text-xs font-tech text-[#88f8c5] hover:underline pt-2 block mx-auto cursor-pointer"
                    >
                      Click to register another audit
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    
                    {/* Security Spam Protection - Honeypot Field */}
                    <div className="absolute top-0 left-0 w-0 h-0 overflow-hidden pointer-events-none opacity-0" aria-hidden="true">
                      <input 
                        type="text" 
                        name="website_dummy_spambot" 
                        tabIndex={-1} 
                        value={honeypot} 
                        onChange={(e) => setHoneypot(e.target.value)}
                        placeholder="Do not fill this if you are human" 
                      />
                    </div>

                    {formError && (
                      <div className="p-3.5 bg-red-500/15 border border-red-500/30 text-red-100 text-xs rounded-xl flex items-start gap-2.5">
                        <span className="text-sm shrink-0">⚠️</span>
                        <div className="space-y-0.5 text-left">
                          <p className="font-bold">Submission Error</p>
                          <p className="text-red-200 leading-relaxed">{formError}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Two Column Grid Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-tech text-white/60 uppercase font-bold tracking-wider">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.fullName}
                          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                          placeholder="Your full name"
                          className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#88f8c5] transition-colors"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-tech text-white/60 uppercase font-bold tracking-wider">Business Name</label>
                        <input
                          type="text"
                          value={formData.businessName}
                          onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                          placeholder="Name of your enterprise"
                          className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#88f8c5] transition-colors"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-tech text-white/60 uppercase font-bold tracking-wider">Phone Number *</label>
                        <input
                          type="tel"
                          required
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                          placeholder="Include area code"
                          className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#88f8c5] transition-colors"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-tech text-white/60 uppercase font-bold tracking-wider">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={formData.emailAddress}
                          onChange={(e) => setFormData({...formData, emailAddress: e.target.value})}
                          placeholder="name@business.com"
                          className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#88f8c5] transition-colors"
                        />
                      </div>
                      
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-tech text-white/60 uppercase font-bold tracking-wider">Website / Instagram URL (Optional)</label>
                      <input
                        type="url"
                        value={formData.websiteUrl}
                        onChange={(e) => setFormData({...formData, websiteUrl: e.target.value})}
                        placeholder="https://example.com"
                        className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#88f8c5] transition-colors"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={formState === 'submitting'}
                      className="w-full rounded-xl bg-[#00685b] hover:bg-[#178373] disabled:opacity-60 disabled:cursor-not-allowed text-white py-3.5 font-display text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer mt-4"
                    >
                      {formState === 'submitting' ? (
                        <>
                          <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          <span>Submitting Enquiry...</span>
                        </>
                      ) : (
                        <>
                          <span>Book My Free Audit</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                    
                  </form>
                )}
                
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* 6. WHY CHOOSE Q BENCH & FOUNDER STATEMENT SECTION */}
      <section id="why-choose-block" className="mx-auto max-w-7xl px-6 py-20 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Grid: 4 boxes */}
          <div className="lg:col-span-7 space-y-10">
            <div className="space-y-3.5">
              <span className="font-tech text-[10px] tracking-widest text-[#00685b] font-extrabold uppercase bg-[#00685b]/10 px-3 py-1 rounded-full inline-block">
                WHY CHOOSE Q BENCH?
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-black text-brand-text tracking-tight">
                Why Choose Us
              </h2>
              <p className="font-sans text-sm text-brand-text-muted leading-relaxed max-w-xl">
                We are a Kerala-based branding and creative agency helping startups and businesses grow.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {whyChooseItems.map((item, idx) => (
                <div 
                  id={`why-box-${idx}`}
                  key={idx} 
                  className="bg-white border border-brand-outline/15 rounded-2xl p-5 space-y-2.5 transition-all duration-300 hover:border-[#00685b]/25 shadow-xs"
                >
                  <span className="h-7 w-7 rounded-full bg-[#00685b]/5 text-[#00685b] font-display text-xs font-black flex items-center justify-center">
                    0{idx+1}
                  </span>
                  <h4 className="font-display text-sm font-bold text-brand-text tracking-tight">{item.title}</h4>
                  <p className="font-sans text-xs text-brand-text-muted leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right card: Meet Akhil Founder portrait */}
          <div className="lg:col-span-5">
            <div className="bg-[#faf9f9] border border-brand-outline/25 rounded-2xl p-6 sm:p-8 space-y-6 relative hover:shadow-md transition-shadow">
              
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full border border-[#00685b]/30 bg-[#00685b]/5 flex items-center justify-center shrink-0">
                  <span className="font-display font-black text-2xl text-[#00685b] select-none">
                    Q
                  </span>
                </div>
                <div>
                  <h4 className="font-display text-base font-bold text-brand-text">Meet Akhil</h4>
                  <span className="font-tech text-[10px] text-[#00685b] font-extrabold uppercase tracking-wider block">Founder & Creative Lead, Q BENCH</span>
                </div>
              </div>
              
              <blockquote className="font-sans text-xs sm:text-sm text-brand-text-variant italic leading-relaxed border-l-2 border-[#00685b] pl-4">
                "I believe great design is more than aesthetics—it's about solving problems, telling stories, and creating meaningful experiences. Every project is an opportunity to turn ideas into thoughtful, impactful work."
              </blockquote>
              
              <div className="pt-4 border-t border-brand-outline/15 text-left">
                <a
                  id="founder-linkedin-link"
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-xs font-tech font-bold text-brand-text hover:text-[#00685b] transition-colors"
                >
                  <Linkedin className="h-4 w-4 text-[#00685b]" />
                  <span>Connect on LinkedIn</span>
                </a>
              </div>
              
            </div>
          </div>
          
        </div>
      </section>

    </div>
  );
}
