<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { pushNotificationService } from '@/services/pushNotifications';
import NavBar from '@/components/NavBar.vue';
import NotificationToast from '@/components/NotificationToast.vue';
import NotificationSystem from '@/components/NotificationSystem.vue';

const authStore = useAuthStore();

onMounted(async () => {
  // Cargar usuario desde localStorage al inicializar la app
  authStore.loadUserFromStorage();
  
  // Configurar notificaciones push
  try {
    const hasPermission = await pushNotificationService.requestPermissions();
    if (hasPermission) {
      await pushNotificationService.registerForPushNotifications();
    }
  } catch (error) {
    console.error('Error configurando notificaciones push:', error);
  }
});
</script>

<template>
  <div id="app">
    <NavBar />
    <main class="main-content">
      <router-view />
    </main>
    <NotificationToast />
    <NotificationSystem />
  </div>
</template>

<style>
/* Reset y configuración base */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  scroll-behavior: smooth;
  -webkit-text-size-adjust: 100%;
  -ms-text-size-adjust: 100%;
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f8f9fa;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin: 0;
  padding: 0;
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
}

.main-content {
  padding-top: 70px; /* Altura de la navbar */
  min-height: calc(100vh - 70px);
  width: 100%;
  max-width: none;
  margin: 0;
  overflow-x: hidden;
}

/* Responsive para el contenido principal */
@media (max-width: 768px) {
  .main-content {
    padding-top: 60px; /* Altura de la navbar en móvil */
    min-height: calc(100vh - 60px);
  }
}

@media (max-width: 480px) {
  .main-content {
    padding-top: 50px; /* Altura de la navbar en móvil pequeño */
    min-height: calc(100vh - 50px);
  }
}

/* Variables CSS para responsive design */
:root {
  --container-padding: 1rem;
  --border-radius: 8px;
  --transition: all 0.3s ease;
  --shadow: 0 2px 10px rgba(0,0,0,0.1);
  --shadow-hover: 0 4px 20px rgba(0,0,0,0.15);
}

/* Breakpoints responsive */
@media (max-width: 480px) {
  :root {
    --container-padding: 0.75rem;
  }
  
  html {
    font-size: 14px;
  }
}

@media (min-width: 481px) and (max-width: 768px) {
  :root {
    --container-padding: 1rem;
  }
  
  html {
    font-size: 15px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  :root {
    --container-padding: 1.5rem;
  }
  
  html {
    font-size: 16px;
  }
}

@media (min-width: 1025px) {
  :root {
    --container-padding: 2rem;
  }
  
  html {
    font-size: 16px;
  }
}

/* Estilos globales para botones */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  text-decoration: none;
  font-weight: 600;
  font-size: 1rem;
  transition: var(--transition);
  min-height: 44px; /* Para accesibilidad en móvil */
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: var(--shadow);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.btn-secondary {
  background: #6c757d;
  color: white;
  box-shadow: var(--shadow);
}

.btn-secondary:hover {
  background: #545b62;
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

/* Botones responsive */
@media (max-width: 480px) {
  .btn {
    padding: 0.875rem 1.25rem;
    font-size: 0.9rem;
    width: 100%;
    min-height: 48px; /* Mayor área de toque */
  }
}

/* Estilos para formularios */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.875rem;
  border: 2px solid #e9ecef;
  border-radius: var(--border-radius);
  font-size: 1rem;
  transition: var(--transition);
  background: white;
  min-height: 44px; /* Para accesibilidad en móvil */
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Formularios responsive */
@media (max-width: 480px) {
  .form-group {
    margin-bottom: 1.25rem;
  }
  
  .form-group input,
  .form-group select,
  .form-group textarea {
    padding: 1rem;
    font-size: 16px; /* Evita zoom en iOS */
    min-height: 48px; /* Mayor área de toque */
  }
}

/* Estilos para tarjetas */
.card {
  background: white;
  border-radius: 16px;
  box-shadow: var(--shadow);
  overflow: hidden;
  transition: var(--transition);
  border: 1px solid rgba(0,0,0,0.05);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
}

/* Estilos para contenedores */
.container {
  width: 100%;
  padding: 0 var(--container-padding);
  max-width: none;
  margin: 0;
}

/* Contenedores responsive */
@media (max-width: 480px) {
  .container {
    padding: 0 1rem;
  }
}

@media (min-width: 481px) and (max-width: 768px) {
  .container {
    padding: 0 1.5rem;
  }
}

@media (min-width: 769px) {
  .container {
    padding: 0 2rem;
  }
}

/* Estilos para headers */
.page-header {
  background: white;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 2.5rem;
}

.page-header p {
  margin: 0;
  color: #666;
  font-size: 1.1rem;
}

/* Estilos para loading */
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  color: #666;
}

/* Estilos para mensajes de error */
.error {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

/* Estilos para mensajes de éxito */
.success {
  background: #d4edda;
  color: #155724;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

/* Capacitor específico */
@media (max-width: 480px) and (orientation: landscape) {
  .main-content {
    padding-top: 40px;
    min-height: calc(100vh - 40px);
  }
}

/* Touch optimizations */
@media (hover: none) and (pointer: coarse) {
  .btn {
    min-height: 48px;
  }
  
  .form-group input,
  .form-group select,
  .form-group textarea {
    min-height: 48px;
  }
}

/* Safe area para dispositivos con notch */
@supports (padding: max(0px)) {
  .main-content {
    padding-left: max(0px, env(safe-area-inset-left));
    padding-right: max(0px, env(safe-area-inset-right));
    padding-bottom: max(0px, env(safe-area-inset-bottom));
  }
}
</style>
