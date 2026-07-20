import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Store, CheckCircle2, AlertCircle, Camera, Users, Bell, Activity, TrendingUp, Receipt, ChevronDown, Check, X, Shield, Star, Zap, ArrowRight, Bot, CreditCard } from 'lucide-react';
import AnimatedBillScanner from '@/components/landing/AnimatedBillScanner';
import SupplierFlowDemo from '@/components/landing/SupplierFlowDemo';
import ReminderTimeline from '@/components/landing/ReminderTimeline';
import HealthScoreCard from '@/components/landing/HealthScoreCard';
import CashFlowChart from '@/components/landing/CashFlowChart';
import GSTTableDemo from '@/components/landing/GSTTableDemo';
import HowItWorksWorkflow from '@/components/landing/workflow/HowItWorksWorkflow';
import { Button } from '@/components/ui/button';

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frameId: number;
    let cycleTimeout: NodeJS.Timeout;

    const startCycle = () => {
      if (counterRef.current) counterRef.current.innerText = '₹0';
      
      cycleTimeout = setTimeout(() => {
        const duration = 400;
        const target = 12500;
        const startTime = Date.now();
        
        const animate = () => {
          const now = Date.now();
          const progress = Math.min((now - startTime) / duration, 1);
          const easeProgress = progress * (2 - progress);
          const current = Math.floor(target * easeProgress);
          
          if (counterRef.current) {
            counterRef.current.innerText = `₹${current.toLocaleString('en-IN')}`;
          }
          
          if (progress < 1) {
            frameId = requestAnimationFrame(animate);
          }
        };
        frameId = requestAnimationFrame(animate);
      }, 1750);
    };

    startCycle();
    const interval = setInterval(startCycle, 2500);

    return () => {
      clearInterval(interval);
      clearTimeout(cycleTimeout);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-slide-up');
          entry.target.classList.replace('opacity-0', 'opacity-100');
          if (entry.target.classList.contains('line-draw')) {
            entry.target.classList.add('animate-draw-line');
          }
        }
      });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        el.classList.replace('opacity-0', 'opacity-100');
      } else {
        observerRef.current?.observe(el);
      }
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const tickerData = [
    { name: "Ravi Traders", amount: "₹12,500", status: "Paid", color: "bg-success" },
    { name: "Sharma Supplies", amount: "₹8,200", status: "Due in 2d", color: "bg-warning" },
    { name: "Metro Foods Pvt.", amount: "₹31,000", status: "Scanned", color: "bg-primary" },
    { name: "Krishna Wholesale", amount: "₹5,750", status: "Paid", color: "bg-success" },
    { name: "Patel Brothers", amount: "₹19,400", status: "Due in 5d", color: "bg-warning" },
    { name: "Anand Distributors", amount: "₹7,100", status: "Paid", color: "bg-success" },
    { name: "Gupta Merchants", amount: "₹44,000", status: "Disputed", color: "bg-destructive" },
    { name: "SM Agro Supplies", amount: "₹9,600", status: "Scanned", color: "bg-primary" },
    { name: "New Delhi Traders", amount: "₹22,300", status: "Paid", color: "bg-success" },
    { name: "Ram Kumar & Sons", amount: "₹13,800", status: "Due in 1d", color: "bg-warning" }
  ];
  const fullTickerData = [...tickerData, ...tickerData, ...tickerData];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans">
      <style>{`
        @keyframes custom-ticker {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes travel-dot {
          0%, 15% { left: 0; opacity: 0; }
          25% { opacity: 1; }
          70% { left: 100%; opacity: 1; transform: translateX(-100%); }
          80%, 100% { left: 100%; opacity: 0; transform: translateX(-100%); }
        }
        @keyframes pulse-ring {
          0%, 65% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
          70% { box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.4); }
          85%, 100% { box-shadow: 0 0 0 12px rgba(34, 197, 94, 0); }
        }
        @keyframes draw-line {
          0% { right: 85%; }
          100% { right: 15%; }
        }
        @keyframes ambient-drift {
          0%, 100% { transform: translate(-50%, -50%); }
          50% { transform: translate(-45%, -55%); }
        }
        .animate-custom-ticker {
          animation: custom-ticker 20s linear infinite;
        }
        .animate-travel-dot {
          animation: travel-dot 2.5s ease-in-out infinite;
        }
        .animate-pulse-ring {
          animation: pulse-ring 2.5s infinite;
        }
        .animate-draw-line {
          animation: draw-line 0.6s ease-out forwards;
          animation-delay: 0.15s;
        }
        .animate-ambient-drift {
          animation: ambient-drift 10s ease-in-out infinite;
        }
        .ticker-mask {
          mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
          -webkit-mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
        }
      `}</style>

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${isScrolled ? 'bg-background/95 backdrop-blur-md border-b border-border shadow-sm' : 'bg-background/80 backdrop-blur-md border-b border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
            <Store className="h-6 w-6" />
            Digibill
          </Link>
          
          <div className="hidden md:flex gap-8 items-center font-medium text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <Link to="/supplier/login" className="hover:text-foreground transition-colors">Supplier Portal</Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">Shop Login</Link>
            <Button asChild variant="outline" size="sm">
              <Link to="/supplier/login">Supplier Login</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/register">Create Shop</Link>
            </Button>
          </div>

          <button className="md:hidden text-foreground relative w-6 h-6" onClick={toggleMenu}>
            <X className={`absolute inset-0 h-6 w-6 transition-all duration-200 ${isMobileMenuOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}`} />
            <Store className={`absolute inset-0 h-6 w-6 transition-all duration-200 ${isMobileMenuOpen ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'}`} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`fixed inset-0 bg-background z-40 p-6 pt-24 flex flex-col gap-6 transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full'}`}>
        {[
          { text: 'Features', href: '#features' },
          { text: 'How it Works', href: '#how-it-works' },
          { text: 'Pricing', href: '#pricing' },
          { text: 'Supplier Portal', href: '/supplier/login', isLink: true },
          { isDivider: true },
          { text: 'Shop Login', href: '/login', isLink: true, className: 'text-muted-foreground font-medium' },
          { text: 'Supplier Login', href: '/supplier/login', isLink: true, className: 'text-muted-foreground font-medium' },
        ].map((item, i) => (
          item.isDivider ? 
            <div key={i} className={`h-px bg-border my-2 transition-all duration-300 delay-[${i * 50}ms] ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: `${i * 0.05}s` }} /> :
          item.isLink ? 
            <Link key={i} to={item.href!} className={`text-xl font-semibold transition-all duration-500 ${item.className || ''} ${isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: `${i * 0.05}s` }} onClick={toggleMenu}>{item.text}</Link> :
            <a key={i} href={item.href!} className={`text-xl font-semibold transition-all duration-500 ${isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: `${i * 0.05}s` }} onClick={toggleMenu}>{item.text}</a>
        ))}
        <div className={`transition-all duration-500 ${isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: `0.4s` }}>
          <Button asChild size="lg" className="w-full mt-4">
            <Link to="/register" onClick={toggleMenu}>Create Shop</Link>
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
        {/* Background ambient glow matching the gradient-hero logic */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] opacity-20 pointer-events-none rounded-full blur-[100px] bg-primary/20" />
        
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-10">
          <div className="reveal opacity-0 text-center lg:text-left">
            <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 tracking-wide">
              BILL MANAGEMENT FOR INDIAN RETAIL
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
              Every invoice, <span className="text-primary">tracked.</span><br />
              Every supplier, <span className="text-accent">paid.</span><br />
              No more chaos.
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
              Digibill replaces your paper registers and WhatsApp bill photos with one modern dashboard your whole shop can use.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Button asChild size="lg" className="h-12 px-8 text-base shadow-glow">
                <Link to="/register">I'm a Shop Owner</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base">
                <Link to="/supplier/login">I'm a Supplier</Link>
              </Button>
            </div>
            <div className="flex items-center justify-center lg:justify-start gap-4 text-sm text-muted-foreground font-medium flex-wrap">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-success" /> No credit card required</span>
              <span className="hidden sm:inline">·</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-success" /> Setup in 10 minutes</span>
              <span className="hidden sm:inline">·</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-success" /> Free for 1 shop</span>
              <span className="hidden sm:inline">·</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-success" /> Pay suppliers via UPI</span>
            </div>
          </div>

          <div className="reveal opacity-0 w-full max-w-md mx-auto lg:ml-auto lg:max-w-none">
            <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden glass-strong">
              <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Live Activity
                </span>
                <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
              </div>
              <div className="h-[360px] overflow-hidden ticker-mask bg-card/50">
                <div className="animate-custom-ticker flex flex-col pt-4">
                  {fullTickerData.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${item.color}`}>
                        {item.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-foreground">{item.name}</div>
                        <div className="text-sm font-mono text-muted-foreground">{item.amount}</div>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${item.color.replace('bg-', 'text-')} bg-background`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-y border-border bg-muted/20 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center reveal opacity-0">
          <p className="text-sm font-semibold text-muted-foreground mb-6 tracking-wide uppercase">Trusted by shop owners across India</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center">
            <span className="text-xl font-bold tracking-tighter grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-default">ShopKart Pro</span>
            <span className="text-xl font-bold tracking-tighter grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-default">Kirana360</span>
            <span className="text-xl font-bold tracking-tighter flex items-center gap-1 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-default"><Store className="w-5 h-5"/> VyaparMart</span>
            <span className="text-xl font-bold tracking-tighter grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-default">BillingHub</span>
            <span className="text-xl font-bold tracking-tighter grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-default">RetailSetu</span>
          </div>
        </div>
      </section>

      {/* Instant UPI Payments Section */}
      <section className="py-20 lg:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-0 items-center">
          <div className="text-center lg:text-left reveal opacity-0 relative z-10 lg:pr-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6 ml-4 lg:ml-0">
              <Zap className="w-8 h-8" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-6 max-w-[520px] mx-auto lg:mx-0">Pay suppliers instantly via UPI</h2>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-[520px] mx-auto lg:mx-0">
              Settle bills directly from your dashboard. No more switching apps, no more manual reconciliation, and no more chasing bank transfers. Digibill syncs the payment automatically.
            </p>
          </div>

          <div className="reveal opacity-0 w-full max-w-lg mx-auto lg:-translate-x-8 lg:-translate-y-4 relative z-20">
            {/* Primary Glow Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />
            
            <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 glass-strong">
              <div className="flex justify-between items-center mb-10">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Status</span>
                <span className="text-xs font-bold uppercase tracking-wider text-success flex items-center gap-1 motion-safe:animate-pulse-slow rounded-full px-2 py-0.5 bg-success/10" style={{ animationDuration: '4s' }}>
                  <CheckCircle2 className="w-3 h-3" /> Paid
                </span>
              </div>
              
              <div className="relative flex items-center justify-between mb-10 px-4">
                {/* Connecting Line */}
                <div className="absolute left-12 right-12 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-border z-0"></div>
                
                {/* Traveling Dot */}
                <div className="absolute left-12 right-12 top-1/2 -translate-y-1/2 z-10 motion-safe:animate-travel-dot motion-reduce:hidden">
                  <div className="w-3 h-3 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.8)] animate-pulse"></div>
                </div>

                {/* Reduced Motion Static Dot */}
                <div className="absolute right-12 top-1/2 -translate-y-1/2 -translate-x-full z-10 hidden motion-reduce:block">
                  <div className="w-3 h-3 bg-success rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                </div>

                {/* Shop Icon */}
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white z-10 shadow-lg">
                  <Store className="w-6 h-6" />
                </div>
                
                {/* Supplier Icon */}
                <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-white z-10 shadow-lg motion-safe:animate-pulse-ring">
                  <span className="font-bold text-lg">RT</span>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1 font-semibold">Amount Transferred</p>
                <div className="text-4xl font-extrabold text-foreground tracking-tight h-12 flex items-center justify-center">
                  <span className="motion-reduce:hidden" ref={counterRef}>₹0</span>
                  <span className="hidden motion-reduce:block text-success">₹12,500</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section id="features" className="py-24 sm:py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-32 md:mb-48 reveal opacity-0">
            <h2 className="text-primary font-semibold tracking-wide uppercase text-sm mb-3">What Digibill Does</h2>
            <p className="text-3xl sm:text-5xl font-extrabold tracking-tight">Built for how Indian shops actually work</p>
          </div>
          
          <div className="space-y-32 md:space-y-[200px] relative">
            
            {/* Central Connecting Line */}
            <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-[5%] bottom-[5%] w-px border-l-2 border-dashed border-border/40 -z-20" />
            
            {/* Feature 1: AI Bill Scanning (Demo 60%, Text 40%, Top-left glow) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-0 items-center relative reveal opacity-0">
              <div className="absolute top-[-100px] left-[-100px] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />
              <div className="col-span-1 md:col-span-7 relative z-10">
                <div className="w-full [&>div]:!max-w-[520px] md:-rotate-1 md:hover:rotate-0 hover:-translate-y-2 transition-all duration-500 ease-out">
                  <AnimatedBillScanner />
                </div>
                {/* Floating Badge */}
                <div className="hidden md:flex absolute -right-6 top-1/4 bg-background/80 backdrop-blur-md border border-border shadow-xl rounded-full px-4 py-2 text-xs font-bold items-center gap-2 animate-bounce motion-reduce:!animate-none z-20" style={{ animationDuration: '4s' }}>
                  <CheckCircle2 className="w-4 h-4 text-success" /> AI Verified
                </div>
              </div>
              <div className="col-span-1 md:col-span-5 md:pl-16 self-end pb-12">
                <h3 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">AI Bill Scanning</h3>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Photograph any invoice and Digibill reads the supplier name, amount, and due date in seconds.
                </p>
              </div>
            </div>

            {/* Feature 2: Supplier Portal (Text 50%, Demo 50%, Bottom-right glow) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-0 items-center relative reveal opacity-0">
              <div className="absolute bottom-[-100px] right-[-100px] w-[700px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none -z-10" />
              <div className="col-span-1 md:col-span-6 md:pr-20 self-start pt-12 order-2 md:order-1">
                <h3 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">Supplier Portal</h3>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Give suppliers their own login to view invoices, raise disputes, and acknowledge payments instantly.
                </p>
              </div>
              <div className="col-span-1 md:col-span-6 relative z-10 order-1 md:order-2">
                <div className="w-full [&>div]:!max-w-[420px] md:translate-x-8 md:rotate-1 md:hover:rotate-0 hover:-translate-y-2 transition-all duration-500 ease-out">
                  <SupplierFlowDemo />
                </div>
                {/* Floating Badge */}
                <div className="hidden md:flex absolute -left-12 bottom-1/3 bg-background/80 backdrop-blur-md border border-border shadow-xl rounded-full px-4 py-2 text-xs font-bold items-center gap-2 animate-pulse motion-reduce:!animate-none z-20" style={{ animationDuration: '5s' }}>
                  <Users className="w-4 h-4 text-accent" /> Supplier Online
                </div>
              </div>
            </div>

            {/* Feature 3: Payment Reminders (Demo Compact, Text Wide, Center-left glow) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-0 items-center relative reveal opacity-0">
              <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-warning/5 rounded-full blur-[100px] pointer-events-none -z-10" />
              <div className="col-span-1 md:col-span-5 relative z-10">
                <div className="w-full [&>div]:!max-w-sm md:-translate-y-12 md:hover:-translate-y-16 transition-all duration-700 ease-out">
                  <ReminderTimeline />
                </div>
              </div>
              <div className="col-span-1 md:col-span-7 md:pl-24 self-center">
                <h3 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">Payment Reminders</h3>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Automated WhatsApp and email reminders go out 3 days before a bill is due, with retry logic.
                </p>
              </div>
            </div>

            {/* Feature 4: Health Scores (Text Left, Demo Overlaps Text Area, Right glow) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-0 items-center relative reveal opacity-0">
              <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-success/5 rounded-full blur-[120px] pointer-events-none -z-10" />
              <div className="col-span-1 md:col-span-5 md:pr-8 self-center order-2 md:order-1 relative z-20">
                <h3 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">Health Scores</h3>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Every supplier gets a credit score based on your payment history so you know who is reliable.
                </p>
              </div>
              <div className="col-span-1 md:col-span-7 relative z-10 order-1 md:order-2">
                <div className="w-full [&>div]:!max-w-[500px] md:scale-105 md:-translate-x-16 md:hover:scale-110 md:hover:-translate-x-20 transition-all duration-700 ease-out">
                  <HealthScoreCard />
                </div>
                {/* Floating Badge */}
                <div className="hidden md:flex absolute -right-4 top-10 bg-background/80 backdrop-blur-md border border-border shadow-xl rounded-full px-4 py-2 text-xs font-bold items-center gap-2 animate-bounce motion-reduce:!animate-none z-30" style={{ animationDuration: '6s' }}>
                  <Shield className="w-4 h-4 text-success" /> Health Updated
                </div>
              </div>
            </div>

            {/* Feature 5: Cash Flow Forecast (Demo Extra Large Shifted Up, Text Bottom, Bottom-left glow) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-0 items-center relative reveal opacity-0">
              <div className="absolute bottom-[-150px] left-[-100px] w-[800px] h-[600px] bg-destructive/5 rounded-full blur-[150px] pointer-events-none -z-10" />
              <div className="col-span-1 md:col-span-8 relative z-10">
                <div className="w-full [&>div]:!max-w-[620px] md:-translate-y-16 md:hover:-translate-y-20 hover:shadow-2xl transition-all duration-700 ease-out">
                  <CashFlowChart />
                </div>
              </div>
              <div className="col-span-1 md:col-span-4 md:pl-10 self-end pb-24">
                <h3 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">Cash Flow Forecast</h3>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  See money going out over the next 30 and 90 days to plan inventory purchases accurately.
                </p>
              </div>
            </div>

            {/* Feature 6: GST Tracking (Text Top, Demo Shifted Down, Center glow) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-0 items-center relative reveal opacity-0">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-accent/5 rounded-full blur-[150px] pointer-events-none -z-10" />
              <div className="col-span-1 md:col-span-5 md:pr-16 self-start pt-16 order-2 md:order-1">
                <h3 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">GST Tracking</h3>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Log CGST, SGST, and IGST per line item and export clean GST summaries when filing time comes.
                </p>
              </div>
              <div className="col-span-1 md:col-span-7 relative z-10 order-1 md:order-2">
                <div className="w-full [&>div]:!max-w-[480px] md:translate-y-12 md:translate-x-12 md:hover:translate-y-8 hover:shadow-2xl transition-all duration-700 ease-out">
                  <GSTTableDemo />
                </div>
                {/* Floating Badge */}
                <div className="hidden md:flex absolute right-0 bottom-0 bg-background/80 backdrop-blur-md border border-border shadow-xl rounded-full px-4 py-2 text-xs font-bold items-center gap-2 animate-pulse motion-reduce:!animate-none z-20" style={{ animationDuration: '4.5s' }}>
                  <Receipt className="w-4 h-4 text-accent" /> GST Ready
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Premium Section Transition */}
      <div className="relative w-full py-32 flex flex-col items-center justify-center overflow-visible reveal opacity-0 -mb-20">
        <style>{`
          @keyframes orb-travel-horizontal {
            0% { left: 5%; transform: translateY(-50%) scale(0); opacity: 0; }
            10% { left: 10%; transform: translateY(-50%) scale(1); opacity: 1; }
            80% { left: 85%; transform: translateY(-50%) scale(1); opacity: 1; }
            90% { left: 95%; transform: translateY(-50%) scale(1.5); opacity: 0; }
            100% { left: 95%; transform: translateY(-50%) scale(0); opacity: 0; }
          }
        `}</style>
        
        {/* Soft Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />
        
        {/* Connector from above */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-[50%] bg-gradient-to-b from-border/50 to-transparent -z-20" />

        {/* Floating Glass Component */}
        <div className="relative z-10 flex items-center gap-4 sm:gap-6 bg-background/60 backdrop-blur-md border border-border/50 shadow-xl rounded-full px-6 sm:px-8 py-3 sm:py-4">
           {/* Animated Orb */}
           <div className="absolute top-1/2 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center motion-reduce:hidden pointer-events-none z-0" style={{ animation: 'orb-travel-horizontal 6s ease-in-out infinite' }}>
             <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
           </div>

           <div className="flex items-center gap-2 relative z-10">
             <Camera className="w-4 h-4 text-muted-foreground" />
             <span className="hidden sm:inline text-xs font-bold text-muted-foreground">Scan</span>
           </div>
           <ArrowRight className="w-3 h-3 text-muted-foreground/30 relative z-10" />
           
           <div className="flex items-center gap-2 relative z-10">
             <Bot className="w-4 h-4 text-muted-foreground" />
             <span className="hidden sm:inline text-xs font-bold text-muted-foreground">AI</span>
           </div>
           <ArrowRight className="w-3 h-3 text-muted-foreground/30 relative z-10" />
           
           <div className="flex items-center gap-2 relative z-10">
             <Users className="w-4 h-4 text-muted-foreground" />
             <span className="hidden sm:inline text-xs font-bold text-muted-foreground">Supplier</span>
           </div>
           <ArrowRight className="w-3 h-3 text-muted-foreground/30 relative z-10" />
           
           <div className="flex items-center gap-2 relative z-10">
             <CreditCard className="w-4 h-4 text-muted-foreground" />
             <span className="hidden sm:inline text-xs font-bold text-muted-foreground">Pay</span>
           </div>
        </div>
      </div>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 bg-muted/30 border-y border-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 reveal opacity-0">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">How it works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From receiving an invoice to paying your supplier — every step happens in one place.
            </p>
          </div>
          
          <HowItWorksWorkflow />

        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 reveal opacity-0">
          <h2 className="text-primary font-semibold tracking-wide uppercase text-sm mb-3">Pricing</h2>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-8">Simple. No surprises.</p>
          
          <div className="inline-flex items-center p-1 bg-muted rounded-full border border-border">
            <button 
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${billingPeriod === 'monthly' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setBillingPeriod('monthly')}
            >
              Monthly
            </button>
            <button 
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${billingPeriod === 'annual' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setBillingPeriod('annual')}
            >
              Annual <span className="bg-success/10 text-success text-[10px] uppercase px-2 py-0.5 rounded-full">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
          {/* Free Plan */}
          <div className="bg-card border border-border rounded-2xl p-8 reveal opacity-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/50">
            <h3 className="text-2xl font-bold mb-2">Free</h3>
            <p className="text-muted-foreground text-sm mb-6 h-10">For one shop getting started</p>
            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-5xl font-extrabold tracking-tight">₹0</span>
              <span className="text-muted-foreground font-medium">/month</span>
            </div>
            <Button variant="outline" className="w-full mb-8 h-12" asChild>
              <Link to="/register">Get started free</Link>
            </Button>
            <ul className="space-y-4 text-sm font-medium">
              {['1 shop', 'Up to 3 suppliers', '20 bills/month', 'AI scanning (5 scans/month)', 'Basic analytics'].map((feat, i) => (
                <li key={i} className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> {feat}</li>
              ))}
              {['Supplier portal', 'Payment reminders', 'Cash flow forecast'].map((feat, i) => (
                <li key={i} className="flex items-center gap-3 text-muted-foreground/60 line-through"><X className="w-5 h-5" /> {feat}</li>
              ))}
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="bg-card border-2 border-primary rounded-2xl p-8 shadow-xl relative lg:scale-105 z-10 reveal opacity-0 transition-shadow duration-300 hover:shadow-2xl" style={{ transitionDelay: '0.1s' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold mb-2">Pro</h3>
            <p className="text-muted-foreground text-sm mb-6 h-10">For growing shops and small chains</p>
            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-5xl font-extrabold tracking-tight">{billingPeriod === 'monthly' ? '₹599' : '₹479'}</span>
              <span className="text-muted-foreground font-medium">/month</span>
            </div>
            <Button className="w-full mb-8 h-12 shadow-glow" asChild>
              <Link to="/register">Start Pro free for 14 days</Link>
            </Button>
            <ul className="space-y-4 text-sm font-medium">
              {[
                '1 shop', 'Unlimited suppliers', 'Unlimited bills', 'AI scanning (unlimited)', 
                'Supplier portal (unlimited invites)', 'WhatsApp + email reminders', 
                'Cash flow forecast', 'Health scores', 'GST line items & export', 'Priority support'
              ].map((feat, i) => (
                <li key={i} className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> {feat}</li>
              ))}
            </ul>
          </div>

          {/* Business Plan */}
          <div className="bg-card border border-border rounded-2xl p-8 reveal opacity-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/50" style={{ transitionDelay: '0.2s' }}>
            <h3 className="text-2xl font-bold mb-2">Business</h3>
            <p className="text-muted-foreground text-sm mb-6 h-10">For multi-location businesses</p>
            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-5xl font-extrabold tracking-tight">{billingPeriod === 'monthly' ? '₹1,499' : '₹1,199'}</span>
              <span className="text-muted-foreground font-medium">/month</span>
            </div>
            <Button variant="secondary" className="w-full mb-8 h-12" asChild>
              <a href="mailto:sales@digibill.com">Talk to sales</a>
            </Button>
            <ul className="space-y-4 text-sm font-medium">
              <li className="flex items-center gap-3"><Star className="w-5 h-5 text-accent" /> Everything in Pro, plus:</li>
              {['Up to 5 shop locations', 'Team accounts (5 users)', 'API access', 'Custom integrations', 'Dedicated account manager', 'SLA guarantee'].map((feat, i) => (
                <li key={i} className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> {feat}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="text-center text-sm font-medium text-muted-foreground mt-12 reveal opacity-0">
          <Shield className="w-4 h-4 inline-block mr-2" /> SSL encrypted · Payments via Razorpay · Cancel anytime
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mt-24 reveal opacity-0">
          <h3 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {[
              { q: "How fast can I start?", a: "You can sign up in seconds using Google Sign-In or your email. Setup takes less than 10 minutes, and no approvals are required." },
              { q: "Is there a free trial for Pro?", a: "Yes — 14 days free on Pro, no credit card required. You can upgrade, downgrade, or cancel anytime from your settings." },
              { q: "Can I import my existing bills?", a: "Yes. You can upload a CSV export from Vyapar, Tally, or any spreadsheet. Our smart import tool maps your fields automatically." },
              { q: "What happens to my data if I cancel?", a: "Your data stays accessible in read-only mode for 30 days after cancellation. You can export everything as JSON or CSV before you leave." },
              { q: "Do my suppliers need to pay anything?", a: "No. Access to the Supplier Portal is always 100% free for your suppliers. Only the shop owner pays for a Digibill subscription." }
            ].map((faq, i) => (
              <div key={i} className="border border-border bg-card rounded-xl overflow-hidden">
                <button 
                  className="w-full text-left px-6 py-4 font-semibold flex justify-between items-center hover:bg-muted/50 transition-colors"
                  onClick={() => toggleFaq(i)}
                >
                  {faq.q}
                  <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <div className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openFaq === i ? 'max-h-40 pb-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="text-muted-foreground">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="border-t border-border bg-gradient-to-br from-primary/10 via-background to-accent/5 py-24 text-center reveal opacity-0 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/20 rounded-full blur-[100px] pointer-events-none opacity-30 motion-safe:animate-ambient-drift" />
        <div className="max-w-3xl mx-auto px-4 relative z-10">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">Stop losing bills. Start tonight.</h2>
          <p className="text-lg text-muted-foreground mb-8">Free to start. No credit card. Takes 10 minutes to set up your first supplier.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
            <Button asChild size="lg" className="h-14 px-8 text-lg shadow-xl shadow-primary/20">
              <Link to="/register">Join as Shop Owner</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg bg-background">
              <Link to="/supplier/login">Join as Supplier</Link>
            </Button>
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Already have an account? <Link to="/login" className="text-primary hover:underline font-semibold">Sign in to your Shop</Link> or <Link to="/supplier/login" className="text-primary hover:underline font-semibold">Supplier Portal</Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary mb-4">
                <Store className="h-6 w-6" />
                Digibill
              </Link>
              <p className="text-sm text-muted-foreground pr-4">The modern bill management tool built specifically for Indian retail shops.</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                <a href="#features" className="hover:text-foreground transition-colors">Features</a>
                <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
                <Link to="/supplier/login" className="hover:text-foreground transition-colors">Supplier Portal</Link>
                <a href="#" className="hover:text-foreground transition-colors">Changelog</a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                <a href="#" className="hover:text-foreground transition-colors">About</a>
                <a href="#" className="hover:text-foreground transition-colors">Blog</a>
                <a href="#" className="hover:text-foreground transition-colors">Careers</a>
                <a href="#" className="hover:text-foreground transition-colors">Contact</a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-foreground transition-colors">Security</a>
                <a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">© 2026 Digibill. Made with care for Indian shop owners.</p>
            <div className="flex gap-4 text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg></a>
              <a href="#" className="hover:text-foreground transition-colors"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg></a>
              <a href="#" className="hover:text-foreground transition-colors"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
