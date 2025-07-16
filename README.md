# DatingApp

Una aplicación de citas moderna construida con Vue 3, TypeScript y Capacitor para soporte móvil.

## Características

- ✅ Registro de usuarios con información completa
- ✅ Subida de fotos
- ✅ Filtros por distancia, edad, orientación sexual, etc.
- ✅ Interfaz responsive y moderna
- ✅ Soporte para aplicación móvil (Android/iOS)
- ✅ Gestión de estado con Pinia
- ✅ TypeScript para type safety

## Campos del Perfil

- Nombre y edad
- Ciudad
- Religión
- Monogamia (Sí/No)
- Orientación sexual
- Orientación política
- Hijos (Sí/No)
- Tipo de relación buscada
- Descripción personal
- Fotos (máximo 6)

## Instalación

```bash
# Instalar dependencias
npm install

# Instalar dependencias adicionales para móvil
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios @capacitor/camera @capacitor/geolocation @capacitor/storage @ionic/vue @ionic/vue-router firebase @vueuse/core @vueuse/geolocation --legacy-peer-deps

# Inicializar Capacitor
npx cap init

# Construir el proyecto
npm run build

# Agregar plataformas móviles
npx cap add android
npx cap add ios

# Sincronizar con plataformas móviles
npx cap sync
```

## Desarrollo

```bash
# Servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Abrir en Android Studio
npx cap open android

# Abrir en Xcode (macOS)
npx cap open ios
```

## Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── RegisterForm.vue
│   └── ProfileList.vue
├── stores/             # Stores de Pinia
│   ├── auth.ts
│   └── profiles.ts
├── types/              # Tipos TypeScript
│   └── index.ts
├── views/              # Páginas
│   ├── HomeView.vue
│   ├── ProfilesView.vue
│   ├── RegisterView.vue
│   ├── LoginView.vue
│   ├── MatchesView.vue
│   └── ProfileView.vue
└── router/             # Configuración de rutas
    └── index.ts
```

## Funcionalidades Implementadas

### Autenticación
- Registro de usuarios con validación
- Login con persistencia local
- Logout

### Perfiles
- Lista de perfiles con filtros
- Cálculo de distancia entre usuarios
- Filtros por:
  - Distancia máxima
  - Rango de edad
  - Orientación sexual
  - Tipo de relación
  - Hijos
  - Monogamia

### Interfaz
- Diseño responsive
- Navegación intuitiva
- Componentes reutilizables
- Estilos modernos con CSS

## Próximos Pasos

1. **Integración con Firebase**
   - Autenticación real
   - Base de datos Firestore
   - Storage para fotos

2. **Funcionalidades de Chat**
   - Mensajería en tiempo real
   - Notificaciones push

3. **Mejoras Móviles**
   - Geolocalización en tiempo real
   - Cámara nativa para fotos
   - Push notifications

4. **Algoritmo de Matching**
   - Sistema de likes/dislikes
   - Algoritmo de compatibilidad
   - Recomendaciones personalizadas

## Tecnologías Utilizadas

- **Frontend**: Vue 3, TypeScript, Pinia
- **Estilos**: CSS3, Flexbox, Grid
- **Móvil**: Capacitor, Ionic
- **Backend**: Firebase (pendiente)
- **Herramientas**: Vite, ESLint, Prettier

## Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Construir para producción
npm run preview      # Vista previa de producción
npm run format       # Formatear código
npm run lint         # Linting
```

## Configuración de Firebase (Pendiente)

1. Crear proyecto en Firebase Console
2. Habilitar Authentication y Firestore
3. Configurar Storage para fotos
4. Agregar configuración en el proyecto

## Licencia

MIT
