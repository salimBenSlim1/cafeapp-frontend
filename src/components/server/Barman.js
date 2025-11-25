import { useState, useEffect, useRef } from 'react';

// Shared Order Display Component
function OrderDisplay({ orders, title, color, onDismiss, notificationCount }) {
  const [swipingOrderId, setSwipingOrderId] = useState(null);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const swipeStartX = useRef(0);
  const isDismissing = useRef(false);

  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const getTimeDifference = (date) => {
    const now = new Date();
    const orderTime = new Date(date);
    const diffMinutes = Math.floor((now - orderTime) / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    return `${Math.floor(diffMinutes / 60)}h ago`;
  };

  const handleSwipeStart = (e, orderId) => {
    if (isDismissing.current) return;
    swipeStartX.current = e.touches[0].clientX;
    setSwipingOrderId(orderId);
  };

  const handleSwipeMove = (e, orderId) => {
    if (swipingOrderId !== orderId || isDismissing.current) return;
    
    const currentX = e.touches[0].clientX;
    const distance = currentX - swipeStartX.current;
    
    setSwipeDistance(distance);
  };

  const handleSwipeEnd = (orderId) => {
    if (isDismissing.current) return;
    
    if (Math.abs(swipeDistance) > 120) {
      isDismissing.current = true;
      setSwipeDistance(swipeDistance > 0 ? 500 : -500);
      
      setTimeout(() => {
        onDismiss(orderId);
        isDismissing.current = false;
        setSwipingOrderId(null);
        setSwipeDistance(0);
      }, 300);
    } else {
      setSwipeDistance(0);
      setSwipingOrderId(null);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              margin: 0,
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              {title}
            </h1>
            <p style={{
              margin: '4px 0 0 0',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '14px'
            }}>
              {orders.length} pending order{orders.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          {notificationCount > 0 && (
            <div style={{
              backgroundColor: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 'bold',
              animation: 'pulse 2s infinite',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)'
            }}>
              {notificationCount > 99 ? '99+' : notificationCount}
            </div>
          )}
        </div>
      </div>

      <div style={{
        padding: '16px',
        overflowY: 'auto',
        height: 'calc(100vh - 100px)',
        WebkitOverflowScrolling: 'touch'
      }}>
        {orders.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#64748b'
          }}>
            <p style={{ fontSize: '18px', margin: 0 }}>No pending orders</p>
            <p style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>
              Swipe left or right to dismiss orders
            </p>
          </div>
        ) : (
          orders.map((order) => {
            const isBeingSwiped = swipingOrderId === order.id;
            const currentSwipe = isBeingSwiped ? swipeDistance : 0;
            const opacity = Math.max(0.2, 1 - (Math.abs(currentSwipe) / 400));
            const rotation = currentSwipe / 30;
            
            return (
              <div
                key={order.id}
                onTouchStart={(e) => handleSwipeStart(e, order.id)}
                onTouchMove={(e) => handleSwipeMove(e, order.id)}
                onTouchEnd={() => handleSwipeEnd(order.id)}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '16px',
                  marginBottom: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  border: '1px solid #e2e8f0',
                  transform: `translateX(${currentSwipe}px) rotate(${rotation}deg)`,
                  opacity: opacity,
                  transition: isBeingSwiped && Math.abs(swipeDistance) < 120 ? 'transform 0.3s ease-out, opacity 0.3s ease-out' : 'none',
                  touchAction: 'pan-x',
                  position: 'relative',
                  cursor: 'grab'
                }}
              >
                {isBeingSwiped && Math.abs(currentSwipe) > 20 && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: currentSwipe > 0 ? '20px' : 'auto',
                    right: currentSwipe < 0 ? '20px' : 'auto',
                    transform: 'translateY(-50%)',
                    fontSize: '48px',
                    opacity: Math.min(Math.abs(currentSwipe) / 120, 0.8),
                    pointerEvents: 'none',
                    zIndex: 1
                  }}>
                    {Math.abs(currentSwipe) > 120 ? '✅' : '👉'}
                  </div>
                )}
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  paddingBottom: '12px',
                  borderBottom: '2px solid #f1f5f9'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      backgroundColor: color,
                      color: 'white',
                      borderRadius: '12px',
                      padding: '8px 16px',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}>
                      Table {order.Table.number}
                    </div>
                    <span style={{
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {getTimeDifference(order.createdAt)}
                    </span>
                  </div>
                  <div style={{
                    color: '#64748b',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {formatTime(order.createdAt)}
                  </div>
                </div>

                {order.OrderItems.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      paddingTop: index > 0 ? '12px' : '0',
                      paddingBottom: '12px',
                      borderBottom: index < order.OrderItems.length - 1 ? '1px solid #f1f5f9' : 'none'
                    }}
                  >
                    <div style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#1e293b',
                      marginBottom: item.comment ? '8px' : '4px'
                    }}>
                      {item.Item.name} x{item.quantity}
                    </div>
                    
                    {item.comment && (
                      <div style={{
                        backgroundColor: '#fef9e7',
                        border: '1px solid #fde68a',
                        borderRadius: '8px',
                        padding: '10px',
                        marginTop: '8px'
                      }}>
                        <div style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          color: '#92400e',
                          marginBottom: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Note
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: '#451a03',
                          lineHeight: '1.4',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}>
                          {item.comment}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.9;
          }
        }
      `}</style>
    </div>
  );
}

// Bar Orders Component (Drinks & Coffee)
function BarmanOrders() {
  const [orders, setOrders] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.volume = 0.5;
    audioRef.current.load();
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => console.log('Audio play failed:', error));
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/server/getOrders`,
        {
          headers: { 'server-token': localStorage.getItem('serverToken') }
        }
      );
      
      const data = await response.json();
      
      const filteredOrders = data
        .filter(order => {
          if (order.status !== 'pending') return false;
          return order.OrderItems.some(item => 
            item.Item.category === 'drink' || item.Item.category === 'coffee'
          );
        })
        .map(order => ({
          ...order,
          OrderItems: order.OrderItems.filter(item => 
            item.Item.category === 'drink' || item.Item.category === 'coffee'
          )
        }))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      setOrders(filteredOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const SOCKET_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';
    
    // Dynamically import socket.io-client
    import('socket.io-client').then(({ io }) => {
      const socket = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnection: true,
      });

      socket.on('connect', () => {
        const cafeId = localStorage.getItem('cafeId');
        if (cafeId) socket.emit('joinCafe', { cafeId });
      });

      socket.on('newOrder', () => {
        setNotificationCount(prev => prev + 1);
        fetchOrders();
        playNotificationSound();
      });

      socket.on('orderStatusUpdated', () => {
        fetchOrders();
      });

      return () => socket.disconnect();
    });
  }, []);

  const handleDismiss = (orderId) => {
    setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
    setNotificationCount(prev => Math.max(0, prev - 1));
  };

  return (
    <OrderDisplay 
      orders={orders}
      title="Bar Orders"
      color="#1e293b"
      onDismiss={handleDismiss}
      notificationCount={notificationCount}
    />
  );
}

// Kitchen Orders Component (Food & Dessert)
function KitchenOrders() {
  const [orders, setOrders] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.volume = 0.5;
    audioRef.current.load();
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => console.log('Audio play failed:', error));
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/server/getOrders`,
        {
          headers: { 'server-token': localStorage.getItem('serverToken') }
        }
      );
      
      const data = await response.json();
      
      const filteredOrders = data
        .filter(order => {
          if (order.status !== 'pending') return false;
          return order.OrderItems.some(item => 
            item.Item.category === 'food' || item.Item.category === 'dessert'
          );
        })
        .map(order => ({
          ...order,
          OrderItems: order.OrderItems.filter(item => 
            item.Item.category === 'food' || item.Item.category === 'dessert'
          )
        }))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      setOrders(filteredOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const SOCKET_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';
    
    import('socket.io-client').then(({ io }) => {
      const socket = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnection: true,
      });

      socket.on('connect', () => {
        const cafeId = localStorage.getItem('cafeId');
        if (cafeId) socket.emit('joinCafe', { cafeId });
      });

      socket.on('newOrder', () => {
        setNotificationCount(prev => prev + 1);
        fetchOrders();
        playNotificationSound();
      });

      socket.on('orderStatusUpdated', () => {
        fetchOrders();
      });

      return () => socket.disconnect();
    });
  }, []);

  const handleDismiss = (orderId) => {
    setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
    setNotificationCount(prev => Math.max(0, prev - 1));
  };

  return (
    <OrderDisplay 
      orders={orders}
      title="Kitchen Orders"
      color="#dc2626"
      onDismiss={handleDismiss}
      notificationCount={notificationCount}
    />
  );
}

// Chicha Orders Component (Smoking)
function ChichaOrders() {
  const [orders, setOrders] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.volume = 0.5;
    audioRef.current.load();
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => console.log('Audio play failed:', error));
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/server/getOrders`,
        {
          headers: { 'server-token': localStorage.getItem('serverToken') }
        }
      );
      
      const data = await response.json();
      
      const filteredOrders = data
        .filter(order => {
          if (order.status !== 'pending') return false;
          return order.OrderItems.some(item => item.Item.category === 'smoking');
        })
        .map(order => ({
          ...order,
          OrderItems: order.OrderItems.filter(item => item.Item.category === 'smoking')
        }))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      setOrders(filteredOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const SOCKET_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';
    
    import('socket.io-client').then(({ io }) => {
      const socket = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnection: true,
      });

      socket.on('connect', () => {
        const cafeId = localStorage.getItem('cafeId');
        if (cafeId) socket.emit('joinCafe', { cafeId });
      });

      socket.on('newOrder', () => {
        setNotificationCount(prev => prev + 1);
        fetchOrders();
        playNotificationSound();
      });

      socket.on('orderStatusUpdated', () => {
        fetchOrders();
      });

      return () => socket.disconnect();
    });
  }, []);

  const handleDismiss = (orderId) => {
    setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
    setNotificationCount(prev => Math.max(0, prev - 1));
  };

  return (
    <OrderDisplay 
      orders={orders}
      title="Chicha Orders"
      color="#7c3aed"
      onDismiss={handleDismiss}
      notificationCount={notificationCount}
    />
  );
}

// Demo selector
export default function App() {
  const [view, setView] = useState('bar');

  return (
    <div>
      <div style={{
        position: 'fixed',
        top: 10,
        right: 10,
        zIndex: 1000,
        display: 'flex',
        gap: '8px',
        backgroundColor: 'white',
        padding: '8px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        <button
          onClick={() => setView('bar')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: view === 'bar' ? '#1e293b' : '#e2e8f0',
            color: view === 'bar' ? 'white' : '#64748b',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🍺 Bar
        </button>
        <button
          onClick={() => setView('kitchen')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: view === 'kitchen' ? '#dc2626' : '#e2e8f0',
            color: view === 'kitchen' ? 'white' : '#64748b',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🍽️ Kitchen
        </button>
        <button
          onClick={() => setView('chicha')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: view === 'chicha' ? '#7c3aed' : '#e2e8f0',
            color: view === 'chicha' ? 'white' : '#64748b',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          💨 Chicha
        </button>
      </div>
      
      {view === 'bar' && <BarmanOrders />}
      {view === 'kitchen' && <KitchenOrders />}
      {view === 'chicha' && <ChichaOrders />}
    </div>
  );
}

// Export individual components for use in your app
export { BarmanOrders, KitchenOrders, ChichaOrders };