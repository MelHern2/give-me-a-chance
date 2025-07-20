<template>
  <Teleport to="body">
    <TransitionGroup
      name="notification"
      tag="div"
      class="notification-container"
    >
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="[
          'notification',
          `notification-${notification.type}`,
          { 'notification-mobile': isMobile }
        ]"
        @click="removeNotification(notification.id)"
      >
        <div class="notification-icon">
          <span v-if="notification.type === 'success'">✅</span>
          <span v-else-if="notification.type === 'error'">❌</span>
          <span v-else-if="notification.type === 'warning'">⚠️</span>
          <span v-else-if="notification.type === 'info'">ℹ️</span>
        </div>
        <div class="notification-content">
          <h4 class="notification-title">{{ notification.title }}</h4>
          <p class="notification-message">{{ notification.message }}</p>
        </div>
        <button 
          class="notification-close"
          @click.stop="removeNotification(notification.id)"
        >
          ×
        </button>
        <div class="notification-progress" :style="{ width: notification.progress + '%' }"></div>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration: number;
  progress: number;
}

const notifications = ref<Notification[]>([]);
const isMobile = ref(false);

// Detectar si es móvil
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768 || 'ontouchstart' in window;
};

// Crear notificación
const showNotification = (type: Notification['type'], title: string, message: string, duration = 5000) => {
  const id = Date.now().toString();
  const notification: Notification = {
    id,
    type,
    title,
    message,
    duration,
    progress: 100
  };
  
  notifications.value.push(notification);
  
  // Auto-remover después del tiempo especificado
  if (duration > 0) {
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = duration - elapsed;
      
      if (remaining <= 0) {
        clearInterval(progressInterval);
        removeNotification(id);
      } else {
        const progress = (remaining / duration) * 100;
        const notificationIndex = notifications.value.findIndex(n => n.id === id);
        if (notificationIndex !== -1) {
          notifications.value[notificationIndex].progress = progress;
        }
      }
    }, 100);
  }
};

// Remover notificación
const removeNotification = (id: string) => {
  const index = notifications.value.findIndex(n => n.id === id);
  if (index !== -1) {
    notifications.value.splice(index, 1);
  }
};

// Métodos de conveniencia
const success = (title: string, message: string, duration?: number) => {
  showNotification('success', title, message, duration);
};

const error = (title: string, message: string, duration?: number) => {
  showNotification('error', title, message, duration);
};

const warning = (title: string, message: string, duration?: number) => {
  showNotification('warning', title, message, duration);
};

const info = (title: string, message: string, duration?: number) => {
  showNotification('info', title, message, duration);
};

// Exponer métodos globalmente
const notificationService = {
  show: showNotification,
  success,
  error,
  warning,
  info,
  remove: removeNotification
};

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
  (window as any).$notification = notificationService;
}

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});

// Exponer para uso en otros componentes
defineExpose({
  show: showNotification,
  success,
  error,
  warning,
  info,
  remove: removeNotification
});
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
  pointer-events: none;
}

.notification {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  pointer-events: auto;
  min-width: 300px;
  max-width: 400px;
}

.notification:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
}

.notification-icon {
  flex-shrink: 0;
  font-size: 1.2rem;
  margin-top: 2px;
}

.notification-content {
  flex-grow: 1;
  min-width: 0;
}

.notification-title {
  margin: 0 0 4px 0;
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.3;
}

.notification-message {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.4;
  opacity: 0.9;
}

.notification-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
  flex-shrink: 0;
}

.notification-close:hover {
  background: rgba(0, 0, 0, 0.1);
}

.notification-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: currentColor;
  opacity: 0.3;
  transition: width 0.1s linear;
}

/* Tipos de notificación */
.notification-success {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
}

.notification-error {
  background: linear-gradient(135deg, #f44336, #d32f2f);
  color: white;
}

.notification-warning {
  background: linear-gradient(135deg, #ff9800, #f57c00);
  color: white;
}

.notification-info {
  background: linear-gradient(135deg, #2196F3, #1976D2);
  color: white;
}

/* Animaciones */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

.notification-move {
  transition: transform 0.3s ease;
}

/* Responsive para móviles */
.notification-mobile {
  min-width: 280px;
  max-width: calc(100vw - 40px);
  margin: 0 10px;
}

@media (max-width: 768px) {
  .notification-container {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
  
  .notification {
    min-width: auto;
    max-width: none;
    width: 100%;
  }
  
  .notification-title {
    font-size: 0.9rem;
  }
  
  .notification-message {
    font-size: 0.8rem;
  }
}

/* Compatibilidad con Capacitor */
@media (hover: none) and (pointer: coarse) {
  .notification {
    min-height: 60px;
  }
  
  .notification-close {
    min-width: 32px;
    min-height: 32px;
  }
}
</style> 