import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, AuthState } from '@/types';
import { setupUserNotifications } from '@/services/notifications';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const loading = ref(false);

  const isAuthenticated = computed(() => !!user.value);
  const hasAcceptedTerms = computed(() => {
    return localStorage.getItem('termsAccepted') === 'true';
  });

  // Inicializar usuario desde localStorage
  const initUser = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser);
        console.log('👤 Usuario cargado desde localStorage:', user.value?.name);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
  };

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

  // Inicializar automáticamente
  initUser();

  // Método para aceptar términos
  const acceptTerms = () => {
    localStorage.setItem('termsAccepted', 'true');
  };

  return {
    user,
    loading,
    isAuthenticated,
    hasAcceptedTerms,
    setUser,
    setLoading,
    logout,
    saveUserToStorage,
    loadUserFromStorage,
    initUser,
    acceptTerms,
  };
}); 