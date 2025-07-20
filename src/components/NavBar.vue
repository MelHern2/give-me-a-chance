<template>
  <nav class="navbar">
    <!-- Menú hamburguesa para móvil -->
    <button 
      @click="toggleMobileMenu" 
      class="mobile-menu-btn"
      :class="{ 'active': isMobileMenuOpen }"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>

    <!-- Logo/Nombre de la app -->
    <div class="navbar-brand">
      <router-link to="/" class="brand-link">
        Give me a chance
      </router-link>
    </div>

    <!-- Menú de navegación -->
    <div class="navbar-menu" :class="{ 'mobile-open': isMobileMenuOpen }">
      <div class="navbar-left">
        <router-link to="/" class="router-link" @click="closeMobileMenu">Inicio</router-link>
        <router-link to="/profiles" class="router-link" @click="closeMobileMenu">Perfiles</router-link>
        <router-link to="/matches" class="router-link" @click="closeMobileMenu">
          Matches
          <span v-if="pendingMatchesCount > 0" class="pending-badge">
            {{ pendingMatchesCount }}
          </span>
        </router-link>
        <router-link to="/profile" class="router-link" @click="closeMobileMenu">Mi Perfil</router-link>
        <router-link v-if="user?.isAdmin" to="/admin/reports" class="router-link admin-link" @click="closeMobileMenu">Reportes</router-link>
        <router-link v-if="user?.isAdmin" to="/admin/users" class="router-link admin-link" @click="closeMobileMenu">Usuarios</router-link>
      </div>
      <div class="navbar-right">
        <span v-if="user" class="navbar-user">{{ user.name }}</span>
        <button v-if="user" @click="logout" class="btn btn-danger">Cerrar Sesión</button>
        <router-link v-else to="/login" class="btn">Iniciar Sesión</router-link>
      </div>
    </div>

    <!-- Overlay para cerrar menú móvil -->
    <div 
      v-if="isMobileMenuOpen" 
      class="mobile-overlay" 
      @click="closeMobileMenu"
    ></div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { logoutUser } from '@/services/auth';
import { usePendingMatchesStore } from '@/stores/pendingMatches';

const authStore = useAuthStore();
const pendingMatchesStore = usePendingMatchesStore();
const user = computed(() => authStore.user);
const pendingMatchesCount = computed(() => pendingMatchesStore.pendingMatchesCount);
const isMobileMenuOpen = ref(false);

const logout = () => {
  authStore.logout();
  closeMobileMenu();
};

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

// Cargar matches pendientes cuando el componente se monta
onMounted(() => {
  if (user.value) {
    pendingMatchesStore.loadPendingMatches(user.value.id);
  }
});

// Observar cambios en el usuario
watch(() => user.value, (newUser) => {
  if (newUser) {
    pendingMatchesStore.loadPendingMatches(newUser.id);
  } else {
    pendingMatchesStore.clearPendingMatches();
  }
}, { immediate: true });

// Recargar matches pendientes cada 60 segundos
setInterval(() => {
  if (user.value) {
    pendingMatchesStore.loadPendingMatches(user.value.id);
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
  padding: 0 1rem;
  border-radius: var(--wa-radius) var(--wa-radius) 0 0;
  box-shadow: var(--wa-shadow);
  min-height: 60px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.navbar-brand {
  display: flex;
  align-items: center;
}

.brand-link {
  color: #fff;
  text-decoration: none;
  font-weight: 700;
  font-size: 1.1rem;
}

.navbar-menu {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  margin-left: 1rem;
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
  white-space: nowrap;
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
  white-space: nowrap;
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
  white-space: nowrap;
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
  line-height: 1;
  vertical-align: text-top;
  position: relative;
  top: -2px;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* Botón de menú móvil */
.mobile-menu-btn {
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 30px;
  height: 30px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 1001;
}

.mobile-menu-btn span {
  width: 100%;
  height: 3px;
  background: #fff;
  border-radius: 3px;
  transition: all 0.3s ease;
}

.mobile-menu-btn.active span:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.mobile-menu-btn.active span:nth-child(2) {
  opacity: 0;
}

.mobile-menu-btn.active span:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -6px);
}

/* Overlay móvil */
.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

/* Responsive */
@media (max-width: 768px) {
  .navbar {
    padding: 0 0.5rem;
  }
  
  .mobile-menu-btn {
    display: flex;
  }
  
  .navbar-menu {
    position: fixed;
    top: 60px;
    left: -100%;
    width: 280px;
    height: calc(100vh - 60px);
    background: var(--wa-green);
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    padding: 2rem 1rem;
    transition: left 0.3s ease;
    z-index: 1000;
  }
  
  .navbar-menu.mobile-open {
    left: 0;
  }
  
  .navbar-left, .navbar-right {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    width: 100%;
  }
  
  .router-link {
    padding: 1rem;
    border-radius: 0.5rem;
    display: block;
    text-align: left;
  }
  
  .router-link:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .btn {
    width: 100%;
    justify-content: center;
    margin-top: 1rem;
  }
  
  .navbar-user {
    text-align: center;
    margin: 1rem 0;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
  }
}

@media (max-width: 480px) {
  .navbar {
    min-height: 50px;
  }
  
  .navbar-menu {
    top: 50px;
    height: calc(100vh - 50px);
  }
  
  .brand-link {
    font-size: 1rem;
  }
}
</style> 