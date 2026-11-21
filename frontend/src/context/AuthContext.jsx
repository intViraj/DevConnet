import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const { showToast } = useToast();

  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get('/profile/view');
      setUser(response.data.data);
      return response.data.data;
    } catch (error) {
      setUser(null);
      return null;
    }
  }, []);

  const refreshPendingCount = useCallback(async () => {
    try {
      const response = await api.get('/user/requests/received');
      setPendingCount(response.data.data?.length || 0);
    } catch (error) {
      setPendingCount(0);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      const currentUser = await fetchProfile();
      if (currentUser) {
        await refreshPendingCount();
      }
      setLoading(false);
    };
    initAuth();
  }, [fetchProfile, refreshPendingCount]);

  const login = async (emailId, password) => {
    try {
      const response = await api.post('/login', { emailId, password });
      setUser(response.data.data);
      showToast(response.data.message || 'Logged in successfully!', 'success');
      await refreshPendingCount();
      return { success: true, user: response.data.data };
    } catch (error) {
      showToast(error.message || 'Login failed.', 'error');
      return { success: false, error: error.message };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await api.post('/signup', userData);
      setUser(response.data.data);
      showToast(response.data.message || 'Account created successfully!', 'success');
      await refreshPendingCount();
      return { success: true, user: response.data.data };
    } catch (error) {
      showToast(error.message || 'Registration failed.', 'error');
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await api.post('/logout');
      setUser(null);
      setPendingCount(0);
      showToast('Logged out successfully', 'info');
    } catch (error) {
      setUser(null);
      setPendingCount(0);
    }
  };

  const updateProfile = async (updates) => {
    try {
      const response = await api.patch('/profile/edit', updates);
      setUser(response.data.data);
      showToast(response.data.message || 'Profile updated successfully!', 'success');
      return { success: true, user: response.data.data };
    } catch (error) {
      showToast(error.message || 'Failed to update profile.', 'error');
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        pendingCount,
        login,
        signup,
        logout,
        updateProfile,
        fetchProfile,
        refreshPendingCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
