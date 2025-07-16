<template>
  <nav class="navbar" :class="{ 'navbar--scrolled': isScrolled }">
    <div class="navbar-container">
      <!-- Logo/Brand -->
      <div class="navbar-brand">
        <router-link to="/" class="navbar-logo">
          <span class="navbar-logo-text">DatingApp</span>
        </router-link>
      </div>

      <!-- Desktop Menu -->
      <div class="navbar-menu desktop-menu">
        <router-link to="/" class="navbar-link">Inicio</router-link>
        <router-link to="/profiles" class="navbar-link">Perfiles</router-link>
        <router-link to="/matches" class="navbar-link">Matches</router-link>
        <router-link to="/profile" class="navbar-link">Mi Perfil</router-link>
        <router-link 
          v-if="user?.isAdmin" 
          to="/admin/reports" 
          class="navbar-link admin-link"
        >
          Administración
        </router-link>
      </div>

      <!-- User Menu Desktop -->
      <div class="navbar-user desktop-menu">
        <div v-if="user" class="user-info">
          <span class="user-name">{{ user.name }}</span>
          <button @click="logout" class="logout-btn">Cerrar Sesión</button>
        </div>
        <router-link v-else to="/login" class="login-btn">Iniciar Sesión</router-link>
      </div>

      <!-- Mobile Menu Toggle -->
      <button 
        @click="toggleMobileMenu" 
        class="mobile-menu-toggle"
        :class="{ 'mobile-menu-toggle--active': isMobileMenuOpen }"
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>

    <!-- Mobile Menu -->
    <div class="mobile-menu" :class="{ 'mobile-menu--open': isMobileMenuOpen }">
      <div class="mobile-menu-content">
        <router-link to="/" class="mobile-menu-link" @click="closeMobileMenu">Inicio</router-link>
        <router-link to="/profiles" class="mobile-menu-link" @click="closeMobileMenu">Perfiles</router-link>
        <router-link to="/matches" class="mobile-menu-link" @click="closeMobileMenu">Matches</router-link>
        <router-link to="/profile" class="mobile-menu-link" @click="closeMobileMenu">Mi Perfil</router-link>
        <router-link 
          v-if="user?.isAdmin" 
          to="/admin/reports" 
          class="mobile-menu-link admin-link" 
          @click="closeMobileMenu"
        >
          Administración
        </router-link>
        
        <div class="mobile-menu-divider"></div>
        
        <div v-if="user" class="mobile-user-info">
          <div class="mobile-user-name">{{ user.name }}</div>
          <button @click="logout" class="mobile-logout-btn">Cerrar Sesión</button>
        </div>
        <router-link v-else to="/login" class="mobile-login-btn" @click="closeMobileMenu">
          Iniciar Sesión
        </router-link>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { logoutUser } from '@/services/auth';

const router = useRouter();
const authStore = useAuthStore();
const user = computed(() => authStore.user); // Asegura reactividad

const isMobileMenuOpen = ref(false);
const isScrolled = ref(false);

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
  // Prevenir scroll del body cuando el menú móvil está abierto
  document.body.style.overflow = isMobileMenuOpen.value ? 'hidden' : '';
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
  document.body.style.overflow = '';
};

const handleScroll = () => {
  isScrolled.value = window.scrollY > 10;
};

const logout = async () => {
  try {
    await logoutUser();
    authStore.logout();
    router.push('/login');
    closeMobileMenu();
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  }
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  document.body.style.overflow = '';
});
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100vw;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  z-index: 1000;
  transition: all 0.3s ease;
}

.navbar--scrolled {
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
}

.navbar-container {
  width: 100vw;
  max-width: none;
  margin: 0;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70px;
}

.navbar-brand {
  flex-shrink: 0;
}

.navbar-logo {
  text-decoration: none;
  color: #333;
  font-weight: 700;
  font-size: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.navbar-menu {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.navbar-link {
  text-decoration: none;
  color: #333;
  font-weight: 500;
  transition: color 0.3s ease;
  position: relative;
}

.navbar-link:hover {
  color: #667eea;
}

.navbar-link::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.navbar-link:hover::after {
  width: 100%;
}

.admin-link {
  color: #dc3545 !important;
  font-weight: 600;
}

.admin-link:hover {
  color: #c82333 !important;
}

.admin-link::after {
  background: #dc3545 !important;
}

.navbar-user {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-name {
  font-weight: 600;
  color: #333;
}

.logout-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s ease;
}

.logout-btn:hover {
  background: #c82333;
}

.login-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.mobile-menu-toggle {
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

.mobile-menu-toggle span {
  width: 100%;
  height: 3px;
  background: #333;
  border-radius: 3px;
  transition: all 0.3s ease;
  transform-origin: center;
}

.mobile-menu-toggle--active span:nth-child(1) {
  transform: rotate(45deg) translate(6px, 6px);
}

.mobile-menu-toggle--active span:nth-child(2) {
  opacity: 0;
}

.mobile-menu-toggle--active span:nth-child(3) {
  transform: rotate(-45deg) translate(6px, -6px);
}

.mobile-menu {
  position: fixed;
  top: 70px;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  transform: translateY(-100%);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 999;
}

.mobile-menu--open {
  transform: translateY(0);
  opacity: 1;
  visibility: visible;
}

.mobile-menu-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mobile-menu-link {
  text-decoration: none;
  color: #333;
  font-weight: 500;
  padding: 1rem;
  border-radius: 8px;
  transition: background 0.3s ease;
}

.mobile-menu-link:hover {
  background: #f8f9fa;
  color: #667eea;
}

.mobile-menu-divider {
  height: 1px;
  background: #e9ecef;
  margin: 0.5rem 0;
}

.mobile-user-info {
  padding: 1rem;
}

.mobile-user-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.mobile-logout-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  width: 100%;
  transition: background 0.3s ease;
}

.mobile-logout-btn:hover {
  background: #c82333;
}

.mobile-login-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  text-align: center;
  transition: all 0.3s ease;
}

.mobile-login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

/* Responsive Design */
@media (max-width: 768px) {
  .desktop-menu {
    display: none;
  }
  
  .mobile-menu-toggle {
    display: flex;
  }
  
  .navbar-container {
    padding: 0 1rem;
    height: 60px;
  }
  
  .navbar-logo-text {
    font-size: 1.25rem;
  }
}

@media (min-width: 769px) {
  .mobile-menu-toggle {
    display: none;
  }
  
  .mobile-menu {
    display: none;
  }
}

/* Ajustes para pantallas muy pequeñas */
@media (max-width: 480px) {
  .navbar-container {
    padding: 0 0.75rem;
    height: 60px;
  }
  
  .navbar-logo-text {
    font-size: 1.1rem;
  }
  
  .mobile-menu-content {
    padding: 0.75rem;
  }
  
  .mobile-menu-link {
    padding: 0.875rem;
  }
}

/* Ajustes para tablets */
@media (min-width: 481px) and (max-width: 768px) {
  .navbar-container {
    padding: 0 1.5rem;
  }
}
</style> 