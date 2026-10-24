import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { AppStorage } from '../utils/storage';
import { api } from '../services/api';

export interface UserPreferences {
  preferredFeedbackMode: 'per_answer' | 'end_of_session';
  coachingFocus: 'grammar' | 'technical_depth' | 'pacing' | 'all_round';
  speechSpeed: '0.9x' | '1.0x' | '1.1x';
  reducedMotion: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userEmail: string | null;
  firstName: string;
  preferences: UserPreferences;
  loadProfile: () => Promise<boolean>;
  updateProfile: (data: Partial<UserPreferences & { firstName: string }>) => Promise<{ success: boolean; message?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signup: (email: string, password: string, firstName?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const defaultPreferences: UserPreferences = {
  preferredFeedbackMode: 'per_answer',
  coachingFocus: 'all_round',
  speechSpeed: '1.0x',
  reducedMotion: false,
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  userEmail: null,
  firstName: '',
  preferences: defaultPreferences,
  loadProfile: async () => false,
  updateProfile: async () => ({ success: false }),
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string>('');
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);

  const loadProfile = async (): Promise<boolean> => {
    try {
      const response = await api.get('/profile');
      if (response.data) {
        if (response.data.firstName) {
          setFirstName(response.data.firstName);
        }
        if (response.data.email) {
          setUserEmail(response.data.email);
        }
        setPreferences({
          preferredFeedbackMode: response.data.preferredFeedbackMode || 'per_answer',
          coachingFocus: response.data.coachingFocus || 'all_round',
          speechSpeed: response.data.speechSpeed || '1.0x',
          reducedMotion: Boolean(response.data.reducedMotion),
        });
        return true;
      }
      return false;
    } catch (err: any) {
      console.warn('Could not fetch profile from database:', err);
      if (err.response?.status === 401) {
        setIsAuthenticated(false);
        setUserEmail(null);
        setFirstName('');
        try {
          await AppStorage.deleteItem('verbalis_jwt');
          await AppStorage.deleteItem('verbalis_user_email');
        } catch {}
      }
      return false;
    }
  };

  const updateProfile = async (
    data: Partial<UserPreferences & { firstName: string }>
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await api.put('/profile', data);
      if (response.data?.profile) {
        const p = response.data.profile;
        if (p.firstName) setFirstName(p.firstName);
        setPreferences({
          preferredFeedbackMode: p.preferredFeedbackMode || preferences.preferredFeedbackMode,
          coachingFocus: p.coachingFocus || preferences.coachingFocus,
          speechSpeed: p.speechSpeed || preferences.speechSpeed,
          reducedMotion: Boolean(p.reducedMotion),
        });
        return { success: true };
      }
      return { success: false, message: 'Server did not return updated profile' };
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to update profile';
      return { success: false, message: msg };
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await AppStorage.getItem('verbalis_jwt');
        const savedEmail = await AppStorage.getItem('verbalis_user_email');
        if (token && savedEmail) {
          const success = await loadProfile();
          if (success) {
            setUserEmail(savedEmail);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
            await AppStorage.deleteItem('verbalis_jwt');
            await AppStorage.deleteItem('verbalis_user_email');
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.warn('Auth init error', err);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password = ''): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      const cleanEmail = email.trim().toLowerCase();
      const response = await api.post('/auth/login', { email: cleanEmail, password });
      const { token, user } = response.data;

      if (token) {
        await AppStorage.setItem('verbalis_jwt', token);
        await AppStorage.setItem('verbalis_user_email', cleanEmail);
        setUserEmail(cleanEmail);
        if (user?.firstName) {
          setFirstName(user.firstName);
        }
        setIsAuthenticated(true);
        await loadProfile();
        return { success: true };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to connect to backend';
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    email: string,
    password = '',
    userFirstName = ''
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = userFirstName.trim() || cleanEmail.split('@')[0];

      const response = await api.post('/auth/signup', {
        email: cleanEmail,
        password,
        firstName: cleanName,
      });

      const { token, user } = response.data;

      if (token) {
        await AppStorage.setItem('verbalis_jwt', token);
        await AppStorage.setItem('verbalis_user_email', cleanEmail);
        setUserEmail(cleanEmail);
        setFirstName(cleanName);
        setIsAuthenticated(true);
        await loadProfile();
        return { success: true };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsAuthenticated(false);
      setUserEmail(null);
      setFirstName('');
      await AppStorage.deleteItem('verbalis_jwt');
      await AppStorage.deleteItem('verbalis_user_email');
    } catch (e) {
      console.warn('Logout error', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        userEmail,
        firstName,
        preferences,
        loadProfile,
        updateProfile,
        login,
        signup,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
