import { useState, useEffect } from 'react';
import { LayoutDashboard, Package, ShoppingCart, Sparkles, QrCode, TrendingUp, Lock, CreditCard, Check, Star, AlertCircle, Loader2 } from 'lucide-react';

export default function ProtectedAdminDashboard() {
  const [isPaid, setIsPaid] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [userPlan, setUserPlan] = useState("basic");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  // Vérifier le statut de paiement au chargement
  useEffect(() => {
    // checkPaymentStatus();
  }, []);

  const checkPaymentStatus = async () => {
    setIsLoading(true);
    try {
      // Remplacer par votre API call
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/checkPaymentStatus`, {
        headers: {
          'x-api-key': `${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      console.log(data,'ze')
      setIsPaid(data.Cafe.verifiedPayment);
      setUserPlan(data.Cafe.plan);
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking payment:', error);
      setIsLoading(false);
      setIsPaid(false);
    }
  };

  const handlePayment = async (planName, price) => {
    setProcessingPayment(true);
    try {
      // Remplacer par votre logique de paiement
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': `${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: price*1000
        })
      });
      
      const data = await response.json();
      console.log(data)
      if (data.payUrl) {
        // Rediriger vers la page de paiement
        window.location.href = data.payUrl;
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Erreur lors du traitement du paiement. Veuillez réessayer.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const menuItems = [
    {
      id: 1,
      title: 'Items',
      description: 'Manage menu items & inventory',
      path: '/admin/items',
      icon: Package,
      gradient: 'from-blue-500 to-blue-700',
      glowColor: 'blue-500'
    },
    {
      id: 2,
      title: 'Dashboard',
      description: 'Analytics & insights',
      path: '/admin/charts',
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-teal-600',
      glowColor: 'emerald-500'
    },
    {
      id: 3,
      title: 'Orders',
      description: 'View & manage orders',
      path: '/admin/orders',
      icon: ShoppingCart,
      gradient: 'from-purple-500 to-purple-700',
      glowColor: 'purple-500'
    },
    {
      id: 4,
      title: 'AI Agent',
      description: 'Smart assistant & automation',
      path: '/admin/agent',
      icon: Sparkles,
      gradient: 'from-indigo-500 to-indigo-700',
      glowColor: 'indigo-500'
    },
    {
      id: 5,
      title: 'QR Codes',
      description: 'Generate table QR codes',
      path: '/admin/qrcode',
      icon: QrCode,
      gradient: 'from-pink-500 to-rose-600',
      glowColor: 'pink-500'
    }
  ];

  const pricingPlans = [
    {
      name: 'Basic',
      price: 39,
      features: ['Jusqu\'à 20 tables', 'Menu QR illimité', 'Dashboard simple', 'Support par email'],
      color: 'from-blue-600 to-cyan-600'
    },
    {
      name: 'VIP',
      price: 59,
      features: ['Tables illimitées', 'QR personnalisés', 'AI Insights avancés', 'Support prioritaire 24/7', 'Thèmes premium'],
      color: 'from-purple-600 to-pink-600',
      popular: true
    }
  ];

  // Écran de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-300 text-lg">Vérification du statut de paiement...</p>
        </div>
      </div>
    );
  }

  // Écran de paiement requis
  if (!isPaid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        {/* Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Warning Header */}
          <div className="mb-12 text-center animate-fadeIn">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full mb-6 shadow-lg shadow-amber-500/50">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">
              Accès <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Restreint</span>
            </h1>
            <p className="text-slate-400 text-xl max-w-2xl mx-auto">
              Pour accéder à votre dashboard admin et gérer votre café, veuillez choisir un plan et effectuer votre paiement.
            </p>
          </div>

          {/* Alert Banner */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 mb-12 backdrop-blur-xl">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-2">Paiement Mensuel Requis</h3>
                <p className="text-slate-300 text-sm">
                  Votre compte sera activé immédiatement après réception du paiement. 
                  Le paiement est mensuel et doit être renouvelé pour maintenir l'accès.
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Plans */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {pricingPlans.map((plan, i) => (
              <div 
                key={i} 
                className={`relative glass rounded-3xl p-8 hover:scale-105 transition-all duration-300 ${
                  plan.popular ? 'ring-2 ring-blue-500 shadow-2xl shadow-blue-500/20' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-2 rounded-full flex items-center gap-2 shadow-lg">
                      <Star size={16} fill="currentColor" className="text-white" />
                      <span className="font-semibold text-white">Populaire</span>
                    </div>
                  </div>
                )}

                <h3 className="text-3xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className={`text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${plan.color}`}>
                    {plan.price}
                  </span>
                  <span className="text-slate-400 ml-2">TND/mois</span>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-slate-300">
                      <Check className="text-green-400 flex-shrink-0" size={20} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePayment(plan.name, plan.price)}
                  disabled={processingPayment}
                  className={`w-full bg-gradient-to-r ${plan.color} px-6 py-4 rounded-full font-semibold text-white hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  {processingPayment ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Payer maintenant
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Features Preview (Locked) */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-white text-center mb-8">
              Fonctionnalités Disponibles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-50 pointer-events-none">
              {menuItems.slice(0, 3).map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.id} className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                    <div className={`w-16 h-16 mb-4 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-slate-400 text-sm">{item.description}</p>
                    
                    {/* Lock Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="w-12 h-12 text-slate-600" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.8s ease-out;
          }
          .glass {
            background: rgba(30, 41, 59, 0.5);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(148, 163, 184, 0.1);
          }
        `}</style>
      </div>
    );
  }

  // Dashboard Normal (après paiement)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="mb-16 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg shadow-blue-500/50">
                <LayoutDashboard className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-emerald-400 text-sm font-medium">System Online</span>
                  </div>
                </div>
                <h1 className="text-5xl font-bold text-white tracking-tight">
                  Admin Dashboard
                </h1>
                <p className="text-slate-400 mt-2">
                  Welcome back! Manage your café operations from one central hub
                </p>
              </div>
            </div>

            {/* Plan Badge */}
            {userPlan && (
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 rounded-full shadow-lg">
                <span className="text-white font-semibold">Plan: {userPlan}</span>
              </div>
            )}
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => window.location.href = item.path}
                onMouseEnter={() => setHoveredCard(item.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className="group relative cursor-pointer"
                style={{
                  animation: `slideUp 0.6s ease-out ${index * 0.1}s both`
                }}
              >
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${item.gradient} rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500`}></div>
                
                <div className={`relative h-full bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 transition-all duration-500 ${
                  hoveredCard === item.id ? 'transform scale-105 shadow-2xl' : ''
                }`}>
                  <div className={`relative w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg transition-transform duration-500 ${
                    hoveredCard === item.id ? 'rotate-12 scale-110' : ''
                  }`}>
                    <Icon className="w-10 h-10 text-white" />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all duration-300">
                      {item.title}
                    </h3>
                    
                    <p className="text-slate-400 text-sm leading-relaxed mb-4">
                      {item.description}
                    </p>

                    <div className={`flex items-center gap-2 text-slate-500 group-hover:text-white transition-all duration-300 ${
                      hoveredCard === item.id ? 'translate-x-2' : ''
                    }`}>
                      <span className="text-sm font-medium">View Details</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>

                  <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg className="w-32 h-32 text-white" fill="currentColor" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 text-center hover:bg-slate-800/50 transition-colors">
            <div className="text-3xl font-bold text-white mb-2">5</div>
            <div className="text-slate-400 text-sm">Active Modules</div>
          </div>
          <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 text-center hover:bg-slate-800/50 transition-colors">
            <div className="text-3xl font-bold text-emerald-400 mb-2">100%</div>
            <div className="text-slate-400 text-sm">System Health</div>
          </div>
          <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 text-center hover:bg-slate-800/50 transition-colors">
            <div className="text-3xl font-bold text-blue-400 mb-2">24/7</div>
            <div className="text-slate-400 text-sm">Support Available</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }
        .glass {
          background: rgba(30, 41, 59, 0.5);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(148, 163, 184, 0.1);
        }
      `}</style>
    </div>
  );
}