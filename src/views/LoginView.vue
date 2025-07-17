<template>
  <div class="login-view">
    <header class="page-header">
      <h1>Iniciar Sesión</h1>
      <p>Accede a tu cuenta para continuar</p>
    </header>
    <div class="login-container card">
      <form class="form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="email">Email</label>
          <input id="email" v-model="form.email" type="email" required placeholder="tu@email.com" />
        </div>
        <div class="form-group">
          <label for="password">Contraseña</label>
          <input id="password" v-model="form.password" type="password" required placeholder="Contraseña" />
        </div>
        <button type="submit" class="btn btn-primary">Iniciar Sesión</button>
      </form>
      <div class="divider"><span>o</span></div>
      <button @click="handleGoogleLogin" :disabled="loading" class="google-btn">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {{ loading ? 'Conectando...' : 'Iniciar sesión con Google' }}
      </button>
      <div class="register-link">
        ¿No tienes una cuenta? 
        <router-link to="/register">Regístrate aquí</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { loginUser, loginWithGoogle } from '@/services/auth';

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);

const form = reactive({
  email: '',
  password: '',
});

const handleSubmit = async () => {
  loading.value = true;
  try {
    const user = await loginUser(form.email, form.password);
    authStore.setUser(user);
    authStore.saveUserToStorage(user);
    router.push('/');
  } catch (error: any) {
    console.error('Error en el login:', error);
    let errorMessage = 'Error en el login';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Usuario no encontrado';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Contraseña incorrecta';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Email inválido';
    }
    
    alert(errorMessage);
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
    router.push('/');
  } catch (error: any) {
    console.error('Error en el login con Google:', error);
    alert('Error al iniciar sesión con Google');
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