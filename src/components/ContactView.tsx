import { useState, FormEvent, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Globe, 
  ArrowRight, 
  MessageSquare, 
  Headphones, 
  Send,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  MessageCircle,
  Instagram,
  Search,
  Trash2,
  Download,
  Lock,
  Unlock,
  RefreshCw,
  FileSpreadsheet,
  Activity,
  Filter,
  Layers,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { NavSection, ServiceTab } from '../types';
import { sendEmailJS, formatSupabaseError } from '../lib/emailService';
import { useProjects } from '../hooks/useProjects';
import { useAuth } from '../hooks/useAuth';

interface ContactViewProps {
  onNavigate?: (section: NavSection, tab?: ServiceTab) => void;
}

export default function ContactView({ onNavigate }: ContactViewProps) {
  const { settings } = useProjects('public');
  const { isAdmin } = useAuth();
  // Load selected package from local storage
  const [selectedPackage, setSelectedPackage] = useState<any>(() => {
    try {
      const stored = localStorage.getItem('qbench_selected_package');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Load selected portfolio blueprint from local storage
  const [selectedBlueprint, setSelectedBlueprint] = useState<any>(() => {
    try {
      const stored = localStorage.getItem('qbench_selected_portfolio_blueprint');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Load free consultation from local storage
  const [freeConsultation, setFreeConsultation] = useState<any>(() => {
    try {
      const stored = localStorage.getItem('qbench_free_consultation_request');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [additionalMessage, setAdditionalMessage] = useState('');

  const handleClearPackage = () => {
    localStorage.removeItem('qbench_selected_package');
    localStorage.removeItem('qbench_prefilled_message');
    localStorage.removeItem('qbench_prefilled_budget');
    setSelectedPackage(null);
    setFormData(prev => ({
      ...prev,
      service: 'Branding',
      message: ''
    }));
  };

  const handleClearBlueprint = () => {
    localStorage.removeItem('qbench_selected_portfolio_blueprint');
    setSelectedBlueprint(null);
    setFormData(prev => ({
      ...prev,
      service: 'Branding',
      message: ''
    }));
    setAdditionalMessage('');
  };

  const handleClearConsultation = () => {
    localStorage.removeItem('qbench_free_consultation_request');
    setFreeConsultation(null);
    setFormData(prev => ({
      ...prev,
      service: 'Branding',
      message: ''
    }));
  };

  // Form State using the exact keys requested for EmailJS + Supabase project_inquiries
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    service: 'Branding', // Default service option
    budget: '',
    timeline: '',
    projectDescription: '',
    referenceUrl: '',
    message: ''
  });

  useEffect(() => {
    if (freeConsultation) {
      setFormData(prev => ({
        ...prev,
        service: 'Free Consultation',
        message: 'Hello, I would like to book a free consultation regarding this project/service. Please contact me to discuss my requirements and provide more information about the available options.'
      }));
    } else if (selectedBlueprint) {
      const autoMessage = `Hi Q BENCH team! I am highly interested in inquiring for a blueprint similar to your project "${selectedBlueprint.projectName}".\n\n` +
        `- Project Name: ${selectedBlueprint.projectName}\n` +
        `- Reference Number: ${selectedBlueprint.portfolioReference}\n` +
        `- Design Type: ${selectedBlueprint.designType}\n` +
        `- Service Category: ${selectedBlueprint.projectCategory}\n` +
        `- Estimated Budget Range: ${selectedBlueprint.estimatedBudget}\n` +
        `- Project URL: ${selectedBlueprint.projectUrl}\n\n` +
        `Please share the modular structural files and design guide. Thank you!`;

      setFormData(prev => ({
        ...prev,
        service: selectedBlueprint.projectCategory || 'Other',
        message: autoMessage
      }));
    } else if (selectedPackage) {
      const optionsInfo = selectedPackage.addonsOrOptions && selectedPackage.addonsOrOptions.length > 0
        ? `\n\nOptions & Configurations Specified:\n${selectedPackage.addonsOrOptions.map((opt: string) => `- ${opt}`).join('\n')}`
        : '';
        
      const autoMessage = `Hi Q BENCH team! I would like to book the following service package:\n\n` +
        `- Selected Package: ${selectedPackage.packageName}\n` +
        `- Package ID: ${selectedPackage.packageId}\n` +
        `- Price Quote: ${selectedPackage.packagePrice}\n` +
        `- Estimated Delivery: ${selectedPackage.duration}${optionsInfo}\n\n` +
        `Kindly coordinate my onboarding details and launch files. Thank you!`;
      
      setFormData(prev => ({
        ...prev,
        service: selectedPackage.packageCategory || 'Other',
        message: autoMessage
      }));
    } else {
      const savedMsg = localStorage.getItem('qbench_prefilled_message');
      const savedBudget = localStorage.getItem('qbench_prefilled_budget');
      let combinedText = '';
      if (savedMsg) combinedText += savedMsg;
      if (savedBudget) combinedText += `\n\n[Budget Consideration]: ${savedBudget}`;
      
      if (combinedText) {
        setFormData(prev => ({
          ...prev,
          message: combinedText
        }));
      }
    }
  }, [selectedPackage, selectedBlueprint, freeConsultation]);
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [formError, setFormError] = useState<string | null>(null);
  const [formErrorMeta, setFormErrorMeta] = useState<{
    code?: string;
    details?: string;
    hint?: string;
  } | null>(null);
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
    message?: string;
  }>({});
  const [submissionDelivery, setSubmissionDelivery] = useState<{
    smtpConfigured: boolean;
    smtpSuccess: boolean;
    adminEmailSuccess?: boolean;
    customerEmailSuccess?: boolean;
    emailDelivery?: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'SKIPPED';
    message?: string;
    error?: string;
    advice?: string;
  } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Auto-dismiss the floating toast notification after 8 seconds
  useEffect(() => {
    if (!showSuccessToast) return;
    const timer = setTimeout(() => {
      setShowSuccessToast(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, [showSuccessToast]);

  // Anti-spam honeypot protection field & double-click submission lock
  const [honeypot, setHoneypot] = useState('');
  const [lastSubmittedSnapshot, setLastSubmittedSnapshot] = useState<typeof formData | null>(null);
  const isSubmittingRef = useRef(false);

  // Construct pre-filled WhatsApp conversation URL dynamically with submitted form inputs
  const constructWhatsAppUrl = () => {
    const baseUrl = "https://wa.me/917356525932";
    const source = lastSubmittedSnapshot || formData;
    const { name, company, phone, email, service, message } = source;
    
    const text = `Hello QBENCH Team,

I have submitted an enquiry through your website.

Name: ${name}
Company: ${company ? company : 'N/A'}
Phone: ${phone}
Email: ${email}
Service: ${service}

Message:
${message}`;

    return `${baseUrl}?text=${encodeURIComponent(text)}`;
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Prevent accidental duplicate submissions caused by double-clicking Submit
    if (isSubmittingRef.current || formState === 'submitting') {
      return;
    }

    // Spam protection check (Honeypot)
    if (honeypot.trim() !== '') {
      console.warn('Spam detected via Honeypot check.');
      setFormState('success'); // Pretend success to confuse bots
      return;
    }

    // Comprehensive client-side form validation
    const trimmedName = formData.name.trim();
    const trimmedPhone = formData.phone.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedCompany = (selectedBlueprint ? 'Portfolio Inquirer' : (freeConsultation ? 'Consultation Request' : formData.company)).trim();

    const newErrors: typeof errors = {};

    if (!trimmedName) {
      newErrors.name = "Please enter your name.";
    } else if (trimmedName.length < 2) {
      newErrors.name = "Name must be at least 2 characters.";
    }

    // Phone pattern allows standard local/international format with digits, dashes, spaces, brackets, or plus signs
    const phonePattern = /^\+?[0-9\s\-()]{7,20}$/;
    if (!trimmedPhone) {
      newErrors.phone = "Please enter your phone number.";
    } else if (!phonePattern.test(trimmedPhone)) {
      newErrors.phone = "Please enter a valid phone number (at least 7 digits, digits and standard symbols only).";
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      newErrors.email = "Please enter your email address.";
    } else if (!emailPattern.test(trimmedEmail)) {
      newErrors.email = "Please enter a valid email address.";
    }

    let finalMessage = formData.message;
    if (selectedBlueprint) {
      const extraNotes = additionalMessage.trim() ? `\n\nCustomer Message/Notes:\n"${additionalMessage}"` : '\n\nCustomer did not specify any optional notes.';
      finalMessage = `Hi Q BENCH team! I am highly interested in inquiring for a blueprint similar to your project "${selectedBlueprint.projectName}".\n\n` +
        `- Project Name: ${selectedBlueprint.projectName}\n` +
        `- Reference Number: ${selectedBlueprint.portfolioReference}\n` +
        `- Design Type: ${selectedBlueprint.designType}\n` +
        `- Service Category: ${selectedBlueprint.projectCategory}\n` +
        `- Estimated Budget Range: ${selectedBlueprint.estimatedBudget}\n` +
        `- Project URL: ${selectedBlueprint.projectUrl}${extraNotes}\n\n` +
        `Please share the modular structural files and design guide. Thank you!`;
    } else if (freeConsultation) {
      finalMessage = `Hi Q BENCH team! I would like to book a free consultation.\n\n` +
        `- Inquiry Type: Free Consultation\n` +
        `- Selected Service/Package/Project: ${freeConsultation.selectedItem || 'General Consulting'}\n` +
        `- Origin Page: ${freeConsultation.pageUrl || 'N/A'}\n` +
        `- Reference Number: ${freeConsultation.referenceId}\n\n` +
        `Message:\n"${formData.message}"`;
    } else if (selectedPackage && !finalMessage.trim()) {
      const optionsInfo =
        selectedPackage.addonsOrOptions && selectedPackage.addonsOrOptions.length > 0
          ? `\n\nOptions & Configurations Specified:\n${selectedPackage.addonsOrOptions.map((opt: string) => `- ${opt}`).join('\n')}`
          : '';
      finalMessage =
        `Hi Q BENCH team! I would like to book the following service package:\n\n` +
        `- Selected Package: ${selectedPackage.packageName}\n` +
        `- Package ID: ${selectedPackage.packageId}\n` +
        `- Price Quote: ${selectedPackage.packagePrice}\n` +
        `- Estimated Delivery: ${selectedPackage.duration}${optionsInfo}\n\n` +
        `Kindly coordinate my onboarding details and launch files. Thank you!`;
    }

    if (!selectedPackage && !selectedBlueprint && !finalMessage.trim()) {
      newErrors.message = "Please enter your message.";
    } else if (!selectedPackage && !selectedBlueprint && finalMessage.trim().length < 5) {
      newErrors.message = "Please describe your query in more detail (at least 5 characters).";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      console.error('QBENCH: Form validation FAILED', newErrors);
      return;
    }

    setErrors({}); // Reset previous validation states on successful check

    isSubmittingRef.current = true;
    setFormState('submitting');
    setFormError(null);
    setFormErrorMeta(null);

    const resolvedService = selectedPackage
      ? (selectedPackage.packageCategory || formData.service)
      : selectedBlueprint
        ? (selectedBlueprint.projectCategory || formData.service)
        : freeConsultation
          ? `Free Consultation (${freeConsultation.selectedItem || 'General'})`
          : formData.service;

    try {
      const responseData = await sendEmailJS({
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        company: trimmedCompany,
        service: resolvedService,
        budget: formData.budget.trim(),
        timeline: formData.timeline.trim(),
        project_description: formData.projectDescription.trim() || finalMessage,
        reference_url: formData.referenceUrl.trim(),
        message: finalMessage,
        selectedPackage,
        selectedBlueprint,
        freeConsultation
      });

      // Capture delivery status
      setSubmissionDelivery({
        smtpConfigured: responseData.smtpConfigured ?? true,
        smtpSuccess: responseData.smtpSuccess ?? true,
        adminEmailSuccess: responseData.adminEmailSuccess,
        customerEmailSuccess: responseData.customerEmailSuccess,
        emailDelivery: responseData.emailDelivery,
        message: responseData.message,
        error: responseData.error,
        advice: responseData.advice
      });

      // Save snapshot for WhatsApp CTA before clearing form inputs
      setLastSubmittedSnapshot({
        name: trimmedName,
        phone: trimmedPhone,
        email: trimmedEmail,
        company: trimmedCompany,
        service: resolvedService,
        budget: formData.budget.trim(),
        timeline: formData.timeline.trim(),
        projectDescription: formData.projectDescription.trim(),
        referenceUrl: formData.referenceUrl.trim(),
        message: finalMessage
      });

      setFormState('success');
      setShowSuccessModal(true);
      setShowSuccessToast(true);
      // Clear selected package & blueprint local state & storage once successfully submitted
      localStorage.removeItem('qbench_selected_package');
      localStorage.removeItem('qbench_selected_portfolio_blueprint');
      localStorage.removeItem('qbench_free_consultation_request');
      localStorage.removeItem('qbench_prefilled_message');
      localStorage.removeItem('qbench_prefilled_budget');
      setSelectedPackage(null);
      setSelectedBlueprint(null);
      setFreeConsultation(null);
      setAdditionalMessage('');
      
      // Reset form inputs & clear errors only after successful submission
      setFormData({
        name: '',
        phone: '',
        email: '',
        company: '',
        service: 'Branding',
        budget: '',
        timeline: '',
        projectDescription: '',
        referenceUrl: '',
        message: ''
      });
      setErrors({});
    } catch (error) {
      const parsedErr = formatSupabaseError(error);
      console.error('[QBENCH Enquiry Submission Error]:', {
        message: parsedErr.message,
        code: parsedErr.code,
        details: parsedErr.details,
        hint: parsedErr.hint,
      });
      setFormError(parsedErr.message);
      setFormErrorMeta({
        code: parsedErr.code,
        details: parsedErr.details,
        hint: parsedErr.hint,
      });
      setFormState('idle');
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const waClean = (settings.whatsapp || '917356525932').replace(/[^0-9]/g, '');
  const contactInfos = [
    {
      icon: Mail,
      title: 'Email Address',
      desc: settings.email || 'contact@qbench.in',
      subDesc: 'Click to compose email directly',
      link: `mailto:${settings.email || 'contact@qbench.in'}?subject=Inquiry%20from%20QBENCH%20Website&body=Hello%20QBENCH%20Team%2C%0A%0AI%20would%20like%20to%20know%20more%20about%20your%20services.%0A%0ARegards%2C`,
      ariaLabel: `Draft email to QBENCH at ${settings.email || 'contact@qbench.in'}`,
      colorClass: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
    },
    {
      icon: Phone,
      title: 'Phone Number',
      desc: settings.phone || '+91 7356525932',
      subDesc: 'Click to initiate standard voice call',
      link: `tel:${(settings.phone || '+917356525932').replace(/\s+/g, '')}`,
      ariaLabel: `Place phone call to QBENCH support team at ${settings.phone || '+91 73565 25932'}`,
      colorClass: 'text-teal-600 bg-teal-500/10 border-teal-500/20 hover:bg-teal-500/20'
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp Chat',
      desc: settings.phone || '+91 7356525932',
      subDesc: 'Click to start conversation instantly',
      link: `https://wa.me/${waClean}?text=Hello%20QBENCH%20Team%2C%20I%20would%20like%20to%20know%20more%20about%20your%20services.`,
      ariaLabel: 'Start live WhatsApp chat with QBENCH representatives',
      colorClass: 'text-green-600 bg-green-500/10 border-green-500/20 hover:bg-green-500/20'
    },
    {
      icon: Instagram,
      title: 'Instagram Profile',
      desc: '@qbench_official',
      subDesc: 'Follow or reach out on Instagram',
      link: settings.instagram_url || 'https://www.instagram.com/qbench_official?igsh=MXdscDgwMHFzd2d1aA==',
      ariaLabel: 'Visit our official Instagram profile at @qbench_official',
      colorClass: 'text-pink-600 bg-pink-500/10 border-pink-500/20 hover:bg-pink-500/20'
    },
    {
      icon: MapPin,
      title: 'Office Location',
      desc: 'Kochi, Kerala, India',
      subDesc: 'Click to navigate with Google Maps',
      link: 'https://www.google.com/maps/search/?api=1&query=QBENCH+Kochi+Kerala+India',
      ariaLabel: 'Open maps representation for QBENCH headquarters in Kochi, Kerala, India on Google Maps',
      colorClass: 'text-[#00685b] bg-[#00685b]/5 border-[#00685b]/20 hover:bg-[#00685b]/10'
    },
    {
      icon: Globe,
      title: 'Official Website',
      desc: (settings.website_url || 'www.qbench.in').replace(/^https?:\/\//, ''),
      subDesc: 'Click to check out our company homepage',
      link: settings.website_url || 'https://www.qbench.in',
      ariaLabel: 'Visit official company website',
      colorClass: 'text-teal-700 bg-teal-500/10 border-teal-500/20 hover:bg-teal-500/20'
    },
    {
      icon: Clock,
      title: 'Working Hours',
      desc: 'Mon - Sat: 9:30 AM - 6:30 PM',
      subDesc: 'Sunday: Closed',
      ariaLabel: 'QBENCH standard operational timing details',
      colorClass: 'text-[#002f29] bg-[#002f29]/15 border-[#002f29]/10'
    }
  ];

  const handleCtaClick = () => {
    // Scroll down to message form section
    const elem = document.getElementById('message-form-segment');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div id="contact-view-page" className="w-full">
      
      {/* 1. HERO HEADER BANER SECTION (DARK GREEN) */}
      <section id="contact-hero-banner" className="bg-[#05211c] text-white py-16 sm:py-20 px-6 lg:px-12 relative overflow-hidden select-none">
        
        {/* Soft background ambient gradient */}
        <div className="absolute top-[-150px] right-[-150px] w-[500px] h-[500px] rounded-full bg-[#00685b]/20 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[-100px] left-[-100px] w-96 h-96 rounded-full bg-[#45b88a]/5 blur-[100px] pointer-events-none" />
        
        <div className="mx-auto max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left informational segment */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8">
              <span id="contact-badge" className="font-tech text-xs tracking-widest text-[#88f8c5] font-extrabold uppercase bg-white/10 px-3.5 py-1 rounded-full inline-block">
                GET IN TOUCH
              </span>
              
              <h1 id="contact-hero-title" className="font-display text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight text-white">
                Let's Build Something <br className="hidden sm:block" />
                <span className="text-[#88f8c5]">Amazing Together.</span>
              </h1>
              
              <p id="contact-hero-subtitle" className="font-sans text-sm sm:text-base text-white/70 leading-relaxed max-w-xl">
                Have a project in mind or want to discuss how we can help your business grow? We'd love to hear from you.
              </p>
              
              {/* Bottom bullets layouts */}
              <div id="response-features" className="space-y-4 pt-4 border-t border-white/10 max-w-md">
                
                <div className="flex items-start space-x-3.5 group">
                  <div className="p-2.5 bg-white/10 text-[#88f8c5] rounded-xl flex items-center justify-center shrink-0">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-bold text-white transition-colors duration-200">Quick Response</h4>
                    <p className="font-sans text-xs text-white/60">We reply within 24 hours.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5 group">
                  <div className="p-2.5 bg-white/10 text-[#88f8c5] rounded-xl flex items-center justify-center shrink-0">
                    <Headphones className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-bold text-white transition-colors duration-200">Friendly Support</h4>
                    <p className="font-sans text-xs text-white/60">We are here to help you grow.</p>
                  </div>
                </div>

              </div>
            </div>
            
            {/* Right overlapping banner container (Promo card) */}
            <div className="lg:col-span-5">
              <div 
                id="contact-promo-box" 
                className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 relative hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.01] overflow-hidden"
              >
                {/* Decorative image background placeholder - generic abstract office overlay */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=5')] opacity-5 bg-cover bg-center pointer-events-none" />
                
                <div className="h-10 w-10 bg-[#88f8c5]/15 text-[#88f8c5] rounded-xl flex items-center justify-center relative z-10 shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
                
                <div className="space-y-2 relative z-10">
                  <h3 className="font-display text-lg sm:text-xl font-bold tracking-tight">
                    Ready to Grow Your Business?
                  </h3>
                  <p className="font-sans text-xs sm:text-sm text-white/75 leading-relaxed">
                    Let's create powerful strategies that increase visibility, generate leads, and drive growth.
                  </p>
                </div>
                
                <button
                  onClick={handleCtaClick}
                  className="w-full rounded-xl bg-[#00685b] hover:bg-[#178373] text-white py-3.5 font-display text-xs font-bold uppercase tracking-wider transition-colors duration-300 relative z-10 cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                >
                  <span>Start a Project</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* 2. CONTACT INFORMATION & FORM (WHITE BACKGROUND ROW) */}
      <section id="contact-workspace" className="bg-[#ffffff] py-20 px-6 lg:px-12 border-b border-brand-outline/20">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left Column: Contact info cards */}
            <div id="contact-info-panel" className="lg:col-span-12 xl:col-span-5 space-y-8 lg:mb-8 xl:mb-0">
              
              <div className="space-y-3">
                <span className="font-mono text-[10px] tracking-wider text-[#00685b] font-extrabold uppercase bg-[#00685b]/5 px-3 py-1 rounded-full inline-block">
                  RAPID RESPONSE CHANNELS
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-black text-[#002f29] tracking-tight">
                  Contact Us Directly
                </h2>
                <p className="font-sans text-xs sm:text-sm text-brand-text-muted leading-relaxed">
                  Choose your preferred medium below. Our team is fully integrated across all communication systems to route your query instantly.
                </p>
              </div>
              
              {/* Vertical items map list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4 pt-2">
                {contactInfos.map((info, idx) => {
                  const InfoIcon = info.icon;
                  const isLink = !!info.link;
                  const Wrapper = isLink ? 'a' : 'div';
                  const wrapperProps = isLink ? {
                    href: info.link,
                    target: '_blank',
                    rel: 'noreferrer',
                    'aria-label': info.ariaLabel,
                    role: 'link'
                  } : {
                    'aria-label': info.ariaLabel,
                    role: 'text'
                  };
                  return (
                    <Wrapper 
                      id={`contact-info-item-${idx}`} 
                      key={idx} 
                      {...wrapperProps}
                      className={`flex items-start space-x-4 p-4 rounded-xl border transition-all duration-300 relative group overflow-hidden ${
                        isLink 
                          ? 'bg-gradient-to-br from-white to-[#faf9f9]/80 cursor-pointer shadow-[0_2px_12px_-3px_rgba(0,104,91,0.04)] hover:shadow-[0_8px_24px_-6px_rgba(0,104,91,0.1)] hover:scale-[1.02] transform border-brand-outline/15 hover:border-[#00685b]/40' 
                          : 'bg-[#faf9f9]/40 border-brand-outline/10'
                      }`}
                    >
                      {/* Decorative internal green gradient accent glow on hover */}
                      {isLink && (
                        <div className="absolute inset-0 bg-gradient-to-r from-[#00685b]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      )}
                      
                      <span className={`p-3 rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-all duration-300 ${info.colorClass} ${isLink ? 'group-hover:scale-110' : ''}`}>
                        <InfoIcon className="h-5 w-5" />
                      </span>
                      
                      <div className="space-y-0.5 relative z-10 w-full min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-display text-[9px] font-black uppercase tracking-wider text-brand-text-muted">
                            {info.title}
                          </h4>
                          {isLink && (
                            <span className="text-[8px] font-mono text-[#00685b] uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              Direct Action ⚡
                            </span>
                          )}
                        </div>
                        <p className={`font-sans text-xs sm:text-sm font-bold tracking-tight break-words truncate ${isLink ? 'text-[#002f29] group-hover:text-[#00685b] transition-colors' : 'text-brand-text'}`}>
                          {info.desc}
                        </p>
                        {info.subDesc && (
                          <p className={`font-sans text-[10px] mt-0.5 ${isLink ? 'text-[#00685b]/70 group-hover:text-[#00685b]' : 'text-brand-text-muted'}`}>
                            {info.subDesc}
                          </p>
                        )}
                      </div>
                    </Wrapper>
                  );
                })}
              </div>
              
            </div>
            
            {/* Right Column: Interaction form panel */}
            <div id="message-form-segment" className="lg:col-span-7">
              <div className="space-y-6">
                
                <div className="space-y-2.5">
                  {selectedPackage ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-[#00685b]/10 text-[#00685b] flex items-center justify-center text-xs font-bold font-mono">✓</span>
                        <span className="text-[10px] font-mono tracking-widest text-[#00685b] font-black uppercase">SEAMLESS SERVICE BOOKING</span>
                      </div>
                      <h3 className="font-display text-2xl sm:text-3xl font-black text-[#002f29] tracking-tight">
                        Complete Your Booking
                      </h3>
                      <p className="font-sans text-xs sm:text-sm text-brand-text-muted leading-relaxed">
                        Your selected package configuration is locked. Enter your contacts below to finalize your booking.
                      </p>
                    </>
                  ) : selectedBlueprint ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-[#00685b]/10 text-[#00685b] flex items-center justify-center text-xs font-bold font-mono">✦</span>
                        <span className="text-[10px] font-mono tracking-widest text-[#00685b] font-black uppercase">PORTFOLIO BLUEPRINT INQUIRY</span>
                      </div>
                      <h3 className="font-display text-2xl sm:text-3xl font-black text-[#002f29] tracking-tight">
                        Inquire for Similar Blueprint
                      </h3>
                      <p className="font-sans text-xs sm:text-sm text-brand-text-muted leading-relaxed">
                        The selected project specifications are loaded. Submit your details to finalize your design files request.
                      </p>
                    </>
                  ) : freeConsultation ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-[#00685b]/10 text-[#00685b] flex items-center justify-center text-xs font-bold font-mono">✦</span>
                        <span className="text-[10px] font-mono tracking-widest text-[#00685b] font-black uppercase">CONSULTATION REQUEST</span>
                      </div>
                      <h3 className="font-display text-2xl sm:text-3xl font-black text-[#002f29] tracking-tight">
                        Book Your Consultation
                      </h3>
                      <p className="font-sans text-xs sm:text-sm text-brand-text-muted leading-relaxed">
                        Your free consultation details are loaded. Fill out your details below to lock in your advisory session.
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="font-display text-xl sm:text-2xl font-black text-[#002f29] tracking-tight">
                        Send Us a Message
                      </h3>
                      <p className="font-sans text-xs sm:text-sm text-brand-text-muted leading-relaxed">
                        Fill out the form below and we'll get back to you as soon as possible.
                      </p>
                    </>
                  )}
                </div>

                {selectedPackage && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    id="selected-package-summary-card"
                    className="p-5 sm:p-6 bg-[#002f29]/5 border border-[#00685b]/30 rounded-2xl space-y-4 relative overflow-hidden"
                  >
                    {/* Visual pattern accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#00685b]/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex items-start justify-between border-b border-[#00685b]/10 pb-3">
                      <div>
                        <span className="text-[9px] font-mono text-[#00685b] font-black tracking-wider uppercase">Selected Service Package</span>
                        <h4 className="font-display text-md font-black text-[#002f29] mt-0.5">{selectedPackage.packageName}</h4>
                        <p className="font-sans text-[10px] text-brand-text-muted mt-0.5">Package ID: <span className="font-mono font-bold">{selectedPackage.packageId}</span></p>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearPackage}
                        className="text-[10px] font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer bg-red-100/60 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors border border-red-200/50 shrink-0"
                        title="Remove package and select another"
                      >
                        Change Package
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-brand-text-muted text-[10px] block font-mono">EST. TIMELINE</span>
                        <span className="font-bold text-[#002f29] font-sans">{selectedPackage.duration}</span>
                      </div>
                      <div>
                        <span className="text-brand-text-muted text-[10px] block font-mono">CATEGORY</span>
                        <span className="font-bold text-[#002f29] font-sans">{selectedPackage.packageCategory}</span>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-brand-text-muted text-[10px] block font-mono">RATE BASE</span>
                        <span className="font-bold text-[#00685b] font-sans">{selectedPackage.packagePrice}</span>
                      </div>
                    </div>

                    {selectedPackage.addonsOrOptions && selectedPackage.addonsOrOptions.length > 0 && (
                      <div className="border-t border-[#00685b]/10 pt-3 space-y-1.5 text-xs">
                        <span className="text-brand-text-muted text-[10px] block font-mono">ADDITIONAL OPTIONS & CONFIGURATIONS</span>
                        <ul className="space-y-1 pl-4 list-disc text-brand-text leading-relaxed">
                          {selectedPackage.addonsOrOptions.map((addon: string, idx: number) => (
                            <li key={idx} className="font-medium text-brand-text/95">{addon}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="border-t border-dashed border-[#00685b]/30 pt-4 flex items-center justify-between">
                      <div>
                        <span className="text-brand-text-muted text-[10px] block font-mono">TOTAL PROJECT VALUE / AMOUNT</span>
                        <span className="text-[11px] text-[#00685b] font-medium leading-none">Inclusive of standard resource allocation</span>
                      </div>
                      <span className="text-xl sm:text-2xl font-display font-black text-[#00685b]">{selectedPackage.totalAmount}</span>
                    </div>

                  </motion.div>
                )}

                {selectedBlueprint && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    id="selected-blueprint-summary-card"
                    className="p-5 sm:p-6 bg-[#00685b]/5 border border-[#00685b]/25 rounded-2xl space-y-4 relative overflow-hidden"
                  >
                    {/* Visual pattern accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#00685b]/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex items-start justify-between border-b border-[#00685b]/10 pb-3">
                      <div>
                        <span className="text-[9px] font-mono text-[#00685b] font-black tracking-wider uppercase">Interested In Portfolio Blueprint</span>
                        <h4 className="font-display text-base font-black text-[#002f29] mt-0.5">{selectedBlueprint.projectName}</h4>
                        <p className="font-sans text-[10px] text-brand-text-muted mt-0.5">Reference Number: <span className="font-mono font-bold text-[#00685b]">{selectedBlueprint.portfolioReference}</span></p>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearBlueprint}
                        className="text-[10px] font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer bg-red-100/60 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors border border-red-200/50 shrink-0"
                        title="Remove blueprint inquiry details"
                      >
                        Change Blueprint
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-brand-text-muted text-[10px] block font-mono">EST. BUDGET RANGE</span>
                        <span className="font-bold text-[#002f29] font-sans">{selectedBlueprint.estimatedBudget}</span>
                      </div>
                      <div>
                        <span className="text-brand-text-muted text-[10px] block font-mono">DESIGN TYPE</span>
                        <span className="font-bold text-[#002f29] font-sans leading-relaxed">{selectedBlueprint.designType}</span>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-brand-text-muted text-[10px] block font-mono">CATEGORY</span>
                        <span className="font-bold text-[#00685b] font-sans">{selectedBlueprint.projectCategory}</span>
                      </div>
                    </div>

                    <div className="border-t border-[#00685b]/10 pt-3 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-brand-text-muted text-[10px] block font-mono">SELECTED PROJECT URL</span>
                        <a 
                          href={selectedBlueprint.projectUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-[#00685b] hover:underline break-all block"
                        >
                          {selectedBlueprint.projectUrl}
                        </a>
                      </div>
                      <span className="text-[10px] font-bold text-white bg-[#00685b] px-2 py-0.5 rounded font-mono shrink-0 select-none align-middle inline-block w-fit">AUTO-FILLED</span>
                    </div>

                  </motion.div>
                )}

                {freeConsultation && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    id="selected-consultation-summary-card"
                    className="p-5 sm:p-6 bg-[#00685b]/5 border border-[#00685b]/25 rounded-2xl space-y-4 relative overflow-hidden"
                  >
                    {/* Visual pattern accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#00685b]/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex items-start justify-between border-b border-[#00685b]/10 pb-3">
                      <div>
                        <span className="text-[10px] font-mono text-[#00685b] font-black tracking-wider uppercase font-bold">Consultation Request</span>
                        <h4 className="font-display text-lg font-black text-[#002f29] mt-0.5">Free Consultation</h4>
                        <p className="font-sans text-[10px] text-brand-text-muted mt-0.5">Reference Number: <span className="font-mono font-bold text-[#00685b]">{freeConsultation.referenceId}</span></p>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearConsultation}
                        className="text-[10px] font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer bg-red-100/60 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors border border-red-200/50 shrink-0"
                        title="Remove consultation details"
                      >
                        Cancel Request
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pb-1">
                      <div>
                        <span className="text-brand-text-muted text-[10px] block font-mono">SELECTED FOCUS / TARGET</span>
                        <span className="font-bold text-[#002f29] font-sans text-sm">{freeConsultation.selectedItem}</span>
                      </div>
                      <div>
                        <span className="text-brand-text-muted text-[10px] block font-mono">SOURCE PAGE URL</span>
                        <a 
                          href={freeConsultation.pageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-[#00685b] hover:underline break-all block text-[11px] mt-0.5"
                        >
                          {freeConsultation.pageUrl}
                        </a>
                      </div>
                    </div>

                    <div className="border-t border-[#00685b]/10 pt-3 text-xs flex items-center justify-between">
                      <span className="text-brand-text-muted text-[10px] font-mono uppercase">INQUIRY TYPE</span>
                      <span className="text-[10px] font-bold text-white bg-[#00685b] px-2.5 py-0.5 rounded-full font-mono uppercase">Free Consultation</span>
                    </div>

                  </motion.div>
                )}

                <AnimatePresence mode="wait">
                  {formState === 'success' ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.96, y: 12 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: -12 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      id="form-success-alert"
                      className="bg-[#002f29]/5 border border-[#00685b]/25 rounded-2xl p-8 text-center space-y-5"
                    >
                      <motion.span
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ 
                          delay: 0.15, 
                          type: "spring", 
                          stiffness: 180, 
                          damping: 12 
                        }}
                        className="h-14 w-14 bg-[#00685b]/10 text-[#00685b] rounded-full flex items-center justify-center text-2xl mx-auto font-black font-mono"
                      >
                        ✓
                      </motion.span>
                      
                      <div className="space-y-2">
                        <motion.h4
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.25, duration: 0.35, ease: "easeOut" }}
                          className="font-display text-lg sm:text-xl font-bold text-[#002f29] tracking-tight"
                        >
                          ✓ Inquiry Received Successfully
                        </motion.h4>
                        
                        <motion.p
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.32, duration: 0.35, ease: "easeOut" }}
                          className="font-sans text-xs sm:text-sm text-brand-text-muted leading-relaxed max-w-md mx-auto"
                        >
                          {submissionDelivery?.message || 'Thank you! Your enquiry has been submitted successfully. We’ll get back to you shortly.'}
                        </motion.p>
                      </div>

                      {/* Prominent green WhatsApp CTA button */}
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="pt-2 max-w-sm mx-auto"
                      >
                        <a
                          href={constructWhatsAppUrl()}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full rounded-xl bg-gradient-to-r from-[#25D366] to-[#00685b] hover:from-[#20ba5a] hover:to-[#005c51] text-white px-6 py-4 font-display text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-[0_4px_14px_rgba(37,211,102,0.3)] hover:shadow-[0_6px_20px_rgba(0,104,91,0.4)] flex items-center justify-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                          title="Open instant WhatsApp chat with our support team"
                        >
                          <MessageCircle className="h-5 w-5 shrink-0" />
                          <span>Continue on WhatsApp</span>
                        </a>
                      </motion.div>
                      
                      <motion.button 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        onClick={() => {
                          setFormData({
                            name: '',
                            phone: '',
                            email: '',
                            company: '',
                            service: 'Branding',
                            budget: '',
                            timeline: '',
                            projectDescription: '',
                            referenceUrl: '',
                            message: ''
                          });
                          setFormState('idle');
                        }}
                        className="text-xs font-tech font-extrabold text-[#00685b] hover:underline pt-2 block mx-auto cursor-pointer"
                      >
                        Click to send another message
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      onSubmit={handleFormSubmit}
                      className="space-y-4"
                    >
                      
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
                        <div
                          role="alert"
                          className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-start gap-2.5"
                        >
                          <span className="text-sm shrink-0">⚠️</span>
                          <div className="space-y-1 min-w-0">
                            <p className="font-bold">
                              Enquiry Submission Error
                              {formErrorMeta?.code ? ` (Code: ${formErrorMeta.code})` : ''}
                            </p>
                            <p className="text-red-700/90 leading-relaxed break-words">
                              {formError}
                            </p>
                            {formErrorMeta?.details && (
                              <p className="text-[11px] font-mono text-red-700/80 break-words">
                                <strong>Details:</strong> {formErrorMeta.details}
                              </p>
                            )}
                            {formErrorMeta?.hint && (
                              <p className="text-[11px] text-red-700/85 leading-relaxed break-words">
                                <strong>Hint:</strong> {formErrorMeta.hint}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Name & Business grid */}
                      <div className={(selectedPackage || selectedBlueprint || freeConsultation) ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 sm:grid-cols-2 gap-4"}>
                        
                        <div className="space-y-1.5">
                          <label htmlFor="name" className="text-[10px] font-tech text-brand-text-muted uppercase font-bold tracking-wider">Full Name *</label>
                          <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => {
                              setFormData({...formData, name: e.target.value});
                              if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                            }}
                            placeholder="Your full name"
                            className={`w-full bg-[#faf9f9]/70 border rounded-xl px-4 py-2.5 text-xs text-brand-text placeholder-brand-text-muted/30 focus:outline-none focus:bg-white transition-all duration-200 ${
                              errors.name 
                                ? 'border-red-500 bg-red-50/10 focus:border-red-500 focus:ring-1 focus:ring-red-500/30' 
                                : 'border-brand-outline/25 focus:border-[#00685b]'
                            }`}
                          />
                          {errors.name && (
                            <p className="text-[11px] text-red-600 font-sans mt-1 flex items-center gap-1 animate-fade-in">
                              <span className="text-[12px]">⚠️</span> {errors.name}
                            </p>
                          )}
                        </div>
                        
                        {!selectedPackage && !selectedBlueprint && !freeConsultation && (
                          <div className="space-y-1.5">
                            <label htmlFor="company" className="text-[10px] font-tech text-brand-text-muted uppercase font-bold tracking-wider">Company Name</label>
                            <input
                              id="company"
                              name="company"
                              type="text"
                              value={formData.company}
                              onChange={(e) => setFormData({...formData, company: e.target.value})}
                              placeholder="Name of your company / enterprise"
                              className="w-full bg-[#faf9f9]/70 border border-brand-outline/25 rounded-xl px-4 py-2.5 text-xs text-brand-text placeholder-brand-text-muted/30 focus:outline-none focus:border-[#00685b] focus:bg-white transition-colors"
                            />
                          </div>
                        )}
                        
                      </div>
                      
                      {/* Phone & Email grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        <div className="space-y-1.5">
                          <label htmlFor="phone" className="text-[10px] font-tech text-brand-text-muted uppercase font-bold tracking-wider">Phone Number *</label>
                          <input
                            id="phone"
                            name="phone"
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => {
                              setFormData({...formData, phone: e.target.value});
                              if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }));
                            }}
                            placeholder="Include country code"
                            className={`w-full bg-[#faf9f9]/70 border rounded-xl px-4 py-2.5 text-xs text-brand-text placeholder-brand-text-muted/30 focus:outline-none focus:bg-white transition-all duration-200 ${
                              errors.phone 
                                ? 'border-red-500 bg-red-50/10 focus:border-red-500 focus:ring-1 focus:ring-red-500/30' 
                                : 'border-brand-outline/25 focus:border-[#00685b]'
                            }`}
                          />
                          {errors.phone && (
                            <p className="text-[11px] text-red-600 font-sans mt-1 flex items-center gap-1 animate-fade-in">
                              <span className="text-[12px]">⚠️</span> {errors.phone}
                            </p>
                          )}
                        </div>
                        
                        <div className="space-y-1.5">
                          <label htmlFor="email" className="text-[10px] font-tech text-brand-text-muted uppercase font-bold tracking-wider">Email Address *</label>
                          <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => {
                              setFormData({...formData, email: e.target.value});
                              if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                            }}
                            placeholder="name@company.com"
                            className={`w-full bg-[#faf9f9]/70 border rounded-xl px-4 py-2.5 text-xs text-brand-text placeholder-brand-text-muted/30 focus:outline-none focus:bg-white transition-all duration-200 ${
                              errors.email 
                                ? 'border-red-500 bg-red-50/10 focus:border-red-500 focus:ring-1 focus:ring-red-500/30' 
                                : 'border-brand-outline/25 focus:border-[#00685b]'
                            }`}
                          />
                          {errors.email && (
                            <p className="text-[11px] text-red-600 font-sans mt-1 flex items-center gap-1 animate-fade-in">
                              <span className="text-[12px]">⚠️</span> {errors.email}
                            </p>
                          )}
                        </div>
                        
                      </div>
                      
                      {/* Service Required Select */}
                      <div className="space-y-1.5">
                        <label htmlFor="service" className="text-[10px] font-tech text-brand-text-muted uppercase font-bold tracking-wider">Service Required *</label>
                        {selectedPackage ? (
                          <div className="w-full bg-[#00685b]/5 border border-[#00685b]/25 rounded-xl px-4 py-2.5 text-xs text-[#00685b] font-bold flex items-center justify-between">
                            <span>{selectedPackage.packageCategory || 'Linked Service'}</span>
                            <span className="text-[8px] font-bold text-white bg-[#00685b] px-2 py-0.5 rounded font-mono">LOCKED</span>
                          </div>
                        ) : selectedBlueprint ? (
                          <div className="w-full bg-[#00685b]/5 border border-[#00685b]/25 rounded-xl px-4 py-2.5 text-xs text-[#00685b] font-bold flex items-center justify-between">
                            <span>{selectedBlueprint.projectCategory || 'Linked Blueprint'}</span>
                            <span className="text-[8px] font-bold text-white bg-[#00685b] px-2 py-0.5 rounded font-mono">LOCKED</span>
                          </div>
                        ) : freeConsultation ? (
                          <div className="w-full bg-[#00685b]/5 border border-[#00685b]/25 rounded-xl px-4 py-2.5 text-xs text-[#00685b] font-bold flex items-center justify-between">
                            <span>Free Consultation Focus ({freeConsultation.selectedItem})</span>
                            <span className="text-[8px] font-bold text-white bg-[#00685b] px-2 py-0.5 rounded font-mono">LOCKED</span>
                          </div>
                        ) : (
                          <select
                            id="service"
                            name="service"
                            required
                            value={formData.service}
                            onChange={(e) => setFormData({...formData, service: e.target.value})}
                            className="w-full bg-[#faf9f9]/70 border border-brand-outline/25 rounded-xl px-4 py-2.5 text-xs text-brand-text focus:outline-none focus:border-[#00685b] focus:bg-white transition-colors appearance-none cursor-pointer"
                            style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2300685b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
                          >
                            <option value="Branding">Branding & Identity</option>
                            <option value="Social Media Design">Social Media Design</option>
                            <option value="Motion Graphics">Motion Graphics</option>
                            <option value="Video Editing">Video Editing</option>
                            <option value="Digital Marketing">Digital Marketing</option>
                            <option value="UI/UX Design">UI/UX Design</option>
                            <option value="Web Development">Web Development</option>
                            <option value="AI Creative Services">AI Creative Services</option>
                            <option value="Printing">Printing</option>
                            <option value="Business Support">Business Support</option>
                            <option value="Other">Other Inquiry</option>
                          </select>
                        )}
                      </div>

                      {/* Budget, Timeline & Reference/Website Grid */}
                      {!selectedPackage && !selectedBlueprint && !freeConsultation && (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label htmlFor="budget" className="text-[10px] font-tech text-brand-text-muted uppercase font-bold tracking-wider">Estimated Budget</label>
                              <input
                                id="budget"
                                name="budget"
                                type="text"
                                value={formData.budget}
                                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                placeholder="e.g. ₹25,000 – ₹75,000 / Flexible"
                                className="w-full bg-[#faf9f9]/70 border border-brand-outline/25 rounded-xl px-4 py-2.5 text-xs text-brand-text placeholder-brand-text-muted/30 focus:outline-none focus:border-[#00685b] focus:bg-white transition-colors"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label htmlFor="timeline" className="text-[10px] font-tech text-brand-text-muted uppercase font-bold tracking-wider">Project Timeline</label>
                              <input
                                id="timeline"
                                name="timeline"
                                type="text"
                                value={formData.timeline}
                                onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                                placeholder="e.g. 2–4 Weeks / Immediate"
                                className="w-full bg-[#faf9f9]/70 border border-brand-outline/25 rounded-xl px-4 py-2.5 text-xs text-brand-text placeholder-brand-text-muted/30 focus:outline-none focus:border-[#00685b] focus:bg-white transition-colors"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label htmlFor="projectDescription" className="text-[10px] font-tech text-brand-text-muted uppercase font-bold tracking-wider">Project Description</label>
                              <input
                                id="projectDescription"
                                name="projectDescription"
                                type="text"
                                value={formData.projectDescription}
                                onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                                placeholder="Brief summary of deliverables or goals"
                                className="w-full bg-[#faf9f9]/70 border border-brand-outline/25 rounded-xl px-4 py-2.5 text-xs text-brand-text placeholder-brand-text-muted/30 focus:outline-none focus:border-[#00685b] focus:bg-white transition-colors"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label htmlFor="referenceUrl" className="text-[10px] font-tech text-brand-text-muted uppercase font-bold tracking-wider">Reference / Website</label>
                              <input
                                id="referenceUrl"
                                name="referenceUrl"
                                type="url"
                                value={formData.referenceUrl}
                                onChange={(e) => setFormData({ ...formData, referenceUrl: e.target.value })}
                                placeholder="https://yourwebsite.com or inspiration link"
                                className="w-full bg-[#faf9f9]/70 border border-brand-outline/25 rounded-xl px-4 py-2.5 text-xs text-brand-text placeholder-brand-text-muted/30 focus:outline-none focus:border-[#00685b] focus:bg-white transition-colors"
                              />
                            </div>
                          </div>
                        </>
                      )}
                      
                      {/* Message description box */}
                      {!selectedPackage && !selectedBlueprint && (
                        <div className="space-y-1.5">
                          <label htmlFor="message" className="text-[10px] font-tech text-brand-text-muted uppercase font-bold tracking-wider">Your Message *</label>
                          <textarea
                            id="message"
                            name="message"
                            required
                            rows={5}
                            readOnly={!!freeConsultation}
                            value={formData.message}
                            onChange={(e) => {
                              if (!freeConsultation) {
                                setFormData({...formData, message: e.target.value});
                                if (errors.message) setErrors(prev => ({ ...prev, message: undefined }));
                              }
                            }}
                            placeholder="Please write your detailed query or project description here..."
                            className={`w-full border rounded-xl px-4 py-3 text-xs resize-none transition-all duration-200 ${
                              freeConsultation 
                                ? "bg-[#00685b]/5 border-[#00685b]/20 text-[#002f29]/80 font-medium font-sans leading-relaxed pointer-events-none select-all" 
                                : errors.message 
                                  ? "bg-red-50/10 border-red-500 text-brand-text placeholder-brand-text-muted/30 focus:outline-none focus:ring-1 focus:ring-red-500/30"
                                  : "bg-[#faf9f9]/70 border-brand-outline/25 text-brand-text placeholder-brand-text-muted/30 focus:outline-none focus:border-[#00685b] focus:bg-white"
                            }`}
                          />
                          {errors.message && (
                            <p className="text-[11px] text-red-600 font-sans mt-1 flex items-center gap-1 animate-fade-in">
                              <span className="text-[12px]">⚠️</span> {errors.message}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Optional Message box for Portfolio Blueprint Inquiry */}
                      {selectedBlueprint && (
                        <div className="space-y-1.5 animate-fade-in">
                          <label className="text-[10px] font-tech text-[#00685b] uppercase font-bold tracking-wider">Additional Message (Optional)</label>
                          <textarea
                            rows={3}
                            value={additionalMessage}
                            onChange={(e) => setAdditionalMessage(e.target.value)}
                            placeholder="Add any specific guidelines, custom tweaks or options for this design blueprint..."
                            className="w-full bg-[#faf9f9]/70 border border-brand-outline/25 rounded-xl px-4 py-3 text-xs text-brand-text placeholder-brand-text-muted/30 focus:outline-none focus:border-[#00685b] focus:bg-white transition-colors resize-none"
                          />
                        </div>
                      )}
                      
                      <button
                        type="submit"
                        disabled={formState === 'submitting'}
                        className="w-full sm:w-auto rounded-xl bg-[#00685b] hover:bg-[#178373] disabled:opacity-60 disabled:cursor-not-allowed text-white px-8 py-3.5 font-display text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
                      >
                        {formState === 'submitting' ? (
                          <>
                            <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Message</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                      
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* 3. COCHIN/KERALA METROPOLITAN VECTOR MAP BLOCK */}
      <section id="contact-map-block" className="mx-auto max-w-7xl px-6 py-20 lg:px-12">
        <div id="map-con-grid" className="bg-[#fafaf9] border border-brand-outline/20 rounded-3xl overflow-hidden p-6 sm:p-10 flex flex-col lg:grid lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Styled Cochin vector street map layout diagram */}
          <div className="lg:col-span-7 w-full aspect-[4/3] rounded-2.5xl bg-[#ededec] border border-slate-300 relative overflow-hidden select-none shadow-inner">
            
            {/* Custom street network visual SVG */}
            <svg className="absolute inset-0 w-full h-full text-slate-400 stroke-slate-300/80 fill-none" viewBox="0 0 400 300">
              
              {/* Soft background visual styling water flow (Vembanad Lake / River delta layout) */}
              <path d="M-10,120 Q50,110 80,180 T150,230 T200,310 L-10,310 Z" fill="#d0e2e2" stroke="none" />
              <path d="M75,178 L35,240 T0,280" stroke="#d0e2e2" strokeWidth="8" />
              
              {/* Main Expressway Arteries represent Cochin bypass */}
              <path d="M50,-10 L120,80 L220,170 T350,310" stroke="#fcfcfc" strokeWidth="6" />
              <path d="M50,-10 L120,80 L220,170 T350,310" stroke="#e0aa62" strokeWidth="1.5" /> {/* NH66 Bypass highway representation */}
              
              <path d="M-20,60 L420,190" stroke="#fcfcfc" strokeWidth="4" />
              <path d="M-20,60 L420,190" stroke="#cbd5e1" strokeWidth="1" />
              
              <path d="M120,80 Q220,50 310,120 T390,190" stroke="#fcfcfc" strokeWidth="4" />
              <path d="M120,80 Q220,50 310,120 T390,190" stroke="#e2e8f0" strokeWidth="1" />
              
              {/* Secondary roads grid vectors */}
              <line x1="80" y1="20" x2="160" y2="140" stroke="#f3f4f6" strokeWidth="2.5" />
              <line x1="150" y1="250" x2="300" y2="250" stroke="#f3f4f6" strokeWidth="2.5" />
              <line x1="310" y1="120" x2="310" y2="240" stroke="#f3f4f6" strokeWidth="2.5" />
              
              {/* Landmark point rings */}
              <circle cx="120" cy="80" r="1.5" fill="#64748b" />
              <circle cx="220" cy="170" r="1.5" fill="#64748b" />
              <circle cx="310" cy="120" r="1.5" fill="#64748b" />
              
            </svg>
            
            {/* Custom Street Address Marker labels on Cochin Map view */}
            <div className="absolute top-[22%] left-[32%] text-[9px] font-sans font-bold text-slate-500 tracking-tight leading-none bg-white/70 px-1 py-0.5 rounded shadow-xs select-none">
              Edapally
            </div>
            
            <div className="absolute top-[48%] left-[45%] text-[9px] font-sans font-bold text-slate-500 tracking-tight leading-none bg-white/70 px-1 py-0.5 rounded shadow-xs select-none">
              Palarivattom
            </div>
            
            <div className="absolute top-[40%] left-[81%] text-[9px] font-sans font-bold text-slate-600 tracking-tight leading-none bg-white/70 px-1 py-0.5 rounded shadow-xs select-none">
              Kakkanad InfoPark
            </div>

            <div className="absolute bottom-[23%] left-[75%] text-[8px] font-sans font-bold text-red-500 tracking-tight leading-none flex items-center gap-1.5 select-none bg-white/70 p-1 rounded">
              <span className="h-1 w-1 bg-red-500 rounded-full inline-block animate-ping" /> Aster Medcity
            </div>

            <div className="absolute bottom-[10%] left-[35%] text-[9px] font-sans font-bold text-slate-500 tracking-tight leading-none bg-white/70 px-1 py-0.5 rounded shadow-xs select-none">
              Lulu Mall
            </div>
            
            {/* Active Bouncing Pin representing Q BENCH office */}
            <div className="absolute top-[62%] left-[46%] -translate-x-1/2 -translate-y-full flex flex-col items-center">
              
              {/* Ambient beacon ring */}
              <div className="absolute bottom-1 w-6 h-1 w-3.5 h-1.5 bg-black/20 rounded-full blur-[1px] animate-pulse" />
              
              {/* Pin indicator body */}
              <div className="relative animate-bounce duration-1000 flex flex-col items-center select-none cursor-pointer">
                <MapPin className="h-7 w-7 text-[#00685b] fill-[#88f8c5] drop-shadow-md" />
                <span className="absolute top-1.5 h-1.5 w-1.5 bg-[#00685b] rounded-full" />
              </div>
              
              <div className="mt-1 bg-[#002f29] text-white text-[8px] font-tech font-bold uppercase tracking-widest px-2 py-0.5 rounded shadow-md border border-white/20 leading-none shrink-0 whitespace-nowrap">
                Q BENCH Cochin
              </div>
            </div>

          </div>
          
          {/* Right Column: Invite to Consultation Action block */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Circular Paperplane launcher */}
            <div className="h-14 w-14 rounded-full bg-[#002f29] p-3 text-[#88f8c5] flex items-center justify-center shrink-0 shadow-md">
              <Send className="h-6 w-6" />
            </div>
            
            <div className="space-y-2.5">
              <h3 className="font-display text-xl sm:text-2xl font-black text-brand-text tracking-tight">
                Let's Start a Conversation
              </h3>
              <p className="font-sans text-xs sm:text-sm text-brand-text-muted leading-relaxed">
                We're excited to learn more about your business and help you achieve your goals. Connect with our advisors to schedule a visual blueprint layout audit.
              </p>
            </div>
            
            <div className="pt-2 border-t border-brand-outline/10">
              <button 
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('contact');
                  }
                  handleCtaClick();
                }}
                className="rounded-xl border border-brand-text bg-white text-brand-text px-6 py-3 font-display text-xs font-bold uppercase tracking-wider hover:bg-brand-surface-low transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>Book a Free Consultation</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            
          </div>
          
        </div>
      </section>

      {/* FLOATING SUCCESS TOAST NOTIFICATION */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            key="contact-success-toast"
            id="contact-success-toast"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -24, x: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] bg-[#05211c] text-white border border-[#88f8c5]/30 rounded-2xl p-4 shadow-[0_16px_40px_-8px_rgba(5,33,28,0.55)] overflow-hidden"
          >
            <div className="flex items-start gap-3.5">
              <div className="h-9 w-9 rounded-xl bg-[#88f8c5]/15 text-[#88f8c5] flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] tracking-widest uppercase font-extrabold text-[#88f8c5]">
                    Inquiry Sent
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSuccessToast(false)}
                    aria-label="Dismiss notification"
                    className="text-white/60 hover:text-white transition-colors p-0.5 rounded-lg cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="font-display text-xs sm:text-sm font-bold text-white leading-snug">
                  {submissionDelivery?.emailDelivery === 'SUCCESS'
                    ? 'Inquiry Saved & Confirmations Dispatched'
                    : submissionDelivery?.emailDelivery === 'PARTIAL'
                      ? 'Inquiry Saved (Notification Delivery in Progress)'
                      : 'Inquiry Received Successfully'}
                </p>
                <p className="font-sans text-[11px] text-white/75 leading-relaxed">
                  {submissionDelivery?.message || 'Thank you! Your enquiry has been submitted successfully.'}
                </p>
              </div>
            </div>
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 8, ease: 'linear' }}
              className="absolute bottom-0 left-0 h-1 bg-[#88f8c5]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* SUCCESS CONFIRMATION MODAL */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            key="contact-success-modal-backdrop"
            id="contact-success-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-success-modal-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setShowSuccessModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#05211c]/65 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-white border border-[#00685b]/20 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5 overflow-hidden"
            >
              {/* Top subtle decorative bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00685b] via-[#25D366] to-[#002f29]" />

              {/* Close button */}
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                aria-label="Close confirmation modal"
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Animated Checkmark Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 14 }}
                className="h-16 w-16 rounded-full bg-[#00685b]/10 text-[#00685b] border border-[#00685b]/20 flex items-center justify-center mx-auto shadow-xs"
              >
                <CheckCircle2 className="h-8 w-8 stroke-[2.2]" />
              </motion.div>

              <div className="space-y-2">
                <span className="font-mono text-[10px] tracking-widest uppercase font-extrabold text-[#00685b] bg-[#00685b]/10 px-3 py-1 rounded-full inline-block">
                  Submission Confirmed
                </span>
                <h3
                  id="contact-success-modal-title"
                  className="font-display text-xl sm:text-2xl font-black text-[#002f29] tracking-tight"
                >
                  Your Inquiry Has Been Received!
                </h3>
                <p className="font-sans text-xs sm:text-sm text-brand-text-muted leading-relaxed">
                  {submissionDelivery?.message || 'Thank you! Your enquiry has been submitted successfully. We’ll get back to you shortly.'}
                </p>
              </div>

              {lastSubmittedSnapshot && (
                <div className="bg-[#faf9f9] border border-brand-outline/15 rounded-2xl p-4 text-left text-xs space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] uppercase text-brand-text-muted font-bold">Name</span>
                    <span className="font-sans font-bold text-[#002f29] truncate">{lastSubmittedSnapshot.name}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] uppercase text-brand-text-muted font-bold">Service</span>
                    <span className="font-mono text-[11px] font-bold text-[#00685b]">{lastSubmittedSnapshot.service}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] uppercase text-brand-text-muted font-bold">Reply Email</span>
                    <span className="font-sans text-slate-700 truncate">{lastSubmittedSnapshot.email}</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <a
                  href={constructWhatsAppUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white px-4 py-3 font-display text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  <span>Chat on WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={() => setShowSuccessModal(false)}
                  className="flex-1 rounded-xl bg-[#00685b] hover:bg-[#178373] text-white px-4 py-3 font-display text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
