import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const API_BASE = 'http://localhost:8000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Fetch full user profile from /me to get is_admin and other fields
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      axios
        .get(`${API_BASE}/api/v1/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const savedPlan = localStorage.getItem(`user_plan_${res.data.email}`) || 'free';
          setUser({ ...res.data, plan: savedPlan });
        })
        .catch(() => {
          // Token is invalid/expired – clear it
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const updateUserPlan = (newPlan) => {
    if (user?.email) {
      localStorage.setItem(`user_plan_${user.email}`, newPlan);
      setUser((prev) => ({ ...prev, plan: newPlan }));
    } else {
      setUser((prev) => ({ ...prev, plan: newPlan }));
    }
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

  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, updateUserPlan }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
