import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Coffee, Mail, Phone, Globe, CreditCard, User, AlertCircle, Loader2, X, Eye } from 'lucide-react'

const GetInfos = () => {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [creatingId, setCreatingId] = useState(null)
    const [successMessage, setSuccessMessage] = useState(null)
    const [coffe, setCoffe] = useState([])
    const [showPaymentsModal, setShowPaymentsModal] = useState(false)
    const [loadingPayments, setLoadingPayments] = useState(false)

    useEffect(() => {
       
        fetchPayments()
        fetchData()
    }, [])

    const fetchPayments = () => {
        setLoadingPayments(true)
        axios.get('http://localhost:5000/getPayments')
            .then(r => {
                setCoffe(r.data)
                setLoadingPayments(false)
            })
            .catch(err => {
                console.log(err)
                setLoadingPayments(false)
            })
    }

    const fetchData = () => {
        setLoading(true)
        setError(null)
        axios.get(`${process.env.REACT_APP_API_URL}/getForms`)
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
        
        axios.post(`${process.env.REACT_APP_API_URL}/create`, e)
            .then(r => {
                console.log(r.data)
                setSuccessMessage(`Café "${e.cafeName}" créé avec succès!`)
                setCreatingId(null)
                setTimeout(() => setSuccessMessage(null), 5000)
            })
            .catch(err => {
                console.log(err)
                setError(err.response?.data?.message || 'Erreur lors de la création du café. Veuillez réessayer.')
                setCreatingId(null)
            })
    }

   const PaymentsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <CreditCard className="w-7 h-7" />
                    Cafés et Paiements ({coffe.length})
                </h2>
                <button
                    onClick={() => setShowPaymentsModal(false)}
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                {loadingPayments ? (
                    <div className="text-center py-12">
                        <Loader2 className="w-12 h-12 text-amber-600 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Chargement des paiements...</p>
                    </div>
                ) : coffe.length === 0 ? (
                    <div className="text-center py-12">
                        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg">Aucun paiement trouvé</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {coffe.map((cafe, index) => (
                            <div
                                key={index}
                                className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow bg-gradient-to-r from-white to-amber-50"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-amber-500 p-3 rounded-lg">
                                            <Coffee className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800">
                                                {cafe.cafeName || 'Nom non disponible'}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {cafe.email || 'Email non disponible'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                                        cafe.plan === 'VIP'
                                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                            : cafe.plan === 'Basic'
                                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                                            : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                                    }`}>
                                        {cafe.plan || 'Plan inconnu'}
                                    </span>
                                </div>

                                {/* Cafe Details */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div className="bg-white rounded-lg p-4 shadow-sm">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Domaine</p>
                                        <p className="text-gray-800 font-medium font-mono text-sm">
                                            {cafe.domaine || 'Non défini'}.cafeapp.tn
                                        </p>
                                    </div>
                                    
                                    <div className="bg-white rounded-lg p-4 shadow-sm">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Paiements</p>
                                        <p className="text-gray-800 font-bold text-lg">
                                            {cafe.payments?.length || 0}
                                        </p>
                                    </div>

                                    <div className="bg-white rounded-lg p-4 shadow-sm">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Montant Total</p>
                                        <p className="text-gray-800 font-bold text-lg text-green-600">
                                            {cafe.payments?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0).toFixed(2)} DT
                                        </p>
                                    </div>
                                </div>

                                {/* Payments History */}
                                {cafe.payments && cafe.payments.length > 0 ? (
                                    <div className="mt-4">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                            <CreditCard className="w-4 h-4" />
                                            Historique des Paiements
                                        </h4>
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {cafe.payments.map((payment, pIndex) => (
                                                <div 
                                                    key={pIndex}
                                                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-amber-300 transition-colors"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${
                                                                payment.status === 'completed' ? 'bg-green-500' :
                                                                payment.status === 'pending' ? 'bg-yellow-500' :
                                                                'bg-red-500'
                                                            }`}></div>
                                                            <span className="text-sm font-medium text-gray-700">
                                                                Paiement #{pIndex + 1}
                                                            </span>
                                                        </div>
                                                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                                                            payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                            {payment.status === 'completed' ? 'Complété' :
                                                             payment.status === 'pending' ? 'En attente' : 'Échoué'}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        <div>
                                                            <p className="text-gray-500 text-xs mb-1">Montant</p>
                                                            <p className="font-semibold text-gray-800">
                                                                {payment.amount} DT
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500 text-xs mb-1">Date</p>
                                                            <p className="font-medium text-gray-800">
                                                                {payment.DateOfPayment ? new Date(payment.DateOfPayment).toLocaleDateString('fr-FR', {
                                                                    day: '2-digit',
                                                                    month: 'short',
                                                                    year: 'numeric'
                                                                }) : 'N/A'}
                                                            </p>
                                                        </div>
                                                        {payment.transactionId && (
                                                            <div className="col-span-2">
                                                                <p className="text-gray-500 text-xs mb-1">ID Transaction</p>
                                                                <p className="font-mono text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                                                    {payment.transactionId}
                                                                </p>
                                                            </div>
                                                        )}
                                                        {payment.method && (
                                                            <div>
                                                                <p className="text-gray-500 text-xs mb-1">Méthode</p>
                                                                <p className="font-medium text-gray-700">
                                                                    {payment.method}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center mt-4">
                                        <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-600 text-sm">Aucun paiement enregistré</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
)

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
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                                <Coffee className="w-8 h-8 text-amber-600" />
                                Gestion des Cafés - Admin Panel
                            </h1>
                            <p className="text-gray-600 mt-2">
                                {data.length} inscription{data.length > 1 ? 's' : ''} en attente
                            </p>
                        </div>
                        <button
                            onClick={() => setShowPaymentsModal(true)}
                            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                        >
                            <Eye className="w-5 h-5" />
                            Voir Paiements
                        </button>
                    </div>
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

            {/* Payments Modal */}
            {showPaymentsModal && <PaymentsModal />}
        </div>
    )
}

export default GetInfos