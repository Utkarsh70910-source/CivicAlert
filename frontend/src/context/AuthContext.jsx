import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('civicalert_token');
      const storedUser = localStorage.getItem('civicalert_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('Failed to parse cached auth state:', err);
      localStorage.removeItem('civicalert_token');
      localStorage.removeItem('civicalert_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Log in user with username/workerId and password
   */
  const login = async (credentials) => {
    const response = await authApi.login(credentials);
    if (response.success && response.token && response.user) {
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('civicalert_token', response.token);
      localStorage.setItem('civicalert_user', JSON.stringify(response.user));
      return response.user;
    }
    throw new Error(response.message || 'Login failed.');
  };

  /**
   * Log out active session
   */
  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('civicalert_token');
      localStorage.removeItem('civicalert_user');
    }
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: Boolean(user && token),
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

