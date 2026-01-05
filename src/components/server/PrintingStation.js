import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const PrinterStation = () => {
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const [qzStatus, setQzStatus] = useState('disconnected');
  const [orders, setOrders] = useState([]);
  const [availablePrinters, setAvailablePrinters] = useState([]);
  const [printerConfig, setPrinterConfig] = useState({
    kitchen: "",
    bar: "",
    chicha: ""
  });
  const [showConfig, setShowConfig] = useState(false);
  const [tempConfig, setTempConfig] = useState({});

  const CAFE_ID = localStorage.getItem('cafeId');
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const PUBLIC_CERT = `-----BEGIN CERTIFICATE-----
MIIDCTCCAfGgAwIBAgIUK1qaeEfyntI1xyiU4i2BttrmDrcwDQYJKoZIhvcNAQEL
BQAwFDESMBAGA1UEAwwJY29mZmFpLnRuMB4XDTI2MDEwNTE5MTIzOFoXDTI3MDEw
NTE5MTIzOFowFDESMBAGA1UEAwwJY29mZmFpLnRuMIIBIjANBgkqhkiG9w0BAQEF
AAOCAQ8AMIIBCgKCAQEAw6RSglXj6rwBkY6EdTYVbpbJcXaEhq5Egcv3fJgsoaZv
aGG49mS0IxIKEDTVIKEM7poT/5vYJZLgW1MVf1CES/F/AOepbE6m8TIFeWiRTFJy
nuirkpr1U2w2kaePdcHK2rhvCAX/FVWhiKvoB5DLeXrby106wUKb6Nd5mTZ5x310
fOXRiiMuCnBdMgGt+PV2dX3rLKpnAYG2jNv8sj3Wsmlzy1BbfrdjbP0U7+h+yhkK
AjQSzXlZbTmXbOtShHAGOYoK2w0ki/XW8+6aP/aiY63cf8uz0efFKvFTj+w67Nvg
bKeMJ0GOLPOPyYP3NB1d5d/Y68ymXZhucOhk1p8tcQIDAQABo1MwUTAdBgNVHQ4E
FgQUYmOGsal9jG58fEddfTv2Hyf8PmkwHwYDVR0jBBgwFoAUYmOGsal9jG58fEdd
fTv2Hyf8PmkwDwYDVR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEALC+W
7S+rP2uJRR795VUhfkV7VFmSr7yZ67hmWoMQE8vu3KUbeXDfaN7vQIF4HI/qjpp/
RPLV4xNjo6PPcu89uev605FCbJJV+4ZhuiVEaMH3YqA/RT4GlRBaZrVy3rky3lGY
eCgNWeJZudmQRNUq/QeDol8Yk6N8GYvfjpI4H0Wmvvs6fEdImNE1OQPVPM5cPZHV
NL9e4HC3QBebCo86SUbPxbjbSmcyVbm13CaupZXezvUFxavsj/VCXBuRoR2DGxrd
Pj77DhnDUhdgyKMFplASq0xGOKPp0WQe8cKaJ12gQOVyucLApZFauPoWEv2cLjdt
XEZLIpb+91uEC5GrDg==
-----END CERTIFICATE-----`;

  const CATEGORY_PRINTER_MAP = {
    'food': 'kitchen',
    'dessert': 'kitchen',
    'drink': 'bar',
    'coffee': 'bar',
    'smoking': 'chicha',
    'chicha': 'chicha',
    'hookah': 'chicha'
  };

  useEffect(() => {
    setupSocket();
    setupQZTray();
    loadPrinterConfig();

    return () => {
      if (window.socket) window.socket.disconnect();
      if (window.qz?.websocket?.isActive()) {
        window.qz.websocket.disconnect();
      }
    };
  }, []);

  const setupSocket = () => {
    const SOCKET_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      withCredentials: true,
      upgrade: true,
    });

    window.socket = socket;

    socket.on('connect', () => {
      console.log('✅ Socket connected');
      setSocketStatus('connected');
      socket.emit('joinCafe', { 
        cafeId: CAFE_ID,
        deviceType: 'printer_station'
      });
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setSocketStatus('disconnected');
    });

    socket.on('newOrder', async (data) => {
      console.log('📥 NEW ORDER:', data);
      
      if (!data.order) {
        console.error('❌ Invalid order data received');
        return;
      }

      const order = data.order;
      const transformedOrder = {
        id: order.id,
        tableNumber: order.tableNumber || 'N/A',
        createdAt: order.createdAt || new Date(),
        items: (order.orderItems || []).map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          category: item.category.toLowerCase(),
          comment: item.comment || ''
        }))
      };

      setOrders(prev => [transformedOrder, ...prev].slice(0, 20));
      
      // Wait a bit for printer config to load if needed
      setTimeout(() => {
        printOrder(transformedOrder);
      }, 500);
    });
  };

  const loadPrinterConfig = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/server/printer/config`,
        { headers: { 'server-token': localStorage.getItem('serverToken') } }
      );

      console.log('📥 Loaded config from backend:', response.data.config);

      if (response.data.config && Object.keys(response.data.config).length > 0) {
        setPrinterConfig(response.data.config);
        console.log('✅ Printer config set:', response.data.config);
      }
    } catch (error) {
      console.error('❌ Failed to load printer config:', error);
    }
  };

  const savePrinterConfig = async () => {
    try {
      console.log('💾 Saving config:', tempConfig);
      
      await axios.put(
        `${API_URL}/server/printer/config`,
        { printers: tempConfig },
        { headers: { 'server-token': localStorage.getItem('serverToken') } }
      );
      
      setPrinterConfig({...tempConfig});
      setShowConfig(false);
      console.log('✅ Config saved and updated:', tempConfig);
      alert('✅ Printer configuration saved!');
    } catch (error) {
      console.error('❌ Failed to save config:', error);
      alert('Failed to save configuration');
    }
  };

  const setupQZTray = async () => {
    try {
      if (!window.qz) {
        console.error('❌ QZ Tray library not loaded');
        setQzStatus('error - library missing');
        return;
      }

      if (window.qz.security.setSignatureAlgorithm) {
        window.qz.security.setSignatureAlgorithm("SHA512");
      }

      window.qz.security.setCertificatePromise(function(resolve) {
        resolve(PUBLIC_CERT);
      });

      window.qz.security.setSignaturePromise(function(toSign) {
        return (resolve, reject) => {
          axios.post(
            `${API_URL}/server/printer/sign`,
            { request: toSign },
            { 
              headers: { 
                'server-token': localStorage.getItem('serverToken'),
                'Content-Type': 'application/json'
              } 
            }
          )
          .then(response => resolve(response.data.signature))
          .catch(error => reject(error));
        };
      });

      await connectToQZ();
    } catch (error) {
      console.error('❌ QZ setup failed:', error);
      setQzStatus('setup error');
    }
  };

  const connectToQZ = async () => {
    try {
      if (window.qz.websocket.isActive()) {
        setQzStatus('connected');
        await listPrinters();
        return;
      }

      setQzStatus('connecting...');
      await window.qz.websocket.connect();
      setQzStatus('connected ✓');
      await listPrinters();
    } catch (error) {
      console.error('❌ QZ connection failed:', error);
      setQzStatus('error - ' + error.message);
    }
  };

  const listPrinters = async () => {
    try {
      const printers = await window.qz.printers.find();
      console.log('🖨️ Available printers:', printers);
      setAvailablePrinters(printers);

      if (printers.length === 0) {
        alert('⚠️ No printers detected!');
      }
    } catch (error) {
      console.error('❌ Failed to list printers:', error);
    }
  };

  const printOrder = async (order) => {
    console.log('🖨️ PRINTING ORDER:', order);
    console.log('🖨️ Current printer config:', printerConfig);

    if (!order.items || order.items.length === 0) {
      console.error('❌ Order has no items!');
      return;
    }

    const itemsByPrinter = {
      kitchen: [],
      bar: [],
      chicha: []
    };

    order.items.forEach(item => {
      const category = item.category.toLowerCase();
      const printerType = CATEGORY_PRINTER_MAP[category] || 'kitchen';
      itemsByPrinter[printerType].push(item);
    });

    console.log('📦 Items grouped:', itemsByPrinter);

    const printPromises = [];
    
    if (itemsByPrinter.kitchen.length > 0) {
      printPromises.push(printToPhysicalPrinter('kitchen', itemsByPrinter.kitchen, order));
    }
    if (itemsByPrinter.bar.length > 0) {
      printPromises.push(printToPhysicalPrinter('bar', itemsByPrinter.bar, order));
    }
    if (itemsByPrinter.chicha.length > 0) {
      printPromises.push(printToPhysicalPrinter('chicha', itemsByPrinter.chicha, order));
    }

    await Promise.all(printPromises);
  };

const printToPhysicalPrinter = async (printerType, items, order) => {
  // ✅ Get fresh config from backend instead of relying on state
  let printerName;
  
  try {
    const response = await axios.get(
      `${API_URL}/server/printer/config`,
      { headers: { 'server-token': localStorage.getItem('serverToken') } }
    );
    printerName = response.data.config[printerType];
    console.log(`🔍 Fresh printer for ${printerType}:`, printerName);
  } catch (error) {
    console.error('Failed to get printer config:', error);
    return;
  }
  
  if (!printerName) {
    console.warn(`⚠️ No printer configured for ${printerType}`);
    return;
  }

  if (!window.qz?.websocket?.isActive()) {
    console.error('❌ QZ Tray not connected');
    return;
  }

  try {
    const receiptText = generateReceipt(printerType, items, order);
    console.log(`📄 Receipt for ${printerType}:\n${receiptText}`);
    
    const config = window.qz.configs.create(printerName);
    const data = [{
      type: 'raw',
      format: 'plain',
      data: receiptText
    }];

    await window.qz.print(config, data);
    
    console.log(`✅ Printed to ${printerType.toUpperCase()}`);
    showNotification(`✅ ${printerType.toUpperCase()} - Table ${order.tableNumber}`);

  } catch (error) {
    console.error(`❌ Print failed for ${printerType}:`, error);
  }
};

  const generateReceipt = (printerType, items, order) => {
    const time = new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false 
    });

    let receipt = '';

    items.forEach(item => {
      receipt += `${item.quantity}x ${item.name}\n`;
      if (item.comment) {
        receipt += `${item.comment}\n`;
      }
    });
    
    receipt += `${time}\n`;
    receipt += `\n\n\n`;

    return receipt;
  };

  const showNotification = (message) => {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 9999;
      font-weight: bold;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  const testPrint = () => {
    console.log('🧪 Test print with config:', printerConfig);
    const testOrder = {
      id: 'TEST-999',
      tableNumber: 5,
      items: [
        { name: 'Margherita Pizza', quantity: 2, category: 'food', comment: 'Extra cheese' },
        { name: 'Caesar Salad', quantity: 1, category: 'food', comment: '' },
        { name: 'Cappuccino', quantity: 2, category: 'coffee', comment: 'No sugar' },
        { name: 'Apple Shisha', quantity: 1, category: 'smoking', comment: 'Strong' }
      ],
      createdAt: new Date()
    };

    printOrder(testOrder);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>🖨️ Printer Station - Café {CAFE_ID}</h1>
        
        <div style={styles.statusBar}>
          <div style={{
            ...styles.status, 
            backgroundColor: socketStatus === 'connected' ? '#10b981' : '#ef4444'
          }}>
            Socket: {socketStatus}
          </div>
          <div style={{
            ...styles.status, 
            backgroundColor: qzStatus.includes('connected') ? '#10b981' : qzStatus === 'connecting...' ? '#f59e0b' : '#ef4444'
          }}>
            QZ: {qzStatus}
          </div>
        </div>
      </div>

      <div style={styles.printerInfo}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h3>📋 Printer Configuration</h3>
          <button 
            onClick={() => {
              setTempConfig({...printerConfig});
              setShowConfig(true);
            }} 
            style={styles.configButton}
          >
            ⚙️ Configure Printers
          </button>
        </div>
        
        {showConfig ? (
          <div style={styles.configModal}>
            <h4>Select Printers for Each Station</h4>
            
            <div style={styles.configSection}>
              <label style={styles.label}>🍕 Kitchen Printer:</label>
              <select 
                value={tempConfig.kitchen || ''} 
                onChange={(e) => setTempConfig({...tempConfig, kitchen: e.target.value})}
                style={styles.select}
              >
                <option value="">-- Select Printer --</option>
                {availablePrinters.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div style={styles.configSection}>
              <label style={styles.label}>☕ Bar Printer:</label>
              <select 
                value={tempConfig.bar || ''} 
                onChange={(e) => setTempConfig({...tempConfig, bar: e.target.value})}
                style={styles.select}
              >
                <option value="">-- Select Printer --</option>
                {availablePrinters.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div style={styles.configSection}>
              <label style={styles.label}>💨 Chicha Printer:</label>
              <select 
                value={tempConfig.chicha || ''} 
                onChange={(e) => setTempConfig({...tempConfig, chicha: e.target.value})}
                style={styles.select}
              >
                <option value="">-- Select Printer --</option>
                {availablePrinters.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
              <button onClick={savePrinterConfig} style={{...styles.testButton, flex: 1}}>
                💾 Save Configuration
              </button>
              <button 
                onClick={() => setShowConfig(false)} 
                style={{...styles.testButton, flex: 1, background: '#6b7280'}}
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={styles.printerList}>
              <div style={styles.printerItem}>
                <strong>🍕 Kitchen:</strong> {printerConfig.kitchen || 'Not configured'}
              </div>
              <div style={styles.printerItem}>
                <strong>☕ Bar:</strong> {printerConfig.bar || 'Not configured'}
              </div>
              <div style={styles.printerItem}>
                <strong>💨 Chicha:</strong> {printerConfig.chicha || 'Not configured'}
              </div>
            </div>

            {availablePrinters.length > 0 && (
              <div style={styles.availablePrinters}>
                <strong>✅ Available Printers ({availablePrinters.length}):</strong>
                <ul>
                  {availablePrinters.map((printer, idx) => (
                    <li key={idx}>{printer}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        <div style={{marginTop: '15px'}}>
          <button onClick={testPrint} style={styles.testButton}>
            🧪 Test Print
          </button>
          <button 
            onClick={connectToQZ} 
            style={{...styles.testButton, background: '#f59e0b', marginLeft: '10px'}}
          >
            🔌 Reconnect QZ
          </button>
        </div>
      </div>

      <div style={styles.orders}>
        <h2>Recent Orders ({orders.length})</h2>
        {orders.length === 0 ? (
          <p style={styles.empty}>Waiting for orders...</p>
        ) : (
          orders.map((order, idx) => (
            <div key={idx} style={styles.order}>
              <div style={styles.orderHeader}>
                <strong>Table {order.tableNumber}</strong>
                <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
              </div>
              <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                {order.items.map((item, i) => (
                  <li key={i}>
                    <strong>x{item.quantity}</strong> {item.name}
                    <span style={styles.badge}>{item.category}</span>
                    {item.comment && (
                      <div style={styles.comment}>💬 {item.comment}</div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '20px', fontFamily: 'Arial', maxWidth: '1200px', margin: '0 auto', background: '#f0f2f5', minHeight: '100vh' },
  header: { background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', marginBottom: '20px' },
  statusBar: { display: 'flex', gap: '15px', marginTop: '20px' },
  status: { flex: 1, padding: '15px', borderRadius: '8px', color: 'white', textAlign: 'center', fontWeight: 'bold' },
  printerInfo: { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', marginBottom: '20px' },
  configButton: { padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  configModal: { marginTop: '20px', padding: '20px', background: '#f9fafb', borderRadius: '8px', border: '2px solid #3b82f6' },
  configSection: { marginBottom: '15px' },
  label: { display: 'block', fontWeight: 'bold', marginBottom: '5px' },
  select: { width: '100%', padding: '10px', borderRadius: '6px', border: '2px solid #d1d5db', fontSize: '14px' },
  printerList: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginTop: '15px' },
  printerItem: { padding: '15px', background: '#f9fafb', borderRadius: '8px', borderLeft: '4px solid #3b82f6' },
  availablePrinters: { marginTop: '20px', padding: '15px', background: '#d1fae5', borderRadius: '8px', fontSize: '14px' },
  testButton: { padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
  orders: { background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  order: { padding: '20px', background: '#f9fafb', borderRadius: '8px', marginBottom: '15px', borderLeft: '4px solid #10b981' },
  orderHeader: { display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' },
  badge: { marginLeft: '10px', padding: '2px 8px', background: '#e5e7eb', borderRadius: '12px', fontSize: '11px' },
  comment: { marginTop: '5px', marginLeft: '20px', fontSize: '13px', color: '#6b7280', fontStyle: 'italic' },
  empty: { textAlign: 'center', color: '#999', padding: '60px 20px' }
};

export default PrinterStation;