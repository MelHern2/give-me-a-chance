# 🚀 Cómo Usar DatingApp

## ✅ La aplicación está funcionando correctamente

El servidor de desarrollo está ejecutándose en:
- **Local**: http://localhost:5173/
- **Red**: http://192.168.1.44:5173/

## 📱 Funcionalidades Disponibles

### 1. **Página Principal** (`/`)
- Pantalla de bienvenida
- Navegación a todas las secciones
- Dashboard si estás autenticado

### 2. **Registro** (`/register`)
- Formulario completo con todos los campos:
  - ✅ Email y contraseña
  - ✅ Nombre y edad
  - ✅ Ciudad
  - ✅ Religión (8 opciones)
  - ✅ Monogamia (Sí/No)
  - ✅ Orientación sexual (5 opciones)
  - ✅ Orientación política (6 opciones)
  - ✅ Hijos (Sí/No)
  - ✅ Tipo de relación buscada (5 opciones)
  - ✅ Descripción personal
  - ✅ Subida de fotos (máximo 6)

### 3. **Login** (`/login`)
- Autenticación con email y contraseña
- Persistencia de sesión

### 4. **Explorar Perfiles** (`/profiles`)
- Lista de perfiles con filtros avanzados:
  - ✅ **Filtro por distancia en km** (con cálculo real)
  - ✅ Rango de edad
  - ✅ Orientación sexual
  - ✅ Tipo de relación
  - ✅ Hijos
  - ✅ Monogamia

### 5. **Mis Matches** (`/matches`)
- Lista de personas con las que has hecho match
- Funcionalidad de mensajería (pendiente)

### 6. **Mi Perfil** (`/profile`)
- Ver y editar tu información personal
- Gestión de fotos

## 🎯 Cómo Probar la Aplicación

### Paso 1: Registrarse
1. Ve a http://localhost:5173/
2. Haz clic en "Registrarse"
3. Completa el formulario con tus datos
4. Sube algunas fotos
5. Haz clic en "Registrarse"

### Paso 2: Explorar Perfiles
1. Ve a "Perfiles" en el menú
2. Usa los filtros para encontrar personas:
   - Ajusta la distancia máxima
   - Selecciona rango de edad
   - Filtra por orientación sexual
   - Elige tipo de relación
3. Haz clic en cualquier perfil para ver más detalles

### Paso 3: Ver tu Perfil
1. Ve a "Mi Perfil" en el menú
2. Revisa toda tu información
3. Edita lo que necesites

## 📱 Versión Móvil

Para crear la aplicación móvil:

```bash
# Construir para producción
npm run build

# Agregar plataforma Android
npx cap add android

# Sincronizar cambios
npx cap sync

# Abrir en Android Studio
npx cap open android
```

## 🔧 Comandos Útiles

```bash
# Servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Vista previa de producción
npm run preview

# Formatear código
npm run format

# Linting
npm run lint
```

## 🎨 Características del Diseño

- ✅ **Responsive**: Funciona en móvil, tablet y desktop
- ✅ **Moderno**: Diseño actual con gradientes y sombras
- ✅ **Intuitivo**: Navegación clara y fácil de usar
- ✅ **Accesible**: Contraste adecuado y estructura semántica

## 🚀 Próximos Pasos

1. **Integrar Firebase** para autenticación real
2. **Implementar sistema de likes/matches**
3. **Agregar chat en tiempo real**
4. **Configurar notificaciones push**
5. **Mejorar algoritmo de matching**

## 🐛 Si hay problemas

1. **Reinicia el servidor**: `Ctrl+C` y luego `npm run dev`
2. **Limpia la caché**: `npm cache clean --force`
3. **Reinstala dependencias**: `npm install`

¡La aplicación está lista para usar! 🎉 