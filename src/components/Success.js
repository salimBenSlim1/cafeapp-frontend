import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [showSucc,setShowSucc]=useState(true)
  const [showConfetti, setShowConfetti] = useState(true);
  const location = useLocation();
const queryParams = new URLSearchParams(location.search);
const ref = queryParams.get("ref");
  useEffect(()=>{
    axios.get('https://api.sandbox.konnect.network/api/v2/payments/'+ref)
    .then(r=>{if(r?.data?.payment?.transactions[0]?.status=='failed_payment') navigate('/cancel')
    else setShowSucc(false)

    })
    .catch(err=>console.log(err))

  })

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    showSucc?
    (<div style={{ textAlign: 'center' }}>
  <div style={{ /* spinner styles */ }} />
  <p style={{ marginTop: '16px', color: '#666' }}>Loading...</p>
</div>)
:
    (<div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-900 p-8 flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-green-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                backgroundColor: ['#10b981', '#14b8a6', '#22c55e', '#84cc16', '#fbbf24'][Math.floor(Math.random() * 5)],
                animation: `fall ${2 + Math.random() * 3}s linear forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            />
          ))}
        </div>
      )}

      <div className="max-w-2xl w-full relative z-10">
        {/* Success Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
          {/* Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur-xl opacity-20"></div>
          
          <div className="relative">
            {/* Success Icon with Animation */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/50 animate-scaleIn">
                  <svg className="w-16 h-16 text-white animate-checkmark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {/* Ripple Effect */}
                <div className="absolute inset-0 rounded-full border-4 border-emerald-400 animate-ping opacity-75"></div>
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center mb-8">
              <h1 className="text-5xl font-bold text-white mb-4 animate-fadeInUp">
                Payment Successful!
              </h1>
              <p className="text-xl text-emerald-300 mb-2 animate-fadeInUp" style={{animationDelay: '0.1s'}}>
                Thank you for your purchase
              </p>
              <p className="text-slate-400 animate-fadeInUp" style={{animationDelay: '0.2s'}}>
                Your order has been confirmed and is being processed
              </p>
            </div>

            {/* Order Details */}
            <div className="bg-slate-900/50 rounded-2xl p-6 mb-8 border border-emerald-500/20 animate-fadeInUp" style={{animationDelay: '0.3s'}}>
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-700">
                <span className="text-slate-400">Order Number</span>
                <span className="text-white font-mono font-semibold">#ORD-{Math.floor(Math.random() * 10000)}</span>
              </div>
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-700">
                <span className="text-slate-400">Transaction ID</span>
                <span className="text-white font-mono text-sm">{Math.random().toString(36).substring(2, 15)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Payment Method</span>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-6 bg-gradient-to-r from-blue-600 to-blue-400 rounded"></div>
                  <span className="text-white">•••• 4242</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 animate-fadeInUp" style={{animationDelay: '0.4s'}}>
              <button
                onClick={() => navigate('/orders')}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transform hover:scale-105 transition-all duration-300 shadow-lg shadow-emerald-500/30"
              >
                View Order Details
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 bg-slate-700/50 text-white px-8 py-4 rounded-xl font-semibold hover:bg-slate-600/50 transform hover:scale-105 transition-all duration-300 border border-slate-600"
              >
                Back to Home
              </button>
            </div>

            {/* Additional Info */}
            <div className="mt-8 text-center text-slate-400 text-sm animate-fadeInUp" style={{animationDelay: '0.5s'}}>
              <p>A confirmation email has been sent to your registered email address</p>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl"></div>
      </div>

      <style>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes checkmark {
          0% {
            stroke-dasharray: 50;
            stroke-dashoffset: 50;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-scaleIn {
          animation: scaleIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .animate-checkmark {
          animation: checkmark 0.6s ease-out 0.3s both;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out both;
        }
      `}</style>
    </div>)
    
  );
}