import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useAuth } from './context/AuthContext';

// Layout
import Layout from './components/layout/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PromotionsList from './pages/PromotionsList';
import PromotionCreate from './pages/PromotionCreate';
import PromotionDetail from './pages/PromotionDetail';
import QRCodeScanner from './pages/QRCodeScanner';
import QRCodeVerify from './pages/QRCodeVerify';
import QRCodeDetail from './pages/QRCodeDetail';
import QRCodesList from './pages/QRCodesList';
import PromotionStats from './pages/PromotionStats';
import Stats from './pages/Stats';
import Account from './pages/Account';
import EmailVerified from './pages/EmailVerified';
import CheckEmail from './pages/CheckEmail';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import NotFound from './pages/NotFound';
import PublicQRCodeDetail from './pages/PublicQRCodeDetail';

// NUOVE PAGINE LEGALI
import TermsAndConditions from './pages/TermsAndConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookiePolicy from './pages/CookiePolicy';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const { isAuthenticated, loading } = useAuth();

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (loading) return <div>Caricamento...</div>;
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {/* ROUTE PUBBLICHE */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify/:code" element={<QRCodeVerify />} />
        <Route path="/qrcode/:code" element={<PublicQRCodeDetail />} />
        
        {/* NUOVE ROUTE LEGALI */}
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/cookies" element={<CookiePolicy />} />
        <Route path="/email-verified" element={<EmailVerified />} />
        <Route path="/check-email" element={<CheckEmail />} />
        
        {/* ROUTE PROTETTE */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="promotions" element={<PromotionsList />} />
          <Route path="promotions/create" element={<PromotionCreate />} />
          <Route path="promotions/:id" element={<PromotionDetail />} />
          <Route path="promotions/:id/stats" element={<PromotionStats />} />
          <Route path="qrcodes" element={<QRCodesList />} />
          <Route path="qrcodes/:id" element={<QRCodeDetail />} />
          <Route path="qrcode/verify/:code" element={<QRCodeVerify />} />
          <Route path="scanner" element={<QRCodeScanner />} />
          <Route path="stats" element={<Stats />} />
          <Route path="account" element={<Account />} />
	  <Route path="admin" element={<AdminDashboard />} />
	  <Route path="admin/users" element={<UserManagement />} />

        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
