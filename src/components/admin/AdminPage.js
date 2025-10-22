import { useState } from 'react';
import { LayoutDashboard, Package, ShoppingCart, Sparkles, QrCode, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const [hoveredCard, setHoveredCard] = useState(null);

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
          <div className="flex items-center gap-3 mb-6">
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
                {/* Card Glow Effect */}
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${item.gradient} rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500`}></div>
                
                {/* Main Card */}
                <div className={`relative h-full bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 transition-all duration-500 ${
                  hoveredCard === item.id ? 'transform scale-105 shadow-2xl' : ''
                }`}>
                  {/* Icon Container */}
                  <div className={`relative w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg shadow-${item.glowColor}/50 transition-transform duration-500 ${
                    hoveredCard === item.id ? 'rotate-12 scale-110' : ''
                  }`}>
                    <Icon className="w-10 h-10 text-white" />
                    
                    {/* Shine Effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all duration-300">
                      {item.title}
                    </h3>
                    
                    <p className="text-slate-400 text-sm leading-relaxed mb-4">
                      {item.description}
                    </p>

                    {/* Arrow Icon */}
                    <div className={`flex items-center gap-2 text-slate-500 group-hover:text-white transition-all duration-300 ${
                      hoveredCard === item.id ? 'translate-x-2' : ''
                    }`}>
                      <span className="text-sm font-medium">View Details</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>

                  {/* Decorative Elements */}
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
      `}</style>
    </div>
  );
}