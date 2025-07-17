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
                <img :src="photo" :alt="`Foto ${index + 1}`" />
              </div>
            </div>
            <div v-else class="no-photos">
              <p>No hay fotos disponibles</p>
            </div>
          </div>
          
          <div class="profile-basic-info">
            <h2>{{ user?.name }}, {{ user?.age }}</h2>
            <p class="location">{{ displayCity }}</p>
            <p class="description">{{ user?.description || 'Sin descripción' }}</p>
          </div>
        </div>

        <div class="profile-details">
          <div class="detail-section">
            <h3>Información Personal</h3>
            <div class="detail-grid">
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
            <div class="photo-preview">
              <div v-for="(photo, index) in editForm.photos" :key="index" class="photo-item">
                <img :src="photo" :alt="`Foto ${index + 1}`" />
                <button 
                  type="button" 
                  @click="removePhoto(index)" 
                  class="remove-btn"
                >
                  ×
                </button>
              </div>
            </div>
            
            <input 
              v-if="editForm.photos.length < 6"
              type="file" 
              @change="handlePhotoUpload" 
              accept="image/*" 
              multiple
            />
            <p class="photo-help">Sube entre 1 y 6 fotos. La primera será tu foto principal.</p>
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
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { createMatch } from '@/services/matches';
import { useRoute } from 'vue-router';
import { getCountries, getRegions, getCitiesByCountry, searchCities } from '@/utils/location';
import AutocompleteInput from '@/components/AutocompleteInput.vue';

const route = useRoute();
const authStore = useAuthStore();
const editMode = ref(false);
const saving = ref(false);
const isAdmin = authStore.user?.isAdmin;
const profileUserId = route.query.id as string || authStore.user?.id || '';

const user = computed(() => authStore.user);
const isOwnProfile = computed(() => !route.query.id || route.query.id === authStore.user?.id);

// Computed que combina las fotos subidas con la foto de Google
const displayPhotos = computed(() => {
  if (!user.value) return [];
  
  const photos = [...user.value.photos];
  
  // Si hay foto de Google y no está ya en las fotos, agregarla al final
  if (user.value.photoURL && !photos.includes(user.value.photoURL)) {
    photos.push(user.value.photoURL);
  }
  
  return photos;
});

const editForm = reactive({
  name: '',
  age: 18,
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
      // Filtrar la foto de Google del array de fotos editables
      const photosWithoutGoogle = user.value.photos.filter(photo => photo !== user.value?.photoURL);
      
      Object.assign(editForm, {
        name: user.value.name,
        age: user.value.age,
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
        photos: photosWithoutGoogle, // Solo las fotos subidas, no la de Google
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
  
  if (files) {
    for (const file of Array.from(files)) {
      if (editForm.photos.length >= 6) break;
      
      try {
        const imageUrl = await uploadImageToImageKit(file);
        editForm.photos.push(imageUrl);
      } catch (error) {
        console.error('Error uploading photo:', error);
        alert('Error al subir la foto. Inténtalo de nuevo.');
      }
    }
  }
};

const removePhoto = (index: number) => {
  editForm.photos.splice(index, 1);
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

const saveProfile = async () => {
  if (!user.value) return;
  saving.value = true;
  try {
    // Filtrar la foto de Google del array de fotos para no duplicarla
    const photosWithoutGoogle = editForm.photos.filter(photo => photo !== user.value?.photoURL);
    
    // Si no hay fotos nuevas pero el usuario tiene photoURL, usar solo la foto de Google
    if (photosWithoutGoogle.length === 0 && user.value.photoURL) {
      // No hacer nada, mantener la foto de Google
    } else if (photosWithoutGoogle.length === 0 && !user.value.photoURL) {
      alert('Por favor sube al menos una foto');
      return;
    }
    
    // Actualizar en Firestore
    const userRef = doc(db, 'users', user.value.id);
    await updateDoc(userRef, {
      name: editForm.name,
      age: editForm.age,
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
      photos: photosWithoutGoogle, // Solo guardar las fotos subidas, no la de Google
      updatedAt: new Date(),
    });
    // Actualizar el store
    const updatedUser = { ...user.value, ...editForm, photos: photosWithoutGoogle };
    authStore.setUser(updatedUser);
    authStore.saveUserToStorage(updatedUser);
    editMode.value = false;
    alert('Perfil actualizado correctamente');
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('Error al actualizar el perfil. Inténtalo de nuevo.');
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
    alert('¡Match forzado exitosamente!');
  } catch (e) {
    alert('Error al forzar match');
  } finally {
    forceMatchLoading.value = false;
  }
};

onMounted(() => {
  // Asegurar que el usuario esté cargado
  if (!user.value) {
    authStore.loadUserFromStorage();
  }
  
  // Inicializar las opciones de ubicación si el usuario ya tiene datos
  if (user.value) {
    if (user.value.country) {
      availableRegions.value = getRegions(user.value.country);
    }
  }
});
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