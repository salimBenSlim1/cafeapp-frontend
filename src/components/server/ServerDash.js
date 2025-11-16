import { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ToggleButtonGroup,
  ToggleButton,
  Badge,
  Pagination,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { io } from 'socket.io-client';
import './ServerDash.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function ServerDash() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [itemQuantity, setItemQuantity] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [viewMode, setViewMode] = useState('pending');
  const [notificationCount, setNotificationCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [alerts, setAlerts] = useState([]);
  const [printingOrder, setPrintingOrder] = useState(null);
  
  // NEW: Loading states for each order
  const [loadingOrders, setLoadingOrders] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const ordersPerPage = 10;
  const audioRef = useRef(null);
  const printRef = useRef();
useEffect(() => {
  // Create and configure audio element
  audioRef.current = new Audio();
  
  // Option 1: Use a notification sound URL (recommended)
  // You can use any of these free notification sounds:
  audioRef.current.src = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'; // Positive notification
  // OR use: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3' // Bell notification
  // OR use: 'https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3' // Success notification
  
  audioRef.current.volume = 0.5; // Set volume (0.0 to 1.0)
  
  // Preload the audio
  audioRef.current.load();
  
  return () => {
    // Cleanup
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };
}, []);
const playNotificationSound = () => {
  if (audioRef.current) {
    // Reset audio to start
    audioRef.current.currentTime = 0;
    
    // Play the sound
    audioRef.current.play().catch(error => {
      console.log('Audio play failed:', error);
      // Browser might block autoplay, this is normal
    });
  }
};
  // Socket.io setup
useEffect(() => {
  const SOCKET_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';
  const newSocket = io(SOCKET_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    withCredentials: true,
    upgrade: true,
  });

  newSocket.on('connect', () => {
    const cafeId = localStorage.getItem('cafeId');
    if (cafeId) {
      newSocket.emit('joinCafe', { cafeId });
    }
  });

  const handleNewOrder = (data) => {
    setNotificationCount(prev => prev + 1);
    setRefresh(prev => !prev);
    
    // Play notification sound
    playNotificationSound();
  };

  const handleNewAlert = (data) => {
    setAlerts(prev => [...prev, data]);
  };

  const handleOrderStatusUpdated = (data) => {
    setOrders(prevOrders =>
      prevOrders.map(order => (order.id === data.id ? { ...order, ...data } : order))
    );
  };

  newSocket.on('newOrder', handleNewOrder);
  newSocket.on('newAlert', handleNewAlert);
  newSocket.on('orderStatusUpdated', handleOrderStatusUpdated);

  return () => {
    newSocket.off('newOrder', handleNewOrder);
    newSocket.off('newAlert', handleNewAlert);
    newSocket.off('orderStatusUpdated', handleOrderStatusUpdated);
    if (newSocket.connected || newSocket.connecting) {
      newSocket.disconnect();
    }
  };
}, []);


  const navigate = useNavigate();
  
  useEffect(() => {
    axios.get(process.env.REACT_APP_API_URL+"/server/getOrders", {
      headers: { 'server-token': localStorage.getItem('serverToken') }
    })
    .then((r) => {
      const filteredData = r.data.filter((e) => {
        const status = e.status;
        const orderDate = new Date(e.createdAt);
        const today = new Date();
        const start = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          6, 0, 0, 0
        );
        const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

        if (viewMode === "pending") {
          return status === "pending";
        } else if (status === "served" || status==='canceled') {
          return orderDate >= start && orderDate <= end;
        }

        return false;
      });
      setOrders(filteredData);
      setCurrentPage(1);
    })
    .catch((err) => {
      if (err.response?.data){
        navigate('/login')
      }
    });
  }, [refresh, viewMode]);

  const handlePrintReceipt = (order) => {
    const printWindow = window.open('', '', 'width=302,height=600');
    
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Receipt</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            width: 80mm;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            padding: 5mm;
          }
          .center {
            text-align: center;
          }
          .bold {
            font-weight: bold;
          }
          .header {
            border-bottom: 2px dashed #000;
            padding-bottom: 8px;
            margin-bottom: 8px;
          }
          .section {
            margin-bottom: 8px;
          }
          .divider {
            border-bottom: 1px dashed #000;
            margin: 8px 0;
          }
          .items {
            margin: 8px 0;
          }
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
          .footer {
            margin-top: 10px;
            border-top: 2px dashed #000;
            padding-top: 8px;
          }
        </style>
      </head>
      <body>
        <div class="header center">
          <div class="bold" style="font-size: 16px;">CAFÉ</div>
          <div style="font-size: 14px;">CASH RECEIPT</div>
          <div style="margin-top: 4px;">------------------------</div>
          <div>${new Date().toLocaleDateString('fr-TN')}</div>
          <div>${new Date().toLocaleTimeString('fr-TN')}</div>
        </div>

        <div class="section">
          <div class="bold">Table: ${order?.Table?.number}</div>
          <div>Commande #${order.id}</div>
        </div>

        <div class="divider"></div>

        <div class="items">
          <div class="bold" style="margin-bottom: 6px;">DESCRIPTION</div>
          ${order.OrderItems.map(item => `
            <div class="item-row">
              <div>${item.quantity}x ${item.Item.name}</div>
              <div>${(item.quantity * item.price).toFixed(3)} TND</div>
            </div>
          `).join('')}
        </div>

        <div class="total">
          <div class="item-row bold">
            <div>TOTAL</div>
            <div>${order.totalPrice.toFixed(3)} TND</div>
          </div>
        </div>

        <div class="footer center">
          <div class="bold" style="font-size: 14px; margin-bottom: 4px;">MERCI!</div>
          <div>A bientôt</div>
        </div>

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
    
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

const handleRowClick = (order) => {
  // Only allow opening dialog for pending orders
  if (order.status === 'served' || order.status === 'canceled') {
    setSnackbar({ 
      open: true, 
      message: 'Cannot edit completed orders', 
      severity: 'warning' 
    });
    return;
  }
  
  setSelectedOrder(order);
  setOpenDialog(true);
  if (notificationCount > 0) {
    setNotificationCount(0);
  }
};

  const handleCloseDialog = () => {
    setSelectedOrder(null);
    setEditingItem(null);
    setOpenDialog(false);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setItemQuantity(item.quantity);
  };

  const handleUpdateQuantity = () => {
    if (!selectedOrder || !editingItem) return;
    axios.put(process.env.REACT_APP_API_URL+'/server/updateOrder/' + editingItem.id, {
      quantity: parseInt(itemQuantity),
    }, {
      headers: { 'server-token': localStorage.getItem('serverToken') }
    })
    .then((r) => {
      setOpenDialog(false);
      setRefresh(!refresh);
      setSnackbar({ open: true, message: 'Order updated successfully!', severity: 'success' });
    })
    .catch((err) => {
      console.log(err);
      setSnackbar({ open: true, message: 'Failed to update order', severity: 'error' });
    });
    setEditingItem(null);
  };

  const [showPopUp, setShowPopUp] = useState(null);
  
  // UPDATED: Modified updateOrderStatus with loading states
  const updateOrderStatus = (id, upd, tableId) => {
    // Set loading state for this specific order
    setLoadingOrders(prev => ({ ...prev, [id]: upd }));
    
    axios.put(process.env.REACT_APP_API_URL+'/server/updateOrderStatus/' + id, {
      status: upd,
      tableId
    }, {
      headers: { 'server-token': localStorage.getItem('serverToken') }
    })
    .then((r) => {
      // Remove loading state
      setLoadingOrders(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      
      // Show success notification
      const message = upd === 'served' ? 'Order marked as served!' : 'Order canceled successfully!';
      setSnackbar({ open: true, message, severity: 'success' });
      
      setTimeout(() => {
        setRefresh(!refresh);
      }, 500);
    })
    .catch((err) => {
      // Remove loading state
      setLoadingOrders(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      
      // Show error
      setShowPopUp(err.response?.data?.error || 'Failed to update order status');
      setSnackbar({ open: true, message: 'Failed to update order', severity: 'error' });
    });
  };

  const getStatusChip = (status) => {
    const statusColors = {
      pending: '#FFA500',
      prepared: '#87CEEB',
      canceled: 'red',
      served: '#10b981',
    };

    return (
      <Chip
        label={status.charAt(0).toUpperCase() + status.slice(1)}
        sx={{
          backgroundColor: statusColors[status],
          color: '#FFFFFF',
          fontWeight: 600,
        }}
      />
    );
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(orders.length / ordersPerPage);

  return (
    <>
      <Box className="orders-container" sx={{ display: printingOrder ? 'none' : 'block' }}>
        <Paper 
          className="header-paper" 
          elevation={0} 
          style={{
            background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
            position: "relative",
            paddingTop: "60px"
          }}
        >
          <Button
            onClick={() => window.history.back()}
            startIcon={<ArrowLeft size={20} />}
            sx={{
              position: "absolute",
              top: 16,
              left: 16,
              backdropFilter: "blur(10px)",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              color: "white",
              borderRadius: "50px",
              px: 2,
              py: 1,
              textTransform: "none",
              transition: "transform 0.2s",
              zIndex: 10,
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                transform: "scale(1.05)",
              },
              "& .MuiButton-startIcon": {
                marginRight: { xs: 0, sm: 1 },
              },
            }}
          >
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              Back
            </Box>
          </Button>
          
          <Button
            onClick={() => {
              localStorage.clear()
              window.history.back()
            }}
            startIcon={<ArrowLeft size={20} />}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              backdropFilter: "blur(10px)",
              backgroundColor: "red",
              color: "white",
              borderRadius: "50px",
              px: 2,
              py: 1,
              textTransform: "none",
              transition: "transform 0.2s",
              zIndex: 10,
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                transform: "scale(1.05)",
              },
              "& .MuiButton-startIcon": {
                marginRight: { xs: 0, sm: 1 },
              },
            }}
          >
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              Disconnect
            </Box>
          </Button>

          <Box className="header-content">
            <Box>
              <Typography variant="h4" className="header-title">
                Orders Management
              </Typography>
              <Typography variant="subtitle1" className="header-subtitle">
                Manage your café orders efficiently
              </Typography>
            </Box>
            <Badge 
              badgeContent={notificationCount} 
              color="error"
              className="notification-badge"
              max={99}
            >
              <IconButton className="notification-icon">
                <NotificationsIcon sx={{ fontSize: 32, color: '#f1f5f9' }} />
              </IconButton>
            </Badge>
          </Box>
        </Paper>

        {alerts.length !== 0 && alerts.map((e, i) => (
          <div 
            key={i}
            className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-3 rounded-r-lg shadow-sm"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-amber-800">
                  Item <span className="font-semibold">{e.name}</span> will end - You only have {e.stock} left in stock.{' '}
                  <a 
                    href="/admin/items" 
                    className="underline font-medium hover:text-amber-900 transition-colors"
                  >
                    Update it now
                  </a>
                </p>
              </div>
            </div>
          </div>
        ))}

        {showPopUp && (
          <div className="absolute inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-[90%] max-w-md text-center">
              <h2 className="text-xl font-semibold mb-3">Notification</h2>
              <p className="text-gray-600 mb-6">
                {showPopUp}
              </p>
              <button
                onClick={() => setShowPopUp(null)}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}

        <Box className="toggle-container">
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            className="toggle-group"
          >
            <ToggleButton value="pending" className="toggle-button">
              <ScheduleIcon sx={{ mr: 1 }} />
              Pending Orders
            </ToggleButton>
            <ToggleButton value="served" className="toggle-button">
              <CheckCircleIcon sx={{ mr: 1 }} />
              Served Today
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Paper className="table-paper" elevation={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell className="header-cell">Table</TableCell>
                  <TableCell className="header-cell">Items</TableCell>
                  <TableCell className="header-cell">Total</TableCell>
                  <TableCell className="header-cell">Status</TableCell>
                  <TableCell className="header-cell">Time</TableCell>
                  <TableCell className="header-cell">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="empty-state">
                      <Typography>
                        {viewMode === 'pending'
                          ? 'No pending orders'
                          : 'No orders served today'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentOrders.map((order) => (
                    <TableRow key={order.id} className="table-row">
                      <TableCell className="table-cell table-number">
                        {order.Table.number}
                      </TableCell>
                    <TableCell
  className="table-cell items-cell"
  onClick={() => handleRowClick(order)} // Changed from order.OrderItems
>
  {order.OrderItems.map((item, index) => (
    <div key={index} className="item-line">
      <span className="item-quantity">{item.quantity}x</span>{' '}
      {item.Item.name}
    </div>
  ))}
</TableCell>

                     
                      <TableCell className="table-cell price-cell">
                        {order.totalPrice.toFixed(2)} TnD
                      </TableCell>
                      <TableCell className="table-cell status-cell">
                        {viewMode === 'pending' ? (
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                updateOrderStatus(order.id, 'served', order.Table.number);
                              }}
                              disabled={!!loadingOrders[order.id]}
                              className={`${
                                loadingOrders[order.id] === 'served'
                                  ? 'bg-gray-400 cursor-not-allowed'
                                  : 'bg-green-600 hover:bg-green-700'
                              } rounded-2xl text-white font-semibold py-2 px-3 transition flex items-center gap-2`}
                            >
                              {loadingOrders[order.id] === 'served' && (
                                <CircularProgress size={16} sx={{ color: 'white' }} />
                              )}
                              Served
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                updateOrderStatus(order.id, 'canceled', order.Table.number);
                              }}
                              disabled={!!loadingOrders[order.id]}
                              className={`${
                                loadingOrders[order.id] === 'canceled'
                                  ? 'bg-gray-400 cursor-not-allowed'
                                  : 'bg-red-600 hover:bg-red-700'
                              } rounded-2xl text-white font-semibold py-2 px-3 transition flex items-center gap-2`}
                            >
                              {loadingOrders[order.id] === 'canceled' && (
                                <CircularProgress size={16} sx={{ color: 'white' }} />
                              )}
                              Cancel
                            </button>
                          </Box>
                        ) : (
                          getStatusChip(order.status)
                        )}
                      </TableCell>
                      <TableCell className="table-cell time-cell">
                        {new Date(order.createdAt).toLocaleString().split(' ')[1]}
                      </TableCell>
                      <TableCell className="table-cell">
                        <IconButton
                          onClick={() => handlePrintReceipt(order)}
                          sx={{ color: '#1976d2' }}
                        >
                          <PrintIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {orders.length > ordersPerPage && (
            <Box className="pagination-container">
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
                className="pagination"
              />
            </Box>
          )}
        </Paper>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* Dialog remains the same */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
  {selectedOrder && (
    <>
      <DialogTitle className="dialog-title">Order Details</DialogTitle>
      <DialogContent className="dialog-content">
        <List>
          {selectedOrder.OrderItems.map((item) => ( // Changed from selectedOrder.map
            <ListItem key={item.id} className="dialog-item">
              {editingItem?.id === item.id ? (
                <>
                  <ListItemText
                    primary={item.Item.name}
                    secondary={`${item.price.toFixed(2)} TnD each`}
                  />
                  <Box className="edit-box">
                    <TextField
                      type="number"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(e.target.value)}
                      size="small"
                      inputProps={{ min: 1 }}
                      className="quantity-input"
                    />
                    <Button
                      variant="contained"
                      onClick={handleUpdateQuantity}
                      className="update-button"
                    >
                      Update
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => setEditingItem(null)}
                      className="cancel-button"
                    >
                      Cancel
                    </Button>
                  </Box>
                </>
              ) : (
                <>
                 <ListItem 
  sx={{ 
    py: 2,
    px: 2,
    borderBottom: '1px solid rgba(0,0,0,0.1)',
    display: 'grid',
    gridTemplateColumns: '250px 1fr 60px',
    gap: 2,
    alignItems: 'center'
  }}
>
  <ListItemText
    primary={`${item.quantity}x ${item.Item.name}`}
    secondary={`${(item.quantity * item.price).toFixed(2)} TnD`}
    className="item-text"
  />
  
<TextField
  type="text"
  value={item?.comment || ''}
  size="small"
  variant="outlined"
  disabled
  multiline
  maxRows={5}       // optional, limits height
  fullWidth={false} // optional, remove if you want it to shrink to content
  InputProps={{
    readOnly: true,
    style: { 
      overflow: 'hidden', 
      whiteSpace: 'pre-wrap',  // preserve line breaks
      wordWrap: 'break-word',  // wrap long words
      padding: '8px',          // adjust padding if needed
    },
  }}
/>
  
  <IconButton
    onClick={() => handleEditItem(item)}
    className="action-button edit-icon"
  >
    <EditIcon />
  </IconButton>
</ListItem>
                </>
              )}
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions className="dialog-actions">
        <Button onClick={handleCloseDialog} className="close-button">
          Close
        </Button>
      </DialogActions>
    </>
  )}
</Dialog>
      </Box>
    </>
  );
}

export default ServerDash;