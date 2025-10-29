import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Coffee, Mail, Phone, Globe, CreditCard, User, AlertCircle, Loader2, Search, Trash2, Edit2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const GetInfos = () => {
    const [pendingData, setPendingData] = useState([])
    const [cafesData, setCafesData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [creatingId, setCreatingId] = useState(null)
    const [successMessage, setSuccessMessage] = useState(null)
    
    // Table states
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)
    const [editingDate, setEditingDate] = useState(null)
    const [updatingPayment, setUpdatingPayment] = useState(null)
    const [deletingId, setDeletingId] = useState(null)
    const [expandedCafe, setExpandedCafe] = useState(null)
    const [addingPaymentFor, setAddingPaymentFor] = useState(null)
    const [newPayment, setNewPayment] = useState({ amount: '', method: 'cash', status: 'success' })
    const navigate = useNavigate()
    
    useEffect(() => {
        fetchPendingForms()
        fetchCafes()
    }, [])

    const fetchPendingForms = () => {
        axios.get(`${process.env.REACT_APP_API_URL}/getForms`,{headers:{'token-jwt':localStorage.getItem('adminToken')}})
            .then(r => {
                setPendingData(r.data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setError('Erreur lors du chargement des inscriptions')
                setLoading(false)
                if(err?.response?.data?.redirectTo){
                    navigate('/login/admin')
                }
                
            })
    }

    const fetchCafes = () => {
        axios.get(process.env.REACT_APP_API_URL+'/getPayments',{headers:{'token-jwt':localStorage.getItem('adminToken')}})
            .then(r => {
                setCafesData(r.data)
            })
            .catch(err => {
                if(err?.response?.data?.redirectTo){
                    navigate('/login/admin')
                }
            })
    }

    const handleCreateCafe = (e, index) => {
        setCreatingId(index)
        setSuccessMessage(null)
        setError(null)  
        console.log(e)
        
        axios.post(`${process.env.REACT_APP_API_URL}/create`, e,{headers:{'token-jwt':localStorage.getItem('adminToken')}})
            .then(r => {
                setSuccessMessage(`Café "${e.nomCafe}" créé avec succès!`)
                setCreatingId(null)
                fetchPendingForms()
                fetchCafes()
                setTimeout(() => setSuccessMessage(null), 5000)
            })
            .catch(err => {
                setError(err.response?.data?.message || 'Erreur lors de la création')
                setCreatingId(null)
                if(err?.response?.data?.redirectTo){
                    navigate('/login/admin')
                }
            })
    }

    const handleDeleteCafe = (cafeId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce café?')) return
        
        setDeletingId(cafeId)
        axios.delete(`${process.env.REACT_APP_API_URL}/deleteCafe/${cafeId}`,{headers:{'token-jwt':localStorage.getItem('adminToken')}})
            .then(() => {
                setSuccessMessage('Café supprimé avec succès')
                fetchCafes()
                setDeletingId(null)
                setTimeout(() => setSuccessMessage(null), 3000)
            })
            .catch(err => {
                setError('Erreur lors de la suppression')
                setDeletingId(null)
                if(err?.response?.data?.redirectTo){
                    navigate('/login/admin')
                }
            })
    }

    const handleUpdatePaymentVerified = (cafeId) => {
        setUpdatingPayment(cafeId)
        axios.put(
            `${process.env.REACT_APP_API_URL}/updatePayment/${cafeId}`,
            {}, // empty body
            {
                headers: {
                    'token-jwt': localStorage.getItem('adminToken'),
                },
            }
        )
            .then(() => {
                setSuccessMessage('Paiement vérifié avec succès')
                fetchCafes()
                setUpdatingPayment(null)
                setTimeout(() => setSuccessMessage(null), 3000)
            })
            .catch(err => {
                setError('Erreur lors de la mise à jour')
                setUpdatingPayment(null)
                if(err?.response?.data?.redirectTo){
                    navigate('/login/admin')
                }
            })
    }

    const handleUpdateapiKeyExpiresAt = (cafeId, newDate) => {
        axios.put(`${process.env.REACT_APP_API_URL}/updateCreatedAt/${cafeId}`, { createdAt: newDate },{headers:{'token-jwt':localStorage.getItem('adminToken')}})
            .then(() => {
                setSuccessMessage('Date mise à jour')
                fetchCafes()
                setEditingDate(null)
                setTimeout(() => setSuccessMessage(null), 3000)
            })
            .catch(err => {
                setError('Erreur lors de la mise à jour de la date')
                if(err?.response?.data?.redirectTo){
                    navigate('/login/admin')
                }
            })
    }
    const handleDeletePayment=(id)=>{
        axios.delete(process.env.REACT_APP_API_URL+'/deleteUserPayment/'+id,{headers:{
            'token-jwt':localStorage.getItem('adminToken')
        }})
        .then(r=>fetchCafes())
        .catch(err=>console.log(err))
    }
    const handleAddPayment = (cafeId) => {
        if (!newPayment.amount || parseFloat(newPayment.amount) <= 0) {
            setError('Montant invalide')
            setTimeout(() => setError(null), 3000)
            return
        }

        setAddingPaymentFor(cafeId)
        axios.post(
            `${process.env.REACT_APP_API_URL}/createUserPayment`,
            {
                amount: parseFloat(newPayment.amount),
                method: newPayment.method,
                status: newPayment.status,
                DateOfPayment: new Date().toISOString(),
                cafeId
            },
            { headers: { 'token-jwt': localStorage.getItem('adminToken') } }
        )
            .then(() => {
                setSuccessMessage('Paiement ajouté avec succès')
                fetchCafes()
                setAddingPaymentFor(null)
                setNewPayment({ amount: '', method: 'cash', status: 'success' })
                setTimeout(() => setSuccessMessage(null), 3000)
            })
            .catch(err => {
                setError(err.response?.data?.message || 'Erreur lors de l\'ajout du paiement')
                setAddingPaymentFor(null)
                if(err?.response?.data?.redirectTo){
                    navigate('/login/admin')
                }
            })
    }

    // Filter and pagination logic
    const filteredCafes = cafesData.filter(cafe => 
        cafe.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cafe.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentCafes = filteredCafes.slice(indexOfFirstItem, indexOfLastItem)
    const totalPages = Math.ceil(filteredCafes.length / itemsPerPage)

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
                    <p className="text-white text-lg">Chargement...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 py-6 px-4">
            <div className="max-w-[1800px] mx-auto">
                {/* Header */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-6 border border-white/20">
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Coffee className="w-8 h-8 text-blue-400" />
                        Dashboard Admin
                    </h1>
                    <p className="text-gray-300 mt-2">
                        {pendingData.length} inscription{pendingData.length > 1 ? 's' : ''} en attente • {cafesData.length} café{cafesData.length > 1 ? 's' : ''} actif{cafesData.length > 1 ? 's' : ''}
                    </p>
                </div>

                {/* Success/Error Messages */}
                {successMessage && (
                    <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 mb-6 flex items-start gap-3 backdrop-blur">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <p className="text-green-100 font-medium">{successMessage}</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6 flex items-start gap-3 backdrop-blur">
                        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-100 font-medium">{error}</p>
                    </div>
                )}

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Left Side: Pending Registrations */}
                    <div className="xl:col-span-1">
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20 sticky top-6">
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                                <AlertCircle className="w-6 h-6 text-yellow-400" />
                                En Attente ({pendingData.length})
                            </h2>
                            
                            <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
                                {pendingData.length === 0 ? (
                                    <p className="text-gray-400 text-center py-8">Aucune inscription en attente</p>
                                ) : (
                                    pendingData.map((e, i) => (
                                        <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition">
                                            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                                <Coffee className="w-4 h-4 text-blue-400" />
                                                {e.nomCafe}
                                            </h3>
                                            
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2 text-gray-300">
                                                    <User className="w-4 h-4 text-blue-400" />
                                                    {e.nomPerson}
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-300">
                                                    <Mail className="w-4 h-4 text-blue-400" />
                                                    {e.email}
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-300">
                                                    <Mail className="w-4 h-4 text-blue-400" />
                                                    {e.password}
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-300">
                                                    <Phone className="w-4 h-4 text-blue-400" />
                                                    {e.phone}
                                                </div>
                                               
                                                <div className="flex items-center gap-2 text-gray-300">
                                                    <CreditCard className="w-4 h-4 text-blue-400" />
                                                    Plan: <span className="font-semibold text-blue-300">{e.plan}</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleCreateCafe({
                                                    cafeName: e.nomCafe,
                                                    email: e.email,
                                                    plan: e.plan,
                                                    phone:e.phone,
                                                    nomPerson:e.nomPerson
                                                }, i)}
                                                disabled={creatingId === i}
                                                className={`w-full mt-4 py-2 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                                                    creatingId === i
                                                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                                        : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700'
                                                }`}
                                            >
                                                {creatingId === i ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Création...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-4 h-4" />
                                                        Créer
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Cafes Table */}
                    <div className="xl:col-span-2">
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                            {/* Table Header */}
                            <div className="p-6 border-b border-white/20">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                        <Coffee className="w-6 h-6 text-blue-400" />
                                        Cafés Actifs ({filteredCafes.length})
                                    </h2>
                                </div>
                                
                                {/* Search Bar */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher par nom, email..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value)
                                            setCurrentPage(1)
                                        }}
                                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-white/5 border-b border-white/20">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Café</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Plan</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Paiements</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Vérifié</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Date Expiration</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {currentCafes.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                                    Aucun café trouvé
                                                </td>
                                            </tr>
                                        ) : (
                                            currentCafes.map((cafe, index) => (
                                                <React.Fragment key={index}>
                                                    <tr className="hover:bg-white/5 transition">
                                                        <td className="px-6 py-4">
                                                            <div>
                                                                <div className="font-semibold text-white">{cafe.name || 'N/A'}</div>
                                                                <div className="text-sm text-gray-400">{cafe.email || 'N/A'}</div>
                                                            </div>
                                                        </td>
                                                       
                                                        <td className="px-6 py-4">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                                cafe.plan === 'VIP' ? 'bg-purple-500/20 text-purple-300' :
                                                                cafe.plan === 'Basic' ? 'bg-blue-500/20 text-blue-300' :
                                                                'bg-green-500/20 text-green-300'
                                                            }`}>
                                                                {cafe.plan || 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <button
                                                                onClick={() => setExpandedCafe(expandedCafe === cafe.id ? null : cafe.id)}
                                                                className="flex items-center gap-2 hover:text-blue-400 transition"
                                                            >
                                                                <div>
                                                                    <div className="text-white font-semibold">{cafe.Payments?.length || 0} paiement{(cafe.Payments?.length || 0) > 1 ? 's' : ''}</div>
                                                                    <div className="text-xs text-green-400">
                                                                        {cafe.Payments?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0).toFixed(2)} DT
                                                                    </div>
                                                                </div>
                                                                {expandedCafe === cafe.id ? 
                                                                    <ChevronUp className="w-4 h-4 text-blue-400" /> : 
                                                                    <ChevronDown className="w-4 h-4 text-blue-400" />
                                                                }
                                                            </button>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {cafe.verifiedPayment === '1' ? (
                                                                <span className="flex items-center gap-1 text-green-400">
                                                                    <CheckCircle className="w-4 h-4" />
                                                                    Oui
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleUpdatePaymentVerified(cafe.id)}
                                                                    disabled={updatingPayment === cafe.id}
                                                                    className="flex items-center gap-1 text-yellow-400 hover:text-yellow-300 transition disabled:opacity-50"
                                                                >
                                                                    {updatingPayment === cafe.id ? (
                                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                                    ) : (
                                                                        <>
                                                                            <XCircle className="w-4 h-4" />
                                                                            Non
                                                                        </>
                                                                    )}
                                                                </button>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {editingDate === cafe.id ? (
                                                                <input
                                                                    type="datetime-local"
                                                                    defaultValue={cafe.apiKeyExpiresAt ? new Date(cafe.apiKeyExpiresAt).toISOString().slice(0, 16) : ''}
                                                                    onBlur={(e) => {
                                                                        if (e.target.value) {
                                                                            handleUpdateapiKeyExpiresAt(cafe.id, e.target.value)
                                                                        } else {
                                                                            setEditingDate(null)
                                                                        }
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            handleUpdateapiKeyExpiresAt(cafe.id, e.target.value)
                                                                        } else if (e.key === 'Escape') {
                                                                            setEditingDate(null)
                                                                        }
                                                                    }}
                                                                    className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                    autoFocus
                                                                />
                                                            ) : (
                                                                <button
                                                                    onClick={() => setEditingDate(cafe.id)}
                                                                    className="text-sm text-gray-300 hover:text-white transition flex items-center gap-1"
                                                                >
                                                                    {cafe.apiKeyExpiresAt ? new Date(cafe.apiKeyExpiresAt).toLocaleDateString('fr-FR', {
                                                                        day: '2-digit',
                                                                        month: 'short',
                                                                        year: 'numeric'
                                                                    }) : 'N/A'}
                                                                    <Edit2 className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <button
                                                                onClick={() => handleDeleteCafe(cafe.id)}
                                                                disabled={deletingId === cafe.id}
                                                                className="text-red-400 hover:text-red-300 transition disabled:opacity-50"
                                                            >
                                                                {deletingId === cafe.id ? (
                                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="w-5 h-5" />
                                                                )}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                    
                                                    {/* Expanded Payment Details Row */}
                                                    {expandedCafe === cafe.id && (
                                                        <tr>
                                                            <td colSpan="6" className="px-6 py-4 bg-white/5">
                                                                <div className="space-y-4">
                                                                    {/* Add Payment Form */}
                                                                    <div className="bg-white/5 border border-blue-500/30 rounded-lg p-4">
                                                                        <h4 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                                                                            <CreditCard className="w-4 h-4" />
                                                                            Ajouter un paiement
                                                                        </h4>
                                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                                            <div>
                                                                                <label className="text-xs text-gray-400 mb-1 block">Montant (DT)</label>
                                                                                <input
                                                                                    type="number"
                                                                                    step="0.01"
                                                                                    min="0"
                                                                                    placeholder="0.00"
                                                                                    value={newPayment.amount}
                                                                                    onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                                                                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="text-xs text-gray-400 mb-1 block">Méthode</label>
                                                                                <select
                                                                                    value={newPayment.method}
                                                                                    onChange={(e) => setNewPayment({...newPayment, method: e.target.value})}
                                                                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                >
                                                                                    <option value="cash">Cash</option>
                                                                                    <option value="card">Carte</option>
                                                                                    <option value="bank_transfer">Virement</option>
                                                                                    <option value="check">Chèque</option>
                                                                                </select>
                                                                            </div>
                                                                            <div>
                                                                                <label className="text-xs text-gray-400 mb-1 block">Statut</label>
                                                                                <select
                                                                                    value={newPayment.status}
                                                                                    onChange={(e) => setNewPayment({...newPayment, status: e.target.value})}
                                                                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                >
                                                                                    <option value="success">Succès</option>
                                                                                    <option value="pending">En attente</option>
                                                                                    <option value="cancel">Annulé</option>
                                                                                </select>
                                                                            </div>
                                                                            <div className="flex items-end">
                                                                                <button
                                                                                    onClick={() => handleAddPayment(cafe.id)}
                                                                                    disabled={addingPaymentFor === cafe.id || !newPayment.amount}
                                                                                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                                                >
                                                                                    {addingPaymentFor === cafe.id ? (
                                                                                        <>
                                                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                                                            Ajout...
                                                                                        </>
                                                                                    ) : (
                                                                                        <>
                                                                                            <CheckCircle className="w-4 h-4" />
                                                                                            Ajouter
                                                                                        </>
                                                                                    )}
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Payment History */}
                                                                    {cafe.Payments?.length > 0 && (
                                                                        <div>
                                                                            <h4 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                                                                                <CreditCard className="w-4 h-4" />
                                                                                Historique des paiements
                                                                            </h4>
                                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                                {cafe.Payments.map((payment, pIndex) => (
                                                                                    <div key={pIndex} className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition">
                                                                                        
                                                                                        {console.log(payment)}
                                                                                        <div className="flex items-center justify-between mb-2">
                                                                                            <span className="text-xs font-semibold text-gray-400">Paiement #{pIndex + 1}</span>
                                                                                            <span className="text-sm font-bold text-green-400">{parseFloat(payment.amount || 0).toFixed(2)} DT</span>
                                                                                            <span 
                                                                                            onClick={()=>handleDeletePayment(payment.id)}
                                                                                            className="text-sm font-bold text-red-400 cursor-pointer">X</span>
                                                                                            
                                                                                        </div>
                                                                                        <div className="space-y-1 text-xs text-gray-300">
                                                                                            {payment.method && (
                                                                                                <div>
                                                                                                    <span className="text-gray-500">Méthode:</span> {payment.method}
                                                                                                </div>
                                                                                            )}
                                                                                            {payment.status && (
                                                                                                <div>
                                                                                                    <span className="text-gray-500">Statut:</span> 
                                                                                                    <span className={`ml-1 font-semibold ${
                                                                                                        payment.status === 'success' ? 'text-green-400' :
                                                                                                        payment.status === 'pending' ? 'text-yellow-400' :
                                                                                                        'text-red-400'
                                                                                                    }`}>
                                                                                                        {payment.status}
                                                                                                    </span>
                                                                                                </div>
                                                                                            )}
                                                                                            <div>
                                                                                                <span className="text-gray-500">Date:</span> 
                                                                                                <span className="ml-1 font-semibold text-green-400">
                                                                                                    {new Date(payment?.DateOfPayment).toLocaleDateString('fr-FR', {
                                                                                                        day: '2-digit',
                                                                                                        month: 'short',
                                                                                                        year: 'numeric',
                                                                                                        hour: '2-digit',
                                                                                                        minute: '2-digit'
                                                                                                    })}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="p-6 border-t border-white/20 flex items-center justify-between">
                                    <p className="text-sm text-gray-400">
                                        Affichage {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, filteredCafes.length)} sur {filteredCafes.length}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <span className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white">
                                            {currentPage} / {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default GetInfos