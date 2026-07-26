import React, { createContext, useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../utils/constants';
import { loginUser, registerUser, getMe } from '../services/auth.api';
import toast from 'react-hot-toast';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEYS.TOKEN) || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (storedToken) {
        try {
          const profileData = await getMe();
          if (profileData && profileData.success) {
            setUser(profileData.user);
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profileData.user));
          } else {
            handleLogoutState();
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          handleLogoutState();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const handleLogoutState = () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    setToken(null);
    setUser(null);
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const data = await loginUser({ email, password });
      if (data && data.success) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        toast.success(data.message || 'Logged in successfully!');
        return data.user;
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Invalid credentials';
      toast.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const data = await registerUser(userData);
      if (data && data.success) {
        toast.success(data.message || 'Registration successful!');
        return data;
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Registration failed';
      toast.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    handleLogoutState();
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
export default AuthContext;
