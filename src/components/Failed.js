import React, { useState } from 'react';

export default function PaymentFailed() {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleTryAgain = () => {
    setIsRetrying(true);
    setTimeout(() => {
      window.location.href = '/checkout';
    }, 500);
  };

  const handleBackHome = () => {
    window.location.href = '/';
  };

  const handleContactSupport = () => {
    window.location.href = '/support';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-900 via-red-900 to-rose-900 p-8 flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-red-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="max-w-2xl w-full relative z-10">
        {/* Failed Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-red-500/30 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
          {/* Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-rose-500 rounded-3xl blur-xl opacity-20"></div>
          
          <div className="relative">
            {/* Failed Icon with Animation */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-lg shadow-red-500/50 animate-scaleIn">
                  <svg className="w-16 h-16 text-white animate-shake" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                {/* Pulse Effect */}
                <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-75"></div>
              </div>
            </div>

            {/* Failed Message */}
            <div className="text-center mb-8">
              <h1 className="text-5xl font-bold text-white mb-4 animate-fadeInUp">
                Payment Failed
              </h1>
              <p className="text-xl text-red-300 mb-2 animate-fadeInUp" style={{animationDelay: '0.1s'}}>
                We couldn't process your payment
              </p>
              <p className="text-slate-400 animate-fadeInUp" style={{animationDelay: '0.2s'}}>
                Don't worry, no charges were made to your account
              </p>
            </div>

            {/* Error Details */}
            <div className="bg-slate-900/50 rounded-2xl p-6 mb-8 border border-red-500/20 animate-fadeInUp" style={{animationDelay: '0.3s'}}>
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-2">Possible Reasons</h3>
                  <ul className="text-slate-400 text-sm space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                      <span>Insufficient funds in your account</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                      <span>Incorrect card details entered</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                      <span>Card expired or blocked</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                      <span>Network or connection issues</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Transaction Info */}
            <div className="bg-slate-900/30 rounded-xl p-4 mb-8 border border-slate-700/50 animate-fadeInUp" style={{animationDelay: '0.4s'}}>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Transaction Reference</span>
                <span className="text-slate-300 font-mono">TXN-{Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 animate-fadeInUp" style={{animationDelay: '0.5s'}}>
              <button
                onClick={handleTryAgain}
                disabled={isRetrying}
                className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-red-600 hover:to-rose-700 transform hover:scale-105 transition-all duration-300 shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {isRetrying ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Try Again</span>
                  </>
                )}
              </button>
              <button
                onClick={handleBackHome}
                className="flex-1 bg-slate-700/50 text-white px-8 py-4 rounded-xl font-semibold hover:bg-slate-600/50 transform hover:scale-105 transition-all duration-300 border border-slate-600"
              >
                Back to Home
              </button>
            </div>

            {/* Support Link */}
            <div className="mt-8 text-center animate-fadeInUp" style={{animationDelay: '0.6s'}}>
              <p className="text-slate-400 text-sm mb-3">
                Need help with your payment?
              </p>
              <button
                onClick={handleContactSupport}
                className="text-red-400 hover:text-red-300 font-medium text-sm underline transition-colors"
              >
                Contact Support Team
              </button>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-red-500/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-rose-500/10 rounded-full blur-2xl"></div>
      </div>

      <style>{`
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

        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
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

        .animate-shake {
          animation: shake 0.5s ease-in-out 0.3s 2;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out both;
        }
      `}</style>
    </div>
  );
}