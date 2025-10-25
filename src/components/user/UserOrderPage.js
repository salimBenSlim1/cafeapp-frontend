import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Plus, Minus, X, Receipt } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import {io} from 'socket.io-client';

function UserOrderPage() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [openCart, setOpenCart] = useState(false);
  const [openOrders, setOpenOrders] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL;
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const qrKey = queryParams.get("t");

  // Load orders from localStorage on component mount
  useEffect(() => {
    const storedOrders = localStorage.getItem('userOrders');
    if (storedOrders) {
      try {
        setOrders(JSON.parse(storedOrders));
      } catch (err) {
        console.error('Failed to parse stored orders:', err);
        localStorage.removeItem('userOrders');
      }
    }
  }, []);

  // Socket.IO connection for status updates
  useEffect(() => {
    if (!sessionActive) return;

     const SOCKET_URL = process.env.REACT_APP_WS_URL;
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });
    
   
    
    newSocket.on('statusUpdated', (data) => {

      // Trigger session expired
      setSessionExpired(true);
      
      // Navigate to Google after 5 seconds
      setTimeout(() => {
        window.location.href = 'https://www.google.com';
      }, 5000);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [sessionActive, API_BASE]);

  // Save orders to localStorage whenever they change
  useEffect(() => {
    if (orders.length > 0) {
      localStorage.setItem('userOrders', JSON.stringify(orders));
    }
  }, [orders]);

  // Session initialization - only runs once when QR code is scanned
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const response = await axios.get(`${API_BASE}/start-session`, {
          params: { key: qrKey }
        });

        sessionStorage.setItem('tai', response.data.tableId);
        sessionStorage.setItem('t', response.data.token);
        sessionStorage.setItem('c', response.data.cafeId);
        sessionStorage.setItem('ti', response.data.tableNumber);
        sessionStorage.setItem('sessionKey', qrKey);

        setSessionActive(true);
        loadProducts(response.data.cafeId);
      } catch (err) {
        console.error('Session initialization failed:', err);
        setLoading(false);
      }
    };

    initializeSession();
  }, [qrKey]);

  const loadProducts = async (cafeId) => {
    try {
      const response = await axios.get(`${API_BASE}/getUserItems/${cafeId}`);
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionActive && refresh) {
      const cafeId = sessionStorage.getItem('c');
      if (cafeId) {
        loadProducts(cafeId);
      }
    }
  }, [refresh, sessionActive]);

  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((product) => product.category === categoryFilter);
    }

    setFilteredProducts(filtered);
  }, [searchTerm, categoryFilter, products]);

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: Math.max(0, Math.min(item.stock, item.quantity + delta)) }
        : item
    ).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const placeOrder = async () => {
    if (!cart.length) return;

    setOrderLoading(true);

    const payload = {
      cafeId: sessionStorage.getItem('c'),
      items: cart.map(i => ({ itemId: i.id, quantity: i.quantity }))
    };

    // Create new order object
    const newOrder = {
      id: Date.now(),
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      items: cart.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price })),
      total: getTotalPrice(),
      status: 'pending'
    };

    // Add to orders array (which will trigger localStorage save via useEffect)
    setOrders(prevOrders => [...prevOrders, newOrder]);

    try {
      const response = await axios.post(`${API_BASE}/addOrder`, payload, {
        headers: {
          key: qrKey,
          token: sessionStorage.getItem('t')
        }
      });
      console.log('Order placed successfully:', response.data);
      setRefresh(!refresh);
      setCart([]);
      setOpenCart(false);
    } catch (err) {
      console.error('placeOrder error:', err);
      if (err.response?.status === 401) {
        sessionStorage.clear();
        alert('Session expired. Please scan the QR code again.');
      } else {
        alert('Failed to place order. Please try again.');
      }
      // Remove order if failed
      setOrders(prevOrders => prevOrders.filter(o => o.id !== newOrder.id));
    } finally {
      setOrderLoading(false);
    }
  };

  const clearAllOrders = () => {
    if (window.confirm('Are you sure you want to clear all orders?')) {
      setOrders([]);
      localStorage.removeItem('userOrders');
    }
  };

  const categories = ['all', 'Coffee', 'Food', 'Drink', 'Dessert', 'Games', 'Smoking'];

  // Session Expired Screen
  if (sessionExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <img src="/images/coffAI.png" alt="CoffAI Logo" className="w-48 h-48 mx-auto" />
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h1 className="text-3xl font-bold text-white mb-4">Session Expirée</h1>
            <p className="text-blue-200 text-lg mb-6">
              Votre session a expiré. Merci d'avoir utilisé CoffAI!
            </p>
            <p className="text-slate-300 text-sm mb-4">
              Bienvenue et à bientôt! 👋
            </p>
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400 text-sm">
              Redirection en cours...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // No session active
  if (!sessionActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <img src="/images/coffAI.png" alt="CoffAI Logo" className="w-48 h-48 mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Welcome to CoffAI</h1>
          <p className="text-blue-200 text-lg mb-6">
            Please scan the QR code at your table to start ordering
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <p className="text-white">
              No active session detected. You need to scan a table QR code to access the menu.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative z-10">
        {/* Header with Logo */}
        <div className="mb-8 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <img src="/images/coffAI.png" alt="CoffAI Logo" className="w-16 h-16" />
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">CoffAI Menu</h1>
                <p className="text-blue-300 text-sm md:text-base">Table {sessionStorage.getItem('tai')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-emerald-500/20 px-4 py-2 rounded-full border border-emerald-500/30">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-emerald-300 text-sm font-medium">Session Active</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" size={20} />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 text-white placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 bg-slate-900/50 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-w-[200px]"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-900">
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-24">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden transform transition-all hover:scale-105 hover:shadow-2xl hover:border-blue-500/50 ${!product.stock ? 'opacity-60' : ''}`}
            >
              <div className="relative h-56 overflow-hidden bg-slate-900/50">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform hover:scale-110"
                />
                {!product.stock && (
                  <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    Out of Stock
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-3 min-h-[60px]">
                  <h3 className="text-lg font-bold text-white flex-1">{product.name}</h3>
                  <span className="ml-2 px-3 py-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full text-xs font-semibold">
                    {product.category}
                  </span>
                </div>
                <p className="text-2xl font-bold text-emerald-400 mb-4">
                  {product.price.toFixed(2)} TnD
                </p>
                <button
                  onClick={() => addToCart(product)}
                  disabled={!product.stock}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-blue-500/50 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Cart FAB */}
        <button
          onClick={() => setOpenCart(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full shadow-2xl hover:scale-110 hover:shadow-blue-500/50 transition-transform flex items-center justify-center z-50"
        >
          <div className="relative">
            <ShoppingCart size={28} />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {cart.length}
              </span>
            )}
          </div>
        </button>

        {/* Orders FAB */}
        <button
          onClick={() => setOpenOrders(true)}
          className="fixed bottom-28 right-8 w-14 h-14 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full shadow-2xl hover:scale-110 hover:shadow-emerald-500/50 transition-transform flex items-center justify-center z-50"
        >
          <div className="relative">
            <Receipt size={24} />
            {orders.filter(o => o.status !== 'served').length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {orders.filter(o => o.status !== 'served').length}
              </span>
            )}
          </div>
        </button>

        {/* Cart Modal */}
        {openCart && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Your Cart</h2>
                <button onClick={() => setOpenCart(false)} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <p className="text-center text-slate-400 py-10">Your cart is empty</p>
                ) : (
                  <>
                    {cart.map((item) => (
                      <div key={item.id} className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 mb-3">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-semibold text-white">{item.name}</h3>
                          <p className="font-bold text-emerald-400">
                            {(item.price * item.quantity).toFixed(2)} TnD
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center transition-all text-white"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="font-semibold min-w-[30px] text-center text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center transition-all text-white"
                          >
                            <Plus size={16} />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="ml-auto text-red-400 hover:bg-red-500/20 p-2 rounded-lg transition-colors"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    <div className="mt-6">
                      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-5 rounded-xl">
                        <p className="text-xl font-bold">Total: {getTotalPrice().toFixed(2)} TnD</p>
                      </div>
                      <div className="mt-6 flex gap-3">
                        <button
                          onClick={() => setOpenCart(false)}
                          disabled={orderLoading}
                          className="flex-1 py-3 px-6 text-slate-300 hover:bg-slate-700 rounded-xl font-semibold transition-colors border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Continue Shopping
                        </button>
                        <button
                          onClick={placeOrder}
                          disabled={cart.length === 0 || orderLoading}
                          className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                          {orderLoading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Processing...</span>
                            </>
                          ) : (
                            'Place Order'
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Orders Modal */}
        {openOrders && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">My Orders</h2>
                <button onClick={() => setOpenOrders(false)} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {orders.length === 0 ? (
                  <p className="text-center text-slate-400 py-10">No orders yet</p>
                ) : (
                  <div className="space-y-4">
                    {orders.slice().reverse().map((order) => (
                      <div key={order.id} className="bg-slate-900/50 border border-slate-700 rounded-xl p-5">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-bold text-white">Order #{order.id}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            order.status === 'served' 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : order.status === 'preparing' 
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}>
                            {order.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 mb-3">{order.date}</p>
                        <div className="space-y-1 mb-3">
                          {order.items.map((item, idx) => (
                            <p key={idx} className="text-sm text-slate-300">
                              {item.quantity}x {item.name} - {(item.price * item.quantity).toFixed(2)} TnD
                            </p>
                          ))}
                        </div>
                        <div className="border-t border-slate-700 pt-3">
                          <p className="font-bold text-emerald-400 text-right">
                            Total: {order.total.toFixed(2)} TnD
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Total Summary */}
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-5 mt-6">
                      <div className="text-white">
                        <p className="text-lg mb-2">Session Summary</p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm opacity-90">Total Orders:</span>
                          <span className="font-bold text-xl">{orders.length}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm opacity-90">Grand Total:</span>
                          <span className="font-bold text-2xl">
                            {orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)} TnD
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Clear Orders Button */}
                    <button
                      onClick={clearAllOrders}
                      className="w-full mt-4 py-3 px-6 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <X size={20} />
                      Clear All Orders
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay for Order Placement */}
        {orderLoading && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-xl font-semibold mb-2">Placing your order...</p>
              <p className="text-slate-400 text-sm">Please wait while we process your request</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserOrderPage;