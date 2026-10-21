import * as SecureStore from 'expo-secure-store';

export const AppStorage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      console.warn(`SecureStore set error for key ${key}:`, e);
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.warn(`SecureStore get error for key ${key}:`, e);
      return null;
    }
  },

  async deleteItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.warn(`SecureStore delete error for key ${key}:`, e);
    }
  },
};
