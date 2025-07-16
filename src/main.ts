import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { setupUserNotifications, onMessageListener } from './services/notifications'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

// Configurar notificaciones cuando el usuario se autentique
// Esto se manejará en el store de autenticación
