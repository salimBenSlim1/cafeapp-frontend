import React, { useEffect, useRef, useState } from 'react';
import { Coffee, Zap, TrendingUp, QrCode, Check, Star, ChevronRight, Menu, X, Play } from 'lucide-react';
import RegistrationForm from './RegistrationForm';
import { useNavigate } from 'react-router-dom';
import { CreditCard, UserPlus } from 'lucide-react';
// Mock RegistrationForm component since the original isn't provided


export default function CafeAppLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const pricingRef = useRef(null);
  const registerRef = useRef(null);
  const navigate=useNavigate()
  useEffect(() => {
    // Smooth scroll reveal animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(50px)';
      el.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
      observer.observe(el);
    });

    // Floating animation for hero elements
    const floatingElements = document.querySelectorAll('.floating');
    floatingElements.forEach((el, i) => {
      el.style.animation = `floating ${3 + i * 0.5}s ease-in-out infinite`;
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white overflow-hidden">
      <style>{`
        @keyframes floating {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.4); }
          50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.8); }
        }

        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .gradient-text {
          background: linear-gradient(90deg, #3b82f6, #06b6d4, #0ea5e9);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradient-shift 3s ease infinite;
        }

        .glow-btn {
          animation: glow 2s ease-in-out infinite;
        }

        .glass {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .grid-bg {
          background-image: 
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-2xl font-bold">
            <Coffee className="text-blue-400" size={32} />
            <span className="gradient-text">CoffAI</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection(featuresRef)} className="hover:text-blue-400 transition">How It Works</button>
            <button onClick={() => scrollToSection(pricingRef)} className="hover:text-blue-400 transition">Pricing</button>
            <button 
            onClick={()=>navigate('/login')}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-2 rounded-full hover:scale-105 transition font-semibold">
              Free Trial
            </button>
          </div>

          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden glass border-t border-white/10">
            <div className="px-6 py-4 space-y-4">
              <button onClick={() => scrollToSection(featuresRef)} className="block w-full text-left">How It Works</button>
              <button onClick={() => scrollToSection(pricingRef)} className="block w-full text-left">Pricing</button>
              <button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-2 rounded-full">
                Free Trial
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20 px-6 grid-bg">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 floating"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 floating"></div>
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-block glass px-4 py-2 mt-4 rounded-full mb-6 animate-bounce">
            <span className="text-blue-400">⚡ The digital revolution for cafes</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Transform your cafe with <br />
            <span className="gradient-text">CoffAI</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Smart QR menu • Real-time dashboard • Instant orders<br/>
            Manage your cafe like never before 
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <button 
           onClick={() => {
                  const formSection = document.getElementById('form');
                  formSection?.scrollIntoView({ behavior: 'smooth' });
                }}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-4 rounded-full text-lg font-semibold hover:scale-105 transition glow-btn flex items-center gap-2">
              Start Free <ChevronRight />
            </button>
            <button 
              onClick={() => setIsVideoOpen(true)}
              className="glass px-8 py-4 rounded-full text-lg font-semibold hover:scale-105 transition flex items-center gap-2"
            >
              <Play size={20} /> Watch Demo
            </button>
          </div>

          <div className="glass rounded-3xl p-8 max-w-4xl mx-auto floating">
            <img 
              src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&h=600&fit=crop" 
              alt="CaféApp Dashboard"
              className="rounded-2xl w-full shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-32 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              How does it work? <span className="gradient-text">Too simple.</span>
            </h2>
            <p className="text-xl text-gray-400">In 3 steps, your cafe becomes digital</p>
          </div>

     <div className="grid md:grid-cols-3 gap-8">
  {[
    { icon: CreditCard, title: '1. Select Plan', desc: 'Choose the perfect plan for your cafe and start your 14-day free trial', color: 'from-blue-600 to-cyan-600' },
    { icon: UserPlus, title: '2. Join Us', desc: 'Complete registration and get instant access to your dashboard', color: 'from-cyan-600 to-teal-600' },
    { icon: QrCode, title: '3. Start Working', desc: 'Print your QR codes, place them on tables, and start receiving orders', color: 'from-teal-600 to-green-600' }
  ].map((item, i) => (
    <div key={i} className="reveal glass rounded-3xl p-8 hover:scale-105 transition duration-300">
      <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mb-6`}>
        <item.icon size={32} />
      </div>
      <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
      <p className="text-gray-400">{item.desc}</p>
    </div>
  ))}
</div>

          {/* Trial Info */}
       

          <div className="mt-20 reveal">
            <div className="glass rounded-3xl p-12">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-3xl font-bold mb-6">
                    <span className="gradient-text">Intelligent</span> Dashboard
                  </h3>
                  <ul className="space-y-4">
                    {['Real-time statistics', 'Order management', 'Sales analysis', 'Automatic reports'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <Check className="text-green-400" size={24} />
                        <span className="text-lg">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="relative">
                  <div className="glass rounded-2xl p-6">
                    <TrendingUp className="text-blue-400 mb-4" size={48} />
                    <div className="space-y-3">
                      <div className="h-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full w-full"></div>
                      <div className="h-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full w-3/4"></div>
                      <div className="h-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full w-5/6"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
     {/* Why Us Section */}
      <section className="py-32 px-6 relative bg-gradient-to-b from-transparent to-blue-950/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Why <span className="gradient-text">choose CoffAI?</span>
            </h2>
            <p className="text-xl text-gray-400">Thousands of cafes trust us</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                icon: Zap, 
                title: '1 minute setup', 
                desc: 'Set up your digital cafe in less than 60 seconds. No technical skills required.',
                stat: '< 1 min'
              },
              { 
                icon: Coffee, 
                title: 'Easy to use', 
                desc: 'Intuitive interface for you and your customers. Free training included.',
                stat: '5/5'
              },
              { 
                icon: Star, 
                title: '20+ cafes trust us', 
                desc: 'Join the cafes that have already transformed their service with CoffAI.',
                stat: '20+'
              },
              { 
                icon: Check, 
                title: 'Zero installation', 
                desc: 'No software to install. Everything works directly from your browser.',
                stat: '100% Cloud'
              }
            ].map((item, i) => (
              <div key={i} className="reveal glass rounded-3xl p-8 hover:scale-105 transition duration-300 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                  <item.icon size={28} />
                </div>
                <div className="text-3xl font-bold gradient-text mb-3">{item.stat}</div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 reveal text-center">
            <div className="glass rounded-3xl p-12 inline-block">
              <div className="flex flex-wrap items-center justify-center gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold gradient-text mb-2">1000+</div>
                  <div className="text-gray-400">Orders processed</div>
                </div>
                <div className="hidden md:block w-px h-16 bg-white/10"></div>
                <div className="text-center">
                  <div className="text-4xl font-bold gradient-text mb-2">99.9%</div>
                  <div className="text-gray-400">Uptime</div>
                </div>
                <div className="hidden md:block w-px h-16 bg-white/10"></div>
                <div className="text-center">
                  <div className="text-4xl font-bold gradient-text mb-2">24/7</div>
                  <div className="text-gray-400">Customer support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
   <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto reveal">
            {/* Basic Plan */}
            <div className="glass rounded-3xl p-8 border border-gray-700/50 relative overflow-hidden hover:border-blue-500/30 transition-all">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-3">Basic</h3>
                <div className="flex items-end justify-center gap-2 mb-3">
                  <span className="text-5xl font-bold text-white">69</span>
                  <span className="text-xl text-gray-400 mb-2">TND/mo</span>
                </div>
                <p className="text-gray-400 text-sm">Perfect for small cafes</p>
              </div>

              <div className="space-y-3 mb-8">
                {[
                  'Admin dashboard',
                  'Orders management',
                  'Waiters management',
                  'QR code menu',
                  'Basic statistics',
                  'Up to 20 tables'
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="text-green-400 flex-shrink-0 mt-0.5" size={18} />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => {
                  const formSection = document.getElementById('form');
                  formSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-full font-semibold transition flex items-center justify-center gap-2"
              >
                Get started <ChevronRight size={18} />
              </button>
            </div>

            {/* Pro Plan with AI - Popular */}
            <div className="glass rounded-3xl p-8 border-2 border-blue-500/50 relative overflow-hidden hover:border-blue-500 transition-all transform md:scale-105">
              <div className="absolute top-0 right-0 bg-gradient-to-br from-blue-600 to-cyan-600 text-white px-5 py-1.5 rounded-bl-2xl font-semibold text-sm">
                Most Popular
              </div>
              
              <div className="text-center mb-6 pt-3">
                <h3 className="text-2xl font-bold mb-3">Pro + AI</h3>
                <div className="flex items-end justify-center gap-2 mb-3">
                  <span className="text-5xl font-bold gradient-text">139</span>
                  <span className="text-xl text-gray-400 mb-2">TND/mo</span>
                </div>
                <p className="text-gray-400 text-sm">AI-powered insights</p>
              </div>

              <div className="space-y-3 mb-8">
                {[
                  { text: 'Everything in Basic, plus:', highlight: true },
                  { text: '🤖 AI Analytics Agent', highlight: false, special: true },
                  { text: 'AI business insights', highlight: false },
                  { text: 'Auto recommendations', highlight: false },
                  { text: 'Real-time notifications', highlight: false },
                  { text: 'Advanced analytics', highlight: false },
                  { text: 'Product management', highlight: false },
                  { text: 'Custom branding', highlight: false },
                  { text: 'Up to 50 tables', highlight: false }
                ].map((feature, i) => (
                  <div key={i} className={`flex items-start gap-2 ${feature.highlight ? 'font-semibold text-blue-400' : ''}`}>
                    {feature.highlight ? (
                      <Star className="text-blue-400 flex-shrink-0 mt-0.5" size={18} />
                    ) : feature.special ? (
                      <Star className="text-cyan-400 flex-shrink-0 mt-0.5 animate-pulse" size={18} />
                    ) : (
                      <Check className="text-green-400 flex-shrink-0 mt-0.5" size={18} />
                    )}
                    <span className={`text-sm ${feature.special ? 'text-cyan-300 font-semibold' : 'text-gray-300'}`}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => {
                  const formSection = document.getElementById('form');
                  formSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 rounded-full font-semibold hover:scale-105 transition glow-btn flex items-center justify-center gap-2"
              >
                Start free trial <ChevronRight size={18} />
              </button>
            </div>

            {/* Customize Plan - New */}
            <div className="glass rounded-3xl p-8 border border-purple-500/50 relative overflow-hidden hover:border-purple-500 transition-all">
              <div className="absolute top-0 right-0 bg-gradient-to-br from-purple-600 to-pink-600 text-white px-5 py-1.5 rounded-bl-2xl font-semibold text-sm">
                Premium
              </div>
              
              <div className="text-center mb-6 pt-3">
                <h3 className="text-2xl font-bold mb-3">Customize</h3>
                <div className="flex items-end justify-center gap-2 mb-3">
                  <span className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">199</span>
                  <span className="text-xl text-gray-400 mb-2">TND/mo</span>
                </div>
                <p className="text-gray-400 text-sm">Full customization power</p>
              </div>

              <div className="space-y-3 mb-8">
                {[
                  { text: 'Everything in Pro, plus:', highlight: true },
                  { text: '🎨 Custom table themes', highlight: false, special: true },
                  { text: 'Upload custom photos', highlight: false, special: true },
                  { text: 'Branded table designs', highlight: false },
                  { text: 'Photo galleries', highlight: false },
                  { text: 'Visual menu builder', highlight: false },
                  { text: 'Multi-location support', highlight: false },
                  { text: 'Priority support', highlight: false },
                  { text: 'Unlimited tables', highlight: false }
                ].map((feature, i) => (
                  <div key={i} className={`flex items-start gap-2 ${feature.highlight ? 'font-semibold text-purple-400' : ''}`}>
                    {feature.highlight ? (
                      <Star className="text-purple-400 flex-shrink-0 mt-0.5" size={18} />
                    ) : feature.special ? (
                      <Star className="text-pink-400 flex-shrink-0 mt-0.5 animate-pulse" size={18} />
                    ) : (
                      <Check className="text-green-400 flex-shrink-0 mt-0.5" size={18} />
                    )}
                    <span className={`text-sm ${feature.special ? 'text-pink-300 font-semibold' : 'text-gray-300'}`}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => {
                  const formSection = document.getElementById('form');
                  formSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-full font-semibold hover:scale-105 transition flex items-center justify-center gap-2"
                style={{boxShadow: '0 0 30px rgba(168, 85, 247, 0.4)'}}
              >
                Contact us <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Trial Info */}
          <div className="max-w-2xl mx-auto mt-12 reveal">
            <div className="glass rounded-2xl p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Star size={20} />
                </div>
                <div className="font-bold text-lg">14-day free trial on all plans</div>
              </div>
              <p className="text-sm text-gray-400">
                No credit card required • Cancel anytime • Full access to all features
              </p>
            </div>
          </div>

          {/* Trial Info */}
        

      {/* Registration Form Section */}

      {/* Registration Form Section */}
      <section className="py-32 px-6 relative" id='form'>
        <div className="max-w-5xl mx-auto reveal">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Create your digital cafe now 
            </h2>
            <p className="text-xl text-gray-400">
              Fill out the form and start your 14-day free trial
            </p>
          </div>

          <RegistrationForm ref={registerRef}/>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 text-2xl font-bold mb-6">
            <Coffee className="text-blue-400" size={32} />
            <span className="gradient-text">CoffAI</span>
          </div>
          <p className="text-gray-400 mb-6">The digital solution for modern cafes</p>
          <p className="text-gray-500 mt-8">© 2025 CoffAI. Made in Tunisia</p>
        </div>
      </footer>

      {/* Video Modal */}
      {isVideoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6" onClick={() => setIsVideoOpen(false)}>
          <div className="glass rounded-3xl p-8 max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">CoffAI Demo</h3>
              <button onClick={() => setIsVideoOpen(false)}>
                <X size={32} />
              </button>
            </div>
            <div className="aspect-video bg-gradient-to-br from-blue-900 to-cyan-900 rounded-2xl flex items-center justify-center">
              <Play size={64} className="text-white/50" />
              <p className="text-white/50 ml-4">Demo video</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}