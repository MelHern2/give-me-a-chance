import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, AuthState } from '@/types';
import { setupUserNotifications } from '@/services/notifications';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const loading = ref(false);

  const isAuthenticated = computed(() => !!user.value);

  const setUser = async (newUser: User | null) => {
    user.value = newUser;
    
    // Configurar notificaciones cuando el usuario se autentique
    if (newUser && newUser.id) {
      try {
        await setupUserNotifications(newUser.id);
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    }
  };

  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading;
  };

  const logout = () => {
    user.value = null;
    localStorage.removeItem('user');
  };

  const saveUserToStorage = (userData: User) => {
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const loadUserFromStorage = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      user.value = JSON.parse(storedUser);
    }
  };

  return {
    user,
    loading,
    isAuthenticated,
    setUser,
    setLoading,
    logout,
    saveUserToStorage,
    loadUserFromStorage,
  };
}); 