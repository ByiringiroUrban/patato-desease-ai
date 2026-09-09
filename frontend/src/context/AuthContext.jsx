import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // You might want to decode the token or call a /me endpoint here
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      // For now, we will decode a mock user from token, ideally call API to get user profile
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ email: payload.sub });
      } catch (e) {
        setUser(null);
      }
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    const response = await axios.post('http://localhost:8000/api/v1/auth/login', formData);
    setToken(response.data.access_token);
    return response.data;
  };

  const register = async (email, password) => {
    const response = await axios.post('http://localhost:8000/api/v1/auth/register', { email, password });
    return response.data;
  };

  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
