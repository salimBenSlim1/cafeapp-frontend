import React, { useState, useEffect } from 'react';
import { Printer, Settings, Check, AlertCircle } from 'lucide-react';
import cafeApi from '../../api/cafeApiInstance';



// ============================================
// SMART PRINT DIALOG WITH AUTO-ROUTING
// ============================================

export default function SmartPrintDialog({ order, onClose }) {
  const [printing, setPrinting] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [printers, setPrinters] = useState([]);
  const [stations, setStations] = useState([]);
  
  // Get printer mappings from React state instead of localStorage
  const [printerMappings, setPrinterMappings] = useState({
    caisse: { enabled: true, printerName: 'Printer Caisse' },
    bar: { enabled: true, printerName: 'Printer Bar' },
    cuisine: { enabled: true, printerName: 'Printer Cuisine' },
    chicha: { enabled: true, printerName: 'Printer Chicha' }
  });

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
    // Method 1: Try silent printing (Chrome extension or Electron)
    if (window.electronAPI && window.electronAPI.print) {
      await window.electronAPI.print(html, printerName);
      return;
    }

    // Method 2: Standard browser print with iframe
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <h2 className="text-2xl font-bold">Choisir l'imprimante</h2>
          <p className="text-blue-100 text-sm">
            Commande #{mockOrder.id} - Table {mockOrder.Table?.number}
          </p>
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
  );
}