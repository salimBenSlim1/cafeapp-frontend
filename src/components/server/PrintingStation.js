import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const PrinterStation = () => {
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const [qzStatus, setQzStatus] = useState('disconnected');
  const [orders, setOrders] = useState([]);
  const [availablePrinters, setAvailablePrinters] = useState([]);
  const [printerConfig, setPrinterConfig] = useState({
    kitchen: "Microsoft Print to PDF",
    bar: "Microsoft Print to PDF",
    chicha: "Microsoft Print to PDF"
  });

  const CAFE_ID = localStorage.getItem('cafeId');
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const TOKEN = localStorage.getItem('token');

  // Your certificate (make sure this matches the one in QZ Tray)
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
    loadPrinterConfig();

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

    socket.on('newOrder', async (orderData) => {
      console.log('📥 NEW ORDER NOTIFICATION:', orderData);

      try {
        const response = await axios.get(
          `${API_URL}/server/orders/${orderData.id}`,
          { headers: { 'server-token': localStorage.getItem('serverToken') } }
        );

        const completeOrder = response.data;
        const orderForPrint = transformOrderData(completeOrder);
        setOrders(prev => [orderForPrint, ...prev]);
        await printOrder(orderForPrint);

      } catch (error) {
        console.error('❌ Error fetching order:', error);
        const fallbackOrder = transformOrderData(orderData);
        setOrders(prev => [fallbackOrder, ...prev]);
        await printOrder(fallbackOrder);
      }
    });

    setupQZTray();

    return () => {
      socket.disconnect();
      if (window.qz && window.qz.websocket && window.qz.websocket.isActive()) {
        window.qz.websocket.disconnect();
      }
    };
  }, [CAFE_ID, API_URL, TOKEN]);

  const loadPrinterConfig = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/server/printer/config`,
        { headers: { 'server-token': localStorage.getItem('serverToken') } }
      );

      if (response.data.config && Object.keys(response.data.config).length > 0) {
        setPrinterConfig(response.data.config);
        console.log('✅ Loaded printer config from database:', response.data.config);
      }
    } catch (error) {
      console.error('❌ Failed to load printer config:', error);
    }
  };

  // ============================================
  // ALTERNATIVE APPROACH: Use QZ's setSignatureAlgorithm
  // ============================================
  const setupQZTray = async () => {
    try {
      if (!window.qz) {
        console.error('❌ QZ Tray library not loaded');
        setQzStatus('error - library missing');
        return;
      }

      console.log('🔐 Setting up QZ Tray security (Alternative Method)...');

      // Method 1: Set the signature algorithm explicitly
      if (window.qz.security.setSignatureAlgorithm) {
        window.qz.security.setSignatureAlgorithm("SHA512");
        console.log('✅ Signature algorithm set to SHA512');
      }

      // Set certificate
      window.qz.security.setCertificatePromise(function(resolve, reject) {
        console.log('🔐 Providing certificate to QZ...');
        resolve(PUBLIC_CERT);
      });

      // Set signature promise with detailed logging
      window.qz.security.setSignaturePromise(function(toSign) {
        return (resolve, reject) => {
          console.log('📝 QZ requesting signature...');
          console.log('   To sign:', String(toSign).substring(0, 100));
          
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
          .then(response => {
            console.log('✅ Got signature from backend');
            console.log('   Signature length:', response.data.signature.length);
            console.log('   Signature preview:', response.data.signature.substring(0, 60) + '...');
            resolve(response.data.signature);
          })
          .catch(error => {
            console.error('❌ Failed to get signature:', error);
            console.error('   Error details:', error.response?.data);
            reject(error);
          });
        };
      });

      // Try to connect
      await connectToQZ();

    } catch (error) {
      console.error('❌ QZ Tray setup failed:', error);
      setQzStatus('setup error: ' + error.message);
    }
  };

  const connectToQZ = async () => {
    try {
      if (!window.qz || !window.qz.websocket) {
        throw new Error('QZ Tray not available');
      }

      if (window.qz.websocket.isActive()) {
        console.log('✅ Already connected to QZ Tray');
        setQzStatus('connected');
        await listPrinters();
        return;
      }

      console.log('🔌 Connecting to QZ Tray...');
      setQzStatus('connecting...');

      await window.qz.websocket.connect();
      
      console.log('✅ Connected to QZ Tray!');
      setQzStatus('connected ✓');

      await listPrinters();

    } catch (error) {
      console.error('❌ QZ Tray connection failed:', error);
      console.error('   Full error:', error);
      setQzStatus('error - ' + error.message);
      
      // More detailed error handling
      if (error.message && error.message.includes('signature')) {
        alert(`⚠️ Signature Validation Failed!\n\nThis means:\n1. Backend signature doesn't match certificate\n2. Check backend is using SHA512\n3. Check cert.pem and key.pem are a matching pair\n\nFor now, click "Allow" to proceed.\n\nError: ${error.message}`);
      } else {
        alert(`Failed to connect to QZ Tray:\n${error.message}\n\nMake sure QZ Tray is running!`);
      }
    }
  };

  const listPrinters = async () => {
    try {
      const printers = await window.qz.printers.find();
      console.log('🖨️ Available printers:', printers);
      setAvailablePrinters(printers);

      try {
        await axios.post(
          `${API_URL}/server/printer/available`,
          { printers },
          { headers: { 'server-token': localStorage.getItem('serverToken') } }
        );
      } catch (err) {
        console.error('Failed to register printers:', err);
      }

      if (printers.length === 0) {
        alert('⚠️ No printers detected!');
      } else {
        verifyPrinters(printers);
      }
    } catch (error) {
      console.error('❌ Failed to list printers:', error);
    }
  };

  const verifyPrinters = (printers) => {
    const missing = [];
    
    Object.entries(printerConfig).forEach(([type, name]) => {
      if (!printers.includes(name)) {
        missing.push(`${type}: ${name}`);
      }
    });

    if (missing.length > 0) {
      const availableList = printers.map(p => `  • ${p}`).join('\n');
      console.warn(`⚠️ Configured printers not found:\n${missing.join('\n')}\n\nAvailable:\n${availableList}`);
    } else {
      console.log('✅ All printers verified');
    }
  };

  const transformOrderData = (rawOrder) => {
    let items = [];

    if (rawOrder.orderItems && Array.isArray(rawOrder.orderItems)) {
      items = rawOrder.orderItems.map(orderItem => ({
        id: orderItem.id,
        name: orderItem.item?.name || orderItem.itemName || 'Unknown Item',
        quantity: orderItem.quantity || 1,
        category: (orderItem.item?.category || 'food').toLowerCase(),
        notes: orderItem.comment || orderItem.notes || ''
      }));
    } else if (rawOrder.items && Array.isArray(rawOrder.items)) {
      items = rawOrder.items.map(item => ({
        id: item.id || item.itemId,
        name: item.name || item.itemName || 'Unknown Item',
        quantity: item.quantity || 1,
        category: (item.category || 'food').toLowerCase(),
        notes: item.comment || item.notes || ''
      }));
    }

    return {
      id: rawOrder.id || rawOrder.orderId,
      tableNumber: rawOrder.table?.number || rawOrder.tableNumber || rawOrder.tableId || 'N/A',
      createdAt: rawOrder.createdAt || new Date(),
      items: items
    };
  };

  const printOrder = async (order) => {
    console.log('🖨️ PRINTING ORDER:', order);

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

    console.log('📦 Items grouped by printer:', itemsByPrinter);

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
    let printerName = printerConfig[printerType];
    console.log(`🖨️ Printing to ${printerType.toUpperCase()} (${printerName})...`);

    if (!window.qz || !window.qz.websocket.isActive()) {
      console.error('❌ QZ Tray not connected');
      alert('⚠️ QZ Tray not connected! Please reconnect.');
      return;
    }

    try {
      const availablePrinters = await window.qz.printers.find();
      
      if (!availablePrinters.includes(printerName)) {
        console.warn(`⚠️ Printer "${printerName}" not found`);
        if (availablePrinters.length > 0) {
          printerName = availablePrinters[0];
          console.log(`📄 Using fallback: ${printerName}`);
        } else {
          throw new Error('No printers available');
        }
      }

      const receiptText = generateSimpleReceipt(printerType, items, order);
      
      const config = window.qz.configs.create(printerName);
      const data = [{
        type: 'raw',
        format: 'plain',
        data: receiptText
      }];

      console.log(`📄 Sending to printer: ${printerName}`);
      await window.qz.print(config, data);
      
      console.log(`✅ Printed to ${printerType.toUpperCase()}`);
      showNotification(`✅ ${printerType.toUpperCase()} - Table ${order.tableNumber}`);

    } catch (error) {
      console.error(`❌ Print failed for ${printerType}:`, error);
      alert(`Print failed for ${printerType}: ${error.message}`);
    }
  };

  const generateSimpleReceipt = (printerType, items, order) => {
    const time = new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });

    let receipt = `
================================
     ${printerType.toUpperCase()} ORDER
================================
Table: ${order.tableNumber}
Time: ${time}
--------------------------------

`;

    items.forEach(item => {
      receipt += `x${item.quantity}  ${item.name}\n`;
      if (item.notes) {
        receipt += `    Note: ${item.notes}\n`;
      }
    });

    receipt += `
================================


`;

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
    const testOrder = {
      id: 'TEST-999',
      tableNumber: 5,
      items: [
        { name: 'Margherita Pizza', quantity: 2, category: 'food' },
        { name: 'Caesar Salad', quantity: 1, category: 'food' },
        { name: 'Chocolate Cake', quantity: 1, category: 'dessert' },
        { name: 'Cappuccino', quantity: 2, category: 'coffee' },
        { name: 'Orange Juice', quantity: 1, category: 'drink' },
        { name: 'Apple Shisha', quantity: 1, category: 'smoking' }
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
        <h3>📋 Printer Configuration (Café {CAFE_ID})</h3>
        
        {availablePrinters.length === 0 ? (
          <div style={styles.noPrinters}>
            <p>⚠️ No printers detected!</p>
            <button 
              onClick={connectToQZ} 
              style={{...styles.testButton, background: '#f59e0b', marginTop: '10px'}}
            >
              🔌 Connect to QZ Tray
            </button>
          </div>
        ) : (
          <>
            <div style={styles.printerList}>
              <div style={styles.printerItem}>
                <strong>🍕 Kitchen:</strong> {printerConfig.kitchen}
              </div>
              <div style={styles.printerItem}>
                <strong>☕ Bar:</strong> {printerConfig.bar}
              </div>
              <div style={styles.printerItem}>
                <strong>💨 Chicha:</strong> {printerConfig.chicha}
              </div>
            </div>

            <div style={styles.availablePrinters}>
              <strong>✅ Available ({availablePrinters.length}):</strong>
              <ul>
                {availablePrinters.map((printer, idx) => (
                  <li key={idx}>{printer}</li>
                ))}
              </ul>
            </div>
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
            🔌 Reconnect
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
                    x{item.quantity} {item.name}
                    <span style={styles.badge}>{item.category}</span>
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
  noPrinters: { background: '#fef3c7', padding: '20px', borderRadius: '8px', marginTop: '15px', border: '2px solid #f59e0b', textAlign: 'center' },
  printerList: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginTop: '15px' },
  printerItem: { padding: '15px', background: '#f9fafb', borderRadius: '8px', borderLeft: '4px solid #3b82f6' },
  availablePrinters: { marginTop: '20px', padding: '15px', background: '#d1fae5', borderRadius: '8px', fontSize: '14px' },
  testButton: { padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
  orders: { background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  order: { padding: '20px', background: '#f9fafb', borderRadius: '8px', marginBottom: '15px', borderLeft: '4px solid #10b981' },
  orderHeader: { display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' },
  badge: { marginLeft: '10px', padding: '2px 8px', background: '#e5e7eb', borderRadius: '12px', fontSize: '11px' },
  empty: { textAlign: 'center', color: '#999', padding: '60px 20px' }
};

export default PrinterStation;