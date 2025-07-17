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
    <main class="main">
      <div v-if="!isAuthenticated" class="welcome">
        <h2>Bienvenido a Give me a chance</h2>
        <p>Encuentra tu pareja ideal basándote en tus preferencias y valores</p>
        <div class="cta-buttons">
          <router-link to="/register" class="btn btn-primary">Registrarse</router-link>
          <router-link to="/login" class="btn btn-secondary">Iniciar Sesión</router-link>
        </div>
      </div>

      <div v-else class="dashboard">
        <h2>Hola, {{ user?.name }}<span v-if="user?.isAdmin" style="color:#dc3545; font-size:1rem; margin-left:8px;">[ADMIN]</span></h2>
        <div class="stats">
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

        <div class="quick-actions">
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}

/* Responsive para el contenido principal */
@media (max-width: 768px) {
  .home {
    min-height: calc(100vh - 60px);
    padding: 1rem 0.75rem;
  }
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

@media (max-width: 768px) {
  .main {
    min-height: calc(100vh - 60px);
  }
}

.welcome {
  text-align: center;
  color: white;
  padding: 3rem 1rem;
}

.welcome h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  font-weight: 700;
}

.welcome p {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  opacity: 0.9;
  line-height: 1.6;
}

/* Responsive welcome */
@media (max-width: 480px) {
  .welcome {
    padding: 2rem 0.75rem;
  }
  
  .welcome h2 {
    font-size: 2rem;
  }
  
  .welcome p {
    font-size: 1rem;
  }
}

@media (min-width: 769px) {
  .welcome {
    padding: 4rem 2rem;
  }
  
  .welcome h2 {
    font-size: 3rem;
  }
  
  .welcome p {
    font-size: 1.2rem;
  }
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 1rem 2rem;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;
  backdrop-filter: blur(10px);
}

/* Responsive botones */
@media (max-width: 480px) {
  .cta-buttons {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .btn {
    padding: 1.125rem 1.5rem;
    font-size: 1rem;
    width: 100%;
    max-width: 300px;
  }
}

.dashboard {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-top: 2rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.dashboard h2 {
  color: #333;
  margin-bottom: 2rem;
  font-size: 1.75rem;
  font-weight: 700;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  border: 1px solid rgba(0,0,0,0.05);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-card h3 {
  margin: 0 0 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
  font-weight: 600;
}

.stat-number {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: #333;
}

/* Responsive dashboard */
@media (max-width: 480px) {
  .dashboard {
    padding: 1.5rem;
    margin-top: 1rem;
  }
  
  .dashboard h2 {
    font-size: 1.5rem;
  }
  
  .stats {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .stat-card {
    padding: 1.25rem;
  }
  
  .stat-number {
    font-size: 1.75rem;
  }
}

@media (min-width: 481px) and (max-width: 768px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.action-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 1.5rem;
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  border: 1px solid rgba(0,0,0,0.05);
  display: block;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
}

.action-card h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
}

.action-card p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
}

/* Responsive quick actions */
@media (max-width: 480px) {
  .quick-actions {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .action-card {
    padding: 1.25rem;
  }
  
  .action-card h3 {
    font-size: 1rem;
  }
}

@media (min-width: 481px) and (max-width: 768px) {
  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
}

.action-card h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.action-card p {
  margin: 0;
  color: #666;
}
</style>
