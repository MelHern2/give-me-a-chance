import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import app from '@/config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

// Configuración del Service Worker para notificaciones
const messaging = getMessaging(app);

// Servicio de notificaciones
class NotificationService {
  private getNotificationService() {
    return (window as any).$notification;
  }

  success(title: string, message: string, duration?: number) {
    const service = this.getNotificationService();
    if (service) {
      service.success(title, message, duration);
    } else {
      // Fallback a alert si el servicio no está disponible
      alert(`${title}: ${message}`);
    }
  }

  error(title: string, message: string, duration?: number) {
    const service = this.getNotificationService();
    if (service) {
      service.error(title, message, duration);
    } else {
      // Fallback a alert si el servicio no está disponible
      alert(`Error: ${title} - ${message}`);
    }
  }

  warning(title: string, message: string, duration?: number) {
    const service = this.getNotificationService();
    if (service) {
      service.warning(title, message, duration);
    } else {
      // Fallback a alert si el servicio no está disponible
      alert(`Advertencia: ${title} - ${message}`);
    }
  }

  info(title: string, message: string, duration?: number) {
    const service = this.getNotificationService();
    if (service) {
      service.info(title, message, duration);
    } else {
      // Fallback a alert si el servicio no está disponible
      alert(`Info: ${title} - ${message}`);
    }
  }

  // Métodos de conveniencia para casos comunes
  profileUpdated() {
    this.success(
      'Perfil Actualizado',
      'Tu perfil se ha actualizado correctamente',
      3000
    );
  }

  photoUploaded() {
    this.success(
      'Foto Subida',
      'La foto se ha subido correctamente',
      3000
    );
  }

  photoUploadError() {
    this.error(
      'Error al Subir Foto',
      'No se pudo subir la foto. Inténtalo de nuevo.',
      5000
    );
  }

  photoRemoved() {
    this.info(
      'Foto Eliminada',
      'La foto se ha eliminado correctamente',
      3000
    );
  }

  googlePhotoRemoved() {
    this.warning(
      'Foto de Google Eliminada',
      'Has eliminado tu foto de Google. Esta acción no se puede deshacer.',
      5000
    );
  }

  matchCreated() {
    this.success(
      '¡Match!',
      '¡Tienes un nuevo match!',
      5000
    );
  }

  likeSent() {
    this.info(
      'Like Enviado',
      'Tu like se ha enviado correctamente',
      3000
    );
  }

  verificationSuccess() {
    this.success(
      'Verificación Exitosa',
      'Tu perfil ha sido verificado correctamente',
      5000
    );
  }

  verificationError() {
    this.error(
      'Error de Verificación',
      'No se pudo completar la verificación. Inténtalo de nuevo.',
      5000
    );
  }

  networkError() {
    this.error(
      'Error de Conexión',
      'No se pudo conectar con el servidor. Verifica tu conexión.',
      5000
    );
  }

  genericError(message: string) {
    this.error(
      'Error',
      message,
      5000
    );
  }

  genericSuccess(message: string) {
    this.success(
      'Éxito',
      message,
      3000
    );
  }
}

// Instancia global del servicio
export const notificationService = new NotificationService();

// Función helper para uso directo
export const notify = {
  success: (title: string, message: string, duration?: number) => 
    notificationService.success(title, message, duration),
  error: (title: string, message: string, duration?: number) => 
    notificationService.error(title, message, duration),
  warning: (title: string, message: string, duration?: number) => 
    notificationService.warning(title, message, duration),
  info: (title: string, message: string, duration?: number) => 
    notificationService.info(title, message, duration),
  profileUpdated: () => notificationService.profileUpdated(),
  photoUploaded: () => notificationService.photoUploaded(),
  photoUploadError: () => notificationService.photoUploadError(),
  photoRemoved: () => notificationService.photoRemoved(),
  googlePhotoRemoved: () => notificationService.googlePhotoRemoved(),
  matchCreated: () => notificationService.matchCreated(),
  likeSent: () => notificationService.likeSent(),
  verificationSuccess: () => notificationService.verificationSuccess(),
  verificationError: () => notificationService.verificationError(),
  networkError: () => notificationService.networkError(),
  genericError: (message: string) => notificationService.genericError(message),
  genericSuccess: (message: string) => notificationService.genericSuccess(message),
};

// Solicitar permisos y obtener token
export const requestNotificationPermission = async (userId: string): Promise<string | null> => {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: 'YOUR_VAPID_KEY' // Reemplazar con tu VAPID key
      });
      
      if (token) {
        // Guardar el token en Firestore
        await setDoc(doc(db, 'userTokens', userId), {
          token,
          userId,
          createdAt: new Date(),
          platform: 'web'
        });
        
        return token;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

// Escuchar mensajes cuando la app está en primer plano
export const onMessageListener = () => {
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('Message received:', payload);
      
      // Mostrar notificación local
      if (Notification.permission === 'granted') {
        new Notification(payload.notification?.title || 'Nuevo mensaje', {
          body: payload.notification?.body,
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        });
      }
      
      resolve(payload);
    });
  });
};

// Obtener token de un usuario
export const getUserToken = async (userId: string): Promise<string | null> => {
  try {
    const tokenDoc = await getDoc(doc(db, 'userTokens', userId));
    return tokenDoc.exists() ? tokenDoc.data()?.token : null;
  } catch (error) {
    console.error('Error getting user token:', error);
    return null;
  }
};

// Enviar notificación push (desde el servidor)
export const sendPushNotification = async (
  userId: string, 
  title: string, 
  body: string, 
  data?: any
): Promise<void> => {
  try {
    const token = await getUserToken(userId);
    
    if (token) {
      // En un entorno real, esto se haría desde el servidor
      // Por ahora, solo simulamos el envío
      console.log('Sending push notification to:', userId);
      console.log('Title:', title);
      console.log('Body:', body);
      console.log('Data:', data);
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

// Notificar nuevo mensaje
export const notifyNewMessage = async (
  recipientId: string, 
  senderName: string, 
  messagePreview: string
): Promise<void> => {
  await sendPushNotification(
    recipientId,
    `Nuevo mensaje de ${senderName}`,
    messagePreview,
    { type: 'new_message' }
  );
};

// Notificar nuevo match
export const notifyNewMatch = async (
  userId: string, 
  matchName: string
): Promise<void> => {
  await sendPushNotification(
    userId,
    '¡Nuevo match!',
    `Has hecho match con ${matchName}`,
    { type: 'new_match' }
  );
};

// Notificar nuevo like
export const notifyNewLike = async (
  userId: string, 
  likerName: string
): Promise<void> => {
  await sendPushNotification(
    userId,
    '¡Nuevo like!',
    `${likerName} te ha dado like`,
    { type: 'new_like' }
  );
};

// Configurar notificaciones para un usuario
export const setupUserNotifications = async (userId: string): Promise<void> => {
  try {
    // Solicitar permisos y obtener token
    const token = await requestNotificationPermission(userId);
    
    if (token) {
      console.log('Notifications setup successful for user:', userId);
    } else {
      console.log('User declined notification permissions');
    }
  } catch (error) {
    console.error('Error setting up notifications:', error);
  }
}; 