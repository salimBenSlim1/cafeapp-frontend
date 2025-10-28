import { useState } from 'react';
import { Coffee, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate=useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!formData.password) {
      newErrors.password = 'Mot de passe requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Minimum 6 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    axios.post(`${process.env.REACT_APP_API_URL}/login`,formData)
    .then(r=>{
      localStorage.setItem('token',r.data.apiKey)
      setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setLoginSuccess(true);
      
      setTimeout(() => {
        navigate('/admin')
      }, 2000);
    }, 1500);
    })
    .catch(err=>console.log(err))
  };

  if (loginSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-6">
        <div className="glass rounded-3xl p-12 text-center max-w-md w-full animate-in">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle2 size={48} />
          </div>
          <h3 className="text-3xl font-bold mb-4 gradient-text">Connexion réussie ! 🎉</h3>
          <p className="text-xl text-gray-400 mb-6">
            Bienvenue sur CoffAI
          </p>
          <p className="text-gray-500">
            Redirection vers votre dashboard...
          </p>
          <div className="mt-6">
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-600 animate-progress"></div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes progress {
            from { width: 0%; }
            to { width: 100%; }
          }
          .animate-progress {
            animation: progress 2s ease-out forwards;
          }
          .animate-in {
            animation: slideIn 0.5s ease-out;
          }
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: scale(0.9) translateY(20px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white overflow-hidden">
      <style>{`
        @keyframes floating {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
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

        .floating {
          animation: floating 3s ease-in-out infinite;
        }

        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.4); }
          50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.8); }
        }

        .glow-btn {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>

      <div className="fixed inset-0 grid-bg"></div>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 floating"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 floating" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 floating" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="fixed top-6 left-6 z-50">
        <button onClick={() => window.history.back()} className="glass px-4 py-2 rounded-full flex items-center gap-2 hover:scale-105 transition">
          <ArrowLeft size={20} />
          <span className="hidden sm:inline">Retour</span>
        </button>
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 text-3xl font-bold mb-4">
              <Coffee className="text-blue-400" size={40} />
              <span className="gradient-text">CoffAI</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">
              Bon retour !
            </h1>
            <p className="text-gray-400">
              Connectez-vous à votre dashboard
            </p>
          </div>

          <div className="glass rounded-3xl p-8 mb-6">
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2 text-gray-300">
                Email <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="votreemail@example.com"
                  className={`w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border ${
                    errors.email ? 'border-red-500' : 'border-white/10'
                  } text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition`}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} /> {errors.email}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2 text-gray-300">
                Mot de passe <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-12 py-3 rounded-xl bg-white/5 border ${
                    errors.password ? 'border-red-500' : 'border-white/10'
                  } text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} /> {errors.password}
                </p>
              )}
            </div>

       

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className={`w-full bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 rounded-xl text-lg font-semibold transition ${
                isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] glow-btn'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Connexion...
                </span>
              ) : (
                <span>Se connecter</span>
              )}
            </button>
          </div>

          <div className="text-center glass rounded-2xl p-4">
            <p className="text-gray-400">
              Vous n'avez pas de compte ?
              {' '}
              <button
                onClick={() => navigate('/#form')}
                className="text-blue-400 hover:text-blue-300 font-semibold transition"
              >
                S'inscrire
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}