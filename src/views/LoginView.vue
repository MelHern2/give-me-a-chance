<template>
  <div class="login-view">
    <header class="page-header">
      <h1>Iniciar Sesión</h1>
      <p>Accede a tu cuenta para continuar</p>
    </header>
    <div class="login-container card">
      <form class="form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="form.email" 
            required 
            placeholder="tu@email.com"
          />
        </div>
        
        <div class="form-group">
          <label for="password">Contraseña</label>
          <input 
            type="password" 
            id="password" 
            v-model="form.password" 
            required 
            placeholder="Tu contraseña"
          />
        </div>
        
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Iniciando sesión...' : 'Iniciar sesión' }}
        </button>
      </form>
      
      <div class="divider">
        <span>o</span>
      </div>
      
      <button 
        @click="handleGoogleLogin" 
        class="btn btn-google" 
        :disabled="loading"
      >
        <span class="google-icon">G</span>
        {{ loading ? 'Conectando...' : 'Iniciar sesión con Google' }}
      </button>
      
      <p class="register-link">
        ¿No tienes cuenta? <router-link to="/register">Regístrate aquí</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { loginUser, loginWithGoogle } from '@/services/auth';
import { useNotifications } from '@/composables/useNotifications';

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const notifications = useNotifications();

const form = reactive({
  email: '',
  password: ''
});

const handleLogin = async () => {
  loading.value = true;
  try {
    const user = await loginUser(form.email, form.password);
    authStore.setUser(user);
    authStore.saveUserToStorage(user);
    
    // Verificar si el usuario ha aceptado los términos
    if (!authStore.hasAcceptedTerms) {
      router.push('/terms');
    } else {
      router.push('/');
    }
  } catch (error: any) {
    console.error('Error logging in:', error);
    notifications.error('Error de Login', 'Email o contraseña incorrectos');
  } finally {
    loading.value = false;
  }
};

const handleGoogleLogin = async () => {
  loading.value = true;
  try {
    const user = await loginWithGoogle();
    authStore.setUser(user);
    authStore.saveUserToStorage(user);
    
    // Verificar si el usuario ha aceptado los términos
    if (!authStore.hasAcceptedTerms) {
      router.push('/terms');
    } else {
      router.push('/');
    }
  } catch (error: any) {
    console.error('Error en el login con Google:', error);
    notifications.error('Error al iniciar sesión con Google');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-view {
  min-height: 100vh;
  background: var(--wa-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}
.login-container {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}
.divider {
  text-align: center;
  margin: 1.5rem 0;
  color: var(--wa-green);
  font-weight: 600;
}
.register-link {
  text-align: center;
  padding: 1.5rem;
  color: #666;
}
.register-link a {
  color: var(--wa-green);
  text-decoration: none;
  font-weight: 600;
}
.register-link a:hover {
  text-decoration: underline;
}
</style> 