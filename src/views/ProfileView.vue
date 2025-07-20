<template>
  <div class="profile-view">
    <header class="page-header">
      <h1>{{ isAdmin && !isOwnProfile ? 'Perfil de Usuario' : 'Mi Perfil' }}</h1>
      <p>{{ isAdmin && !isOwnProfile ? 'Gestiona el perfil del usuario' : 'Gestiona y actualiza tu información personal' }}</p>
    </header>

    <div class="profile-container card">
      <!-- Modo Visualización -->
      <div v-if="!editMode" class="profile-display">
        <div class="profile-header">
          <div class="profile-photos">
            <div v-if="displayPhotos.length > 0" class="photo-gallery">
              <div v-for="(photo, index) in displayPhotos" :key="index" class="photo-item">
                <img :src="photo" :alt="`Foto ${index + 1}`" @error="e => e.target.src = '/default-avatar.svg'" />
              </div>
            </div>
            <div v-else class="no-photos">
              <p>No hay fotos disponibles</p>
            </div>
          </div>
          
          <div class="profile-info">
            <h1>{{ user.name }}, {{ user.age }}</h1>
            <p class="location">{{ user.city }}</p>
            
            <!-- Estado de verificación -->
            <div class="verification-status">
              <div v-if="user.isSuperVerified" class="verification-badge super-verified">
                <span class="badge-icon">✓✓</span>
                <span class="badge-text">Super Verificado</span>
              </div>
              <div v-else-if="user.isVerified" class="verification-badge verified">
                <span class="badge-icon">✓</span>
                <span class="badge-text">Verificado</span>
              </div>
              <div v-else class="verification-badge unverified">
                <span class="badge-icon">?</span>
                <span class="badge-text">No Verificado</span>
              </div>
            </div>
            
            <p v-if="user.bio" class="bio">{{ user.bio }}</p>
          </div>
        </div>

        <div class="profile-details">
          <div class="detail-section">
            <h3>Información Personal</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="label">Género:</span>
                <span class="value">{{ user?.gender || 'No especificado' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">País:</span>
                <span class="value">{{ user?.country || 'No especificado' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Región:</span>
                <span class="value">{{ user?.region || 'No especificado' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Religión:</span>
                <span class="value">{{ user?.religion || 'No especificado' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Orientación Sexual:</span>
                <span class="value">{{ user?.sexualOrientation || 'No especificado' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Orientación Política:</span>
                <span class="value">{{ user?.politicalOrientation || 'No especificado' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Tipo de Relación:</span>
                <span class="value">{{ user?.relationshipType || 'No especificado' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Monógamo:</span>
                <span class="value">{{ user?.isMonogamous ? 'Sí' : 'No' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Tiene Hijos:</span>
                <span class="value">{{ user?.hasChildren ? 'Sí' : 'No' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="profile-actions">
          <button v-if="!isAdmin || isOwnProfile" @click="toggleEditMode" class="btn">
            Editar Perfil
          </button>
          
          <!-- Botón de verificación -->
          <button 
            v-if="isOwnProfile && !user?.isVerified" 
            @click="goToVerification" 
            class="btn btn-verify"
          >
            <span class="verify-icon">🔒</span> Verificar Perfil
          </button>
          <div v-if="!isOwnProfile" class="verify-info-message" style="margin: 1rem 0; color: #888; font-size: 0.95rem;">
            La verificación facial solo está disponible para tu propio perfil.
          </div>
          
          <!-- Indicador de perfil verificado -->
          <div v-if="user?.isVerified" class="verified-badge">
            <span class="verified-icon">✔</span> Perfil Verificado
          </div>
          
          <!-- Botón de compartir -->
          <button @click="shareProfile" class="btn btn-share">
            <span class="share-icon">🔗</span> Compartir Perfil
          </button>
          
          <!-- Botones de administrador -->
          <div v-if="isAdmin && !isOwnProfile" class="admin-actions">
            <button @click="forceMatch" :disabled="forceMatchLoading" class="btn btn-warning">
              {{ forceMatchLoading ? 'Creando Match...' : 'Forzar Match' }}
            </button>
            <button @click="toggleEditMode" class="btn">
              Editar Perfil
            </button>
          </div>
        </div>
      </div>

      <!-- Modo Edición -->
      <div v-else class="profile-edit">
        <form @submit.prevent="saveProfile" class="form">
          <div class="form-group">
            <label for="name">Nombre *</label>
            <input 
              id="name" 
              type="text" 
              v-model="editForm.name" 
              required
            />
          </div>

          <div class="form-group">
            <label for="age">Edad *</label>
            <input 
              id="age" 
              type="number" 
              v-model="editForm.age" 
              min="18" 
              max="100" 
              required
            />
          </div>

          <div class="form-group">
            <label for="gender">Género</label>
            <select id="gender" v-model="editForm.gender">
              <option value="">Seleccionar género</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="no-binario">No binario</option>
              <option value="otro">Otro</option>
              <option value="prefiero-no-decirlo">Prefiero no decirlo</option>
            </select>
          </div>

          <div class="form-group">
            <label for="country">País</label>
            <select id="country" v-model="editForm.country" @change="handleCountryChange">
              <option value="">Seleccionar país</option>
              <option v-for="country in availableCountries" :key="country" :value="country">
                {{ country }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="region">Región/Estado</label>
            <select id="region" v-model="editForm.region" @change="handleRegionChange">
              <option value="">Seleccionar región</option>
              <option v-for="region in availableRegions" :key="region" :value="region">
                {{ region }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="city">Ciudad *</label>
            <AutocompleteInput
              v-model="editForm.city"
              :suggestions="citySuggestions"
              placeholder="Buscar ciudad..."
              required
            />
          </div>

          <div class="form-group">
            <label for="religion">Religión</label>
            <select id="religion" v-model="editForm.religion">
              <option value="">Seleccionar religión</option>
              <option value="cristianismo">Cristianismo</option>
              <option value="catolicismo">Catolicismo</option>
              <option value="protestantismo">Protestantismo</option>
              <option value="islam">Islam</option>
              <option value="judaismo">Judaísmo</option>
              <option value="hinduismo">Hinduismo</option>
              <option value="budismo">Budismo</option>
              <option value="ateismo">Ateísmo</option>
              <option value="agnosticismo">Agnosticismo</option>
              <option value="otro">Otro</option>
              <option value="prefiero-no-decirlo">Prefiero no decirlo</option>
            </select>
          </div>

          <div class="form-group">
            <label for="sexualOrientation">Orientación Sexual</label>
            <select id="sexualOrientation" v-model="editForm.sexualOrientation">
              <option value="">Seleccionar orientación</option>
              <option value="heterosexual">Heterosexual</option>
              <option value="homosexual">Homosexual</option>
              <option value="bisexual">Bisexual</option>
              <option value="pansexual">Pansexual</option>
              <option value="asexual">Asexual</option>
              <option value="otro">Otro</option>
              <option value="prefiero-no-decirlo">Prefiero no decirlo</option>
            </select>
          </div>

          <div class="form-group">
            <label for="politicalOrientation">Orientación Política</label>
            <select id="politicalOrientation" v-model="editForm.politicalOrientation">
              <option value="">Seleccionar orientación</option>
              <option value="izquierda">Izquierda</option>
              <option value="centro-izquierda">Centro-izquierda</option>
              <option value="centro">Centro</option>
              <option value="centro-derecha">Centro-derecha</option>
              <option value="derecha">Derecha</option>
              <option value="apolitico">Apolítico</option>
              <option value="otro">Otro</option>
              <option value="prefiero-no-decirlo">Prefiero no decirlo</option>
            </select>
          </div>

          <div class="form-group">
            <label for="relationshipType">Tipo de Relación</label>
            <select id="relationshipType" v-model="editForm.relationshipType">
              <option value="">Seleccionar tipo</option>
              <option value="seria">Relación seria</option>
              <option value="casual">Relación casual</option>
              <option value="amistad">Amistad</option>
              <option value="matrimonio">Matrimonio</option>
              <option value="poliamor">Poliamor</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div class="form-group checkbox-group">
            <label class="wa-checkbox-label">
              <input type="checkbox" v-model="editForm.isMonogamous" class="wa-checkbox" />
              <span class="wa-custom-checkbox"></span>
              Monógamo
            </label>
          </div>
          <div class="form-group checkbox-group">
            <label class="wa-checkbox-label">
              <input type="checkbox" v-model="editForm.hasChildren" class="wa-checkbox" />
              <span class="wa-custom-checkbox"></span>
              Tiene hijos
            </label>
          </div>

          <div class="form-group">
            <label for="description">Descripción *</label>
            <textarea 
              id="description" 
              v-model="editForm.description"
              rows="4"
              placeholder="Cuéntanos sobre ti..."
              required
            ></textarea>
          </div>

          <div class="form-group">
            <label>Fotos (máximo 6)</label>
            
            <!-- Sistema de Drag & Drop para reordenar fotos -->
            <div class="photo-drag-container">
              <draggable 
                v-model="editablePhotos" 
                class="photo-grid"
                :animation="200"
                ghost-class="photo-ghost"
                chosen-class="photo-chosen"
                drag-class="photo-drag"
                @start="onDragStart"
                @end="onDragEnd"
              >
                <template #item="{ element: photo, index }">
                  <div class="photo-item draggable-photo">
                    <div class="photo-number">{{ index + 1 }}</div>
                    <img 
                      :src="photo" 
                      :alt="`Foto ${index + 1}`" 
                      @error="e => e.target.src = '/default-avatar.svg'" 
                    />
                <button 
                  type="button" 
                  @click="removePhoto(index)" 
                  class="remove-btn"
                >
                  ×
                </button>
                    <div class="drag-handle">
                      <span class="drag-icon">⋮⋮</span>
              </div>
            </div>
                </template>
              </draggable>
              
              <!-- Mensaje cuando no hay fotos -->
              <div v-if="editablePhotos.length === 0" class="no-photos-message">
                <div class="upload-placeholder">
                  <span class="upload-icon">📷</span>
                  <p>No hay fotos. Sube tu primera foto para comenzar.</p>
                </div>
              </div>
            </div>
            
            <!-- Input para subir fotos -->
            <div class="upload-section">
            <input 
              v-if="editablePhotos.length < 6"
              type="file" 
              @change="handlePhotoUpload" 
              accept="image/*" 
              multiple
              class="file-input"
              id="photo-upload"
            />
            <label 
              v-if="editablePhotos.length < 6"
              for="photo-upload" 
              class="upload-btn"
            >
                <span class="upload-icon">📤</span>
                Agregar Fotos
              </label>
              <p v-else class="photo-limit-message">
                ✅ Máximo de 6 fotos alcanzado
              </p>
            </div>
            
            <div class="photo-instructions">
              <p class="instruction-text">
                <strong>💡 Instrucciones:</strong>
              </p>
              <ul class="instruction-list">
                <li>🖱️ <strong>Arrastra</strong> las fotos para cambiar su orden</li>
                <li>📷 La <strong>primera foto</strong> será tu foto principal</li>
                <li>❌ Toca la <strong>X</strong> para eliminar una foto</li>
                <li>📱 <strong>Compatible</strong> con móviles (touch & drag)</li>
              </ul>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" :disabled="saving" class="btn btn-primary">
              {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
            <button type="button" @click="toggleEditMode" class="btn btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { uploadImageToImageKit } from '@/services/imagekit';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { createMatch } from '@/services/matches';
import { useRoute, useRouter } from 'vue-router';
import { getCountries, getRegions, getCitiesByCountry, searchCities } from '@/utils/location';
import AutocompleteInput from '@/components/AutocompleteInput.vue';
import draggable from 'vuedraggable';
import { notify } from '@/services/notifications';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const editMode = ref(false);
const saving = ref(false);
const isAdmin = authStore.user?.isAdmin;
const profileUserId = route.query.id as string || authStore.user?.id || '';

const user = computed(() => authStore.user);
const isOwnProfile = computed(() => !route.query.id || route.query.id === authStore.user?.id);

// Función para recargar datos del usuario desde Firestore
const reloadUserData = async () => {
  if (!authStore.user?.id) return;
  
  try {
    const userRef = doc(db, 'users', authStore.user.id);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const updatedUser = {
        id: userDoc.id,
        ...userData
      } as any;
      
      authStore.setUser(updatedUser);
      console.log('✅ Datos del usuario recargados desde Firestore');
    }
  } catch (error) {
    console.error('Error recargando datos del usuario:', error);
  }
};

// Recargar datos cuando se monta el componente
onMounted(() => {
  if (isOwnProfile.value) {
    reloadUserData();
  }
});

// Computed que combina las fotos subidas con la foto de Google para visualización
const displayPhotos = computed(() => {
  if (!user.value) return [];
  const photos = [...user.value.photos];
  // Si hay photoURL y no está en las fotos, agregarla al inicio
  if (user.value.photoURL && !photos.includes(user.value.photoURL)) {
    photos.unshift(user.value.photoURL);
  }
  // Si no hay fotos y sí photoURL, mostrar solo photoURL
  if (photos.length === 0 && user.value.photoURL) {
    return [user.value.photoURL];
  }
  return photos;
});

// En la previsualización de edición, incluir la foto de Google si existe
const editPreviewPhotos = computed(() => {
  if (!user.value) return [];
  
  // Combinar fotos subidas con foto de Google
  const allPhotos = [...editForm.photos];
  
  // Si hay photoURL y no está en las fotos subidas, agregarla al inicio
  if (user.value.photoURL && !allPhotos.includes(user.value.photoURL)) {
    allPhotos.unshift(user.value.photoURL);
  }
  
  return allPhotos;
});

const editForm = reactive({
  name: '',
  age: 18,
  gender: '',
  country: '',
  region: '',
  city: '',
  religion: '',
  isMonogamous: true,
  sexualOrientation: '',
  politicalOrientation: '',
  hasChildren: false,
  relationshipType: '',
  description: '',
  photos: [] as string[],
});

// Array reactivo para las fotos editables (incluyendo foto de Google)
const editablePhotos = ref<string[]>([]);

// Estados reactivos para las opciones de ubicación
const availableCountries = ref(getCountries());
const availableRegions = ref<string[]>([]);

// Computed para las sugerencias de ciudades
const citySuggestions = computed(() => {
  return searchCities(editForm.city, editForm.country);
});

// Computed para el valor de la ciudad en modo visualización
const displayCity = computed(() => {
  return user.value?.city || '';
});

const toggleEditMode = () => {
  if (editMode.value) {
    // Cancelar edición
    editMode.value = false;
  } else {
    // Iniciar edición - cargar datos actuales
    if (user.value) {
      // Incluir todas las fotos, incluyendo la de Google
      const allPhotos = [...user.value.photos];
      
      // Si hay photoURL y no está en las fotos, agregarla al inicio
      if (user.value.photoURL && !allPhotos.includes(user.value.photoURL)) {
        allPhotos.unshift(user.value.photoURL);
      }
      
      // Inicializar editablePhotos con todas las fotos
      editablePhotos.value = [...allPhotos];
      
      Object.assign(editForm, {
        name: user.value.name,
        age: user.value.age,
        gender: user.value.gender || '',
        country: user.value.country || '',
        region: user.value.region || '',
        city: user.value.city || '',
        religion: user.value.religion,
        isMonogamous: user.value.isMonogamous,
        sexualOrientation: user.value.sexualOrientation,
        politicalOrientation: user.value.politicalOrientation,
        hasChildren: user.value.hasChildren,
        relationshipType: user.value.relationshipType,
        description: user.value.description,
        photos: allPhotos, // Incluir todas las fotos, incluyendo la de Google
      });
      
      // Cargar las opciones de ubicación basadas en los datos actuales
      if (user.value.country) {
        availableRegions.value = getRegions(user.value.country);
      }
    }
    editMode.value = true;
  }
};

const handlePhotoUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  
  if (!files || files.length === 0) {
    console.log('❌ No se seleccionaron archivos');
    return;
  }
  
  console.log(`📤 Iniciando subida de ${files.length} archivo(s)...`);
  
    for (const file of Array.from(files)) {
    if (editablePhotos.value.length >= 6) {
      console.log('⚠️ Límite de 6 fotos alcanzado');
      notify.error('Límite de Fotos', 'Ya tienes el máximo de 6 fotos. Elimina una antes de agregar más.');
      break;
    }
    
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      console.log('❌ Archivo no es una imagen:', file.name);
      notify.error('Archivo Inválido', `El archivo "${file.name}" no es una imagen válida.`);
      continue;
    }
    
    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.log('❌ Archivo demasiado grande:', file.name, file.size);
      notify.error('Archivo Demasiado Grande', `El archivo "${file.name}" es demasiado grande. Máximo 5MB.`);
      continue;
    }
    
    try {
      console.log('📁 Subiendo archivo:', file.name);
        const imageUrl = await uploadImageToImageKit(file);
      editablePhotos.value.push(imageUrl);
      console.log('✅ Foto subida exitosamente:', imageUrl);
      notify.photoUploaded();
      } catch (error) {
      console.error('❌ Error subiendo foto:', file.name, error);
      notify.photoUploadError();
      }
    }
  
  // Limpiar el input para permitir subir el mismo archivo de nuevo
  target.value = '';
};

const removePhoto = (index: number) => {
  // Obtener la foto que se va a eliminar
  const photoToRemove = editablePhotos.value[index];
  
  // Si es la foto de Google, mostrar advertencia
  if (photoToRemove === user.value?.photoURL) {
    if (confirm('¿Estás seguro de que quieres eliminar tu foto de Google? Esta acción no se puede deshacer.')) {
      editablePhotos.value.splice(index, 1);
      notify.googlePhotoRemoved();
    }
  } else {
    // Eliminar foto subida normalmente
    editablePhotos.value.splice(index, 1);
    notify.photoRemoved();
  }
};

// Funciones para manejar los cambios de ubicación
const handleCountryChange = () => {
  editForm.region = '';
  editForm.city = '';
  availableRegions.value = getRegions(editForm.country);
};

const handleRegionChange = () => {
  editForm.city = '';
};

// Al guardar el perfil, manejar correctamente la foto de Google
const saveProfile = async () => {
  if (!user.value) return;
  saving.value = true;
  try {
    // Separar fotos subidas de la foto de Google
    const googlePhoto = user.value.photoURL;
    const uploadedPhotos = editablePhotos.value.filter(photo => photo !== googlePhoto);
    
    // Si no hay fotos subidas pero sí hay foto de Google, usar solo la de Google
    let photosToSave = uploadedPhotos;
    if (uploadedPhotos.length === 0 && googlePhoto) {
      photosToSave = [googlePhoto];
    } else if (uploadedPhotos.length === 0 && !googlePhoto) {
      notify.error('Foto Requerida', 'Por favor sube al menos una foto');
      return;
    }
    
    // Actualizar en Firestore
    const userRef = doc(db, 'users', user.value.id);
    await updateDoc(userRef, {
      name: editForm.name,
      age: editForm.age,
      gender: editForm.gender,
      country: editForm.country,
      region: editForm.region,
      city: editForm.city,
      religion: editForm.religion,
      isMonogamous: editForm.isMonogamous,
      sexualOrientation: editForm.sexualOrientation,
      politicalOrientation: editForm.politicalOrientation,
      hasChildren: editForm.hasChildren,
      relationshipType: editForm.relationshipType,
      description: editForm.description,
      photos: photosToSave,
      updatedAt: new Date(),
    });
    
    // Actualizar el store
    const updatedUser = { ...user.value, ...editForm, photos: photosToSave };
    authStore.setUser(updatedUser);
    authStore.saveUserToStorage(updatedUser);
    editMode.value = false;
    notify.success('Perfil Actualizado', 'Perfil actualizado correctamente');
  } catch (error) {
    console.error('Error updating profile:', error);
    notify.error('Error de Perfil', 'Error al actualizar el perfil. Inténtalo de nuevo.');
  } finally {
    saving.value = false;
  }
};

const forceMatchLoading = ref(false);
const forceMatch = async () => {
  if (!authStore.user) return;
  forceMatchLoading.value = true;
  try {
    await createMatch(authStore.user.id, profileUserId);
    notify.success('Match Forzado', '¡Match forzado exitosamente!');
  } catch (e) {
    notify.error('Error de Match', 'Error al forzar match');
  } finally {
    forceMatchLoading.value = false;
  }
};

// Función para compartir el perfil
const shareProfile = async () => {
  const profileUrl = `${window.location.origin}/profile?id=${profileUserId}`;
  
  // Verificar si el navegador soporta la API de compartir
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Perfil de ${user.value?.name || 'usuario'}`,
        text: `Mira el perfil de ${user.value?.name || 'este usuario'} en Give Me a Chance`,
        url: profileUrl
      });
      console.log('Perfil compartido exitosamente');
    } catch (error) {
      console.error('Error compartiendo perfil:', error);
      // Si falla la API de compartir, copiar al portapapeles
      copyToClipboard(profileUrl);
    }
  } else {
    // Si no hay soporte para la API de compartir, copiar al portapapeles
    copyToClipboard(profileUrl);
  }
};

// Función para copiar al portapapeles
const copyToClipboard = (text: string) => {
  // Crear un elemento temporal
  const el = document.createElement('textarea');
  el.value = text;
  document.body.appendChild(el);
  el.select();
  
  try {
    // Ejecutar el comando de copia
    document.execCommand('copy');
    notify.success('Enlace Copiado', 'Enlace copiado al portapapeles');
  } catch (err) {
    console.error('Error al copiar:', err);
    notify.error('Error de Copia', `No se pudo copiar. El enlace es: ${text}`);
  } finally {
    document.body.removeChild(el);
  }
};

// Función para ir a la página de verificación
const goToVerification = () => {
  try {
    router.push('/verification');
  } catch (error) {
    notify.error('Navegación de Verificación', 'No se pudo navegar a la verificación. Intenta de nuevo.');
    console.error('Error navegando a /verification:', error);
  }
};

// Funciones para manejar drag & drop
const onDragStart = (event: any) => {
  console.log('🖱️ Iniciando drag:', event);
  // Agregar clase para feedback visual
  document.body.classList.add('dragging');
};

const onDragEnd = (event: any) => {
  console.log('✅ Drag terminado:', event);
  // Remover clase de feedback visual
  document.body.classList.remove('dragging');
  
  // Mostrar confirmación de cambio de orden
  if (event.oldIndex !== event.newIndex) {
    console.log(`📸 Foto movida de posición ${event.oldIndex + 1} a ${event.newIndex + 1}`);
  }
};
</script>

<style scoped>
.profile-view {
  min-height: 100vh;
  background: var(--wa-bg);
}

.profile-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.profile-display {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.profile-header {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.profile-photos {
  flex-shrink: 0;
}

.photo-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  max-width: 400px;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 1rem;
  overflow: hidden;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-photos {
  text-align: center;
  padding: 2rem;
  color: #666;
  border: 2px dashed #ddd;
  border-radius: 1rem;
}

.profile-basic-info h2 {
  margin: 0 0 0.5rem 0;
  color: var(--wa-green);
}

.location {
  color: #666;
  margin: 0 0 1rem 0;
}

.description {
  line-height: 1.6;
  color: #333;
}

.profile-details {
  margin-top: 2rem;
}

.detail-section h3 {
  margin-bottom: 1rem;
  color: var(--wa-green);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}

.label {
  font-weight: 600;
  color: #666;
}

.value {
  color: #333;
}

.profile-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.admin-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.photo-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}
.photo-item {
  position: relative;
  width: 140px;
  height: 140px;
  border-radius: 1rem;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}
.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 1rem;
}
.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  background: var(--wa-danger);
  color: #fff;
  border: none;
  border-radius: 50%;
  font-size: 1.2rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
  z-index: 2;
}
.remove-btn:hover {
  background: #b71c1c;
  transform: scale(1.08);
}

.photo-help {
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.5rem;
}

/* Estilos para el sistema de Drag & Drop */
.photo-drag-container {
  margin-bottom: 1rem;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.draggable-photo {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  cursor: grab;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.draggable-photo:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  border-color: var(--wa-green);
}

.draggable-photo:active {
  cursor: grabbing;
  transform: scale(1.05);
}

.draggable-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}

.photo-number {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0,0,0,0.7);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
  z-index: 3;
}

.drag-handle {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0,0,0,0.7);
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  z-index: 3;
  transition: background 0.2s;
}

.drag-handle:hover {
  background: rgba(0,0,0,0.9);
}

.drag-icon {
  font-size: 0.8rem;
  line-height: 1;
}

/* Estados de drag */
.photo-ghost {
  opacity: 0.5;
  transform: rotate(5deg);
}

.photo-chosen {
  border-color: var(--wa-green);
  box-shadow: 0 0 0 2px var(--wa-green);
}

.photo-drag {
  transform: rotate(5deg) scale(1.1);
  box-shadow: 0 8px 25px rgba(0,0,0,0.3);
  z-index: 1000;
}

/* Mensaje cuando no hay fotos */
.no-photos-message {
  text-align: center;
  padding: 2rem;
  border: 2px dashed #ddd;
  border-radius: 12px;
  background: #f9f9f9;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.upload-placeholder .upload-icon {
  font-size: 3rem;
  color: #ccc;
}

.upload-placeholder p {
  color: #666;
  margin: 0;
}

/* Sección de upload */
.upload-section {
  margin: 1rem 0;
  text-align: center;
}

.file-input {
  display: none;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--wa-green);
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 2rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  border: none;
  font-size: 1rem;
}

.upload-btn:hover {
  background: var(--wa-green-dark);
}

.upload-btn .upload-icon {
  font-size: 1.2rem;
}

.photo-limit-message {
  color: var(--wa-green);
  font-weight: 600;
  margin: 0;
}

/* Instrucciones */
.photo-instructions {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid var(--wa-green);
}

.instruction-text {
  margin: 0 0 0.5rem 0;
  color: var(--wa-green);
  font-size: 1rem;
}

.instruction-list {
  margin: 0;
  padding-left: 1.5rem;
  color: #666;
  font-size: 0.9rem;
}

.instruction-list li {
  margin-bottom: 0.3rem;
  line-height: 1.4;
}

/* Responsive para móviles */
@media (max-width: 768px) {
  .photo-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 0.8rem;
  }
  
  .draggable-photo {
    width: 100px;
    height: 100px;
  }
  
  .photo-number {
    width: 20px;
    height: 20px;
    font-size: 0.7rem;
  }
  
  .drag-handle {
    width: 24px;
    height: 24px;
  }
  
  .drag-icon {
    font-size: 0.7rem;
  }
}

/* Feedback visual durante drag */
body.dragging {
  cursor: grabbing;
}

body.dragging * {
  cursor: grabbing !important;
}

/* Estilos que se eliminaron accidentalmente */
.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.checkbox-group {
  margin-bottom: 1.2rem;
  display: flex;
  align-items: center;
}

.wa-checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
}

.wa-checkbox {
  display: none;
}

.wa-custom-checkbox {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid var(--wa-green);
  background: #fff;
  display: inline-block;
  position: relative;
  transition: border 0.2s, background 0.2s;
}

.wa-checkbox:checked + .wa-custom-checkbox {
  background: var(--wa-green);
  border-color: var(--wa-green);
}

.wa-checkbox:checked + .wa-custom-checkbox::after {
  content: '';
  display: block;
  position: absolute;
  left: 6px;
  top: 2.5px;
  width: 6px;
  height: 12px;
  border: solid #fff;
  border-width: 0 3px 3px 0;
  border-radius: 1px;
  transform: rotate(45deg);
  animation: checkmark 0.2s;
}

@keyframes checkmark {
  0% { opacity: 0; transform: scale(0.5) rotate(45deg); }
  100% { opacity: 1; transform: scale(1) rotate(45deg); }
}

.btn-primary {
  background: var(--wa-green);
  color: #fff;
  border: none;
  border-radius: 2rem;
  padding: 0.7rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-right: 1rem;
  transition: background 0.2s;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  background: #fff;
  color: var(--wa-green);
  border: 1.5px solid var(--wa-green);
  border-radius: 2rem;
  padding: 0.7rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.btn-secondary:hover {
  background: var(--wa-green-light);
  color: #fff;
}

.btn-share {
  background: var(--wa-accent);
  color: #333;
  border: none;
  border-radius: 2rem;
  padding: 0.7rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;
}

.btn-share:hover {
  background: #ffdd57;
}

.share-icon, .verify-icon {
  font-size: 1.2rem;
}

.btn-verify {
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 2rem;
  padding: 0.7rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;
}

.btn-verify:hover {
  background: #388E3C;
}

.verified-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #E8F5E9;
  color: #4CAF50;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  font-weight: 600;
  border: 1px solid #4CAF50;
}

.verified-icon {
  font-size: 1.2rem;
}

.verify-info-message {
  text-align: center;
  padding: 0.5rem 1rem;
  background-color: #f0f0f0;
  border-radius: 0.5rem;
  border: 1px solid #ddd;
  font-size: 0.95rem;
  color: #666;
}

.profile-info {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 0.5rem;
}

.profile-info h1 {
  margin: 0 0 0.5rem 0;
  color: var(--wa-green);
}

.bio {
  font-size: 1rem;
  color: #555;
  line-height: 1.4;
}

.verification-status {
  display: flex;
  gap: 0.8rem;
  margin-top: 0.5rem;
}

.verification-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.8rem;
  border-radius: 1.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  border: 1px solid #ccc;
}

.super-verified {
  background-color: #E8F5E9;
  color: #4CAF50;
  border-color: #4CAF50;
}

.verified {
  background-color: #E8F5E9;
  color: #4CAF50;
  border-color: #4CAF50;
}

.unverified {
  background-color: #FBE9E7;
  color: #F44336;
  border-color: #F44336;
}

.badge-icon {
  font-size: 1rem;
}

.badge-text {
  text-transform: uppercase;
}

/* Responsive para móviles */
@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
  }
  
  .photo-gallery {
    max-width: 100%;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .profile-actions {
    flex-direction: column;
  }
  
  .admin-actions {
    flex-direction: column;
  }
}
</style> 