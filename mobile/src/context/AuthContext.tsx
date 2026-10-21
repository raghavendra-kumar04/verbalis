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
  loadProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserPreferences & { firstName: string }>) => Promise<{ success: boolean; message?: string }>;
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
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
  firstName: 'Raghavendra',
  preferences: defaultPreferences,
  loadProfile: async () => {},
  updateProfile: async () => ({ success: false }),
  login: async () => ({ success: false }),
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string>('Raghavendra');
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);

  const loadProfile = async () => {
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
      }
    } catch (err) {
      console.warn('Could not fetch profile from database:', err);
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
        const savedEmail = await AppStorage.getItem('verbalis_user_email');
        if (savedEmail) {
          setUserEmail(savedEmail);
        }
        const token = await AppStorage.getItem('verbalis_jwt');
        if (token) {
          setIsAuthenticated(true);
          await loadProfile();
        }
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
      const response = await api.post('/auth/login', { email, password });
      const { token } = response.data;

      if (token) {
        await AppStorage.setItem('verbalis_jwt', token);
        await AppStorage.setItem('verbalis_user_email', email);
        setUserEmail(email);
        setIsAuthenticated(true);
        // Load the real profile from database immediately
        await loadProfile();
        return { success: true };
      }
      return { success: false, message: 'Invalid server response' };
    } catch (error: any) {
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
      await AppStorage.deleteItem('verbalis_jwt');
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
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
