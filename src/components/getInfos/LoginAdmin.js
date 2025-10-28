import React, { useState } from 'react'
import { Coffee, Lock, Mail, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const AdminLogin = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/loginAdmin`, {
                email,
                password
            })

            // Store token in localStorage
            localStorage.setItem('adminToken', response.data.data)
            
            // Redirect to dashboard
            navigate('/getInfo')
        } catch (err) {
            setError(err.response?.data?.message || 'Email ou mot de passe incorrect')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center px-4">
            <style>{`
                @keyframes floating {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
                
                .floating {
                    animation: floating 3s ease-in-out infinite;
                }

                .glass {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
            `}</style>

            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 floating"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 floating" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Login Card */}
            <div className="glass rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Coffee className="w-12 h-12 text-blue-400" />
                        <h1 className="text-4xl font-bold text-white">Caffin</h1>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Admin Panel</h2>
                    <p className="text-gray-400">Connectez-vous pour gérer les cafés</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-100 text-sm">{error}</p>
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email Input */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="admin@caffin.tn"
                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                            Mot de passe
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                            loading
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl'
                        }`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Connexion en cours...
                            </>
                        ) : (
                            'Se connecter'
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-gray-500 text-sm">
                        © 2025 Caffin Admin Panel
                    </p>
                </div>
            </div>
        </div>
    )
}

export default AdminLogin