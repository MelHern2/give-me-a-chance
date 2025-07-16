import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

export class PushNotificationService {
  private static instance: PushNotificationService;

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications solo disponibles en dispositivos nativos');
      return false;
    }

    try {
      const result = await PushNotifications.requestPermissions();
      return result.receive === 'granted';
    } catch (error) {
      console.error('Error solicitando permisos de notificaciones:', error);
      return false;
    }
  }

  async registerForPushNotifications(): Promise<string | null> {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    try {
      // Registrar para recibir notificaciones
      await PushNotifications.register();

      // Escuchar cuando se registra exitosamente
      PushNotifications.addListener('registration', (token) => {
        console.log('Token FCM obtenido:', token.value);
        this.saveTokenToUser(token.value);
      });

      // Escuchar errores de registro
      PushNotifications.addListener('registrationError', (error) => {
        console.error('Error registrando para notificaciones:', error);
      });

      // Escuchar notificaciones recibidas cuando la app está en primer plano
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Notificación recibida en primer plano:', notification);
        this.handleNotificationReceived(notification);
      });

      // Escuchar cuando se hace clic en una notificación
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Acción de notificación realizada:', notification);
        this.handleNotificationAction(notification);
      });

      return 'registered';
    } catch (error) {
      console.error('Error configurando notificaciones push:', error);
      return null;
    }
  }

  private async saveTokenToUser(token: string): Promise<void> {
    try {
      // Importar aquí para evitar error de contexto de Pinia
      const { useAuthStore } = await import('@/stores/auth');
      const authStore = useAuthStore();
      const user = authStore.user;
      if (user) {
        // Guardar el token en Firestore asociado al usuario
        console.log('Token guardado para usuario:', user.id);
        await updateDoc(doc(db, 'users', user.id), {
          fcmToken: token,
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error guardando token FCM:', error);
    }
  }

  private handleNotificationReceived(notification: any): void {
    // Mostrar notificación local o actualizar UI
    console.log('Notificación recibida:', notification);
    // Aquí puedes mostrar un toast o actualizar el estado de la app
  }

  private handleNotificationAction(notification: any): void {
    // Manejar cuando el usuario hace clic en la notificación
    console.log('Acción de notificación:', notification);
    // Aquí puedes navegar a la pantalla correspondiente
  }

  async sendLocalNotification(title: string, body: string, data?: any): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    try {
      // Para notificaciones locales, usar la API del navegador o mostrar un toast
      console.log('Notificación local:', { title, body, data });
    } catch (error) {
      console.error('Error enviando notificación local:', error);
    }
  }
}

export const pushNotificationService = PushNotificationService.getInstance(); 