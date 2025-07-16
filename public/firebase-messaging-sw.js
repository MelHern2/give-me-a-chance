// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD2T2kGXwpaz84mvKpxPZiVgnG8lNflBo0",
  authDomain: "dating-app-ca189.firebaseapp.com",
  projectId: "dating-app-ca189",
  storageBucket: "dating-app-ca189.firebasestorage.app",
  messagingSenderId: "814656156894",
  appId: "1:814656156894:web:ff33b8c01aef2848827e4f",
  measurementId: "G-W1CBF2KY97"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Obtener instancia de messaging
const messaging = firebase.messaging();

// Manejar mensajes en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Nuevo mensaje';
  const notificationOptions = {
    body: payload.notification?.body || 'Tienes un nuevo mensaje',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data || {},
    actions: [
      {
        action: 'open',
        title: 'Abrir'
      },
      {
        action: 'close',
        title: 'Cerrar'
      }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'open') {
    // Abrir la aplicación
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Manejar instalación del service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

// Manejar activación del service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(self.clients.claim());
}); 