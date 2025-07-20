<template>
  <div class="notification-system">
    <!-- Notificaciones -->
    <div class="notifications-container">
      <TransitionGroup name="notification" tag="div" class="notifications-list">
        <div
          v-for="notification in notificationsStore.notifications"
          :key="notification.id"
          :class="['notification', `notification-${notification.type}`]"
          @click="removeNotification(notification.id)"
        >
          <div class="notification-icon">
            <span v-if="notification.type === 'success'">✅</span>
            <span v-else-if="notification.type === 'error'">❌</span>
            <span v-else-if="notification.type === 'warning'">⚠️</span>
            <span v-else-if="notification.type === 'info'">ℹ️</span>
          </div>
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
          </div>
          <button class="notification-close" @click.stop="removeNotification(notification.id)">
            ×
          </button>
        </div>
      </TransitionGroup>
    </div>

    <!-- Confirmaciones -->
    <div v-if="notificationsStore.confirmations.length > 0">
      <TransitionGroup name="confirmation" tag="div" class="confirmations-container">
        <div
          v-for="confirmation in notificationsStore.confirmations"
          :key="confirmation.id"
          class="confirmation-overlay"
          @click="handleConfirmationCancel(confirmation)"
        >
          <div class="confirmation-modal" @click.stop>
            <div class="confirmation-header">
              <h3>{{ confirmation.title }}</h3>
            </div>
            <div class="confirmation-body">
              <p>{{ confirmation.message }}</p>
            </div>
            <div class="confirmation-actions">
              <button 
                class="btn btn-secondary" 
                @click="handleConfirmationCancel(confirmation)"
              >
                Cancelar
              </button>
              <button 
                class="btn btn-primary" 
                @click="handleConfirmationConfirm(confirmation)"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNotificationsStore } from '@/stores/notifications';

const notificationsStore = useNotificationsStore();

const removeNotification = (id: string) => {
  notificationsStore.removeNotification(id);
};

const handleConfirmationConfirm = (confirmation: any) => {
  confirmation.onConfirm();
  notificationsStore.removeConfirmation(confirmation.id);
};

const handleConfirmationCancel = (confirmation: any) => {
  if (confirmation.onCancel) {
    confirmation.onCancel();
  }
  notificationsStore.removeConfirmation(confirmation.id);
};
</script>

<style scoped>
.notification-system {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 9999;
}

.notifications-container {
  position: fixed;
  top: 20px;
  right: 20px;
  pointer-events: none;
  z-index: 10000;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notification {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 300px;
  max-width: 400px;
  cursor: pointer;
  transition: all 0.3s ease;
  pointer-events: auto;
}

.notification:hover {
  transform: translateX(-5px);
}

.notification-success {
  background: #d4edda;
  border-left: 4px solid #28a745;
  color: #155724;
}

.notification-error {
  background: #f8d7da;
  border-left: 4px solid #dc3545;
  color: #721c24;
}

.notification-warning {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  color: #856404;
}

.notification-info {
  background: #d1ecf1;
  border-left: 4px solid #17a2b8;
  color: #0c5460;
}

.notification-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.notification-message {
  font-size: 13px;
  line-height: 1.4;
}

.notification-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.notification-close:hover {
  opacity: 1;
}

.confirmations-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10001;
}

.confirmation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  pointer-events: auto;
  z-index: 10002;
}

.confirmation-modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 100%;
  overflow: hidden;
}

.confirmation-header {
  padding: 20px 20px 0 20px;
}

.confirmation-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.confirmation-body {
  padding: 20px;
}

.confirmation-body p {
  margin: 0;
  color: #666;
  line-height: 1.5;
}

.confirmation-actions {
  display: flex;
  gap: 10px;
  padding: 0 20px 20px 20px;
  justify-content: flex-end;
}

.confirmation-actions .btn {
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-primary {
  background: var(--wa-green);
  color: white;
}

.btn-primary:hover {
  background: #1e7e34;
}

/* Animaciones */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.confirmation-enter-active,
.confirmation-leave-active {
  transition: all 0.3s ease;
}

.confirmation-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.confirmation-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

@media (max-width: 768px) {
  .notifications-container {
    top: 10px;
    right: 10px;
    left: 10px;
  }

  .notification {
    min-width: auto;
    max-width: none;
  }

  .confirmation-modal {
    margin: 20px;
  }
}
</style> 