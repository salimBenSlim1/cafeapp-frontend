import { useState, useEffect } from 'react';
import { Users, Plus, Search, Printer, Edit2, Trash2, Eye, DollarSign, Calendar, ChevronDown, ChevronUp, X, Check, AlertCircle, Loader2, Table2, CheckCircle } from 'lucide-react';
import api from '../../api/axiosInstance';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react'; // or your icon libraryRéessayerClaude n'a pas encore la capacité d'exécuter le code qu'il génère.

import {
  Box,
  Button,
 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
export default function ManageWaiters() {
  const [waiters, setWaiters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showAssignTablesModal, setShowAssignTablesModal] = useState(false);
  const [selectedWaiter, setSelectedWaiter] = useState(null);
  const [expandedWaiter, setExpandedWaiter] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [newWaiter, setNewWaiter] = useState({
    name: '',
    password: '',
    begin: '',
    end: ''
  });
  const [availableTables, setAvailableTables] = useState([]);
  const [selectedTables, setSelectedTables] = useState([]);
 const navigate=useNavigate()
  useEffect(() => {
    loadWaiters();
    loadAvailableTables();
  }, [refresh]);

  const loadWaiters = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/get-servers', {
        headers: { 'x-api-key': localStorage.getItem('token') }
      });
      setWaiters(response.data);
    } catch (error) {
      console.error('Error loading waiters:', error);
    }
    setIsLoading(false);
  };

  const loadAvailableTables = async () => {
    try {
      const data = await api.get('/getQRCodes', {
        headers: { 'x-api-key': localStorage.getItem('token') }
      });
      setAvailableTables(data.data);
    } catch (error) {
      console.error('Error loading tables:', error);
    }
  };


 const handlePrintServerReport = (serverReport) => {
  const printWindow = window.open('', '', 'width=302,height=600');

  const receiptHTML = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Server Report</title>
    <style>
      @page { size: 80mm auto; margin: 0; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        width: 80mm;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        padding: 5mm;
      }
      .center { text-align: center; }
      .bold { font-weight: bold; }
      .header { border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
      .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
      .item-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
      .total { border-top: 2px dashed #000; padding-top: 8px; margin-top: 8px; font-size: 14px; }
      .footer { margin-top: 10px; border-top: 2px dashed #000; padding-top: 8px; }
      .section { margin-bottom: 10px; }
      .small { font-size: 11px; }
    </style>
  </head>
  <body>
    <div class="header center">
      <div class="bold" style="font-size:16px;">${serverReport.cafeName.toUpperCase()}</div>
      <div style="font-size:14px;">RAPPORT SERVEUR</div>
      <div>${serverReport.serverName}</div>
      <div style="margin-top:4px;">${new Date().toLocaleDateString('fr-TN')} ${new Date().toLocaleTimeString('fr-TN')}</div>
    </div>

    <div class="section">
      <div class="bold">Commandes du jour (${serverReport.ordersCount}):</div>
      <div class="divider"></div>
      ${serverReport.orders.map(order => `
        <div>
          <div class="bold small">Table ${order.tableNumber}</div>
          ${order.items.map(item => `
            <div class="item-row">
              <div>${item.quantity}x ${item.name}</div>
              <div>${(item.quantity * item.price).toFixed(3)} TND</div>
            </div>
          `).join('')}
          <div class="item-row bold">
            <div>Sous-total</div>
            <div>${order.total.toFixed(3)} TND</div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="section total">
      <div class="item-row bold">
        <div>TOTAL JOURNALIER</div>
        <div>${serverReport.totalDay.toFixed(3)} TND</div>
      </div>
      <div class="item-row small">
        <div>Potentiel:</div>
        <div>${serverReport.potentialRevenue.toFixed(3)} TND</div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="section">
      <div class="bold">Annulations (${serverReport.cancellations.count}):</div>
      <div class="small">Perte totale: ${serverReport.cancellations.totalLost.toFixed(3)} TND</div>
      ${serverReport.cancellations.details.length > 0
        ? serverReport.cancellations.details.map(c => `
          <div class="small" style="margin-top:4px;">
            Cmd #${c.orderId} - Table ${c.tableNumber} (${c.time})<br>
            ${c.items.map(i => `${i.quantity}x ${i.name}`).join(', ')} → Perte ${(c.totalLost).toFixed(3)} TND
          </div>
        `).join('')
        : '<div class="small">Aucune annulation</div>'
      }
    </div>

    <div class="divider"></div>

    <div class="section">
  <div class="bold">Modifications (${serverReport.modifications.count}):</div>
  <div class="small">Impact total: ${serverReport.modifications.totalImpact.toFixed(3)} TND</div>
  ${
    serverReport.modifications.details.length > 0
      ? serverReport.modifications.details
          .map(
            (m) => `
        <div class="small" style="margin-top:4px;">
          Cmd #${m.orderId} - Table ${m.tableNumber} (${m.time})<br>
          ${m.itemName}: ${m.oldQuantity} → ${m.newQuantity} 
          ${
            m.difference !== 0
              ? `(Δ ${m.difference > 0 ? '+' : ''}${m.difference})`
              : ''
          }<br>
          Impact: ${m.priceImpact.toFixed(3)} TND
        </div>
      `
          )
          .join('')
      : '<div class="small">Aucune modification</div>'
  }
</div>


    <div class="divider"></div>

    <div class="section small">
      <div>Tables attribuées: ${serverReport.assignedTables.join(', ')}</div>
      <div>Tables servies: ${serverReport.tablesServed}</div>
    </div>

    <div class="footer center">
      <div class="bold" style="font-size:14px;">Fin de service</div>
      <div>${serverReport.serverName}</div>
    </div>

    <script>
      window.onload = function() {
        window.print();
        setTimeout(() => window.close(), 100);
      };
    </script>
  </body>
  </html>
  `;

  printWindow.document.write(receiptHTML);
  printWindow.document.close();
};


const print = async (id) => {
  try {
    // Appel API réel
    const response = await axios.get(
      `${process.env.REACT_APP_API_URL}/api/get-daily-of-server/${id}`, 
      {
        headers: { 'x-api-key': localStorage.getItem('token') }
      }
    );
    
    const data = response.data;
    
    // Appeler la fonction d'impression
    handlePrintServerReport(data);
    
  } catch (error) {
    console.error('Error fetching server report:', error);
    alert('Erreur lors de la récupération du rapport du serveur');
  }
};

 const handleAddWaiter = async () => {
    if (!newWaiter.name || !newWaiter.password || !newWaiter.begin || !newWaiter.end) {
      return alert('Veuillez remplir tous les champs obligatoires');
    }

    try {
      await api.post('/add-server', newWaiter, {
        headers: { 'x-api-key': localStorage.getItem('token') }
      });
      setRefresh(!refresh);
      setShowAddModal(false);
      setNewWaiter({ name: '', password: '', begin: '', end: '' });
    } catch (error) {
      console.error('Error adding waiter:', error);
      alert('Erreur lors de l\'ajout du serveur');
    }
  };

  const handleUnassign = async (waiterId, tableNumber) => {
    try {
      // Faire l'appel API
      const res = await api.put('/clear-tables/' + waiterId, 
        { number: tableNumber }, 
        { headers: { 'x-api-key': localStorage.getItem('token') } }
      );
      
      if (res.data) {
        // Mettre à jour immédiatement l'état local sans recharger
        setAvailableTables(prevTables => 
          prevTables.map(table => 
            table.number === tableNumber 
              ? { ...table, assignedTo: null } 
              : table
          )
        );
      }
    } catch (e) {
      console.error('Error unassigning table:', e);
      alert('Erreur lors de la désassignation de la table');
    }
  };

  const handleDeleteWaiter = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce serveur?')) return;
    
    try {
      const response = await api.delete('/delete-servers/' + id, {
        headers: { 'x-api-key': localStorage.getItem('token') }
      });
      if (response.data) {
        setRefresh(!refresh);
      }
    } catch (error) {
      console.error('Error deleting waiter:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleAssignTables = async (waiter) => {
    setSelectedWaiter(waiter);
    // Charger les tables déjà assignées au serveur
    const assignedTableIds = availableTables
      .filter(table => table.assignedTo === waiter.id)
      .map(table => table.id);
    setSelectedTables(assignedTableIds);
    setShowAssignTablesModal(true);
  };

  

 const toggleTableSelection = async (tableId) => {
    try {
   
      const isCurrentlySelected = selectedTables.includes(tableId);
      
      await api.put('/assign-tables/' + tableId, 
        { id: selectedWaiter.id }, 
        { headers: { 'x-api-key': localStorage.getItem('token') } }
      );
      
      // Mettre à jour l'état local immédiatement
      if (isCurrentlySelected) {
        setSelectedTables(selectedTables.filter(id => id !== tableId));
        // Retirer l'assignation dans availableTables
        setAvailableTables(prevTables => 
          prevTables.map(table => 
            table.id === tableId 
              ? { ...table, assignedTo: null } 
              : table
          )
        );
      } else {
        setSelectedTables([...selectedTables, tableId]);
        // Ajouter l'assignation dans availableTables
        setAvailableTables(prevTables => 
          prevTables.map(table => 
            table.id === tableId 
              ? { ...table, assignedTo: selectedWaiter.id } 
              : table
          )
        );
      }
    } catch (error) {
      console.error('Error toggling table assignment:', error);
      alert('Erreur lors de l\'assignation de la table');
    }
  };

  const handleSaveTableAssignment = () => {
    setShowAssignTablesModal(false);
    setSelectedTables([]);
  };

  const filteredWaiters = waiters.filter(waiter =>
    waiter.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const shiftColors = {
    morning: 'from-amber-500 to-orange-500',
    afternoon: 'from-purple-500 to-pink-500',
    night: 'from-blue-500 to-indigo-600'
  };

  const getShiftFromHours = (begin, end) => {
    const beginHour = parseInt(begin);
    if (beginHour >= 0 && beginHour < 12) return 'morning';
    if (beginHour >= 12 && beginHour < 20) return 'afternoon';
    return 'night';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-300 text-lg">Chargement des serveurs...</p>
        </div>
      </div>
    );
  }
 
  return (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-4">
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-lg bg-white/10 text-white transition-all duration-200 hover:bg-white/15 hover:scale-105"
      >
        <ArrowLeft size={20} />
        <span className="hidden sm:inline">Retour</span>
      </button>
      
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-xl shadow-lg">
        <Users className="w-8 h-8 text-white" />
      </div>
      
      <div>
        <h1 className="text-4xl font-bold text-white">Server Management</h1>
        <p className="text-slate-400 mt-1">Manage your team and their assignments</p>
      </div>
    </div>
    
    <button
      onClick={() => setShowAddModal(true)}
      className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 rounded-xl font-semibold text-white hover:scale-105 transition-all shadow-lg flex items-center gap-2"
    >
      <Plus className="w-5 h-5" />
      Add Server
    </button>
  </div>

  {/* Stats Cards */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm">Total Servers</p>
          <p className="text-2xl font-bold text-white">{waiters.length}</p>
        </div>
        <Users className="w-8 h-8 text-blue-400" />
      </div>
    </div>
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm">Assigned Tables</p>
          <p className="text-2xl font-bold text-green-400">
            {availableTables.filter(t => t.assignedTo).length}
          </p>
        </div>
        <Table2 className="w-8 h-8 text-green-400" />
      </div>
    </div>
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm">Available Tables</p>
          <p className="text-2xl font-bold text-purple-400">
            {availableTables.filter(t => !t.assignedTo).length}
          </p>
        </div>
        <Table2 className="w-8 h-8 text-purple-400" />
      </div>
    </div>
  </div>
    
   
  {/* Search Bar */}
  <div className="relative">
    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
    <input
      type="text"
      placeholder="Search by name..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
</div>

        {/* Waiters List */}
        <div className="space-y-4">
          {filteredWaiters.map((waiter, index) => {
            const shift = getShiftFromHours(waiter.begin, waiter.end);
            const waiterTables = availableTables.filter(t => t.assignedTo === waiter.id);

            return (
              <div
                key={waiter.id}
                className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden hover:border-slate-600 transition-all"
                style={{
                  animation: `slideUp 0.4s ease-out ${index * 0.1}s both`
                }}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Avatar */}
                      <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${shiftColors[shift]} flex items-center justify-center text-white text-xl font-bold shadow-lg`}>
                        {waiter.name.split(' ').map(n => n[0]).join('')}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-white">{waiter.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${shiftColors[shift]} text-white`}>
                            {waiter.begin}h - {waiter.end}h
                          </span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-slate-400">
                          <span>🔐 {waiter.password}</span>
                          <span>👤 Role: {waiter.role}</span>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="flex gap-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-400">{waiterTables.length}</p>
                          <p className="text-xs text-slate-400">Tables</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => print(waiter.id)}
                        className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-all"
                        title="Print Report"
                      >
                        <Printer className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleAssignTables(waiter)}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all"
                        title="Assign Tables"
                      >
                        <Table2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setExpandedWaiter(expandedWaiter === waiter.id ? null : waiter.id)}
                        className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
                      >
                        {expandedWaiter === waiter.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => handleDeleteWaiter(waiter.id)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedWaiter === waiter.id && (
                    <div className="mt-6 pt-6 border-t border-slate-700">
                      <h4 className="text-white font-semibold mb-3">Assigned Tables</h4>
                      <div className="flex flex-wrap gap-2">
                        {waiterTables.length > 0 ? (
                          waiterTables.map((table) => (
                            <div
                              key={table.id}
                              className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg font-semibold flex items-center gap-3"
                            >
                              <span>Table {table.number}</span>
                              <button
                                onClick={() => handleUnassign(waiter.id, table.number)}
                                className="text-red-400 hover:text-red-300 hover:scale-110 transition-all"
                                title="Unassign"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="text-slate-400">No tables assigned</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
 <div>
      <p className="text-slate-400 text-sm">Give Link To Servers</p>
          <p
          onClick={()=>navigate('/server-login/'+localStorage.getItem('path'))}
          className="text-2xl font-bold text-purple-400 cursor-pointer">
           {'https://cafeapp-frontend-lij4.vercel.app/server-login'+localStorage.getItem('path')}
          </p>
    </div>
          {filteredWaiters.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No servers found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Waiter Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-700 animate-fadeIn">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Add a Server</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newWaiter.name || ''}
                  onChange={(e) => setNewWaiter({ ...newWaiter, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Password *
                </label>
                <input
                  type="text"
                  value={newWaiter.password || ''}
                  onChange={(e) => setNewWaiter({ ...newWaiter, password: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Password"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Schedule (Start / End Time) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={newWaiter.begin || ''}
                    onChange={(e) => setNewWaiter({ ...newWaiter, begin: e.target.value })}
                    className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Start (0-23)"
                  />
                  <span className="text-white flex items-center">-</span>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={newWaiter.end || ''}
                    onChange={(e) => setNewWaiter({ ...newWaiter, end: e.target.value })}
                    className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="End (0-23)"
                  />
                </div>
                <p className="text-slate-400 text-xs mt-1">Example: 8 - 16 for 8am to 4pm</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddWaiter}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:scale-105 text-white rounded-lg transition-all font-semibold"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Tables Modal */}
      {showAssignTablesModal && selectedWaiter && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-2xl w-full p-6 border border-slate-700 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white">Assign Tables</h3>
                <p className="text-slate-400 mt-1">{selectedWaiter.name}</p>
              </div>
              <button
                onClick={() => setShowAssignTablesModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-blue-400 text-sm">
                {selectedTables.length} table(s) selected
              </p>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {availableTables.map(table => {
                const isSelected = selectedTables.includes(table.id);
                const isAssignedToOther = table.assignedTo && table.assignedTo !== selectedWaiter.id;

                return (
                  <button
                    key={table.id}
                    onClick={() => !isAssignedToOther && toggleTableSelection(table.number)}
                    disabled={isAssignedToOther}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'bg-green-500/20 border-green-500 scale-105'
                        : isAssignedToOther
                        ? 'bg-slate-900 border-slate-700 opacity-50 cursor-not-allowed'
                        : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Table2 className={`w-6 h-6 ${
                        isSelected
                          ? 'text-green-400'
                          : isAssignedToOther
                          ? 'text-slate-600'
                          : 'text-slate-400'
                      }`} />
                      <span className={`font-semibold ${
                        isSelected
                          ? 'text-green-400'
                          : isAssignedToOther
                          ? 'text-slate-600'
                          : 'text-white'
                      }`}>
                        {table.number}
                      </span>
                      {isSelected && <Check className="w-5 h-5 text-green-400" />}
                      {isAssignedToOther && <span className="text-xs text-slate-600">Assigned</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAssignTablesModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTableAssignment}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:scale-105 text-white rounded-lg transition-all font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

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
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}