import { useState, useEffect } from 'react';
import axios from 'axios';

function ServerAddItems({ open, onClose, onOrderAdded }) {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [itemComments, setItemComments] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    if (open) {
      fetchTables();
      fetchItems();
      setCart([]);
      setItemComments({});
      setSearchQuery('');
      setCurrentPage(1);
    }
  }, [open]);

  const fetchTables = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/server/getTables`,
        {
          headers: { 'server-token': localStorage.getItem('serverToken') }
        }
      );
      setTables(response.data);
    } catch (error) {
      console.error('Error fetching tables:', error);
      setSnackbar({ 
        open: true, 
        message: 'Failed to load tables', 
        severity: 'error' 
      });
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/server/getItems`,
        {
          headers: { 'server-token': localStorage.getItem('serverToken') }
        }
      );
      setItems(response.data);
      
      const uniqueCategories = [...new Set(response.data.map(item => item.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching items:', error);
      setSnackbar({ 
        open: true, 
        message: 'Failed to load items', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getCartItemQuantity = (itemId) => {
    const cartItem = cart.find(item => item.itemId === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const updateCart = (item, quantity) => {
    if (quantity <= 0) {
      setCart(cart.filter(cartItem => cartItem.itemId !== item.id));
      const newComments = { ...itemComments };
      delete newComments[item.id];
      setItemComments(newComments);
    } else {
      const existingItemIndex = cart.findIndex(cartItem => cartItem.itemId === item.id);
      if (existingItemIndex >= 0) {
        const newCart = [...cart];
        newCart[existingItemIndex].quantity = quantity;
        setCart(newCart);
      } else {
        setCart([...cart, {
          itemId: item.id,
          name: item.name,
          price: item.price,
          quantity: quantity,
          stock: item.stock
        }]);
      }
    }
  };

  const handleAddToCart = (item) => {
    const currentQty = getCartItemQuantity(item.id);
    if (currentQty < item.stock) {
      updateCart(item, currentQty + 1);
    } else {
      setSnackbar({ 
        open: true, 
        message: 'Insufficient stock', 
        severity: 'warning' 
      });
    }
  };

  const handleRemoveFromCart = (item) => {
    const currentQty = getCartItemQuantity(item.id);
    updateCart(item, currentQty - 1);
  };

  const handleCommentChange = (itemId, comment) => {
    setItemComments({
      ...itemComments,
      [itemId]: comment
    });
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  const handleSubmitOrder = async () => {
    if (!selectedTable) {
      setSnackbar({ 
        open: true, 
        message: 'Please select a table', 
        severity: 'warning' 
      });
      return;
    }

    if (cart.length === 0) {
      setSnackbar({ 
        open: true, 
        message: 'Cart is empty', 
        severity: 'warning' 
      });
      return;
    }

    setSubmitting(true);
    try {
      const orderItems = cart.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity,
        comment: itemComments[item.itemId] || ''
      }));

      await axios.post(
        `${process.env.REACT_APP_API_URL}/server/addOrderForTable`,
        {
          tableNumber: selectedTable,
          items: orderItems
        },
        {
          headers: { 'server-token': localStorage.getItem('serverToken') }
        }
      );

      
      
      setCart([]);
      setItemComments({});
      setSelectedTable(null);
      
      if (onOrderAdded) {
        onOrderAdded();
      }
      
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error submitting order:', error);
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || 'Failed to add order', 
        severity: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '10px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '1200px',
          maxHeight: '95vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            color: 'white',
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>Add Order</h2>
              {cart.length > 0 && (
                <span style={{
                  backgroundColor: '#ef4444',
                  borderRadius: '20px',
                  padding: '4px 12px',
                  fontSize: '13px',
                  fontWeight: 'bold'
                }}>
                  {cart.length}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '28px',
                cursor: 'pointer',
                padding: '0',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>

          {/* Table Selection - Dropdown */}
          <div style={{
            padding: '16px',
            borderBottom: '2px solid #e2e8f0',
            backgroundColor: '#f8fafc'
          }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#1e293b',
              fontSize: '14px'
            }}>
              Select Table *
            </label>
            <select
              value={selectedTable || ''}
              onChange={(e) => setSelectedTable(e.target.value ? Number(e.target.value) : null)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                backgroundColor: 'white',
                fontSize: '16px',
                color: '#1e293b',
                fontWeight: '500',
                cursor: 'pointer',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Cpath fill='%231e293b' d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center'
              }}
            >
              <option value="">Choose a table...</option>
              {tables.map((table) => (
                <option key={table.id} value={table.number}>
                  Table {table.number}
                </option>
              ))}
            </select>
          </div>

          {/* Search and Filter */}
          <div style={{
            padding: '16px',
            borderBottom: '2px solid #e2e8f0',
            backgroundColor: 'white'
          }}>
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '15px',
                marginBottom: '12px',
                boxSizing: 'border-box'
              }}
            />
            
            {/* Category Filter */}
            <div style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '5px',
              scrollbarWidth: 'thin'
            }}>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setCurrentPage(1);
                }}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '20px',
                  backgroundColor: selectedCategory === 'all' ? '#10b981' : '#f1f5f9',
                  color: selectedCategory === 'all' ? 'white' : '#1e293b',
                  fontWeight: selectedCategory === 'all' ? 'bold' : 'normal',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontSize: '13px'
                }}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '20px',
                    backgroundColor: selectedCategory === category ? '#10b981' : '#f1f5f9',
                    color: selectedCategory === category ? 'white' : '#1e293b',
                    fontWeight: selectedCategory === category ? 'bold' : 'normal',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    textTransform: 'capitalize',
                    fontSize: '13px'
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Items */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            WebkitOverflowScrolling: 'touch'
          }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{
                  border: '3px solid #f3f4f6',
                  borderTop: '3px solid #10b981',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto'
                }}></div>
                <p style={{ marginTop: '10px', color: '#64748b' }}>Loading items...</p>
              </div>
            ) : paginatedItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <p>No items found</p>
              </div>
            ) : (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '16px',
                  marginBottom: '16px'
                }}>
                  {paginatedItems.map((item) => {
                    const quantity = getCartItemQuantity(item.id);
                    const inCart = quantity > 0;
                    
                    return (
                      <div
                        key={item.id}
                        style={{
                          border: inCart ? '2px solid #10b981' : '1px solid #e2e8f0',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          backgroundColor: 'white',
                          transition: 'all 0.2s',
                          boxShadow: inCart ? '0 4px 6px rgba(16, 185, 129, 0.1)' : '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                      >
                        {/* Item Image */}
                        <div style={{
                          width: '100%',
                          height: '0',
                          paddingBottom: '75%',
                          backgroundColor: '#f1f5f9',
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          {item.imageUrl ? (
                            <img
                              src={`${item.imageUrl}`}
                              alt={item.name}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const placeholder = document.createElement('div');
                                placeholder.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #94a3b8; font-size: 48px;';
                                placeholder.textContent = '🍽️';
                                e.target.parentElement.appendChild(placeholder);
                              }}
                            />
                          ) : (
                            <div style={{ 
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              color: '#94a3b8',
                              fontSize: '48px'
                            }}>🍽️</div>
                          )}
                        </div>

                        {/* Item Details */}
                        <div style={{ padding: '14px' }}>
                          <div style={{ marginBottom: '10px' }}>
                            <h3 style={{ 
                              margin: '0 0 6px 0', 
                              fontSize: '16px', 
                              fontWeight: 'bold',
                              color: '#1e293b',
                              lineHeight: '1.3'
                            }}>
                              {item.name}
                            </h3>
                            <span style={{
                              display: 'inline-block',
                              backgroundColor: '#f1f5f9',
                              color: '#64748b',
                              padding: '3px 8px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              textTransform: 'capitalize',
                              marginBottom: '8px'
                            }}>
                              {item.category}
                            </span>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap' }}>
                              <span style={{ 
                                fontSize: '20px', 
                                fontWeight: 'bold', 
                                color: '#10b981' 
                              }}>
                                {item.price.toFixed(2)} TnD
                              </span>
                              <span style={{
                                backgroundColor: item.stock < 5 ? '#fee2e2' : '#dcfce7',
                                color: item.stock < 5 ? '#dc2626' : '#16a34a',
                                padding: '3px 8px',
                                borderRadius: '10px',
                                fontSize: '11px',
                                fontWeight: 'bold'
                              }}>
                                Stock: {item.stock}
                              </span>
                            </div>
                          </div>

                          {inCart && (
                            <textarea
                              placeholder="Add comment (optional)"
                              value={itemComments[item.id] || ''}
                              onChange={(e) => handleCommentChange(item.id, e.target.value)}
                              rows="2"
                              style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                marginBottom: '10px',
                                fontSize: '13px',
                                resize: 'vertical',
                                fontFamily: 'inherit',
                                boxSizing: 'border-box'
                              }}
                            />
                          )}

                          {inCart ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <button
                                onClick={() => handleRemoveFromCart(item)}
                                style={{
                                  width: '38px',
                                  height: '38px',
                                  border: 'none',
                                  borderRadius: '8px',
                                  backgroundColor: '#fee2e2',
                                  color: '#dc2626',
                                  fontSize: '20px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                              >
                                −
                              </button>
                              <span style={{ 
                                flex: 1,
                                textAlign: 'center',
                                fontWeight: 'bold',
                                fontSize: '17px'
                              }}>
                                {quantity}
                              </span>
                              <button
                                onClick={() => handleAddToCart(item)}
                                disabled={quantity >= item.stock}
                                style={{
                                  width: '38px',
                                  height: '38px',
                                  border: 'none',
                                  borderRadius: '8px',
                                  backgroundColor: quantity >= item.stock ? '#f3f4f6' : '#dcfce7',
                                  color: quantity >= item.stock ? '#9ca3af' : '#16a34a',
                                  fontSize: '20px',
                                  fontWeight: 'bold',
                                  cursor: quantity >= item.stock ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.2s'
                                }}
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddToCart(item)}
                              disabled={item.stock === 0}
                              style={{
                                width: '100%',
                                padding: '11px',
                                border: 'none',
                                borderRadius: '8px',
                                backgroundColor: item.stock === 0 ? '#f3f4f6' : '#10b981',
                                color: 'white',
                                fontWeight: 'bold',
                                cursor: item.stock === 0 ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                transition: 'all 0.2s'
                              }}
                            >
                              {item.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '8px',
                    alignItems: 'center',
                    paddingTop: '8px'
                  }}>
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      style={{
                        padding: '8px 14px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        backgroundColor: currentPage === 1 ? '#f3f4f6' : 'white',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        fontWeight: '500',
                        fontSize: '14px'
                      }}
                    >
                      Prev
                    </button>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>
                      {currentPage}/{totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      style={{
                        padding: '8px 14px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        backgroundColor: currentPage === totalPages ? '#f3f4f6' : 'white',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        fontWeight: '500',
                        fontSize: '14px'
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div style={{
            borderTop: '2px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            padding: '16px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 'bold' }}>
                  Total: {getTotalPrice().toFixed(2)} TnD
                </h3>
                <span style={{ color: '#64748b', fontSize: '13px' }}>
                  {cart.length} item(s) in cart
                  {selectedTable && ` • Table ${selectedTable}`}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={onClose}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '13px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  color: '#1e293b',
                  fontWeight: 'bold',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: '15px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitOrder}
                disabled={!selectedTable || cart.length === 0 || submitting}
                style={{
                  flex: 1,
                  padding: '13px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: !selectedTable || cart.length === 0 || submitting ? '#cbd5e1' : '#10b981',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: !selectedTable || cart.length === 0 || submitting ? 'not-allowed' : 'pointer',
                  fontSize: '15px'
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Order'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Snackbar */}
      {snackbar.open && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: snackbar.severity === 'error' ? '#ef4444' : 
                          snackbar.severity === 'warning' ? '#f59e0b' : '#10b981',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 2000,
          fontWeight: 'bold',
          animation: 'slideUp 0.3s ease-out',
          maxWidth: '90%',
          textAlign: 'center'
        }}>
          {snackbar.message}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideUp {
          from {
            transform: translateX(-50%) translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
        
        @media (max-width: 640px) {
          /* Mobile optimizations */
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}

export default ServerAddItems;