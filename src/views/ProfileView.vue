<template>
  <div class="profile-view">
    <header class="page-header">
      <h1>Mi Perfil</h1>
      <p>Gestiona tu información personal</p>
    </header>
    
    <div class="profile-container">
      <div class="profile-card">
        <div class="profile-header">
          <!-- Foto de perfil principal -->
          <div class="profile-photos">
            <div v-if="displayPhotos.length" class="main-photo">
              <img :src="displayPhotos[0]" :alt="user.name" />
            </div>
            <div v-else class="no-photo">
              <span>Sin foto</span>
            </div>
          </div>
          
          <div class="profile-basic-info">
            <h2>{{ user?.name }}, {{ user?.age }}</h2>
            <p v-if="user?.city">{{ user?.city }}, {{ user?.region }}, {{ user?.country }}</p>
            <p v-else-if="user?.region">{{ user?.region }}, {{ user?.country }}</p>
            <p v-else-if="user?.country">{{ user?.country }}</p>
            <button @click="toggleEditMode" class="edit-btn">
              {{ editMode ? 'Cancelar' : 'Editar Perfil' }}
            </button>
          </div>
        </div>
        
        <!-- Modo de visualización -->
        <div v-if="!editMode" class="profile-edit">
          <div class="form-section">
            <h3>Información Básica</h3>
            <div class="form-grid">
              <div class="form-group">
                <label for="name">Nombre</label>
                <input id="name" :value="user?.name" type="text" disabled />
              </div>
              <div class="form-group">
                <label for="age">Edad</label>
                <input id="age" :value="user?.age" type="number" disabled />
              </div>
              <div class="form-group">
                <label for="country">País</label>
                <select id="country" :value="user?.country" disabled>
                  <option value="">Selecciona un país</option>
                  <option v-for="country in availableCountries" :key="country" :value="country">
                    {{ country }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label for="region">Región/Estado</label>
                <select id="region" :value="user?.region" disabled>
                  <option value="">Selecciona una región</option>
                  <option v-for="region in availableRegions" :key="region" :value="region">
                    {{ region }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label for="city">Ciudad</label>
                <AutocompleteInput
                  id="city"
                  v-model="displayCity"
                  :suggestions="citySuggestions"
                  placeholder="Busca una ciudad..."
                  :disabled="true"
                />
              </div>
            </div>
          </div>
          <div class="form-section">
            <h3>Preferencias</h3>
            <div class="form-grid">
              <div class="form-group">
                <label for="religion">Religión</label>
                <select id="religion" :value="user?.religion" disabled>
                  <option value="">Selecciona una opción</option>
                  <option value="catolica">Católica</option>
                  <option value="protestante">Protestante</option>
                  <option value="musulmana">Musulmana</option>
                  <option value="judia">Judía</option>
                  <option value="budista">Budista</option>
                  <option value="hindu">Hindú</option>
                  <option value="ateo">Ateo/Agnóstico</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div class="form-group">
                <label for="sexualOrientation">Orientación Sexual</label>
                <select id="sexualOrientation" :value="user?.sexualOrientation" disabled>
                  <option value="">Selecciona una opción</option>
                  <option value="heterosexual">Heterosexual</option>
                  <option value="homosexual">Homosexual</option>
                  <option value="bisexual">Bisexual</option>
                  <option value="pansexual">Pansexual</option>
                  <option value="asexual">Asexual</option>
                </select>
              </div>
              <div class="form-group">
                <label for="politicalOrientation">Orientación Política</label>
                <select id="politicalOrientation" :value="user?.politicalOrientation" disabled>
                  <option value="">Selecciona una opción</option>
                  <option value="izquierda">Izquierda</option>
                  <option value="centro-izquierda">Centro-izquierda</option>
                  <option value="centro">Centro</option>
                  <option value="centro-derecha">Centro-derecha</option>
                  <option value="derecha">Derecha</option>
                  <option value="apolitico">Apolítico</option>
                </select>
              </div>
              <div class="form-group">
                <label for="relationshipType">Tipo de relación que buscas</label>
                <select id="relationshipType" :value="user?.relationshipType" disabled>
                  <option value="">Selecciona una opción</option>
                  <option value="seria">Relación seria</option>
                  <option value="casual">Relación casual</option>
                  <option value="amistad">Amistad</option>
                  <option value="matrimonio">Matrimonio</option>
                  <option value="poliamor">Poliamor</option>
                </select>
              </div>
              <div class="form-group">
                <label>¿Es monógamo?</label>
                <div class="radio-group">
                  <label>
                    <input type="radio" :checked="user?.isMonogamous === true" disabled />
                    Sí
                  </label>
                  <label>
                    <input type="radio" :checked="user?.isMonogamous === false" disabled />
                    No
                  </label>
                </div>
              </div>
              <div class="form-group">
                <label>¿Tienes hijos?</label>
                <div class="radio-group">
                  <label>
                    <input type="radio" :checked="user?.hasChildren === true" disabled />
                    Sí
                  </label>
                  <label>
                    <input type="radio" :checked="user?.hasChildren === false" disabled />
                    No
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div class="form-section">
            <h3>Descripción</h3>
            <div class="form-group">
              <label for="description">Cuéntanos sobre ti</label>
              <textarea id="description" :value="user?.description" disabled rows="4" style="width:100%;resize:vertical;" />
            </div>
          </div>
          <div class="form-section">
            <h3>Fotos</h3>
            <div class="photo-preview">
              <div v-for="(photo, index) in displayPhotos" :key="index" class="photo-item">
                <img :src="photo" :alt="`Foto ${index + 1}`" />
              </div>
            </div>
          </div>
        </div>

        <!-- Modo de edición -->
        <div v-else class="profile-edit">
          <form @submit.prevent="saveProfile" class="edit-form">
            <div class="form-section">
              <h3>Información Básica</h3>
              <div class="form-grid">
                <div class="form-group">
                  <label for="name">Nombre</label>
                  <input id="name" v-model="editForm.name" type="text" required :disabled="!editMode" />
                </div>
                <div class="form-group">
                  <label for="age">Edad</label>
                  <input id="age" v-model.number="editForm.age" type="number" min="18" max="100" required :disabled="!editMode" />
                </div>
                <div class="form-group">
                  <label for="country">País</label>
                  <select id="country" v-model="editForm.country" @change="handleCountryChange" required :disabled="!editMode">
                    <option value="">Selecciona un país</option>
                    <option v-for="country in availableCountries" :key="country" :value="country">
                      {{ country }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="region">Región/Estado</label>
                  <select id="region" v-model="editForm.region" @change="handleRegionChange" required :disabled="!editMode">
                    <option value="">Selecciona una región</option>
                    <option v-for="region in availableRegions" :key="region" :value="region">
                      {{ region }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="city">Ciudad</label>
                  <AutocompleteInput
                    id="city"
                    v-model="editForm.city"
                    :suggestions="citySuggestions"
                    placeholder="Busca una ciudad..."
                    :disabled="!editMode"
                    :required="true"
                  />
                </div>
              </div>
            </div>

            <div class="form-section">
              <h3>Preferencias</h3>
              <div class="form-grid">
                <div class="form-group">
                  <label for="religion">Religión</label>
                  <select id="religion" v-model="editForm.religion" required :disabled="!editMode">
                    <option value="">Selecciona una opción</option>
                    <option value="catolica">Católica</option>
                    <option value="protestante">Protestante</option>
                    <option value="musulmana">Musulmana</option>
                    <option value="judia">Judía</option>
                    <option value="budista">Budista</option>
                    <option value="hindu">Hindú</option>
                    <option value="ateo">Ateo/Agnóstico</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="sexualOrientation">Orientación Sexual</label>
                  <select id="sexualOrientation" v-model="editForm.sexualOrientation" required :disabled="!editMode">
                    <option value="">Selecciona una opción</option>
                    <option value="heterosexual">Heterosexual</option>
                    <option value="homosexual">Homosexual</option>
                    <option value="bisexual">Bisexual</option>
                    <option value="pansexual">Pansexual</option>
                    <option value="asexual">Asexual</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="politicalOrientation">Orientación Política</label>
                  <select id="politicalOrientation" v-model="editForm.politicalOrientation" required :disabled="!editMode">
                    <option value="">Selecciona una opción</option>
                    <option value="izquierda">Izquierda</option>
                    <option value="centro-izquierda">Centro-izquierda</option>
                    <option value="centro">Centro</option>
                    <option value="centro-derecha">Centro-derecha</option>
                    <option value="derecha">Derecha</option>
                    <option value="apolitico">Apolítico</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="relationshipType">Tipo de relación que buscas</label>
                  <select id="relationshipType" v-model="editForm.relationshipType" required :disabled="!editMode">
                    <option value="">Selecciona una opción</option>
                    <option value="seria">Relación seria</option>
                    <option value="casual">Relación casual</option>
                    <option value="amistad">Amistad</option>
                    <option value="matrimonio">Matrimonio</option>
                    <option value="poliamor">Poliamor</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>¿Es monógamo?</label>
                  <div class="radio-group">
                    <label>
                      <input type="radio" v-model="editForm.isMonogamous" :value="true" :disabled="!editMode" />
                      Sí
                    </label>
                    <label>
                      <input type="radio" v-model="editForm.isMonogamous" :value="false" :disabled="!editMode" />
                      No
                    </label>
                  </div>
                </div>
                <div class="form-group">
                  <label>¿Tienes hijos?</label>
                  <div class="radio-group">
                    <label>
                      <input type="radio" v-model="editForm.hasChildren" :value="true" :disabled="!editMode" />
                      Sí
                    </label>
                    <label>
                      <input type="radio" v-model="editForm.hasChildren" :value="false" :disabled="!editMode" />
                      No
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-section">
              <h3>Descripción</h3>
              <div class="form-group">
                <label for="description">Cuéntanos sobre ti</label>
                <textarea 
                  id="description" 
                  v-model="editForm.description" 
                  rows="4" 
                  placeholder="Cuéntanos sobre ti..."
                  required
                  :disabled="!editMode"
                ></textarea>
              </div>
            </div>

            <div class="form-section">
              <h3>Fotos</h3>
              <div class="form-group">
                <label>Subir nuevas fotos</label>
                <input 
                  type="file" 
                  @change="handlePhotoUpload" 
                  accept="image/*" 
                  multiple
                  ref="photoInput"
                  :disabled="!editMode"
                />
                <div class="photo-preview" v-if="editForm.photos.length > 0">
                  <div v-for="(photo, index) in editForm.photos" :key="index" class="photo-item">
                    <img :src="photo" alt="Preview" />
                    <button type="button" @click="removePhoto(index)" class="remove-btn" :disabled="!editMode">×</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" @click="toggleEditMode" class="btn btn-secondary">
                Cancelar
              </button>
              <button type="submit" :disabled="saving || !editMode" class="btn btn-primary">
                {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    <button
      v-if="isAdmin && profileUserId !== authStore.user?.id"
      class="btn-danger"
      :disabled="forceMatchLoading"
      @click="forceMatch"
      style="margin-top: 1rem;"
    >
      Forzar Match
    </button>
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
  width: 100vw;
  background: #f8f9fa;
  margin: 0;
  padding: 0;
}

.page-header {
  background: white;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.page-header h1 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 2.5rem;
}

.page-header p {
  margin: 0;
  color: #666;
  font-size: 1.1rem;
}

.profile-container {
  width: 100vw;
  max-width: none;
  margin: 0;
  padding: 2rem 0;
}

.profile-card {
  width: 100vw;
  max-width: none;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
}

.profile-header {
  display: flex;
  gap: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.profile-photos {
  flex-shrink: 0;
}

.main-photo {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid white;
}

.main-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-photo {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid white;
}

.profile-basic-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.profile-basic-info h2 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
}

.profile-basic-info p {
  margin: 0 0 1rem 0;
  opacity: 0.9;
}

.edit-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  align-self: flex-start;
}

.edit-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.profile-details {
  padding: 2rem;
}

.detail-section {
  margin-bottom: 2rem;
}

.detail-section h3 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item label {
  font-weight: 600;
  color: #666;
  font-size: 0.9rem;
}

.detail-item span {
  color: #333;
  font-size: 1rem;
}

.detail-section p {
  color: #555;
  line-height: 1.6;
  margin: 0;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.photo-item {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Estilos para el modo de edición */
.profile-edit {
  padding: 2rem;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-section {
  background: #f0f2f5;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
}

.form-section h3 {
  margin-top: 0;
  margin-bottom: 1.2rem;
  color: #333;
  font-size: 1.4rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  color: #555;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group input[type="file"],
.form-group select,
.form-group textarea {
  padding: 0.8rem 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
  background-color: #fff;
  transition: border-color 0.3s ease;
}

.form-group input[type="text"]:focus,
.form-group input[type="number"]:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
  outline: none;
}

.form-group input[disabled],
.form-group select[disabled],
.form-group textarea[disabled] {
  background-color: #f0f0f0;
  color: #888;
  cursor: not-allowed;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.radio-group {
  display: flex;
  gap: 2rem;
  margin-top: 0.5rem;
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  color: #333;
}

.radio-group input[type="radio"] {
  transform: scale(1.1);
  accent-color: #667eea;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease, opacity 0.3s ease;
}

.btn-primary {
  background-color: #667eea;
  color: white;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background-color: #5a67d8;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #e2e8f0;
  color: #4a5568;
  border: 1px solid #cbd5e0;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #edf2f7;
}

.photo-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.8rem;
  margin-top: 1rem;
}

.photo-item {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f7fafc;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: #e53e3e;
  color: white;
  border: none;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.2rem;
  font-weight: bold;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  z-index: 10;
}

.remove-btn:hover {
  background-color: #c53030;
}

/* Responsive para el modo de edición */
@media (max-width: 768px) {
  .profile-edit {
    padding: 1rem;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .radio-group {
    flex-direction: column;
    gap: 1rem;
  }
}
</style> 