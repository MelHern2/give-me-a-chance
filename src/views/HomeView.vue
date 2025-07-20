<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useProfilesStore } from '@/stores/profiles';
import { usePendingMatchesStore } from '@/stores/pendingMatches';

const authStore = useAuthStore();
const profilesStore = useProfilesStore();
const pendingMatchesStore = usePendingMatchesStore();

const isAuthenticated = computed(() => authStore.isAuthenticated);
const user = computed(() => authStore.user);

// Datos reales desde los stores
const nearbyProfiles = computed(() => profilesStore.profiles.length);
const matchesCount = computed(() => pendingMatchesStore.pendingMatchesCount);
const messagesCount = computed(() => {
  // TODO: Implementar contador real de mensajes
  return 0;
});

const logout = () => {
  authStore.logout();
};

onMounted(async () => {
  // Cargar datos del usuario si está autenticado
  if (isAuthenticated.value) {
    authStore.loadUserFromStorage();
    
    // Cargar matches pendientes si el usuario está autenticado
    if (authStore.user?.id) {
      await pendingMatchesStore.loadPendingMatches(authStore.user.id);
    }
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
  width: 100%;
  background: var(--wa-bg);
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}

.main {
  width: 100%;
  min-height: calc(100vh - 70px);
  margin: 0;
  padding: 1rem;
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
  flex-wrap: wrap;
}

.dashboard h2 {
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.stats {
  margin-bottom: 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.stat-card {
  font-size: 1.2rem;
  text-align: center;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: var(--wa-green);
  margin: 0.5rem 0;
}

.quick-actions {
  gap: 1.2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.action-card {
  cursor: pointer;
  transition: box-shadow 0.2s;
  text-decoration: none;
  color: inherit;
  display: block;
}

.action-card:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.action-card h3 {
  margin-bottom: 0.5rem;
  color: var(--wa-green);
}

.action-card p {
  margin: 0;
  color: #666;
}

/* Responsive */
@media (max-width: 480px) {
  .main {
    padding: 0.5rem;
  }
  
  .welcome {
    padding: 1.5rem 0.5rem;
  }
  
  .cta-buttons {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .dashboard h2 {
    font-size: 1.25rem;
  }
  
  .stats {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .stat-card {
    font-size: 1rem;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
  
  .quick-actions {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}

@media (min-width: 481px) and (max-width: 768px) {
  .main {
    padding: 1rem;
  }
  
  .stats {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 769px) {
  .main {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .stats {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .quick-actions {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Capacitor específico */
@media (max-width: 480px) and (orientation: landscape) {
  .main {
    padding: 0.25rem;
  }
  
  .stats {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.25rem;
  }
  
  .quick-actions {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }
}
</style>
