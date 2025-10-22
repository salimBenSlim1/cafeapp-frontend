import React, { useEffect, useRef, useState } from 'react';
import { Coffee, Zap, TrendingUp, QrCode, Check, Star, ChevronRight, Menu, X, Play } from 'lucide-react';
import RegistrationForm from './RegistrationForm';
import { useNavigate } from 'react-router-dom';

// Mock RegistrationForm component since the original isn't provided


export default function CafeAppLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const pricingRef = useRef(null);
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

  const handlePayment = (amount) => {
    // Payment handler - kept from original
    console.log('Payment for:', amount);
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
            <span className="gradient-text">Caffin</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection(featuresRef)} className="hover:text-blue-400 transition">Comment ça marche</button>
            <button onClick={() => scrollToSection(pricingRef)} className="hover:text-blue-400 transition">Tarifs</button>
            <button 
            onClick={()=>navigate('/login')}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-2 rounded-full hover:scale-105 transition font-semibold">
              Essai Gratuit
            </button>
          </div>

          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden glass border-t border-white/10">
            <div className="px-6 py-4 space-y-4">
              <button onClick={() => scrollToSection(featuresRef)} className="block w-full text-left">Comment ça marche</button>
              <button onClick={() => scrollToSection(pricingRef)} className="block w-full text-left">Tarifs</button>
              <button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-2 rounded-full">
                Essai Gratuit
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
            <span className="text-blue-400">⚡ La révolution digitale des cafés</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Transformez votre café avec <br />
            <span className="gradient-text">Caffin</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Menu QR intelligent • Dashboard temps réel • Commandes instantanées<br/>
            Gérez votre café comme jamais auparavant 
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <button 
            className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-4 rounded-full text-lg font-semibold hover:scale-105 transition glow-btn flex items-center gap-2">
              Commencer Gratuitement <ChevronRight />
            </button>
            <button 
              onClick={() => setIsVideoOpen(true)}
              className="glass px-8 py-4 rounded-full text-lg font-semibold hover:scale-105 transition flex items-center gap-2"
            >
              <Play size={20} /> Voir la démo
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
              Comment ça marche ? <span className="gradient-text">Trop simple.</span>
            </h2>
            <p className="text-xl text-gray-400">En 3 étapes, votre café devient digital</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: QrCode, title: '1. Scanner le QR', desc: 'Le client scanne le code QR et accède au menu interactif', color: 'from-blue-600 to-cyan-600' },
              { icon: Coffee, title: '2. Commander', desc: 'Il passe sa commande directement, avec options et personnalisations', color: 'from-cyan-600 to-teal-600' },
              { icon: Zap, title: '3. Préparation', desc: 'Le serveur reçoit une notification et prépare la commande rapidement', color: 'from-blue-600 to-indigo-600' }
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

          <div className="mt-20 reveal">
            <div className="glass rounded-3xl p-12">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-3xl font-bold mb-6">
                    Dashboard <span className="gradient-text">intelligent</span>
                  </h3>
                  <ul className="space-y-4">
                    {['Statistiques en temps réel', 'Gestion des commandes', 'Analyse des ventes', 'Rapports automatiques'].map((item, i) => (
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
      <section ref={pricingRef} className="py-32 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Des tarifs <span className="gradient-text">transparents</span>
            </h2>
            <p className="text-xl text-gray-400">Choisissez l'offre qui vous convient</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              { 
                name: 'Basic', 
                price: '39000', 
                features: ['Jusqu\'à 20 tables', 'Menu QR illimité', 'Dashboard simple', 'Support par email'],
                color: 'from-blue-600 to-cyan-600'
              },
              { 
                name: 'VIP', 
                price: '59000', 
                features: ['Tables illimitées', 'QR personnalisés', 'AI Insights avancés', 'Support prioritaire 24/7', 'Thèmes premium'],
                color: 'from-blue-600 to-cyan-600',
                popular: true
              }
            ].map((plan, i) => (
              <div key={i} className={`reveal glass rounded-3xl p-8 relative ${plan.popular ? 'ring-2 ring-blue-500' : ''} hover:scale-105 transition duration-300`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-2 rounded-full flex items-center gap-2">
                      <Star size={16} fill="currentColor" />
                      <span className="font-semibold">Populaire</span>
                    </div>
                  </div>
                )}
                
                <h3 className="text-3xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold gradient-text">{plan.price}</span>
                  <span className="text-gray-400 ml-2">TND/mois</span>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3">
                      <Check className="text-green-400 flex-shrink-0" size={20} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button 
                onClick={() => handlePayment(plan.price)}
                className={`w-full bg-gradient-to-r ${plan.color} px-6 py-4 rounded-full font-semibold hover:scale-105 transition`}>
                  Commencer maintenant
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Form Section */}
      <section className="py-32 px-6 relative" id='form'>
        <div className="max-w-5xl mx-auto reveal">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Créez votre café digital maintenant 
            </h2>
            <p className="text-xl text-gray-400">
              Remplissez le formulaire et commencez votre essai gratuit de 14 jours
            </p>
          </div>

          <RegistrationForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 text-2xl font-bold mb-6">
            <Coffee className="text-blue-400" size={32} />
            <span className="gradient-text">Caffin</span>
          </div>
          <p className="text-gray-400 mb-6">La solution digitale pour les cafés modernes</p>
          <p className="text-gray-500 mt-8">© 2025 Caffin. Made in Tunisia</p>
        </div>
      </footer>

      {/* Video Modal */}
      {isVideoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6" onClick={() => setIsVideoOpen(false)}>
          <div className="glass rounded-3xl p-8 max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Démo Caffin</h3>
              <button onClick={() => setIsVideoOpen(false)}>
                <X size={32} />
              </button>
            </div>
            <div className="aspect-video bg-gradient-to-br from-blue-900 to-cyan-900 rounded-2xl flex items-center justify-center">
              <Play size={64} className="text-white/50" />
              <p className="text-white/50 ml-4">Vidéo de démonstration</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}