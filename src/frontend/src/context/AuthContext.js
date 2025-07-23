import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
// Configurazione axios per il backend
axios.defaults.baseURL = 'https://qrcodepromotion.it';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set auth token for all requests
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user function
  const loadUser = useCallback(async () => {
    if (token) {
      try {
        const res = await axios.get('/api/auth/me');
        setUser(res.data.data);
        setIsAuthenticated(true);
      } catch (err) {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        setError('Sessione scaduta. Effettua nuovamente il login.');
      }
    }
    setLoading(false);
  }, [token]);

  // Load user if token exists
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Register user
  const register = async (userData) => {
    try {
      const res = await axios.post('/api/auth/register', userData);
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
      return false;
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
      return false;
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const res = await axios.put('/api/auth/updateprofile', userData);
      setUser(res.data.data);
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.error || 'Aggiornamento profilo fallito');
      return { success: false, error: err.response?.data?.error || 'Aggiornamento profilo fallito' };
    }
  };

  // Update password
  const updatePassword = async (passwordData) => {
    try {
      const res = await axios.put('/api/auth/updatepassword', passwordData);
      // Update token if returned
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
      }
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.error || 'Aggiornamento password fallito');
      return { success: false, error: err.response?.data?.error || 'Aggiornamento password fallito' };
    }
  };

  // Clear errors
  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        error,
        register,
        login,
        logout,
        updateProfile,
        updatePassword,
        loadUser,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};