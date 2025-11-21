import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

function BarmanOrders() {
  const [orders, setOrders] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const audioRef = useRef(null);
  const startY = useRef(0);
  const pullDistance = useRef(0);
  const containerRef = useRef(null);
  const [swipingOrderId, setSwipingOrderId] = useState(null);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const swipeStartY = useRef(0);
  const isDismissing = useRef(false);

  // Setup audio
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
      audioRef.current.play().catch(error => {
        console.log('Audio play failed:', error);
      });
    }
  };

  // Fetch orders
  const fetchOrders = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/server/getOrders`,
        {
          headers: { 'server-token': localStorage.getItem('serverToken') }
        }
      );
      
      const pendingOrders = response.data
        .filter(order => order.status === 'pending')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setOrders(pendingOrders);
      
      if (isRefresh && notificationCount > 0) {
        setNotificationCount(0);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      if (isRefresh) {
        setTimeout(() => setRefreshing(false), 500);
      }
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, []);

  // Socket.io setup
  useEffect(() => {
    const SOCKET_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    socket.on('connect', () => {
      const cafeId = localStorage.getItem('cafeId');
      if (cafeId) {
        socket.emit('joinCafe', { cafeId });
      }
    });

    socket.on('newOrder', (data) => {
      setNotificationCount(prev => prev + 1);
      fetchOrders();
      playNotificationSound();
    });

    socket.on('orderStatusUpdated', (data) => {
      fetchOrders();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Pull to refresh handlers
  const handleTouchStart = (e) => {
    if (containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (containerRef.current.scrollTop === 0 && !refreshing) {
      const currentY = e.touches[0].clientY;
      pullDistance.current = currentY - startY.current;
      
      if (pullDistance.current > 0 && pullDistance.current < 150) {
        containerRef.current.style.transform = `translateY(${pullDistance.current * 0.5}px)`;
      }
    }
  };

  const handleTouchEnd = () => {
    
    containerRef.current.style.transform = 'translateY(0)';
    pullDistance.current = 0;
  };

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

  // Swipe to dismiss handlers
  const handleSwipeStart = (e, orderId) => {
    if (isDismissing.current) return;
    swipeStartY.current = e.touches[0].clientY;
    setSwipingOrderId(orderId);
  };

  const handleSwipeMove = (e, orderId) => {
    if (swipingOrderId !== orderId || isDismissing.current) return;
    
    const currentY = e.touches[0].clientY;
    const distance = currentY - swipeStartY.current;
    
    // Only allow downward swipes
    if (distance > 0) {
      setSwipeDistance(Math.min(distance, 300));
    }
  };

  const handleSwipeEnd = (orderId) => {
    if (isDismissing.current) return;
    
    // If swiped down more than 120px, dismiss the order
    if (swipeDistance > 120) {
      isDismissing.current = true;
      
      // Animate out
      setSwipeDistance(500);
      
      // Remove from list after animation
      setTimeout(() => {
        setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
        setNotificationCount(prev => Math.max(0, prev - 1));
        isDismissing.current = false;
        setSwipingOrderId(null);
        setSwipeDistance(0);
      }, 300);
    } else {
      // Spring back
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
      {/* Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
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
              Bar Orders
            </h1>
            <p style={{
              margin: '4px 0 0 0',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '14px'
            }}>
              {orders.length} pending order{orders.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          {/* Notification Badge */}
          {notificationCount > 0 && (
            <div style={{
              position: 'relative',
              width: '48px',
              height: '48px'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
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
            </div>
          )}
        </div>
        
        {/* Pull to refresh indicator */}
        {refreshing && (
          <div style={{
            textAlign: 'center',
            marginTop: '12px',
            color: 'rgba(255,255,255,0.9)',
            fontSize: '14px'
          }}>
            Refreshing...
          </div>
        )}
      </div>

      {/* Orders List */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          padding: '16px',
          overflowY: 'auto',
          height: 'calc(100vh - 120px)',
          transition: 'transform 0.3s ease-out',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {orders.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#64748b'
          }}>
            <p style={{ fontSize: '18px', margin: 0 }}>No pending orders</p>
            <p style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>
              Pull down to refresh
            </p>
          </div>
        ) : (
          orders.map((order) => {
            const isBeingSwiped = swipingOrderId === order.id;
            const currentSwipe = isBeingSwiped ? swipeDistance : 0;
            const opacity = Math.max(0.3, 1 - (currentSwipe / 300));
            const scale = Math.max(0.85, 1 - (currentSwipe / 600));
            
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
                  transform: `translateY(${currentSwipe}px) scale(${scale})`,
                  opacity: opacity,
                  transition: isBeingSwiped && swipeDistance < 120 ? 'transform 0.3s ease-out, opacity 0.3s ease-out' : 'none',
                  touchAction: 'pan-y',
                  position: 'relative',
                  cursor: 'grab'
                }}
              >
                {/* Swipe indicator */}
                {isBeingSwiped && currentSwipe > 20 && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '48px',
                    opacity: Math.min(currentSwipe / 120, 0.8),
                    pointerEvents: 'none',
                    zIndex: 1,
                    transition: 'opacity 0.2s'
                  }}>
                    {currentSwipe > 120 ? '✅' : '👇'}
                  </div>
                )}
                
                {/* Order Header */}
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
                      backgroundColor: '#10b981',
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

                {/* Order Items */}
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
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: item.comment ? '8px' : '0'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: 'bold',
                          color: '#1e293b',
                          marginBottom: '4px'
                        }}>
                          {item.Item.name} x{item.quantity}
                        </div>
                        
                      </div>
                    </div>
                    
                    {/* Comment */}
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

export default BarmanOrders;