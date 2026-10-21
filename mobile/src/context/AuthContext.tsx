import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { AppStorage } from '../utils/storage';
import { api } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userEmail: string | null;
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  userEmail: null,
  login: async () => ({ success: false }),
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Check saved credentials and auto-logout on background/exit as requested by user
    const initAuth = async () => {
      try {
        const savedEmail = await AppStorage.getItem('verbalis_user_email');
        setUserEmail(savedEmail || 'raghavendra@gmail.com');
      } catch (err) {
        console.warn('Auth init error', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen to AppState transitions: when app goes to background, mark logged out locally
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState.match(/inactive|background/)) {
        setIsAuthenticated(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const login = async (email: string, password = ''): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      // Attempt login to backend
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      if (token) {
        await AppStorage.setItem('verbalis_jwt', token);
        await AppStorage.setItem('verbalis_user_email', email);
        setUserEmail(email);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: 'Invalid server response' };
    } catch (error: any) {
      // In offline / local prototype mode before backend is active, allow developer sign-in
      if (!error.response && __DEV__) {
        console.log('Dev mode fallback: signing in locally without active backend');
        await AppStorage.setItem('verbalis_jwt', 'dev_mock_token_12345');
        await AppStorage.setItem('verbalis_user_email', email);
        setUserEmail(email);
        setIsAuthenticated(true);
        return { success: true };
      }
      const message = error.response?.data?.message || 'Failed to connect to backend';
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsAuthenticated(false);
    } catch (e) {
      console.warn('Logout error', e);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, userEmail, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
