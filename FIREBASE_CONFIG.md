# 🔥 Configuración de Firebase

## Pasos para configurar Firebase en tu app:

### 1. Crear proyecto en Firebase Console
1. Ve a https://console.firebase.google.com/
2. Crea un nuevo proyecto
3. Habilita Authentication y Firestore Database

### 2. Configurar Authentication
1. Ve a Authentication > Métodos de inicio de sesión
2. Habilita "Correo electrónico/contraseña"
3. Habilita "Google" (opcional)

### 3. Configurar Firestore Database
1. Ve a Firestore Database
2. Crea una base de datos en modo de prueba
3. Elige la ubicación más cercana

### 4. Obtener configuración
1. Ve a Configuración del proyecto (icono de engranaje)
2. En "Tus apps", haz clic en el icono web (</>)
3. Registra tu app y copia la configuración

### 5. Reemplazar en el código
En `src/config/firebase.ts`, reemplaza:

```typescript
const firebaseConfig = {
  apiKey: "TU_API_KEY_REAL",
  authDomain: "TU_PROJECT_ID.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROJECT_ID.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};
```

### 6. Configurar reglas de Firestore
En Firestore Database > Reglas, usa estas reglas básicas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## ✅ Una vez configurado:
- El registro guardará usuarios reales en Firebase
- El login funcionará con email/contraseña y Google
- Los perfiles se guardarán en Firestore
- Las fotos se subirán a ImageKit

## 🚨 Importante:
- Nunca subas las claves de Firebase a GitHub
- Usa variables de entorno en producción
- Configura las reglas de seguridad apropiadas 