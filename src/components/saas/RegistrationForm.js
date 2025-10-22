import { useEffect, useState } from 'react';
import { ChevronRight, AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

export default function RegistrationForm() {
  const [formData, setFormData] = useState({
    nomCafe: '',
    nomPerson: '',
    email: '',
    phone: '',
    plan: 'basic',
    domaine: '',
  });
  const { hash } = useLocation();

 useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [hash]);
  const [errors, setErrors] = useState({});
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [captchaChallenge, setCaptchaChallenge] = useState({ num1: 0, num2: 0 });
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptchaChallenge({ num1, num2 });
    setCaptchaAnswer('');
    setCaptchaVerified(false);
  };

  const verifyCaptcha = (answer) => {
    setCaptchaAnswer(answer);
    const correct = parseInt(answer) === (captchaChallenge.num1 + captchaChallenge.num2);
    setCaptchaVerified(correct);
    return correct;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.nomCafe?.trim()) {
      newErrors.nomCafe = 'Nom du café requis';
    }

    if (!formData?.nomPerson?.trim()) {
      newErrors.nomPerson = 'Nom du propriétaire requis';
    }

    if (!formData?.email?.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (formData?.phone && !/^[\d\s+()-]{8,}$/.test(formData?.phone)) {
      newErrors.phone = 'Numéro de téléphone invalide';
    }

    if (!captchaVerified) {
      newErrors.captcha = 'Vérifiez le captcha';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
   axios.post('http://localhost:5000/add-new-form',formData)
    .then(r=>{
    setIsSubmitting(true);

    // Simulate API call
    setIsSubmitting(false);
    setSubmitSuccess(true);
    // setTimeout(() => {
      
    //   // Reset form after 3 seconds
    //   setTimeout(() => {
    //     setFormData({
    //       cafeName: '',
    //       ownerName: '',
    //       email: '',
    //       phone: '',
    //       plan: 'basic',
    //       customDomain: '',
    //       acceptTerms: false
    //     });
    //     setSubmitSuccess(false);
    //     generateCaptcha();
    //   }, 3000);
    // }, 2000);

    })
    .catch(err=>console.log(err))
  };

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

  if (submitSuccess) {
    return (
      <div className="glass rounded-3xl p-12 text-center" id='form'>
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <CheckCircle2 size={48} />
        </div>
        <h3 className="text-3xl font-bold mb-4 gradient-text">Inscription réussie ! 🎉</h3>
        <p className="text-xl text-gray-400 mb-6">
          Bienvenue chez Caffin, {formData.nomPerson} !
        </p>
        <p className="text-gray-500">
          Nous vous contacterons sur <strong className="text-blue-400">{formData.email}</strong>
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-8 md:p-12">
      <style>{`
        .gradient-text {
          background: linear-gradient(90deg, #3b82f6, #06b6d4, #0ea5e9);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradient-shift 3s ease infinite;
        }

        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .glass {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.4); }
          50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.8); }
        }

        .glow-btn {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-300">
            Nom du café <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="nomCafe"
            value={formData.nomCafe}
            onChange={handleChange}
            placeholder="Ex: Café des Arts"
            className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${errors.nomCafe ? 'border-red-500' : 'border-white/10'} text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition`}
          />
          {errors.nomCafe && (
            <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
              <AlertCircle size={14} /> {errors.nomCafe}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-300">
            Nom du propriétaire <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="nomPerson"
            value={formData.nomPerson}
            onChange={handleChange}
            placeholder="Ex: Ahmed Ben Salem"
            className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${errors.nomPerson ? 'border-red-500' : 'border-white/10'} text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition`}
          />
          {errors.nomPerson && (
            <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
              <AlertCircle size={14} /> {errors.nomPerson}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-300">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="contact@votrecafe.com"
            className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${errors.email ? 'border-red-500' : 'border-white/10'} text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition`}
          />
          {errors.email && (
            <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
              <AlertCircle size={14} /> {errors.email}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-300">
            Téléphone <span className="text-gray-500">(optionnel)</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+216 XX XXX XXX"
            className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${errors.phone ? 'border-red-500' : 'border-white/10'} text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition`}
          />
          {errors.phone && (
            <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
              <AlertCircle size={14} /> {errors.phone}
            </p>
          )}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold mb-3 text-gray-300">
          Choisissez votre plan <span className="text-red-400">*</span>
        </label>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { value: 'basic', name: 'Basic', price: '39 TND', features: '20 tables max' },
            { value: 'pro', name: 'Pro', price: '59 TND', features: '50 tables + AI', popular: true },
            { value: 'premium', name: 'Premium', price: '99 TND', features: 'Illimité + Support 24/7' }
          ].map(plan => (
            <label
              key={plan.value}
              className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition ${
                formData.plan === plan.value
                  ? 'border-blue-600 bg-blue-600/10'
                  : 'border-white/10 bg-white/5 hover:border-blue-600/50'
              }`}
            >
              <input
                type="radio"
                name="plan"
                value={plan.value}
                checked={formData.plan === plan.value}
                onChange={handleChange}
                className="sr-only"
              />
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-cyan-600 text-xs px-3 py-1 rounded-full font-semibold">
                  Populaire
                </span>
              )}
              <span className="text-lg font-bold mb-1">{plan.name}</span>
              <span className="text-2xl font-bold gradient-text mb-2">{plan.price}</span>
              <span className="text-sm text-gray-400">{plan.features}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2 text-gray-300">
          Domaine personnalisé <span className="text-gray-500">(optionnel)</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            name="domaine"
            value={formData.domaine}
            onChange={handleChange}
            placeholder="votrecafe"
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
          />
          <span className="text-gray-400">.cafeapp.tn</span>
        </div>
        <p className="text-gray-500 text-sm mt-1">Laissez vide pour un domaine automatique</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2 text-gray-300">
          Vérification anti-robot <span className="text-red-400">*</span>
        </label>
        <div className="flex items-center gap-4">
          <div className="glass px-6 py-4 rounded-xl flex items-center gap-3 font-mono text-xl">
            <Shield className="text-blue-400" size={24} />
            <span>{captchaChallenge.num1} + {captchaChallenge.num2} = ?</span>
          </div>
          <input
            type="number"
            value={captchaAnswer}
            onChange={(e) => verifyCaptcha(e.target.value)}
            placeholder="?"
            className={`w-24 px-4 py-3 rounded-xl bg-white/5 border ${
              captchaAnswer && !captchaVerified ? 'border-red-500' : captchaVerified ? 'border-green-500' : 'border-white/10'
            } text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-600 transition`}
          />
          <button
            type="button"
            onClick={generateCaptcha}
            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
            title="Recharger"
          >
            🔄
          </button>
        </div>
        {errors.captcha && (
          <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
            <AlertCircle size={14} /> {errors.captcha}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className={`w-full bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-4 rounded-xl text-lg font-semibold transition ${
          isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] glow-btn'
        }`}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Inscription en cours...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            Créer mon café digital <ChevronRight />
          </span>
        )}
      </button>

      <p className="text-center text-gray-500 text-sm mt-4">
        ✨ Essai gratuit de 14 jours • Sans carte bancaire • Annulation à tout moment
      </p>
    </div>
  )}