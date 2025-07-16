// Configuraciones de la aplicación
export const APP_CONFIG = {
  name: 'DatingApp',
  version: '1.0.0',
  maxPhotos: 6,
  maxDistance: 1000, // km
  minAge: 18,
  maxAge: 100,
};

// Opciones para formularios
export const FORM_OPTIONS = {
  religions: [
    { value: 'catolica', label: 'Católica' },
    { value: 'protestante', label: 'Protestante' },
    { value: 'musulmana', label: 'Musulmana' },
    { value: 'judia', label: 'Judía' },
    { value: 'budista', label: 'Budista' },
    { value: 'hindu', label: 'Hindú' },
    { value: 'ateo', label: 'Ateo/Agnóstico' },
    { value: 'otro', label: 'Otro' },
  ],
  
  sexualOrientations: [
    { value: 'heterosexual', label: 'Heterosexual' },
    { value: 'homosexual', label: 'Homosexual' },
    { value: 'bisexual', label: 'Bisexual' },
    { value: 'pansexual', label: 'Pansexual' },
    { value: 'asexual', label: 'Asexual' },
  ],
  
  politicalOrientations: [
    { value: 'izquierda', label: 'Izquierda' },
    { value: 'centro-izquierda', label: 'Centro-izquierda' },
    { value: 'centro', label: 'Centro' },
    { value: 'centro-derecha', label: 'Centro-derecha' },
    { value: 'derecha', label: 'Derecha' },
    { value: 'apolitico', label: 'Apolítico' },
  ],
  
  relationshipTypes: [
    { value: 'seria', label: 'Relación seria' },
    { value: 'casual', label: 'Relación casual' },
    { value: 'amistad', label: 'Amistad' },
    { value: 'matrimonio', label: 'Matrimonio' },
    { value: 'poliamor', label: 'Poliamor' },
  ],
};

// Mensajes de la aplicación
export const MESSAGES = {
  errors: {
    required: 'Este campo es obligatorio',
    email: 'Por favor ingresa un email válido',
    minLength: 'Debe tener al menos {min} caracteres',
    maxLength: 'Debe tener máximo {max} caracteres',
    minAge: 'Debes ser mayor de edad',
    maxPhotos: `Máximo ${APP_CONFIG.maxPhotos} fotos`,
  },
  success: {
    profileUpdated: 'Perfil actualizado correctamente',
    photoUploaded: 'Foto subida correctamente',
    matchFound: '¡Nuevo match!',
  },
  info: {
    noProfiles: 'No se encontraron perfiles con los filtros actuales',
    loading: 'Cargando...',
    saving: 'Guardando...',
  },
};

// Configuración de la API (cuando se implemente)
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
}; 