import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { UserProfile, FilterOptions } from '@/types';
import { calculateDistance } from '@/services/geolocation';

export const useProfilesStore = defineStore('profiles', () => {
  const profiles = ref<UserProfile[]>([]);
  const filteredProfiles = ref<UserProfile[]>([]);
  const loading = ref(false);
  const currentUserLocation = ref<{ latitude: number; longitude: number } | null>(null);
  const userMatches = ref<string[]>([]); // IDs de usuarios con los que ya tienes match

  const filterOptions = ref<FilterOptions>({
    maxDistance: 500, // Aumentar distancia por defecto
    ageRange: [18, 100],
    gender: [],
    sexualOrientation: [],
    relationshipType: [],
    hasChildren: undefined,
    isMonogamous: undefined,
    interactionStatus: [], // Array vacío para no filtrar
  });

  const setProfiles = (newProfiles: UserProfile[], skipFilters = false) => {
    console.log(`📊 Estableciendo ${newProfiles.length} perfiles en el store`);
    profiles.value = newProfiles;
    if (!skipFilters) {
      applyFilters();
    }
  };

  const setUserMatches = (matches: string[]) => {
    console.log(`💕 Estableciendo ${matches.length} matches del usuario en el store`);
    userMatches.value = matches;
    applyFilters(); // Reaplicar filtros para excluir matches
  };

  const setCurrentUserLocation = (location: { latitude: number; longitude: number }) => {
    console.log('📍 Estableciendo ubicación en el store:', location);
    currentUserLocation.value = location;
    calculateDistances();
  };

  const calculateDistances = () => {
    if (!currentUserLocation.value) {
      console.log('⚠️ No hay ubicación para calcular distancias');
      return;
    }

    console.log('📍 Calculando distancias para', profiles.value.length, 'perfiles');
    
    profiles.value = profiles.value.map(profile => {
      if (profile.location && profile.location.latitude && profile.location.longitude) {
        const distance = calculateDistance(
          currentUserLocation.value!.latitude,
          currentUserLocation.value!.longitude,
          profile.location.latitude,
          profile.location.longitude
        );
        return { ...profile, distance };
      } else {
        console.log(`⚠️ Perfil ${profile.name} no tiene ubicación válida`);
        return { ...profile, distance: undefined };
      }
    });
    
    console.log('✅ Distancias calculadas');
  };

  const applyFilters = () => {
    console.log('🔍 Aplicando filtros en el store...');
    let filtered = [...profiles.value];
    console.log(`📊 Perfiles iniciales en store: ${filtered.length}`);

    // Filtrar por distancia
    if (filterOptions.value.maxDistance > 0) {
      filtered = filtered.filter(profile => {
        // Si no hay distancia calculada, incluir el perfil
        if (profile.distance === undefined) {
          console.log(`⚠️ Perfil ${profile.name} sin distancia calculada - incluyendo`);
          return true;
        }
        
        const hasValidDistance = profile.distance <= filterOptions.value.maxDistance;
        if (!hasValidDistance) {
          console.log(`❌ Perfil ${profile.name} descartado por distancia: ${profile.distance}km > ${filterOptions.value.maxDistance}km`);
        }
        return hasValidDistance;
      });
      console.log(`📍 Perfiles después de filtro de distancia: ${filtered.length}`);
    }

    // Filtrar por rango de edad
    filtered = filtered.filter(profile => {
      const ageInRange = profile.age >= filterOptions.value.ageRange[0] && profile.age <= filterOptions.value.ageRange[1];
      if (!ageInRange) {
        console.log(`❌ Perfil ${profile.name} descartado por edad: ${profile.age} años`);
      }
      return ageInRange;
    });
    console.log(`🎂 Perfiles después de filtro de edad: ${filtered.length}`);

    // Filtrar por género
    console.log(`👥 Filtro de género activo:`, filterOptions.value.gender);
    if (filterOptions.value.gender.length > 0) {
      filtered = filtered.filter(profile => {
        console.log(`👥 Perfil ${profile.name}: género = ${profile.gender}, filtros = ${filterOptions.value.gender}`);
        const genderMatch = filterOptions.value.gender.includes(profile.gender);
        if (!genderMatch) {
          console.log(`❌ Perfil ${profile.name} descartado por género: ${profile.gender}`);
        } else {
          console.log(`✅ Perfil ${profile.name} incluido por género: ${profile.gender}`);
        }
        return genderMatch;
      });
      console.log(`👥 Perfiles después de filtro de género: ${filtered.length}`);
    }

    // Filtrar por orientación sexual
    if (filterOptions.value.sexualOrientation.length > 0) {
      filtered = filtered.filter(profile => {
        const orientationMatch = filterOptions.value.sexualOrientation.includes(profile.sexualOrientation);
        if (!orientationMatch) {
          console.log(`❌ Perfil ${profile.name} descartado por orientación: ${profile.sexualOrientation}`);
        }
        return orientationMatch;
      });
      console.log(`💕 Perfiles después de filtro de orientación: ${filtered.length}`);
    }

    // Filtrar por tipo de relación
    if (filterOptions.value.relationshipType.length > 0) {
      filtered = filtered.filter(profile => {
        const relationshipMatch = filterOptions.value.relationshipType.includes(profile.relationshipType);
        if (!relationshipMatch) {
          console.log(`❌ Perfil ${profile.name} descartado por tipo de relación: ${profile.relationshipType}`);
        }
        return relationshipMatch;
      });
      console.log(`💑 Perfiles después de filtro de relación: ${filtered.length}`);
    }

    // Filtrar por matches (excluir usuarios con los que ya tienes match)
    if (userMatches.value.length > 0) {
      filtered = filtered.filter(profile => {
        const isMatch = userMatches.value.includes(profile.id);
        if (isMatch) {
          console.log(`❌ Perfil ${profile.name} descartado por ser match`);
        }
        return !isMatch;
      });
      console.log(`💕 Perfiles después de filtrar matches: ${filtered.length}`);
    }

    // Ordenar por distancia
    filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    console.log(`✅ Filtros aplicados en store. Perfiles finales: ${filtered.length}`);
    filteredProfiles.value = filtered;
  };

  const updateFilterOptions = (newOptions: Partial<FilterOptions>) => {
    console.log('🔄 Actualizando filtros en store:', newOptions);
    filterOptions.value = { ...filterOptions.value, ...newOptions };
    applyFilters();
  };

  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading;
  };

  return {
    profiles,
    filteredProfiles,
    loading,
    filterOptions,
    currentUserLocation,
    userMatches,
    setProfiles,
    setUserMatches,
    setCurrentUserLocation,
    updateFilterOptions,
    setLoading,
    applyFilters,
  };
}); 