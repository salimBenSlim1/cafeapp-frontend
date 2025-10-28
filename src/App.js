import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import AdminOrders from './components/admin/AdminOrders';
import AdminItems from './components/admin/AdminItems';
import AdminHome from './components/admin/AdminPage';
import CafeAppLanding from './components/saas/CafeAppLanding';
import LoginPage from './components/saas/LoginPage';
import GetInfos from './components/getInfos/GetInfo';
import QRCodesDashboard from './components/admin/QRCodesDashboard';
import AdminCharts from './components/admin/AdminCharts';
import AdminAgent from './components/admin/AdminAgent';
import UserOrderPage from './components/user/UserOrderPage';
import PaymentSuccess from './components/Success';
import PaymentFailed from './components/Failed';
import AdminLogin from './components/getInfos/LoginAdmin';

// Create a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#000000', // Black
    },
    secondary: {
      main: '#BEAF8E', // Beige
    },
    background: {
      default: '#F0F8FF', // Light sky blue
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: "'Poppins', 'Roboto', 'Arial', sans-serif",
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 500,
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<CafeAppLanding />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/getInfo" element={<GetInfos />} />
          <Route path="/login/admin" element={<AdminLogin />} />

          {/* Admin routes */}
          <Route path="/admin/qrcode" element={<QRCodesDashboard />} />
          <Route path="/admin" element={<AdminHome />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/items" element={<AdminItems />} />
          <Route path="/admin/charts" element={<AdminCharts />} />
          <Route path="/admin/agent" element={<AdminAgent />} />
          {/* Add your customer-facing routes here */}

          <Route path="/client-panier" element={<UserOrderPage />} />
          <Route path="/success" element={<PaymentSuccess />} />
          <Route path="/cancel" element={<PaymentFailed />} />
          
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
