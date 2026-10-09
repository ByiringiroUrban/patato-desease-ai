import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const API_BASE = 'http://localhost:8000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (authToken) => {
    if (!authToken) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(`${API_BASE}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setUser(res.data);
    } catch {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchUserProfile(token);
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }
  }, [token, fetchUserProfile]);

  const refreshUserProfile = async () => {
    if (token) {
      await fetchUserProfile(token);
    }
  };

  const updateUserPlan = (newPlan) => {
    setUser((prev) => (prev ? { ...prev, plan: newPlan } : prev));
  };

  const login = async (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    const response = await axios.post(`${API_BASE}/api/v1/auth/login`, formData);
    setToken(response.data.access_token);
    return response.data;
  };

  const register = async (email, password) => {
    const response = await axios.post(`${API_BASE}/api/v1/auth/register`, { email, password });
    return response.data;
  };

  const loginWithGoogle = async (credential) => {
    const response = await axios.post(`${API_BASE}/api/v1/auth/google`, { token: credential });
    setToken(response.data.access_token);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        loginWithGoogle,
        logout,
        loading,
        updateUserPlan,
        refreshUserProfile,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

