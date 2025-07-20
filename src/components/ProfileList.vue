<template>
  <div class="profile-list-container">
    <aside class="filters-sidebar" :class="{ 'mobile-hidden': isMobile && !showFilters }">
      <form class="filters-form">
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
      </form>
    </aside>
    <button 
      v-if="isMobile" 
      class="toggle-filters-btn" 
      @click="showFilters = !showFilters"
    >
      <span v-if="showFilters">Ocultar Filtros</span>
      <span v-else>Mostrar Filtros</span>
      </button>
    <div class="profiles">
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <span>Aplicando filtros...</span>
      </div>
      
      <div class="debug-info">
        <p>Perfiles totales: {{ profilesStore.profiles.length }}</p>
        <p>Perfiles filtrados: {{ filteredProfiles.length }}</p>
        <p>Usuario actual: {{ authStore.user?.name || 'No autenticado' }}</p>
      </div>
      
      <div v-if="!loading && filteredProfiles.length === 0" class="no-results">
        <p>No se encontraron perfiles con los filtros actuales</p>
        <p>Filtros activos: Distancia ≤ {{ filters.maxDistance }}km, Edad {{ filters.ageRange[0] }}-{{ filters.ageRange[1] }}</p>
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
              :src="profile.photos[0] || '/default-avatar.svg'" 
              :alt="profile.name"
              @error="e => e.target.src = '/default-avatar.svg'"
            />
            <div class="distance" v-if="profile.distance">
              {{ Math.round(profile.distance) }} km
            </div>
          </div>
          
          <div class="profile-info">
            <h3>{{ profile.name }}, {{ profile.age }}</h3>
            <p class="location">{{ profile.city }}</p>
            
            <!-- Estado de verificación -->
            <div class="verification-status">
              <div v-if="profile.isSuperVerified" class="verification-badge super-verified">
                <span class="badge-icon">✓✓</span>
                <span class="badge-text">Super</span>
              </div>
              <div v-else-if="profile.isVerified" class="verification-badge verified">
                <span class="badge-icon">✓</span>
                <span class="badge-text">Verificado</span>
              </div>
            </div>
            <p class="description">{{ truncateDescription(profile.description) }}</p>
            
            <div class="tags">
              <span class="tag">{{ profile.sexualOrientation }}</span>
              <span class="tag">{{ profile.relationshipType }}</span>
              <span v-if="profile.hasChildren" class="tag">Con hijos</span>
              <span v-if="profile.isMonogamous" class="tag">Monógamo</span>
            </div>
            
            <div class="profile-actions">
              <button 
                @click="dislikeProfile(profile, $event)" 
                class="btn btn-circle btn-danger"
                :disabled="false"
              >
                {{ hasDisliked(profile.id) ? '💔' : '👎' }}
              </button>
              <button 
                @click="likeProfile(profile, $event)" 
                class="btn btn-circle btn-success"
                :disabled="false"
              >
                {{ hasLiked(profile.id) ? '❤️' : '👍' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <MatchAnimation 
      v-if="showMatchAnimation" 
      :show="showMatchAnimation" 
      :matched-user="matchedUser" 
      :current-user="currentUserForMatch" 
      :match-id="matchId" 
      @close="closeMatchAnimation" 
      @send-message="sendMessageAfterMatch" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed, nextTick, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProfilesStore } from '@/stores/profiles';
import { useAuthStore } from '@/stores/auth';
import { getProfilesByFilters, getProfiles } from '@/services/profiles';
import { getUserLocation, calculateDistance } from '@/services/geolocation';
import { getLikesGiven, giveLike, removeLike } from '@/services/likes';
import { getDislikesGiven, giveDislike, removeDislike } from '@/services/dislikes';
import { getMatchIdBetweenUsers, getMatches } from '@/services/matches';
import MatchAnimation from '@/components/MatchAnimation.vue';
import type { UserProfile, FilterOptions } from '@/types';
import { useNotificationsStore } from '@/stores/notifications';
import { usePendingMatchesStore } from '@/stores/pendingMatches';

const router = useRouter();
const profilesStore = useProfilesStore();
const authStore = useAuthStore();
const notificationsStore = useNotificationsStore();
const pendingMatchesStore = usePendingMatchesStore();
const loading = ref(false);
// Usar computed para reactividad
const filteredProfiles = computed(() => profilesStore.filteredProfiles);

// Estado para mostrar/ocultar filtros en móvil
const showFilters = ref(true);
const isMobile = ref(window.innerWidth <= 700);

function handleResize() {
  isMobile.value = window.innerWidth <= 700;
  if (!isMobile.value) {
    showFilters.value = true;
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize);
  handleResize();
});
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('match-removed', handleMatchRemoved);
});

// Función para manejar el evento de match eliminado
const handleMatchRemoved = async (event: any) => {
  console.log('🔄 Match eliminado, recargando perfiles...');
  const { removedUserId, currentUserId } = event.detail;
  
  // Solo recargar si el match eliminado involucra al usuario actual
  if (currentUserId === authStore.user?.id) {
    // Recargar interacciones del usuario
    await loadUserInteractions();
    
    // Recargar matches del usuario
    await loadUserMatches();
    
    // Recargar perfiles
    await loadProfiles();
    
    // Actualizar el store de matches pendientes
    await pendingMatchesStore.loadPendingMatches(authStore.user.id);
    
    console.log('✅ Perfiles recargados después de eliminar match');
  }
};

watch(isMobile, (val) => {
  if (!val) showFilters.value = true;
});

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
  maxDistance: 50, // Distancia más razonable por defecto
  ageRange: [18, 100],
  gender: [], // Vacío para no filtrar por género
  sexualOrientation: [], // Vacío para no filtrar
  relationshipType: [], // Vacío para no filtrar
  hasChildren: undefined,
  isMonogamous: undefined,
  interactionStatus: [], // Vacío para no filtrar
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

const applyFilters = () => {
  console.log('🔍 Aplicando filtros automáticamente...');
  console.log('📊 Filtros actuales:', filters);
  
  // Mostrar indicador de carga
  loading.value = true;
  
  // Pequeño delay para mostrar el indicador
  setTimeout(() => {
    // Actualizar filtros en el store
    profilesStore.updateFilterOptions(filters);
    
    console.log(`✅ Filtros aplicados automáticamente. Perfiles filtrados: ${profilesStore.filteredProfiles.length}`);
    loading.value = false;
  }, 300);
};

// Variable para almacenar el temporizador de debounce
let distanceFilterTimeout: number | null = null;

// Watcher para debuggear cambios en maxDistance
watch(() => filters.maxDistance, (newValue, oldValue) => {
  console.log(`🎯 maxDistance cambió de ${oldValue} a ${newValue}`);
  console.log(`🎯 Tipo de nuevo valor:`, typeof newValue);
});

// Watcher para debuggear cambios en género
watch(() => filters.gender, (newValue, oldValue) => {
  console.log(`👥 Género cambió de ${oldValue} a ${newValue}`);
  console.log(`👥 Tipo de nuevo valor:`, typeof newValue);
});

// Función para aplicar el filtro de distancia con debounce
const debounceDistanceFilter = () => {
  // Mostrar el valor actual del filtro
  console.log(`🎯 Ajustando filtro de distancia: ${filters.maxDistance}km`);
  console.log(`🎯 Tipo de maxDistance:`, typeof filters.maxDistance);
  console.log(`🎯 Valor de maxDistance:`, filters.maxDistance);
  
  // Actualizar filtros en el store inmediatamente
  profilesStore.updateFilterOptions(filters);
  
  // Cancelar el temporizador anterior si existe
  if (distanceFilterTimeout) {
    clearTimeout(distanceFilterTimeout);
  }
  
  // Establecer un nuevo temporizador
  distanceFilterTimeout = setTimeout(() => {
    console.log(`🎯 Aplicando filtro de distancia: ${filters.maxDistance}km`);
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
      console.log('📍 Ubicación obtenida:', location);
      if (location) {
        profilesStore.setCurrentUserLocation(location);
        console.log('📍 Ubicación establecida en el store');
      } else {
        console.log('⚠️ No se pudo obtener ubicación, mostrando todos los perfiles');
        // Si no se puede obtener ubicación, mostrar todos los perfiles sin filtrar por distancia
        const allProfiles = await getProfiles(authStore.user.id);
        profilesStore.setProfiles(allProfiles, false);
        loading.value = false;
        return;
      }
    } else {
      console.log('📍 Ubicación ya disponible en el store:', profilesStore.currentUserLocation);
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
    
    console.log('📍 Ubicación del usuario:', profilesStore.currentUserLocation);
    console.log('📍 Distancia máxima configurada:', filters.maxDistance);
    console.log('📍 Tipo de distancia máxima:', typeof filters.maxDistance);
    
    // Si no hay distancia máxima configurada, mostrar todos los perfiles
    if (!filters.maxDistance || filters.maxDistance <= 0) {
      console.log('⚠️ No hay distancia máxima configurada, mostrando todos los perfiles');
      const allProfiles = await getProfiles(authStore.user.id);
      profilesStore.setProfiles(allProfiles, false);
      loading.value = false;
      return;
    }
    
    for (const profile of allProfiles) {
      console.log(`📍 Procesando perfil: ${profile.name}`);
      console.log(`📍 Ubicación del perfil:`, profile.location);
      
      // Si el perfil tiene ubicación, calcular distancia
      if (profile.location && profile.location.latitude && profile.location.longitude) {
        const distance = calculateDistance(
          profilesStore.currentUserLocation!.latitude,
          profilesStore.currentUserLocation!.longitude,
          profile.location.latitude,
          profile.location.longitude
        );
        
        console.log(`📍 Perfil ${profile.name}: distancia = ${distance}km, maxDistance = ${filters.maxDistance}km`);
        
        // Solo incluir perfiles dentro de la distancia máxima
        console.log(`🔍 Comparando: ${distance} <= ${filters.maxDistance} = ${distance <= filters.maxDistance}`);
        
        // Solo incluir perfiles dentro de la distancia máxima
        if (distance <= filters.maxDistance) {
          console.log(`✅ Perfil ${profile.name} incluido (dentro del rango: ${distance}km)`);
          filteredByDistance.push({
            ...profile,
            distance: distance
          });
        } else {
          console.log(`❌ Perfil ${profile.name} excluido (fuera del rango: ${distance}km)`);
        }
      } else {
        // Si el perfil no tiene ubicación, incluirlo de todas formas
        console.log(`⚠️ Perfil ${profile.name}: sin ubicación - incluyendo`);
        filteredByDistance.push({
          ...profile,
          distance: undefined
        });
      }
    }
    
    console.log(`Filtrados ${filteredByDistance.length} perfiles por distancia de ${filters.maxDistance}km`);
    
    // Aplicar otros filtros activos
    let finalFiltered = filteredByDistance;
    
    // Filtrar por edad
    finalFiltered = finalFiltered.filter(profile => 
      profile.age >= filters.ageRange[0] && profile.age <= filters.ageRange[1]
    );
    
    // Filtrar por género
    console.log(`👥 Filtro de género manual:`, filters.gender);
    if (filters.gender.length > 0) {
      finalFiltered = finalFiltered.filter(profile => {
        console.log(`👥 Perfil ${profile.name}: género = ${profile.gender}, filtros = ${filters.gender}`);
        const genderMatch = filters.gender.includes(profile.gender);
        if (!genderMatch) {
          console.log(`❌ Perfil ${profile.name} descartado por género: ${profile.gender}`);
        } else {
          console.log(`✅ Perfil ${profile.name} incluido por género: ${profile.gender}`);
        }
        return genderMatch;
      });
      console.log(`👥 Perfiles después de filtro de género manual: ${finalFiltered.length}`);
    }
    
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
    finalFiltered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    
    console.log(`Resultado final: ${finalFiltered.length} perfiles`);
    
    // Actualizar perfiles en el store sin aplicar filtros automáticamente
    profilesStore.setProfiles(finalFiltered, true);
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
  if (!matchId) {
    notificationsStore.error('Error', 'El chat aún no está listo. Espera un momento e inténtalo de nuevo.');
    return;
  }
  // Navegar a la página de matches en lugar de ir directamente al chat
  router.push({ name: 'matches' });
};

// Función para dar like a un perfil
const likeProfile = async (profile: UserProfile, event: Event) => {
  event.stopPropagation();
  if (!authStore.user) return;

  // Si ya diste dislike, elimina el dislike y espera a que termine
  if (hasDisliked(profile.id)) {
    await removeDislike(authStore.user.id, profile.id);
    userDislikes.value = userDislikes.value.filter(id => id !== profile.id);
    // Espera un pequeño delay para asegurar que la base de datos se actualiza
    await new Promise(res => setTimeout(res, 200));
  }

  try {
    let result = await giveLike(authStore.user.id, profile.id);
    if (!hasLiked(profile.id)) userLikes.value.push(profile.id);

    // Si hay match pero no matchId, intenta recuperarlo
    if (result.isMatch && !result.matchId) {
      // Espera y vuelve a consultar el matchId
      await new Promise(res => setTimeout(res, 400));
      result.matchId = await getMatchIdBetweenUsers(authStore.user.id, profile.id);
    }

    if (result.isMatch && result.matchId) {
      matchedUser.value = {
        id: profile.id,
        name: profile.name,
        age: profile.age,
        city: profile.city,
        photos: profile.photos,
      };
      matchId.value = result.matchId;
        currentUserForMatch.value = {
          id: authStore.user.id,
          name: authStore.user.name,
          photo: authStore.user.photos && authStore.user.photos.length > 0 ? authStore.user.photos[0] : null
        };
      showMatchAnimation.value = true;
      
      // Actualizar la lista de matches en el store para excluir este perfil de la búsqueda
      const currentMatches = profilesStore.userMatches;
      if (!currentMatches.includes(profile.id)) {
        profilesStore.setUserMatches([...currentMatches, profile.id]);
      }
      
      // Actualizar el store de matches pendientes para que se actualice el contador en el menú
      await pendingMatchesStore.loadPendingMatches(authStore.user.id);
    }
  } catch (error) {
    console.error(`Error dando like a ${profile.name}:`, error);
  }
};

// Función para dar dislike a un perfil
const dislikeProfile = async (profile: UserProfile, event: Event) => {
  event.stopPropagation();
  if (!authStore.user) return;

  // Si ya diste like, elimina el like antes de dar dislike
  if (hasLiked(profile.id)) {
    await removeLike(authStore.user.id, profile.id);
    userLikes.value = userLikes.value.filter(id => id !== profile.id);
  }
  
  try {
    await giveDislike(authStore.user.id, profile.id);
    if (!hasDisliked(profile.id)) userDislikes.value.push(profile.id);
    console.log(`👎 Dislike dado a ${profile.name}`);
  } catch (error) {
    console.error(`Error dando dislike a ${profile.name}:`, error);
  }
};

const truncateDescription = (description: string) => {
  return description.length > 100 ? description.substring(0, 100) + '...' : description;
};

const loadProfiles = async () => {
  loading.value = true;
  try {
    if (!authStore.user) {
      authStore.loadUserFromStorage();
      if (!authStore.user) {
        loading.value = false;
        notificationsStore.error('Error', 'Debes iniciar sesión para ver los perfiles.');
        return;
      }
    }
    
    console.log('🔄 Cargando perfiles...');
    
    // Obtener ubicación o fallback
    if (!profilesStore.currentUserLocation) {
      try {
        const location = await getUserLocation();
        if (location) {
          profilesStore.setCurrentUserLocation(location);
          console.log('📍 Ubicación obtenida:', location);
        } else {
          profilesStore.setCurrentUserLocation({ latitude: 40.416775, longitude: -3.703790 });
          console.log('📍 Usando ubicación por defecto (Madrid)');
        }
      } catch (error) {
        profilesStore.setCurrentUserLocation({ latitude: 40.416775, longitude: -3.703790 });
        console.log('📍 Usando ubicación por defecto por error');
      }
    }
    
    // Cargar perfiles
    const allProfiles = await getProfiles(authStore.user.id);
    console.log(`📋 Cargados ${allProfiles.length} perfiles totales`);
    
    // Actualizar filtros en el store
    profilesStore.updateFilterOptions(filters);
    
    // Establecer perfiles en el store
    profilesStore.setProfiles(allProfiles, false);
    
    console.log(`✅ Perfiles cargados: ${profilesStore.profiles.length}`);
    console.log(`✅ Perfiles filtrados: ${profilesStore.filteredProfiles.length}`);
    
  } catch (error) {
    console.error('❌ Error cargando perfiles:', error);
    notificationsStore.error('Error', 'No se pudieron cargar los perfiles. Intenta de nuevo.');
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

const loadUserMatches = async () => {
  if (!authStore.user) return;
  
  try {
    // Cargar matches del usuario
    const matches = await getMatches(authStore.user.id);
    console.log(`💕 Cargados ${matches.length} matches del usuario`);
    
    // Extraer los IDs de los usuarios con los que tiene match
    const matchUserIds = matches.map(match => {
      // El match tiene dos usuarios, obtener el que no es el usuario actual
      return match.users.find(userId => userId !== authStore.user!.id) || '';
    }).filter(id => id !== '');
    
    console.log(`💕 IDs de usuarios con match: ${matchUserIds.length}`);
    
    // Establecer los matches en el store para excluirlos de la búsqueda
    profilesStore.setUserMatches(matchUserIds);
  } catch (error) {
    console.error('Error cargando matches del usuario:', error);
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
      
      // Cargar matches del usuario para excluirlos de la búsqueda
      await loadUserMatches();
      
      // Cargar perfiles con la ubicación ya establecida
      loadProfiles();
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      // Usar ubicación por defecto en caso de error
      profilesStore.setCurrentUserLocation({ latitude: 40.416775, longitude: -3.703790 });
      loadProfiles();
    }
  }
  
  // Escuchar evento de match eliminado para recargar perfiles
  window.addEventListener('match-removed', handleMatchRemoved);
});




</script>

<style scoped>
.profile-list-container {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 30px;
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.filters-sidebar {
  background: var(--wa-card);
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  height: fit-content;
  position: sticky;
  top: 1rem;
  transition: all 0.3s ease;
}

.mobile-hidden {
  display: none !important;
}

.toggle-filters-btn {
  display: none;
}

.filters-form {
  /* No need for h3 here as it's already in the sidebar */
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
  gap: 1px;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  text-transform: none;
  letter-spacing: normal;
  font-size: 0.9rem;
  color: #555;
  cursor: pointer;
  padding: 1px 0;
  transition: background-color 0.2s;
  border-radius: 4px;
}

.checkbox-group label:hover {
  background-color: rgba(7, 94, 84, 0.1);
}

.checkbox-group input[type="checkbox"] {
  width: 16px;
  height: 16px;
  margin: 0;
  cursor: pointer;
  accent-color: var(--wa-green);
  flex-shrink: 0;
}

.checkbox-group input[type="checkbox"]:checked {
  background-color: var(--wa-green);
  border-color: var(--wa-green);
}

.checkbox-group input[type="checkbox"]:focus {
  outline: 2px solid var(--wa-green-light);
  outline-offset: 2px;
}

.profiles {
  min-height: 400px;
}

.loading, .no-results {
  text-align: center;
  padding: 40px;
  color: #666;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  color: var(--wa-green);
  font-weight: 600;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e6e6e6;
  border-top: 2px solid var(--wa-green);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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

.location {
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

/* Estilos para el estado de verificación */
.verification-status {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.verification-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.super-verified {
  background-color: #e6ffea; /* Verde pastel claro */
  color: #38a169;
  border: 1px solid #a8e6b4;
}

.verified {
  background-color: #e6ffea; /* Verde pastel claro */
  color: #38a169;
  border: 1px solid #a8e6b4;
}

.badge-icon {
  font-size: 1rem;
}

.badge-text {
  font-weight: 600;
}

.filter-debug {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed #ddd;
}

/* Responsive */
@media (max-width: 1024px) {
  .profile-list-container {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 15px;
  }
  
  .filters-sidebar {
    position: static;
    order: -1;
  }

  .toggle-filters-btn {
    display: block;
    margin: 1rem auto;
  }
}

/* Ocultar botón de filtros en desktop */
@media (min-width: 769px) {
  .filters-toggle {
    display: none;
  }
}

/* Responsive para móvil */
@media (max-width: 768px) {
  .profile-list-container {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
  }
  
  .filters-sidebar {
    display: none;
    margin-bottom: 1rem;
    position: static;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.3s ease;
  }
  
  .filters-sidebar.show {
    display: block;
    opacity: 1;
    transform: translateY(0);
  }
  
  .filter-group {
    margin-bottom: 1rem;
  }
  
  .filter-group label {
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }
  
  .age-range {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .age-range input {
    width: 100%;
    text-align: center;
  }
  
  .checkbox-group {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1px;
  }
  
  .checkbox-group label {
    padding: 2px;
    border-radius: 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    min-height: 28px;
    display: flex;
    align-items: center;
    font-size: 0.9rem;
  }
  
  .checkbox-group input[type="checkbox"] {
    width: 18px;
    height: 18px;
    margin-right: 8px;
  }
  
  .profiles-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .profile-card {
    max-width: none;
    margin: 0;
  }
  
  .profile-info {
    padding: 12px;
  }
  
  .profile-image {
    height: 160px;
  }
  
  .profile-info h3 {
    font-size: 1.1rem;
  }
  
  .description {
    font-size: 0.9rem;
    line-height: 1.3;
  }
  
  .tags {
    gap: 4px;
  }
  
  .tag {
    font-size: 10px;
    padding: 4px 8px;
  }
  
  .profile-actions {
    gap: 0.5rem;
  }
  
  .action-btn {
    padding: 0.5rem;
    font-size: 1.2rem;
    min-height: 44px;
  }
  
  .verification-badge {
    font-size: 0.7rem;
    padding: 3px 6px;
  }
  
  .badge-icon {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .profile-list-container {
    padding: 5px;
    gap: 10px;
  }
  
  .filters-sidebar {
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .filter-group {
    margin-bottom: 1rem;
  }
  
  .filter-group label {
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }
  
  .age-range {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .age-range input {
    width: 100%;
    text-align: center;
  }
  
  .checkbox-group {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1px;
  }
  
  .checkbox-group label {
    padding: 2px;
    border-radius: 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    min-height: 28px;
    display: flex;
    align-items: center;
    font-size: 0.9rem;
  }
  
  .checkbox-group input[type="checkbox"] {
    width: 18px;
    height: 18px;
    margin-right: 8px;
  }
  
  .profiles-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .profile-card {
    max-width: none;
    margin: 0;
  }
  
  .profile-info {
    padding: 12px;
  }
  
  .profile-image {
    height: 160px;
  }
  
  .profile-info h3 {
    font-size: 1.1rem;
  }
  
  .description {
    font-size: 0.9rem;
    line-height: 1.3;
  }
  
  .tags {
    gap: 4px;
  }
  
  .tag {
    font-size: 10px;
    padding: 4px 8px;
  }
  
  .profile-actions {
    gap: 0.5rem;
  }
  
  .action-btn {
    padding: 0.5rem;
    font-size: 1.2rem;
    min-height: 44px;
  }
  
  .verification-badge {
    font-size: 0.7rem;
    padding: 3px 6px;
  }
  
  .badge-icon {
    font-size: 0.9rem;
  }
}

@media (max-width: 360px) {
  .profile-list-container {
    padding: 2px;
    gap: 8px;
  }
  
  .toggle-filters-btn {
    padding: 0.6rem 0.8rem;
    font-size: 0.8rem;
    margin-bottom: 0.5rem;
  }
  
  .toggle-filters-btn .toggle-icon {
    font-size: 1rem;
  }
  
  .btn {
    font-size: 0.8rem;
    padding: 0.6rem 0.8rem;
  }
  
  .btn-circle {
    width: 40px;
    height: 40px;
  }
  
  .filters-sidebar {
    padding: 0.75rem;
  }
  
  .checkbox-group label {
    padding: 1px;
    font-size: 0.8rem;
    min-height: 20px;
  }
  
  .checkbox-group input[type="checkbox"] {
    width: 16px;
    height: 16px;
  }
  
  .profile-info {
    padding: 10px;
  }
  
  .profile-image {
    height: 140px;
  }
  
  .profile-info h3 {
    font-size: 1rem;
  }
  
  .description {
    font-size: 0.8rem;
  }
}

/* Capacitor específico */
@media (max-width: 480px) and (orientation: landscape) {
  .profile-list-container {
    padding: 2px;
    gap: 5px;
  }
  
  .toggle-filters-btn {
    padding: 0.5rem 0.8rem;
    font-size: 0.75rem;
    margin-bottom: 0.5rem;
  }
  
  .toggle-filters-btn .toggle-icon {
    font-size: 0.9rem;
  }
  
  .btn {
    font-size: 0.75rem;
    padding: 0.5rem 0.8rem;
  }
  
  .btn-circle {
    width: 36px;
    height: 36px;
  }
  
  .filters-sidebar {
    padding: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .checkbox-group label {
    padding: 1px;
    font-size: 0.75rem;
    min-height: 20px;
  }
  
  .checkbox-group input[type="checkbox"] {
    width: 14px;
    height: 14px;
  }
  
  .profile-image {
    height: 120px;
  }
  
  .profile-info {
    padding: 8px;
  }
  
  .profile-info h3 {
    font-size: 0.9rem;
    margin-bottom: 4px;
  }
  
  .description {
    font-size: 0.75rem;
    margin-bottom: 8px;
  }
  
  .tags {
    gap: 2px;
  }
  
  .tag {
    font-size: 8px;
    padding: 2px 6px;
  }
}

/* Touch optimizations */
@media (hover: none) and (pointer: coarse) {
  .profile-card {
    cursor: default;
  }
  
  .btn-circle {
    min-height: 48px;
    min-width: 48px;
  }
  
  .checkbox-group label {
    min-height: 44px;
    display: flex;
    align-items: center;
  }
}



.debug-info {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #666;
}

.debug-info p {
  margin: 0.25rem 0;
}

/* Estilos base para todos los botones */
.btn {
  border: none;
  border-radius: 0.75rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0.75rem 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-decoration: none;
  min-height: 44px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* Botón primario (verde) */
.btn-primary {
  background: var(--wa-green);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--wa-green-dark);
}

/* Botón secundario (azul) */
.btn-secondary {
  background: var(--wa-primary);
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: var(--wa-primary-dark);
}

/* Botón de peligro (rojo) */
.btn-danger {
  background: var(--wa-danger);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc3545;
}

/* Botón de advertencia (naranja) */
.btn-warning {
  background: #ffc107;
  color: #333;
}

.btn-warning:hover:not(:disabled) {
  background: #e0a800;
}

/* Botón de información (azul claro) */
.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: #138496;
}

/* Botón de éxito (verde claro) */
.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #218838;
}

/* Botón pequeño */
.btn-sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  min-height: 36px;
}

/* Botón grande */
.btn-lg {
  padding: 1rem 1.5rem;
  font-size: 1rem;
  min-height: 52px;
}

/* Botón de ancho completo */
.btn-block {
  width: 100%;
}

/* Botón circular (para acciones) */
.btn-circle {
  border-radius: 50%;
  width: 44px;
  height: 44px;
  padding: 0;
  min-height: 44px;
}

.btn-circle.btn-sm {
  width: 36px;
  height: 36px;
  min-height: 36px;
}

.btn-circle.btn-lg {
  width: 52px;
  height: 52px;
  min-height: 52px;
}

/* Botón de toggle de filtros coherente con el estilo de WhatsApp */
.filters-toggle {
  display: flex;
  background: var(--wa-green);
  color: white;
  border: none;
  padding: 1rem 1.5rem;
  border-radius: var(--wa-radius);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  width: 100%;
  transition: all 0.2s ease;
  box-shadow: var(--wa-shadow);
  align-items: center;
  justify-content: center;
  font-family: var(--wa-font);
  min-height: 44px;
}

.filters-toggle:hover {
  background: var(--wa-green-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(7, 94, 84, 0.3);
}

.filters-toggle.active {
  background: var(--wa-danger);
}

.filters-toggle.active:hover {
  background: #c82333;
}

.filters-toggle .toggle-icon {
  font-size: 1.2rem;
  margin-right: 0.5rem;
  transition: transform 0.2s ease;
}

.filters-toggle:hover .toggle-icon {
  transform: scale(1.1);
}

.filters-toggle .toggle-text {
  font-weight: 600;
  letter-spacing: 0.3px;
}
</style> 