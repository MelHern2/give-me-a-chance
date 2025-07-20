import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, AuthState } from '@/types';
import { setupUserNotifications } from '@/services/notifications';
import { useRouter } from 'vue-router';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const loading = ref(false);
  const router = useRouter();

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

  const setUser = (newUser: User) => {
    console.log('🔄 Actualizando usuario en store:', {
      id: newUser.id,
      name: newUser.name,
      isVerified: newUser.isVerified,
      isSuperVerified: newUser.isSuperVerified,
      verifiedAt: newUser.verifiedAt
    });
    
    user.value = newUser;
    localStorage.setItem('user', JSON.stringify(newUser));
    
    console.log('✅ Usuario actualizado en store y localStorage');
  };

  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading;
  };

  const logout = () => {
    user.value = null;
    localStorage.removeItem('user');
    router.push('/login');
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