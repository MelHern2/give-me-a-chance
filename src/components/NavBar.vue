<template>
  <nav class="navbar">
    <div class="navbar-left">
      <router-link to="/" class="router-link">Inicio</router-link>
      <router-link to="/profiles" class="router-link">Perfiles</router-link>
      <router-link to="/matches" class="router-link">
        Matches
        <span v-if="pendingMatchesCount > 0" class="pending-badge">
          {{ pendingMatchesCount }}
        </span>
      </router-link>
      <router-link to="/profile" class="router-link">Mi Perfil</router-link>
      <router-link v-if="user?.isAdmin" to="/admin/reports" class="router-link admin-link">Administración</router-link>
    </div>
    <div class="navbar-right">
      <span v-if="user" class="navbar-user">{{ user.name }}</span>
      <button v-if="user" @click="logout" class="btn btn-danger">Cerrar Sesión</button>
      <router-link v-else to="/login" class="btn">Iniciar Sesión</router-link>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { logoutUser } from '@/services/auth';
import { getPendingMatches } from '@/services/pendingMatches';

const authStore = useAuthStore();
const user = computed(() => authStore.user);
const pendingMatchesCount = ref(0);

const logout = () => {
  authStore.logout();
};

// Función para cargar los matches pendientes
const loadPendingMatches = async () => {
  if (!user.value) return;
  
  try {
    const pendingMatches = await getPendingMatches(user.value.id);
    pendingMatchesCount.value = pendingMatches.length;
  } catch (error) {
    console.error('Error cargando matches pendientes:', error);
  }
};

// Cargar matches pendientes cuando el componente se monta
onMounted(() => {
  if (user.value) {
    loadPendingMatches();
  }
});

// Observar cambios en el usuario
watch(() => user.value, (newUser) => {
  if (newUser) {
    loadPendingMatches();
  } else {
    pendingMatchesCount.value = 0;
  }
}, { immediate: true });

// Recargar matches pendientes cada 60 segundos
setInterval(() => {
  if (user.value) {
    loadPendingMatches();
  }
}, 60000);
</script>

<style scoped>
.navbar {
  background: var(--wa-green);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  border-radius: var(--wa-radius) var(--wa-radius) 0 0;
  box-shadow: var(--wa-shadow);
  min-height: 60px;
}
.navbar-left, .navbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.router-link {
  color: #fff;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}
.router-link:hover {
  color: var(--wa-green-light);
}
.admin-link {
  color: var(--wa-warning) !important;
}
.btn {
  background: var(--wa-green);
  color: #fff;
  border: none;
  border-radius: 2rem;
  padding: 0.5rem 1.2rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-danger {
  background: var(--wa-danger) !important;
}
.btn:hover {
  background: var(--wa-green-dark);
}
.navbar-user {
  font-weight: 600;
  margin-right: 0.5rem;
}

.pending-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--wa-danger);
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  margin-left: 5px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
</style> 