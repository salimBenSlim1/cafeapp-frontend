// import React from 'react'
// import {
//   Box,
//   Paper,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Typography,
//   Chip,
//   IconButton,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Button,
//   TextField,
//   List,
//   ListItem,
//   ListItemText,
//   ListItemSecondaryAction,
//   ToggleButtonGroup,
//   ToggleButton,
// } from '@mui/material';
// const AdminServedOrders = () => {
//   return (
//      <Paper className="table-paper" elevation={0}>
//         <TableContainer>
//           <Table>
//             <TableHead>
//               <TableRow>
//                 <TableCell className="header-cell">Order ID</TableCell>
//                 <TableCell className="header-cell">Table</TableCell>
//                 <TableCell className="header-cell">Items</TableCell>
//                 <TableCell className="header-cell">Total</TableCell>
//                 <TableCell className="header-cell">Status</TableCell>
//                 <TableCell className="header-cell">Time</TableCell>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {orders.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={6} className="empty-state">
//                     <Typography>
//                       {viewMode === 'pending'
//                         ? 'No pending orders'
//                         : 'No orders served today'}
//                     </Typography>
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 orders.map((order) => (
//                   <TableRow key={order.orders[0].orderId} className="table-row">
//                     <TableCell className="table-cell">
//                       #{order.orders[0].orderId}
//                     </TableCell>
//                     <TableCell className="table-cell table-number">
//                       {order.tableId}
//                     </TableCell>
//                     <TableCell
//                       className="table-cell items-cell"
//                       onClick={() => handleRowClick(order.orders[0].items)}
//                     >
//                       {order.orders[0].items.map((item, index) => (
//                         <div key={index} className="item-line">
//                           <span className="item-quantity">{item.quantity}x</span>{' '}
//                           {item.name}
//                         </div>
//                       ))}
//                     </TableCell>
//                     <TableCell className="table-cell price-cell">
//                       {order.orders[0].totalPrice.toFixed(2)} TnD
//                     </TableCell>
//                     <TableCell
//                       className="table-cell status-cell"
//                       onClick={() => {
//                         if (viewMode === 'pending') {
//                           updateOrderStatus(order.orders[0].orderId, 'served');
//                         }
//                       }}
//                     >
//                       {getStatusChip(order.orders[0].status)}
//                     </TableCell>
//                     <TableCell className="table-cell time-cell">
//                       {new Date(order.orders[0].createdAt).toLocaleString()}
//                     </TableCell>
//                   </TableRow>
//                 ))
//               )}
//             </TableBody>
//           </Table>
//         </TableContainer>
//       </Paper>
//   )
// }

// export default AdminServedOrders