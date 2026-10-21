import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { AppStorage } from '../utils/storage';

/**
 * Resolves the backend API URL.
 * Automatically resolves to the laptop's Wi-Fi / hotspot IP when accessed from a physical phone.
 */
const getBackendUrl = (): string => {
  if (process.env.EXPO_PUBLIC_BACKEND_URL) {
    return process.env.EXPO_PUBLIC_BACKEND_URL;
  }
  // Try extracting the host IP from Expo hostUri (which points to your laptop running Metro)
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:3000`;
    }
  }
  // Laptop Wi-Fi IP address when phone is connected to hotspot/wifi
  if (Platform.OS === 'android') {
    return 'http://10.112.151.252:3000';
  }
  return 'http://localhost:3000';
};

export const API_BASE_URL = getBackendUrl();

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await AppStorage.getItem('verbalis_jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.warn('Could not read JWT from storage', error);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await AppStorage.deleteItem('verbalis_jwt');
      } catch {}
    }
    return Promise.reject(error);
  }
);
