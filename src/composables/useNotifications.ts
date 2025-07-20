import { notify } from '@/services/notifications';

export const useNotifications = () => {
  return {
    success: notify.success,
    error: notify.error,
    warning: notify.warning,
    info: notify.info
  };
}; 