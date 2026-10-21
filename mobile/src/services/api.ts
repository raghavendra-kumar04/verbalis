import axios from 'axios';
import { Platform } from 'react-native';
import { AppStorage } from '../utils/storage';

// For local Android emulator, 10.0.2.2 points to host localhost.
// For Web or physical devices / Render, set via EXPO_PUBLIC_BACKEND_URL or default to localhost.
const DEFAULT_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
export const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || DEFAULT_URL;

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
      // Token expired or invalid
      try {
        await AppStorage.deleteItem('verbalis_jwt');
      } catch {}
    }
    return Promise.reject(error);
  }
);
