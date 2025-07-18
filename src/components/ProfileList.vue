<template>
  <div class="profile-list">
    <!-- Animación de match -->
    <MatchAnimation 
      v-if="showMatchAnimation && matchedUser && authStore.user" 
      :show="showMatchAnimation" 
      :matched-user="matchedUser" 
      :current-user="currentUserForMatch" 
      :match-id="matchId"
      @close="closeMatchAnimation"
      @send-message="sendMessageAfterMatch"
    />
    <div class="filters">
      <h3>Filtros</h3>
      <div class="filter-group">
        <label>Distancia máxima (km)</label>
        <input 
          type="range" 
          v-model="filters.maxDistance" 
          min="1" 
          max="500" 
          @input="debounceDistanceFilter"
        />
        <span>{{ filters.maxDistance }} km</span>
        <div v-if="loading" class="filter-loading">Aplicando filtro...</div>
      </div>

      <div class="filter-group">
        <label>Rango de edad</label>
        <div class="age-range">
          <input 
            type="number" 
            v-model.number="filters.ageRange[0]" 
            min="18" 
            max="100"
            @change="applyFilters"
          />
          <span>-</span>
          <input 
            type="number" 
            v-model.number="filters.ageRange[1]" 
            min="18" 
            max="100"
            @change="applyFilters"
          />
        </div>
      </div>

      <div class="filter-group">
        <label>Género</label>
        <div class="checkbox-group">
          <label v-for="option in genderOptions" :key="option.value">
            <input
              type="checkbox"
              :value="option.value"
              v-model="filters.gender"
              @change="applyFilters"
            />
            {{ option.label }}
          </label>
        </div>
      </div>

      <div class="filter-group">
        <label>Orientación Sexual</label>
        <div class="checkbox-group">
          <label v-for="orientation in sexualOrientations" :key="orientation.value">
            <input 
              type="checkbox" 
              :value="orientation.value"
              v-model="filters.sexualOrientation"
              @change="applyFilters"
            />
            {{ orientation.label }}
          </label>
        </div>
      </div>

      <div class="filter-group">
        <label>Tipo de Relación</label>
        <div class="checkbox-group">
          <label v-for="type in relationshipTypes" :key="type.value">
            <input 
              type="checkbox" 
              :value="type.value"
              v-model="filters.relationshipType"
              @change="applyFilters"
            />
            {{ type.label }}
          </label>
        </div>
      </div>
      
      <button @click="applyFilters" class="apply-filters-btn">
        🔍 Aplicar Filtros
      </button>
      

    </div>

    <div class="profiles">
      <div v-if="loading" class="loading">
        Cargando perfiles...
      </div>
      
      <div v-else-if="filteredProfiles.length === 0" class="no-results">
        <p>No se encontraron perfiles con los filtros actuales</p>
      </div>
      
      <div v-else class="profiles-grid">
        <div 
          v-for="profile in filteredProfiles" 
          :key="profile.id" 
          class="profile-card"
          :class="{
            'liked-profile': hasLiked(profile.id),
            'disliked-profile': hasDisliked(profile.id)
          }"
          @click="viewProfile(profile)"
        >
          <div class="profile-image">
            <img 
              :src="profile.photos[0] || '/default-avatar.png'" 
              :alt="profile.name"
            />
            <div class="distance" v-if="profile.distance">
              {{ Math.round(profile.distance) }} km
            </div>
          </div>
          
          <div class="profile-info">
            <h3>{{ profile.name }}, {{ profile.age }}</h3>
            <p class="city">{{ profile.city }}</p>
            <p class="description">{{ truncateDescription(profile.description) }}</p>
            
            <div class="tags">
              <span class="tag">{{ profile.sexualOrientation }}</span>
              <span class="tag">{{ profile.relationshipType }}</span>
              <span v-if="profile.hasChildren" class="tag">Con hijos</span>
              <span v-if="profile.isMonogamous" class="tag">Monógamo</span>
            </div>
            
            <div class="profile-actions">
              <button 
                @click="likeProfile(profile, $event)" 
                class="action-btn like-btn"
                :disabled="hasLiked(profile.id)"
              >
                {{ hasLiked(profile.id) ? '❤️' : '👍' }}
              </button>
              <button 
                @click="dislikeProfile(profile, $event)" 
                class="action-btn dislike-btn"
                :disabled="hasDisliked(profile.id)"
              >
                {{ hasDisliked(profile.id) ? '💔' : '👎' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useProfilesStore } from '@/stores/profiles';
import { useAuthStore } from '@/stores/auth';
import { getProfilesByFilters, getProfiles } from '@/services/profiles';
import { getUserLocation, calculateDistance } from '@/services/geolocation';
import { getLikesGiven, giveLike } from '@/services/likes';
import { getDislikesGiven, giveDislike } from '@/services/dislikes';
import MatchAnimation from '@/components/MatchAnimation.vue';
import type { UserProfile, FilterOptions } from '@/types';

const router = useRouter();
const profilesStore = useProfilesStore();
const authStore = useAuthStore();
const loading = ref(false);
// Usar computed para reactividad
const filteredProfiles = computed(() => profilesStore.filteredProfiles);

// Almacenar los likes y dislikes del usuario
const userLikes = ref<string[]>([]);
const userDislikes = ref<string[]>([]);

// Variables para la animación de match
const showMatchAnimation = ref(false);
const matchedUser = ref<UserProfile | null>(null);
const matchId = ref<string>('');
const currentUserForMatch = ref<any>(null);

// Función para verificar si el usuario ha dado like a un perfil
const hasLiked = (profileId: string) => userLikes.value.includes(profileId);

// Función para verificar si el usuario ha dado dislike a un perfil
const hasDisliked = (profileId: string) => userDislikes.value.includes(profileId);

const filters = reactive<FilterOptions>({
  maxDistance: 100,
  ageRange: [18, 100],
  gender: [], // Nuevo campo
  sexualOrientation: [],
  relationshipType: [],
  hasChildren: undefined,
  isMonogamous: undefined,
});

const genderOptions = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'no-binario', label: 'No binario' },
  { value: 'otro', label: 'Otro' },
  { value: 'prefiero-no-decirlo', label: 'Prefiero no decirlo' },
];

const sexualOrientations = [
  { value: 'heterosexual', label: 'Heterosexual' },
  { value: 'homosexual', label: 'Homosexual' },
  { value: 'bisexual', label: 'Bisexual' },
  { value: 'pansexual', label: 'Pansexual' },
  { value: 'asexual', label: 'Asexual' },
];

const relationshipTypes = [
  { value: 'seria', label: 'Relación seria' },
  { value: 'casual', label: 'Relación casual' },
  { value: 'amistad', label: 'Amistad' },
  { value: 'matrimonio', label: 'Matrimonio' },
  { value: 'poliamor', label: 'Poliamor' },
];

const updateFilters = () => {
  profilesStore.updateFilterOptions(filters);
};

const applyFilters = async () => {
  // Actualizar filtros en el store primero
  profilesStore.updateFilterOptions(filters);
  console.log('🚩 Aplicando filtros:', filters);
  
  // Luego recargar perfiles con los nuevos filtros
  loadProfiles();
};

// Variable para almacenar el temporizador de debounce
let distanceFilterTimeout: number | null = null;

// Función para aplicar el filtro de distancia con debounce
const debounceDistanceFilter = () => {
  // Mostrar el valor actual del filtro
  console.log(`Ajustando filtro de distancia: ${filters.maxDistance}km`);
  
  // Actualizar filtros en el store inmediatamente
  profilesStore.updateFilterOptions(filters);
  
  // Cancelar el temporizador anterior si existe
  if (distanceFilterTimeout) {
    clearTimeout(distanceFilterTimeout);
  }
  
  // Establecer un nuevo temporizador
  distanceFilterTimeout = setTimeout(() => {
    console.log(`Aplicando filtro de distancia: ${filters.maxDistance}km`);
    applyDistanceFilter();
  }, 500); // Esperar 500ms para evitar demasiadas llamadas
};

// Función para aplicar el filtro de distancia
const applyDistanceFilter = async () => {
  console.log('📍 Aplicando filtro de distancia:', filters.maxDistance);
  
  loading.value = true;
  
  try {
    // Verificar si tenemos ubicación para el filtro de distancia
    if (!profilesStore.currentUserLocation) {
      console.log('📍 Obteniendo ubicación para filtro de distancia...');
      const location = await getUserLocation();
      if (location) {
        profilesStore.setCurrentUserLocation(location);
      } else {
        // Usar ubicación por defecto (Madrid)
        profilesStore.setCurrentUserLocation({ latitude: 40.416775, longitude: -3.703790 });
      }
    }
    
    // Obtener todos los perfiles sin filtrar
    if (!authStore.user) {
      authStore.loadUserFromStorage();
      if (!authStore.user) return;
    }
    
    // Obtener todos los perfiles primero
    const allProfiles = await getProfiles(authStore.user.id);
    console.log(`Obtenidos ${allProfiles.length} perfiles totales`);
    
    // Filtrar manualmente por distancia
    const filteredByDistance = [];
    
    for (const profile of allProfiles) {
      if (profile.location && profile.location.latitude && profile.location.longitude) {
        const distance = calculateDistance(
          profilesStore.currentUserLocation!.latitude,
          profilesStore.currentUserLocation!.longitude,
          profile.location.latitude,
          profile.location.longitude
        );
        
        console.log(`Perfil ${profile.name}: distancia = ${distance}km, maxDistance = ${filters.maxDistance}km`);
        
        // Solo incluir perfiles dentro de la distancia máxima
        if (distance <= filters.maxDistance) {
          filteredByDistance.push({
            ...profile,
            distance: distance
          });
        }
      }
    }
    
    console.log(`Filtrados ${filteredByDistance.length} perfiles por distancia de ${filters.maxDistance}km`);
    
    // Aplicar otros filtros activos
    let finalFiltered = filteredByDistance;
    
    // Filtrar por edad
    finalFiltered = finalFiltered.filter(profile => 
      profile.age >= filters.ageRange[0] && profile.age <= filters.ageRange[1]
    );
    
    // Filtrar por orientación sexual
    if (filters.sexualOrientation.length > 0) {
      finalFiltered = finalFiltered.filter(profile => 
        filters.sexualOrientation.includes(profile.sexualOrientation)
      );
    }
    
    // Filtrar por tipo de relación
    if (filters.relationshipType.length > 0) {
      finalFiltered = finalFiltered.filter(profile => 
        filters.relationshipType.includes(profile.relationshipType)
      );
    }
    
    // Ordenar por distancia
    finalFiltered.sort((a, b) => a.distance! - b.distance!);
    
    console.log(`Resultado final: ${finalFiltered.length} perfiles`);
    
    // Actualizar perfiles en el store
    profilesStore.setProfiles(finalFiltered);
  } catch (error) {
    console.error('Error aplicando filtro de distancia:', error);
  } finally {
    loading.value = false;
  }
};

const viewProfile = (profile: UserProfile) => {
  // Navegar al perfil detallado
  router.push({ name: 'user-profile', params: { id: profile.id } });
};

// Cerrar la animación de match
const closeMatchAnimation = () => {
  showMatchAnimation.value = false;
};

// Enviar mensaje después de un match
const sendMessageAfterMatch = (matchId: string, userId: string) => {
  router.push({ name: 'chat', params: { matchId }, query: { userId } });
};

// Función para dar like a un perfil
const likeProfile = async (profile: UserProfile, event: Event) => {
  event.stopPropagation(); // Evitar que se abra el perfil
  
  if (!authStore.user) return;
  
  try {
    const result = await giveLike(authStore.user.id, profile.id);
    userLikes.value.push(profile.id);
    console.log(`❤️ Like dado a ${profile.name}`);
    
    // Si se ha generado un match, mostrar la animación
    if (result.isMatch) {
      console.log('💞 ¡Match generado!', result.matchId);
      // Asegurarse de que el perfil tenga todas las propiedades necesarias
      matchedUser.value = {
        id: profile.id,
        name: profile.name,
        photos: profile.photos || []
      };
      
      // Preparar datos del usuario actual
      if (authStore.user) {
        currentUserForMatch.value = {
          id: authStore.user.id,
          name: authStore.user.name,
          photo: authStore.user.photos && authStore.user.photos.length > 0 ? authStore.user.photos[0] : null
        };
        console.log('Foto del usuario actual para match:', currentUserForMatch.value.photo);
      }
      
      matchId.value = result.matchId || '';
      showMatchAnimation.value = true;
    }
  } catch (error) {
    console.error('Error dando like:', error);
  }
};

// Función para dar dislike a un perfil
const dislikeProfile = async (profile: UserProfile, event: Event) => {
  event.stopPropagation(); // Evitar que se abra el perfil
  
  if (!authStore.user) return;
  
  try {
    await giveDislike(authStore.user.id, profile.id);
    userDislikes.value.push(profile.id);
    console.log(`👎 Dislike dado a ${profile.name}`);
  } catch (error) {
    console.error('Error dando dislike:', error);
  }
};

const truncateDescription = (description: string) => {
  return description.length > 100 ? description.substring(0, 100) + '...' : description;
};

const loadProfiles = async () => {
  loading.value = true;
  console.log('🔄 Recargando perfiles con filtros:', filters);
  console.log('📍 Ubicación actual:', profilesStore.currentUserLocation);
  
  try {
    if (!authStore.user) {
      authStore.loadUserFromStorage();
      
      if (!authStore.user) {
        return;
      }
    }

    // Si no hay ubicación, intentar obtenerla
    if (!profilesStore.currentUserLocation) {
      await getUserLocationAndSetProfiles();
      return; // La función getUserLocationAndSetProfiles ya llama a loadProfiles
    }

    // Incluir maxDistance en los filtros
    const profiles = await getProfilesByFilters(authStore.user.id, {
      maxDistance: filters.maxDistance,
      ageRange: filters.ageRange,
      gender: filters.gender,
      sexualOrientation: filters.sexualOrientation,
      relationshipType: filters.relationshipType,
      hasChildren: filters.hasChildren,
      isMonogamous: filters.isMonogamous,
    });
    
    profilesStore.setProfiles(profiles);
  } catch (error) {
    console.error('Error cargando perfiles:', error);
  } finally {
    loading.value = false;
  }
};

// Watcher para cuando el usuario se autentica
watch(() => authStore.user, (newUser) => {
  if (newUser) {
    loadProfiles();
  }
}, { immediate: true });

// Función para obtener la ubicación del usuario
const getUserLocationAndSetProfiles = async () => {
  try {
    const location = await getUserLocation();
    if (location) {
      console.log('📍 Ubicación obtenida en componente:', location);
      profilesStore.setCurrentUserLocation(location);
    } else {
      console.log('⚠️ No se pudo obtener la ubicación, usando ubicación por defecto');
      // Usar ubicación por defecto (Madrid)
      profilesStore.setCurrentUserLocation({ latitude: 40.416775, longitude: -3.703790 });
    }
    loadProfiles();
  } catch (error) {
    console.error('Error obteniendo ubicación:', error);
    // Usar ubicación por defecto en caso de error
    profilesStore.setCurrentUserLocation({ latitude: 40.416775, longitude: -3.703790 });
    loadProfiles();
  }
};

// Función para cargar los likes y dislikes del usuario
const loadUserInteractions = async () => {
  if (!authStore.user) return;
  
  try {
    // Cargar likes dados por el usuario
    const likes = await getLikesGiven(authStore.user.id);
    userLikes.value = likes.map(like => like.toUserId);
    console.log(`❤️ Cargados ${userLikes.value.length} likes`);
    
    // Cargar dislikes dados por el usuario
    const dislikes = await getDislikesGiven(authStore.user.id);
    userDislikes.value = dislikes.map(dislike => dislike.toUserId);
    console.log(`👎 Cargados ${userDislikes.value.length} dislikes`);
  } catch (error) {
    console.error('Error cargando interacciones del usuario:', error);
  }
};

onMounted(async () => {
  // Si ya hay un usuario autenticado, obtener ubicación y cargar perfiles
  if (authStore.user) {
    try {
      // Obtener ubicación del usuario
      const location = await getUserLocation();
      if (location) {
        profilesStore.setCurrentUserLocation(location);
      } else {
        // Usar ubicación por defecto
        profilesStore.setCurrentUserLocation({ latitude: 40.416775, longitude: -3.703790 });
      }
      
      // Cargar likes y dislikes del usuario
      await loadUserInteractions();
      
      // Cargar perfiles con la ubicación ya establecida
      loadProfiles();
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      // Usar ubicación por defecto en caso de error
      profilesStore.setCurrentUserLocation({ latitude: 40.416775, longitude: -3.703790 });
      loadProfiles();
    }
  }
});




</script>

<style scoped>
.profile-list {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 30px;
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.filters {
  background: var(--wa-card);
  padding: 20px;
  border-radius: var(--wa-radius);
  height: fit-content;
  position: sticky;
  top: 20px;
  box-shadow: var(--wa-shadow);
}

.filter-group {
  margin-bottom: 20px;
}

.filter-group label {
  display: block;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--wa-green);
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.age-range {
  display: flex;
  align-items: center;
  gap: 10px;
}

.age-range input {
  width: 80px;
  padding: 8px;
  border: 1px solid var(--wa-gray);
  border-radius: 4px;
  font-weight: 600;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  text-transform: none;
  letter-spacing: normal;
  font-size: 0.9rem;
  color: #555;
}

.profiles {
  min-height: 400px;
}

.loading, .no-results {
  text-align: center;
  padding: 40px;
  color: #666;
}



.apply-filters-btn {
  background: var(--wa-green);
  color: white;
  border: none;
  padding: 12px;
  border-radius: 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 10px;
  width: 100%;
}

.apply-filters-btn:hover {
  background: var(--wa-green-dark);
}

.distance-filter-btn {
  background: var(--wa-accent);
  color: #333;
  border: none;
  padding: 8px 12px;
  border-radius: 2rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 10px;
  width: 100%;
}

.distance-filter-btn:hover {
  background: #ffdd57;
}

.filter-loading {
  margin-top: 8px;
  font-size: 0.9rem;
  color: var(--wa-green);
  font-weight: 600;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

/* Estilos para perfiles con interacciones */
.liked-profile {
  background-color: #e6ffea !important; /* Verde pastel claro */
  border: 1px solid #a8e6b4 !important;
}

.disliked-profile {
  background-color: #ffe6e6 !important; /* Rojo pastel claro */
  border: 1px solid #e6a8a8 !important;
}

.profile-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
}

.action-btn {
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.like-btn {
  background-color: #e6ffea;
  color: #38a169;
}

.like-btn:hover {
  background-color: #c6f6d5;
}

.like-btn:disabled {
  opacity: 0.7;
  cursor: default;
}

.dislike-btn {
  background-color: #ffe6e6;
  color: #e53e3e;
}

.dislike-btn:hover {
  background-color: #fed7d7;
}

.dislike-btn:disabled {
  opacity: 0.7;
  cursor: default;
}

.profiles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.profile-card {
  background: var(--wa-card);
  border-radius: var(--wa-radius);
  overflow: hidden;
  box-shadow: var(--wa-shadow);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.profile-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.profile-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.profile-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.distance {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.profile-info {
  padding: 20px;
}

.profile-info h3 {
  margin: 0 0 8px 0;
  color: var(--wa-green);
  font-size: 1.2rem;
}

.city {
  color: #666;
  margin: 0 0 12px 0;
  font-size: 14px;
}

.description {
  color: #555;
  margin: 0 0 15px 0;
  line-height: 1.4;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  background: var(--wa-green);
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.tag:nth-child(even) {
  background: var(--wa-green-light);
}

.tag:nth-child(3n) {
  background: var(--wa-green-dark);
}

.tag:nth-child(4n) {
  background: var(--wa-accent);
  color: #333;
}



.filter-debug {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed #ddd;
}

/* Responsive */
@media (max-width: 1024px) {
  .profile-list {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 15px;
  }
  
  .filters {
    position: static;
    order: -1;
  }
}

@media (max-width: 768px) {
  .profile-list {
    padding: 10px;
    gap: 15px;
  }
  
  .profiles-grid {
    grid-template-columns: 1fr;
  }
  
  .profile-card {
    max-width: 400px;
    margin: 0 auto;
  }
}
</style> 