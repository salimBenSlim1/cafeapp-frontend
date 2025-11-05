import { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react'; // or your icon libraryRéessayerClaude n'a pas encore la capacité d'exécuter le code qu'il génère.
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
import SuccessMessage from './SuccessAlert';
import './AdminOrders.css';

import cafeApi from '../../api/cafeApiInstance';

function AdminOrders() {
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
  const ordersPerPage = 10;
  const printRef = useRef();

  // Socket.io setup
 useEffect(() => {
  const SOCKET_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';
  const newSocket = io(SOCKET_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    transports: ['websocket'],
    withCredentials: true
  });

  newSocket.on('connect', () => {
    console.log('Socket connected:', newSocket.id);
    const token = localStorage.getItem('token');
    if (token) {
      newSocket.emit('joinCafe', { cafeId: token });
    }
  });

  newSocket.on('newAlert', (data) => {
    setAlerts((prev) => [...prev, data]);
  });

  newSocket.on('newOrder', (order) => {
    console.log('New order received:', order);
    setNotificationCount((prev) => prev + 1);
    setRefresh((prev) => !prev);
  });

  newSocket.on('orderUpdated', (order) => {
    console.log('Order updated:', order);
    setRefresh((prev) => !prev);
  });

  return () => {
    if (newSocket.connected) newSocket.close();
  };
}, []);


  useEffect(() => {
    cafeApi.get(`/itemsEndSoon`)
    .then(r => setAlerts(r.data))
    .catch(err => {});
    
    cafeApi.get("/getOrders")
    .then((r) => {
      console.log(r.data,'ddd')
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
        } else if (status === "served") {
          return orderDate >= start && orderDate <= end;
        }

        return false;
      });
      setOrders(filteredData);
      setCurrentPage(1);
    })
    .catch((err) => console.log(err));
  }, [refresh, viewMode]);

const handlePrintReceipt = (order) => {
    // Create a new window for printing
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
    cafeApi.put('/updateOrder/' + editingItem.id, {
      quantity: parseInt(itemQuantity),
    })
    .then((r) => {
      setOpenDialog(false);
      setRefresh(!refresh);
      setShowSuccess(true);
    })
    .catch((err) => console.log(err));
    setEditingItem(null);
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    cafeApi.delete('/deleteOrder/' + itemToDelete.id)
    .then((r) => {
      setRefresh(!refresh);
      setOpenDialog(false);
      setOpenDeleteDialog(false);
      setShowSuccess(true);
      setItemToDelete(null);
    })
    .catch((err) => console.log(err));
  };

  const handleCancelDelete = () => {
    setOpenDeleteDialog(false);
    setItemToDelete(null);
  };

  const updateOrderStatus = (id, upd, tableId) => {
    cafeApi.put('/updateOrderStatus/' + id, {
      status: upd,
      tableId
    })
    .then((r) => {
      setShowSuccess(true);
      setTimeout(() => {
        setRefresh(!refresh);
      }, 1000);
    })
    .catch((err) => console.log(err));
  };

  const getStatusChip = (status) => {
    const statusColors = {
      pending: '#FFA500',
      prepared: '#87CEEB',
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
       {alerts.map((e, i) => (
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
        
        {showSuccess && <SuccessMessage setShowSuccess={setShowSuccess} />}

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
                      {console.log('first',order)}
                      <TableCell className="table-cell table-number">
                        {order.Table.number}
                      </TableCell>
                      <TableCell
                        className="table-cell items-cell"
                        onClick={() => handleRowClick(order.OrderItems)}
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
                      <TableCell
                        className="table-cell status-cell"
                        onClick={() => {
                          if (viewMode === 'pending') {
                            updateOrderStatus(order.id, 'served', order.tableId);
                          }
                        }}
                      >
                        {getStatusChip(order.status)}
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

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          {selectedOrder && (
            <>
              <DialogTitle className="dialog-title">Order Details</DialogTitle>
              <DialogContent className="dialog-content">
                <List>
                  {selectedOrder.map((item) => (
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
                          <ListItemText
                            primary={`${item.quantity}x ${item.Item.name}`}
                            secondary={`${(item.quantity * item.price).toFixed(2)} TnD`}
                            className="item-text"
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              onClick={() => handleEditItem(item)}
                              className="action-button edit-icon"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              edge="end"
                              onClick={() => handleDeleteClick(item)}
                              className="action-button delete-icon"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
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

        <Dialog open={openDeleteDialog} onClose={handleCancelDelete}>
          <DialogTitle className="delete-dialog-title">Confirm Delete</DialogTitle>
          <DialogContent className="delete-dialog-content">
            <Typography>
              Are you sure you want to delete{' '}
              <strong>{itemToDelete?.Item?.name}</strong> from this order?
            </Typography>
          </DialogContent>
          <DialogActions className="delete-dialog-actions">
            <Button onClick={handleCancelDelete} className="cancel-delete-button">
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              className="confirm-delete-button"
              variant="contained"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      {/* Print Receipt */}
      {printingOrder && (
        <Box 
        ref={printRef}
        sx={{
          display: 'block',
          width: '80mm',
          margin: '0 auto',
          padding: '10mm',
          fontFamily: 'monospace',
          '@media print': {
            padding: 0,
            margin: 0,
          }
        }}
        >
         
          <Box sx={{ textAlign: 'center', borderBottom: '2px dashed #000', pb: 2, mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
              CASH RECEIPT
            </Typography>
            <Typography variant="body2">Café Management</Typography>
            <Typography variant="body2">Date: {new Date().toLocaleDateString()}</Typography>
            <Typography variant="body2">Time: {new Date().toLocaleTimeString()}</Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              Table: {printingOrder.Table.number}
            </Typography>
            <Typography variant="body2">
              Order #{printingOrder.id}
            </Typography>
          </Box>

          <Box sx={{ borderBottom: '1px dashed #000', pb: 2, mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Description
            </Typography>
            {printingOrder.OrderItems.map((item, index) => (
              <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">
                  {item.quantity}x {item.Item.name}
                </Typography>
                <Typography variant="body2">
                  {(item.quantity * item.price).toFixed(2)} TnD
                </Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ borderBottom: '2px dashed #000', pb: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Total
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {printingOrder.totalPrice.toFixed(2)} TnD
              </Typography>
            </Box>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              THANK YOU!
            </Typography>
            <Typography variant="caption">
              Visit us again
            </Typography>
          </Box>

          <style>
            {`
              @media print {
                body * {
                  visibility: hidden;
                }
                #print-receipt, #print-receipt * {
                  visibility: visible;
                }
                #print-receipt {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 80mm;
                }
                @page {
                  size: 80mm auto;
                  margin: 0;
                }
              }
            `}
          </style>
        </Box>
      )}
    </>
  );
}

export default AdminOrders;