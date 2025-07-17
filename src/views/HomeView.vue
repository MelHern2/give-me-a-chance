<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useProfilesStore } from '@/stores/profiles';

const authStore = useAuthStore();
const profilesStore = useProfilesStore();

const isAuthenticated = computed(() => authStore.isAuthenticated);
const user = computed(() => authStore.user);

// Datos de ejemplo
const nearbyProfiles = 15;
const matchesCount = 3;
const messagesCount = 8;

const logout = () => {
  authStore.logout();
};

onMounted(() => {
  // Cargar datos del usuario si está autenticado
  if (isAuthenticated.value) {
    authStore.loadUserFromStorage();
  }
});
</script>

<template>
  <div class="home">
    <header class="page-header">
      <h1>Bienvenido a Give me a chance</h1>
      <p>Encuentra tu pareja ideal basándote en tus preferencias y valores</p>
    </header>
    <main class="main">
      <div v-if="!isAuthenticated" class="card welcome">
        <div class="cta-buttons">
          <router-link to="/register" class="btn">Registrarse</router-link>
          <router-link to="/login" class="btn btn-secondary">Iniciar Sesión</router-link>
        </div>
      </div>
      <div v-else class="dashboard card">
        <h2>Hola, {{ user?.name }}<span v-if="user?.isAdmin" style="color:#dc3545; font-size:1rem; margin-left:8px;">[ADMIN]</span></h2>
        <div class="stats matches-grid">
          <div class="stat-card">
            <h3>Perfiles Cercanos</h3>
            <p class="stat-number">{{ nearbyProfiles }}</p>
          </div>
          <div class="stat-card">
            <h3>Matches</h3>
            <p class="stat-number">{{ matchesCount }}</p>
          </div>
          <div class="stat-card">
            <h3>Mensajes</h3>
            <p class="stat-number">{{ messagesCount }}</p>
          </div>
        </div>
        <div class="quick-actions matches-grid">
          <router-link to="/profiles" class="action-card">
            <h3>Explorar Perfiles</h3>
            <p>Descubre personas cerca de ti</p>
          </router-link>
          <router-link to="/matches" class="action-card">
            <h3>Ver Matches</h3>
            <p>Revisa tus conexiones</p>
          </router-link>
          <router-link to="/profile" class="action-card">
            <h3>Mi Perfil</h3>
            <p>Actualiza tu información</p>
          </router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
  width: 100vw;
  background: var(--wa-bg);
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}
.main {
  width: 100vw;
  min-height: calc(100vh - 70px);
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
.welcome {
  text-align: center;
  color: var(--wa-green);
  padding: 2rem 1rem;
}
.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}
.dashboard h2 {
  margin-bottom: 1.5rem;
}
.stats {
  margin-bottom: 2rem;
}
.stat-card {
  font-size: 1.2rem;
}
.quick-actions {
  gap: 1.2rem;
}
.action-card {
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.action-card:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}
</style>
