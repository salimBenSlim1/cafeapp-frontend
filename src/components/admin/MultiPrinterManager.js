import React, { useState, useEffect } from 'react';
import { Printer, Settings, Check, AlertCircle, X } from 'lucide-react';

// Mock API for demonstration
const cafeApi = {
  get: async (url) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    if (url === '/printers') {
      return {
        data: [
          { id: 1, name: 'Printer Caisse' },
          { id: 2, name: 'Printer Bar' },
          { id: 3, name: 'Printer Cuisine' },
          { id: 4, name: 'Printer Chicha' }
        ]
      };
    }
  }
};

// ============================================
// PRINTER CONFIGURATION MODAL
// One-time setup: Map stations to printers
// ============================================

function PrinterConfigModal({ stations, printers, mappings, onSave, onClose }) {
  const [localMappings, setLocalMappings] = useState(mappings);

  const handleSave = () => {
    onSave(localMappings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white sticky top-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Settings size={28} />
                Configuration des Imprimantes
              </h2>
              <p className="text-indigo-100 text-sm mt-1">
                Associez chaque station à une imprimante physique
              </p>
            </div>
            <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {stations.map((station) => (
            <div key={station.id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-gray-300 transition">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${station.color} rounded-lg flex items-center justify-center text-white`}>
                    <Printer size={24} />
                  </div>
                  <div>
                    <div className="font-bold text-lg">{station.name}</div>
                    <div className="text-sm text-gray-600">{station.description}</div>
                  </div>
                </div>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localMappings[station.id]?.enabled || false}
                    onChange={(e) => {
                      setLocalMappings({
                        ...localMappings,
                        [station.id]: {
                          ...localMappings[station.id],
                          enabled: e.target.checked
                        }
                      });
                    }}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">Activer</span>
                </label>
              </div>

              {localMappings[station.id]?.enabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imprimante physique:
                  </label>
                  <select
                    value={localMappings[station.id]?.printerId || ''}
                    onChange={(e) => {
                      const printerId = parseInt(e.target.value);
                      const printer = printers.find(p => p.id === printerId);
                      setLocalMappings({
                        ...localMappings,
                        [station.id]: {
                          enabled: true,
                          printerId: printerId,
                          printerName: printer?.name || ''
                        }
                      });
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                  >
                    <option value="">-- Sélectionner une imprimante --</option>
                    {printers.map(printer => (
                      <option key={printer.id} value={printer.id}>
                        {printer.name}
                      </option>
                    ))}
                  </select>
                  
                  {localMappings[station.id]?.printerName && (
                    <div className="mt-2 flex items-center gap-2 text-green-600 text-sm">
                      <Check size={16} />
                      <span>Configuré: {localMappings[station.id].printerName}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-6 bg-gray-50 flex justify-between items-center sticky bottom-0">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition transform hover:scale-105"
          >
            Enregistrer la Configuration
          </button>
        </div>

      </div>
    </div>
  );
}

// ============================================
// SMART PRINT DIALOG
// ============================================

export default function SmartPrintDialog({ order, onClose }) {
  const [printing, setPrinting] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [printers, setPrinters] = useState([]);
  const [stations, setStations] = useState([]);
  const [showConfig, setShowConfig] = useState(false);
  
  // Load printer mappings from React state
  const [printerMappings, setPrinterMappings] = useState(() => {
    const saved = localStorage.getItem('printerMappings');
    return saved ? JSON.parse(saved) : {};
  });

  // Check if configuration is needed
  const needsConfiguration = Object.keys(printerMappings).length === 0;

  useEffect(() => {
    // Fetch printers from API
    cafeApi.get('/printers')
      .then(r => {
        setPrinters(r.data);
        
        // Define stations
        setStations([
          {
            id: 'caisse',
            name: 'Caisse',
            color: 'bg-blue-600',
            description: 'Tout imprimer avec total',
            showPrices: true,
            showTotal: true,
            filterFn: (items) => items
          },
          {
            id: 'chicha',
            name: 'Chicha',
            color: 'bg-purple-600',
            description: 'Articles chicha',
            showPrices: false,
            showTotal: false,
            filterFn: (items) => items.filter(item => 
              item.Item.category === 'smoking' 
            )
          },
          {
            id: 'bar',
            name: 'Bar',
            color: 'bg-orange-600',
            description: 'Boissons (Directe, etc.)',
            showPrices: false,
            showTotal: false,
            filterFn: (items) => items.filter(item => 
              ['coffee', 'drink'].includes(item.Item.category) 
            )
          },
          {
            id: 'cuisine',
            name: 'Cuisine',
            color: 'bg-green-600',
            description: 'Plats (Pathé, etc.)',
            showPrices: false,
            showTotal: false,
            filterFn: (items) => items.filter(item => 
              ['food', 'dessert'].includes(item.Item.category)
            )
          }
        ]);
      })
      .catch(err => console.log(err));
  }, []);

  // Show config modal on first use
  useEffect(() => {
    if (needsConfiguration && stations.length > 0 && printers.length > 0) {
      setShowConfig(true);
    }
  }, [needsConfiguration, stations.length, printers.length]);

  const handleSaveMappings = (newMappings) => {
    setPrinterMappings(newMappings);
    localStorage.setItem('printerMappings', JSON.stringify(newMappings));
  };

  const handlePrint = async (station) => {
    const mapping = printerMappings[station.id];
    
    if (!mapping || !mapping.enabled) {
      alert(`Station ${station.name} est désactivée`);
      return;
    }

    if (!mapping.printerName) {
      alert(`Veuillez configurer l'imprimante pour ${station.name}`);
      return;
    }

    const filteredItems = station.filterFn(order.OrderItems);
    
    if (filteredItems.length === 0) {
      alert(`Aucun article pour ${station.name}`);
      return;
    }

    setPrinting(true);
    setSelectedStation(station.id);

    try {
      // Generate HTML
      const html = generateReceiptHTML(station, filteredItems, order);
      
      // Print with specific printer
      await printToSpecificPrinter(html, mapping.printerName, station.name);
      
      setTimeout(() => onClose(), 500);
    } catch (error) {
      console.error('Print error:', error);
      alert(`Erreur d'impression pour ${station.name}`);
    } finally {
      setPrinting(false);
      setSelectedStation(null);
    }
  };

  const generateReceiptHTML = (station, items, order) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${station.name} Receipt</title>
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
          .header {
            border-bottom: 2px dashed #000;
            padding-bottom: 8px;
            margin-bottom: 8px;
          }
          .station-name {
            background: #000;
            color: #fff;
            padding: 4px;
            font-size: 14px;
          }
          .items { margin: 8px 0; }
          .item-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
          }
          .total {
            border-top: 2px dashed #000;
            padding-top: 8px;
            margin-top: 8px;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header center">
          <div class="bold station-name">${station.name.toUpperCase()}</div>
          <div style="font-size: 14px; margin-top: 4px;">BON DE COMMANDE</div>
          <div style="margin-top: 4px;">------------------------</div>
          <div>${new Date().toLocaleDateString('fr-TN')}</div>
          <div>${new Date().toLocaleTimeString('fr-TN')}</div>
        </div>

        <div style="margin-bottom: 8px;">
          <div class="bold">Table: ${order?.Table?.number || 'N/A'}</div>
          <div>Commande #${order.id}</div>
        </div>

        <div style="border-bottom: 1px dashed #000; margin: 8px 0;"></div>

        <div class="items">
          <div class="bold" style="margin-bottom: 6px;">ARTICLES</div>
          ${items.map(item => `
            <div class="item-row">
              <div>${item.quantity}x ${item.Item.name}</div>
              ${station.showPrices ? `<div>${(item.quantity * item.price).toFixed(3)} TND</div>` : ''}
            </div>
            ${item.comment ? `<div style="font-size: 10px; margin-left: 20px; color: #666;">Note: ${item.comment}</div>` : ''}
          `).join('')}
        </div>

        ${station.showTotal ? `
          <div class="total">
            <div class="item-row bold">
              <div>TOTAL</div>
              <div>${order.totalPrice.toFixed(3)} TND</div>
            </div>
          </div>
          <div style="margin-top: 10px; border-top: 2px dashed #000; padding-top: 8px;" class="center">
            <div class="bold" style="font-size: 14px; margin-bottom: 4px;">MERCI!</div>
            <div>A bientôt</div>
          </div>
        ` : ''}

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 100);
          };
        </script>
      </body>
      </html>
    `;
  };

  const printToSpecificPrinter = async (html, printerName, stationName) => {
    if (window.electronAPI && window.electronAPI.print) {
      await window.electronAPI.print(html, printerName);
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.id = `print-frame-${Date.now()}`;
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    iframe.onload = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch (e) {}
        }, 1000);
      } catch (error) {
        console.error('Print error:', error);
        document.body.removeChild(iframe);
      }
    };
  };

  // Mock order data for demo
  const mockOrder = order || {
    id: 123,
    totalPrice: 45.500,
    Table: { number: 5 },
    OrderItems: [
      { quantity: 2, price: 8.500, Item: { name: 'Café Express', category: 'coffee' }, comment: '' },
      { quantity: 1, price: 12.000, Item: { name: 'Chicha Pomme', category: 'smoking' }, comment: 'Sans glace' },
      { quantity: 1, price: 16.500, Item: { name: 'Pizza Margherita', category: 'food' }, comment: '' }
    ]
  };

  return (
    <>
      {showConfig && (
        <PrinterConfigModal
          stations={stations}
          printers={printers}
          mappings={printerMappings}
          onSave={handleSaveMappings}
          onClose={() => setShowConfig(false)}
        />
      )}

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
          
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Choisir l'imprimante</h2>
                <p className="text-blue-100 text-sm">
                  Commande #{mockOrder.id} - Table {mockOrder.Table?.number}
                </p>
              </div>
              <button
                onClick={() => setShowConfig(true)}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
              >
                <Settings size={20} />
                <span className="text-sm">Config</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            
            <div className="grid grid-cols-2 gap-4">
              {stations.map((station) => {
                const itemCount = station.filterFn(mockOrder.OrderItems).length;
                const mapping = printerMappings[station.id];
                const isConfigured = mapping && mapping.enabled && mapping.printerName;
                const isPrinting = printing && selectedStation === station.id;
                
                return (
                  <button
                    key={station.id}
                    onClick={() => handlePrint(station)}
                    disabled={itemCount === 0 || !isConfigured || printing}
                    className={`p-6 rounded-xl transition text-left relative ${
                      itemCount === 0 || !isConfigured
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200'
                        : isPrinting
                        ? 'bg-gray-400 cursor-wait'
                        : `${station.color} text-white hover:opacity-90 shadow-lg hover:shadow-xl transform hover:scale-105`
                    }`}
                  >
                    {isPrinting && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-xl">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mb-3">
                      <Printer size={28} />
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        itemCount === 0 || !isConfigured ? 'bg-gray-300 text-gray-500' : 'bg-white/20'
                      }`}>
                        {itemCount} items
                      </span>
                    </div>
                    
                    <div className="text-xl font-bold mb-1">{station.name}</div>
                    <div className={`text-sm ${itemCount === 0 || !isConfigured ? 'text-gray-500' : 'text-white/80'}`}>
                      {station.description}
                    </div>
                    
                    {isConfigured && (
                      <div className="mt-2 text-xs text-white/70">
                        → {mapping.printerName}
                      </div>
                    )}
                    
                    {!isConfigured && itemCount > 0 && (
                      <div className="mt-2 text-xs text-red-600 font-semibold">
                        ⚠️ Non configuré
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                disabled={printing}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
              >
                Fermer
              </button>
            </div>

          </div>

        </div>
      </div>
    </>
  );
}