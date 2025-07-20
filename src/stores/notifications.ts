import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  show: boolean;
}

export interface Confirmation {
  id: string;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  show: boolean;
}

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([]);
  const confirmations = ref<Confirmation[]>([]);

  const showNotification = (type: Notification['type'], title: string, message: string, duration = 5000) => {
    const id = Date.now().toString();
    const notification: Notification = {
      id,
      type,
      title,
      message,
      duration,
      show: true
    };

    notifications.value.push(notification);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  };

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index > -1) {
      notifications.value.splice(index, 1);
    }
  };

  const showConfirmation = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    const id = Date.now().toString();
    const confirmation: Confirmation = {
      id,
      title,
      message,
      onConfirm,
      onCancel,
      show: true
    };

    confirmations.value.push(confirmation);
    return id;
  };

  const removeConfirmation = (id: string) => {
    const index = confirmations.value.findIndex(c => c.id === id);
    if (index > -1) {
      confirmations.value.splice(index, 1);
    }
  };

  // Convenience methods
  const success = (title: string, message: string, duration?: number) => {
    return showNotification('success', title, message, duration);
  };

  const error = (title: string, message: string, duration?: number) => {
    return showNotification('error', title, message, duration);
  };

  const warning = (title: string, message: string, duration?: number) => {
    return showNotification('warning', title, message, duration);
  };

  const info = (title: string, message: string, duration?: number) => {
    return showNotification('info', title, message, duration);
  };

  const confirm = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    return showConfirmation(title, message, onConfirm, onCancel);
  };

  return {
    notifications,
    confirmations,
    showNotification,
    removeNotification,
    showConfirmation,
    removeConfirmation,
    success,
    error,
    warning,
    info,
    confirm
  };
}); 