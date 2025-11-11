import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Plus, Minus, X, Receipt, CheckCircle, AlertCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import ChatbotWaiter from '../ChatbotWaiter';

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
  const [sessionData, setSessionData] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [addedToCart, setAddedToCart] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const qrKey = queryParams.get("t");

  const [socket, setSocket] = useState(null);

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

  useEffect(() => {
    if (orders.length > 0) {
      localStorage.setItem('userOrders', JSON.stringify(orders));
    }
  }, [orders]);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const existingToken = localStorage.getItem('userToken');
        
        if (existingToken && !qrKey) {
          try {
            const response = await axios.get(`${API_BASE}/getUserItems`, {
              headers: { 'Authorization': `Bearer ${existingToken}` }
            });
            setProducts(response.data);
            setFilteredProducts(response.data);
            setSessionActive(true);
            setLoading(false);
            return;
          } catch (err) {
            console.log('Existing token invalid, clearing...');
            localStorage.removeItem('userToken');
          }
        }

        if (!qrKey) {
          console.log("No QR key and no valid token");
          setLoading(false);
          setSessionActive(false);
          return;
        }

        const response = await axios.get(`${API_BASE}/start-session`, {
          params: { key: qrKey }
        });
        
        console.log('Session started:', response.data);
        const { token, cafeId, tableId } = response.data;
        if (cafeId) sessionStorage.setItem('c',cafeId)
        localStorage.setItem('userToken', token);
        if (tableId) {
          sessionStorage.setItem('tai', tableId);
        }

        queryParams.delete("t");
        const newSearch = queryParams.toString();
        const newUrl = `${location.pathname}${newSearch ? `?${newSearch}` : ""}`;
        navigate(newUrl, { replace: true });

        await loadProducts();

      } catch (err) {
        console.error('Session initialization failed:', err);
        if (err.response?.status === 404) {
          alert('Invalid QR code. Please scan a valid table QR code.');
        } else if (err.response?.status === 403) {
          alert('This table is currently inactive. Please contact staff.');
        } else if (err.response?.status === 410) {
          handleSessionExpired();
        }
        setLoading(false);
        setSessionActive(false);
      }
    };

    initializeSession();
  }, []);

  useEffect(() => {
    if (!sessionActive) return;

    const SOCKET_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      withCredentials: true,
      auth: {
        token: localStorage.getItem('userToken')
      }
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      newSocket.emit('userJoin',{id:newSocket.id})
    });

    newSocket.on('orderStatusUpdate', (data) => {
      console.log('Order status updated:', data);
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === data.orderId 
            ? { ...order, status: data.status }
            : order
        )
      );
    });

    newSocket.on('statusUpdated', (data) => {
      console.log(data)
      console.log('Session status updated - expired');
      handleSessionExpired();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [sessionActive, sessionData?.cafeId]);

  const handleSessionExpired = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userOrders');
    sessionStorage.removeItem('tai');
    setSessionExpired(true);
    
    setTimeout(() => {
      window.location.href = 'https://www.google.com';
    }, 5000);
  };

  const loadProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE}/getUserItems`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('userToken')}` }
      });
      setProducts(response.data);
      setFilteredProducts(response.data);
      setSessionActive(true);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load products:', err);
      if (err.response?.status === 401 || err.response?.status === 410) {
        handleSessionExpired();
      }
      setLoading(false);
      setSessionActive(false);
    }
  };

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

    setAddedToCart(product.id);
    setTimeout(() => setAddedToCart(null), 1000);
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

  const confirmOrder = async () => {
    setShowConfirmation(false);
    setOrderLoading(true);

    const payload = {
      items: cart.map(i => ({ itemId: i.id, quantity: i.quantity }))
    };

    const newOrder = {
      id: Date.now(),
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      items: cart.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price })),
      total: getTotalPrice(),
      status: 'pending'
    };

    setOrders(prevOrders => [...prevOrders, newOrder]);
    
    try {
      const response = await axios.post(`${API_BASE}/addOrder`, payload, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('userToken')}` }
      });
      socket.emit('userJoin',{id:response.data.orderId})
      console.log('Order placed successfully:', response.data);
      
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === newOrder.id 
            ? { ...order, id: response.data.orderId }
            : order
        )
      );

      setRefresh(!refresh);
      setCart([]);
      setOrderSuccess(true);
      
      setTimeout(() => {
        setOrderSuccess(false);
        setOpenCart(false);
      }, 2000);

    } catch (err) {
      console.error('placeOrder error:', err);
      alert('Failed to place order. Please try again.');
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

  const categories = ['all', 'coffee', 'food', 'drink', 'dessert', 'games', 'smoking'];

  if (sessionExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <img src="/images/coffAI.png" alt="CoffAI Logo" className="w-48 h-48 mx-auto" />
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h1 className="text-3xl font-bold text-white mb-4">Session Expired</h1>
            <p className="text-blue-200 text-lg mb-6">
              Your session has expired. Thank you for using CoffAI!
            </p>
            <p className="text-slate-300 text-sm mb-4">
              See you next time! 👋
            </p>
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400 text-sm">
              Redirecting...
            </p>
          </div>
        </div>
      </div>
    );
  }

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
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative z-10">
        <div className="mb-8 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <img src="/images/coffAI.png" alt="CoffAI Logo" className="w-16 h-16" />
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">CoffAI Menu</h1>
                <p className="text-blue-300 text-sm md:text-base">Table {sessionStorage.getItem('tai') || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-emerald-500/20 px-4 py-2 rounded-full border border-emerald-500/30">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-emerald-300 text-sm font-medium">Session Active</span>
            </div>
          </div>
        </div>

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

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 mb-24">
          {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              className={`bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl sm:rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:border-blue-500/50 ${!product.stock ? 'opacity-60' : ''}`}
              style={{
                animation: `fadeInUp 0.5s ease-out ${index * 0.05}s both`
              }}
            >
              <div className="relative h-32 sm:h-48 lg:h-56 overflow-hidden bg-slate-900/50">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                />
                {!product.stock && (
                  <div className="absolute top-1 right-1 sm:top-3 sm:right-3 bg-red-500 text-white px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-sm font-bold">
                    Out
                  </div>
                )}
                {addedToCart === product.id && (
                  <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center animate-pulse">
                    <CheckCircle size={32} className="sm:w-12 sm:h-12 text-white" />
                  </div>
                )}
                <span className="absolute top-1 left-1 sm:top-2 sm:left-2 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full text-[9px] sm:text-xs font-semibold">
                  {product.category}
                </span>
              </div>
              <div className="p-2 sm:p-4">
                <h3 className="text-xs sm:text-base font-bold text-white mb-1 sm:mb-2 line-clamp-2 min-h-[32px] sm:min-h-[40px]">
                  {product.name}
                </h3>
                <p className="text-sm sm:text-xl font-bold text-emerald-400 mb-2 sm:mb-3">
                  {product.price.toFixed(2)} TnD
                </p>
                <button
                  onClick={() => addToCart(product)}
                  disabled={!product.stock}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold shadow-lg hover:shadow-blue-500/50 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1 sm:gap-2 active:scale-95"
                >
                  <Plus size={14} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="text-[10px] sm:text-sm">Add</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setOpenCart(true)}
          className="fixed bottom-6 sm:bottom-8 right-6 sm:right-8 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 hover:shadow-blue-500/50 transition-transform flex items-center justify-center z-50"
        >
          <div className="relative">
            <ShoppingCart size={24} className="sm:w-7 sm:h-7" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-bounce">
                {cart.length}
              </span>
            )}
          </div>
        </button>

        <button
          onClick={() => setOpenOrders(true)}
          className="fixed bottom-24 sm:bottom-28 right-6 sm:right-8 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 hover:shadow-emerald-500/50 transition-transform flex items-center justify-center z-50"
        >
          <div className="relative">
            <Receipt size={20} className="sm:w-6 sm:h-6" />
            {orders.filter(o => o.status !== 'served').length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {orders.filter(o => o.status !== 'served').length}
              </span>
            )}
          </div>
        </button>

        {/* Chatbot Waiter Component */}
        <ChatbotWaiter products={products} onAddToCart={addToCart} />

        {openCart && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slideUp">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-5 sm:p-6 flex justify-between items-center">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Your Cart</h2>
                <button onClick={() => setOpenCart(false)} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors active:scale-95">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-10">
                    <ShoppingCart size={64} className="mx-auto text-slate-600 mb-4" />
                    <p className="text-slate-400">Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    {cart.map((item) => (
                      <div key={item.id} className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 mb-3 transform transition-all hover:scale-[1.02]">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-semibold text-white text-sm sm:text-base">{item.name}</h3>
                          <p className="font-bold text-emerald-400 text-sm sm:text-base">
                            {(item.price * item.quantity).toFixed(2)} TnD
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-8 h-8 bg-slate-700 hover:bg-slate-600 active:scale-95 rounded-lg flex items-center justify-center transition-all text-white"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="font-semibold min-w-[30px] text-center text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-8 h-8 bg-slate-700 hover:bg-slate-600 active:scale-95 rounded-lg flex items-center justify-center transition-all text-white"
                          >
                            <Plus size={16} />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="ml-auto text-red-400 hover:bg-red-500/20 active:scale-95 p-2 rounded-lg transition-colors"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    <div className="mt-6">
                      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 sm:p-5 rounded-xl">
                        <p className="text-lg sm:text-xl font-bold">Total: {getTotalPrice().toFixed(2)} TnD</p>
                      </div>
                      <div className="mt-6 flex gap-3">
                        <button
                          onClick={() => setOpenCart(false)}
                          disabled={orderLoading}
                          className="flex-1 py-2.5 sm:py-3 px-4 sm:px-6 text-slate-300 hover:bg-slate-700 active:scale-95 rounded-xl font-semibold transition-all border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                          Continue
                        </button>
                        <button
                          onClick={() => setShowConfirmation(true)}
                          disabled={cart.length === 0 || orderLoading}
                          className="flex-1 py-2.5 sm:py-3 px-4 sm:px-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-blue-500/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                        >
                          Place Order
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {showConfirmation && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full shadow-2xl animate-scaleIn">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 rounded-t-2xl">
                <AlertCircle size={48} className="text-white mx-auto mb-3" />
                <h2 className="text-2xl font-bold text-white text-center">Confirm Order</h2>
              </div>
              
              <div className="p-6">
                <p className="text-slate-300 text-center mb-6">
                  Are you sure you want to place this order?
                </p>
                
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 mb-6">
                  <div className="space-y-2 mb-3">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-slate-300">{item.quantity}x {item.name}</span>
                        <span className="text-emerald-400 font-semibold">
                          {(item.price * item.quantity).toFixed(2)} TnD
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-700 pt-3">
                    <div className="flex justify-between">
                      <span className="font-bold text-white">Total:</span>
                      <span className="font-bold text-emerald-400 text-lg">
                        {getTotalPrice().toFixed(2)} TnD
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="flex-1 py-3 px-6 bg-slate-700 hover:bg-slate-600 active:scale-95 text-white rounded-xl font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmOrder}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white rounded-xl font-semibold shadow-lg transition-all"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {orderSuccess && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-emerald-500 rounded-2xl p-8 text-center shadow-2xl animate-scaleIn">
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle size={48} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Order Placed!</h2>
              <p className="text-slate-300">Your order has been successfully placed</p>
            </div>
          </div>
        )}

        {openOrders && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slideUp">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 sm:p-6 flex justify-between items-center">
                <h2 className="text-xl sm:text-2xl font-bold text-white">My Orders</h2>
                <button onClick={() => setOpenOrders(false)} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors active:scale-95">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {orders.length === 0 ? (
                  <div className="text-center py-10">
                    <Receipt size={64} className="mx-auto text-slate-600 mb-4" />
                    <p className="text-slate-400">No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.slice().reverse().map((order, index) => (
                      <div 
                        key={order.id} 
                        className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 sm:p-5 transform transition-all hover:scale-[1.02]"
                        style={{
                          animation: `fadeInUp 0.3s ease-out ${index * 0.1}s both`
                        }}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-bold text-white text-sm sm:text-base">Order #{order.id}</h3>
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                            order.status === 'served' 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : order.status === 'preparing' 
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}>
                            {order.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-400 mb-3">{order.date}</p>
                        <div className="space-y-1 mb-3">
                          {order.items.map((item, idx) => (
                            <p key={idx} className="text-xs sm:text-sm text-slate-300">
                              {item.quantity}x {item.name} - {(item.price * item.quantity).toFixed(2)} TnD
                            </p>
                          ))}
                        </div>
                        <div className="border-t border-slate-700 pt-3">
                          <p className="font-bold text-emerald-400 text-right text-sm sm:text-base">
                            Total: {order.total.toFixed(2)} TnD
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-4 sm:p-5 mt-6">
                      <div className="text-white">
                        <p className="text-base sm:text-lg mb-2">Session Summary</p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm opacity-90">Total Orders:</span>
                          <span className="font-bold text-lg sm:text-xl">{orders.length}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs sm:text-sm opacity-90">Grand Total:</span>
                          <span className="font-bold text-xl sm:text-2xl">
                            {orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)} TnD
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={clearAllOrders}
                      className="w-full mt-4 py-2.5 sm:py-3 px-4 sm:px-6 bg-red-600/20 hover:bg-red-600/30 active:scale-95 text-red-400 border border-red-500/30 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
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

        {orderLoading && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl text-center animate-pulse">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-lg sm:text-xl font-semibold mb-2">Placing your order...</p>
              <p className="text-slate-400 text-xs sm:text-sm">Please wait while we process your request</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserOrderPage;