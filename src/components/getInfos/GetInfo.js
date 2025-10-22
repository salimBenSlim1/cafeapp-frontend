import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Coffee, Mail, Phone, Globe, CreditCard, User, AlertCircle, Loader2 } from 'lucide-react'

const GetInfos = () => {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [creatingId, setCreatingId] = useState(null)
    const [successMessage, setSuccessMessage] = useState(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = () => {
        setLoading(true)
        setError(null)
        axios.get('http://localhost:5000/getForms')
            .then(r => {
                setData(r.data)
                setLoading(false)
            })
            .catch(err => {
                console.log(err)
                setError('Erreur lors du chargement des données. Veuillez réessayer.')
                setLoading(false)
            })
    }

    const handleSubmit = (e, index) => {
        setCreatingId(index)
        setSuccessMessage(null)
        setError(null)
        
        axios.post('http://localhost:5000/create', e)
            .then(r => {
                console.log(r.data)
                setSuccessMessage(`Café "${e.cafeName}" créé avec succès!`)
                setCreatingId(null)
                // Remove success message after 5 seconds
                setTimeout(() => setSuccessMessage(null), 5000)
            })
            .catch(err => {
                console.log(err)
                setError(err.response?.data?.message || 'Erreur lors de la création du café. Veuillez réessayer.')
                setCreatingId(null)
            })
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-amber-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-700 text-lg">Chargement des inscriptions...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border-l-4 border-amber-500">
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <Coffee className="w-8 h-8 text-amber-600" />
                        Gestion des Cafés - Admin Panel
                    </h1>
                    <p className="text-gray-600 mt-2">
                        {data.length} inscription{data.length > 1 ? 's' : ''} en attente
                    </p>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 mb-6 flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <p className="text-green-800 font-medium">{successMessage}</p>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-red-800 font-medium">{error}</p>
                            <button 
                                onClick={fetchData}
                                className="text-red-600 hover:text-red-700 underline text-sm mt-1"
                            >
                                Réessayer
                            </button>
                        </div>
                    </div>
                )}

                {/* Cafés List */}
                {data.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg">Aucune inscription en attente</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {data.map((e, i) => (
                            <div 
                                key={i} 
                                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100"
                            >
                                {/* Card Header */}
                                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Coffee className="w-5 h-5" />
                                        {e.nomCafe}
                                    </h2>
                                </div>

                                {/* Card Body */}
                                <div className="p-6 space-y-4">
                                    {/* Owner Info */}
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <User className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                        <span className="font-medium">{e.nomPerson}</span>
                                    </div>

                                    {/* Email */}
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <Mail className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                        <span className="text-sm break-all">{e.email}</span>
                                    </div>

                                    {/* Phone */}
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <Phone className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                        <span className="text-sm">{e.phone}</span>
                                    </div>

                                    {/* Domain */}
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <Globe className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                        <span className="text-sm font-mono bg-gray-100 px-3 py-1 rounded-full">
                                            {e.domaine}.cafeapp.tn
                                        </span>
                                    </div>

                                    {/* Plan */}
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <CreditCard className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                        <span className="text-sm">
                                            Plan: <span className="font-semibold text-amber-700">{e.plan}</span>
                                        </span>
                                    </div>

                                    {/* Warning Message */}
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                                        <p className="text-xs text-amber-800">
                                            <AlertCircle className="w-4 h-4 inline mr-1" />
                                            Paiement mensuel requis sinon désactivation
                                        </p>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        onClick={() => handleSubmit({
                                            cafeName: e.nomCafe,
                                            email: e.email,
                                            plan: e.plan,
                                            domaine: e.domaine
                                        }, i)}
                                        disabled={creatingId === i}
                                        className={`w-full mt-4 py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                                            creatingId === i
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-md hover:shadow-lg'
                                        }`}
                                    >
                                        {creatingId === i ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Création en cours...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                Créer le Café
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default GetInfos