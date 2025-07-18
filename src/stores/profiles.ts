import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { UserProfile, FilterOptions } from '@/types';

export const useProfilesStore = defineStore('profiles', () => {
  const profiles = ref<UserProfile[]>([]);
  const filteredProfiles = ref<UserProfile[]>([]);
  const loading = ref(false);
  const currentUserLocation = ref<{ latitude: number; longitude: number } | null>(null);

  const filterOptions = ref<FilterOptions>({
    maxDistance: 100,
    ageRange: [18, 100],
    gender: [], // Agregar campo faltante
    sexualOrientation: [],
    relationshipType: [],
    hasChildren: undefined,
    isMonogamous: undefined,
  });

  const setProfiles = (newProfiles: UserProfile[]) => {
    profiles.value = newProfiles;
    applyFilters();
  };

  const setCurrentUserLocation = (location: { latitude: number; longitude: number }) => {
    currentUserLocation.value = location;
    calculateDistances();
  };

  const calculateDistances = () => {
    if (!currentUserLocation.value) return;

    profiles.value = profiles.value.map(profile => {
      const distance = calculateDistance(
        currentUserLocation.value!.latitude,
        currentUserLocation.value!.longitude,
        profile.location?.latitude || 0,
        profile.location?.longitude || 0
      );
      return { ...profile, distance };
    });
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const applyFilters = () => {
    let filtered = [...profiles.value];

    // Filtrar por distancia
    if (filterOptions.value.maxDistance > 0) {
      filtered = filtered.filter(profile => 
        !profile.distance || profile.distance <= filterOptions.value.maxDistance
      );
    }

    // Filtrar por rango de edad
    filtered = filtered.filter(profile => 
      profile.age >= filterOptions.value.ageRange[0] && 
      profile.age <= filterOptions.value.ageRange[1]
    );

    // Filtrar por orientación sexual
    if (filterOptions.value.sexualOrientation.length > 0) {
      filtered = filtered.filter(profile => 
        filterOptions.value.sexualOrientation.includes(profile.sexualOrientation)
      );
    }

    // Filtrar por tipo de relación
    if (filterOptions.value.relationshipType.length > 0) {
      filtered = filtered.filter(profile => 
        filterOptions.value.relationshipType.includes(profile.relationshipType)
      );
    }

    // Filtrar por hijos
    if (filterOptions.value.hasChildren !== undefined) {
      filtered = filtered.filter(profile => 
        profile.hasChildren === filterOptions.value.hasChildren
      );
    }

    // Filtrar por monogamia
    if (filterOptions.value.isMonogamous !== undefined) {
      filtered = filtered.filter(profile => 
        profile.isMonogamous === filterOptions.value.isMonogamous
      );
    }

    filteredProfiles.value = filtered;
  };

  const updateFilterOptions = (newOptions: Partial<FilterOptions>) => {
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
    setProfiles,
    setCurrentUserLocation,
    updateFilterOptions,
    setLoading,
    applyFilters,
  };
}); 