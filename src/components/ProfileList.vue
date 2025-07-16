<template>
  <div class="profile-list">
    <div class="filters">
      <h3>Filtros</h3>
      <div class="filter-group">
        <label>Distancia máxima (km)</label>
        <input 
          type="range" 
          v-model="filters.maxDistance" 
          min="1" 
          max="1000" 
          @input="updateFilters"
        />
        <span>{{ filters.maxDistance }} km</span>
      </div>

      <div class="filter-group">
        <label>Rango de edad</label>
        <div class="age-range">
          <input 
            type="number" 
            v-model.number="filters.ageRange[0]" 
            min="18" 
            max="100"
            @input="updateFilters"
          />
          <span>-</span>
          <input 
            type="number" 
            v-model.number="filters.ageRange[1]" 
            min="18" 
            max="100"
            @input="updateFilters"
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
              @change="updateFilters"
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
              @change="updateFilters"
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
              @change="updateFilters"
            />
            {{ type.label }}
          </label>
        </div>
      </div>
    </div>

    <div class="profiles">
      <div v-if="loading" class="loading">
        Cargando perfiles...
      </div>
      
      <div v-else-if="filteredProfiles.length === 0" class="no-results">
        No se encontraron perfiles con los filtros actuales
      </div>
      
      <div v-else class="profiles-grid">
        <div 
          v-for="profile in filteredProfiles" 
          :key="profile.id" 
          class="profile-card"
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
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useProfilesStore } from '@/stores/profiles';
import { useAuthStore } from '@/stores/auth';
import { getProfilesByFilters } from '@/services/profiles';
import type { UserProfile, FilterOptions } from '@/types';

const profilesStore = useProfilesStore();
const authStore = useAuthStore();
const loading = ref(false);
const { filteredProfiles } = profilesStore;

const filters = reactive<FilterOptions>({
  maxDistance: 1000,
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

const viewProfile = (profile: UserProfile) => {
  // Navegar al perfil detallado
  console.log('Ver perfil:', profile);
};

const truncateDescription = (description: string) => {
  return description.length > 100 ? description.substring(0, 100) + '...' : description;
};

const loadProfiles = async () => {
  loading.value = true;
  try {
    if (!authStore.user) {
      console.log('Usuario no autenticado');
      return;
    }

    // Obtener perfiles reales desde Firestore
    const profiles = await getProfilesByFilters(authStore.user.id, {
      ageRange: filters.ageRange,
      gender: filters.gender, // Nuevo campo
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

onMounted(() => {
  loadProfiles();
});
</script>

<style scoped>
.profile-list {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 30px;
  padding: 20px;
}

.filters {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  height: fit-content;
}

.filter-group {
  margin-bottom: 20px;
}

.filter-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.age-range {
  display: flex;
  align-items: center;
  gap: 10px;
}

.age-range input {
  width: 80px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
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
  font-weight: normal;
}

.profiles {
  min-height: 400px;
}

.loading, .no-results {
  text-align: center;
  padding: 40px;
  color: #666;
}

.profiles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.profile-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
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
  color: #333;
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
  background: #e9ecef;
  color: #495057;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}
</style> 