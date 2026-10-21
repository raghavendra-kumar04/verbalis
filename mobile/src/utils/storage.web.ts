export const AppStorage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn(`Web storage set error for key ${key}:`, e);
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    } catch (e) {
      console.warn(`Web storage get error for key ${key}:`, e);
      return null;
    }
  },

  async deleteItem(key: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn(`Web storage delete error for key ${key}:`, e);
    }
  },
};
