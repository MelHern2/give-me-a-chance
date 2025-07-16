import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { UserProfile } from '@/types';
import { 
  filterUsersByDistance, 
  sortUsersByDistance, 
  getUserLocation,
  type Location 
} from '@/services/geolocation';

export const getProfiles = async (currentUserId: string): Promise<UserProfile[]> => {
  try {
    const usersRef = collection(db, 'users');
    
    // Obtener todos los usuarios y filtrar en el cliente para evitar problemas de índice
    const q = query(
      usersRef,
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    
    const querySnapshot = await getDocs(q);
    const profiles: UserProfile[] = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      // Filtrar el usuario actual en el cliente
      if (userData.id !== currentUserId) {
        profiles.push({
          id: userData.id,
          name: userData.name,
          age: userData.age,
          gender: userData.gender,
          country: userData.country,
          region: userData.region,
          city: userData.city,
          religion: userData.religion,
          isMonogamous: userData.isMonogamous,
          sexualOrientation: userData.sexualOrientation,
          politicalOrientation: userData.politicalOrientation,
          hasChildren: userData.hasChildren,
          relationshipType: userData.relationshipType,
          description: userData.description,
          photos: userData.photos || [],
          location: userData.location,
        });
      }
    });
    
    return profiles;
  } catch (error) {
    console.error('Error getting profiles:', error);
    throw error;
  }
};

export const getProfilesByFilters = async (
  currentUserId: string,
  filters: {
    maxDistance?: number;
    ageRange?: [number, number];
    gender?: string[];
    sexualOrientation?: string[];
    relationshipType?: string[];
    hasChildren?: boolean;
    isMonogamous?: boolean;
  }
): Promise<UserProfile[]> => {
  try {
    const allProfiles = await getProfiles(currentUserId);
    let filteredProfiles = allProfiles;

    // Obtener ubicación del usuario actual para filtros de distancia
    let userLocation: Location | null = null;
    if (filters.maxDistance) {
      userLocation = await getUserLocation();
    }

    // Filtrar por género
    if (filters.gender && filters.gender.length > 0) {
      filteredProfiles = filteredProfiles.filter(
        profile => filters.gender!.includes(profile.gender)
      );
    }

    // Aplicar filtros
    if (filters.ageRange) {
      filteredProfiles = filteredProfiles.filter(
        profile => profile.age >= filters.ageRange![0] && profile.age <= filters.ageRange![1]
      );
    }

    if (filters.sexualOrientation && filters.sexualOrientation.length > 0) {
      filteredProfiles = filteredProfiles.filter(
        profile => filters.sexualOrientation!.includes(profile.sexualOrientation)
      );
    }

    if (filters.relationshipType && filters.relationshipType.length > 0) {
      filteredProfiles = filteredProfiles.filter(
        profile => filters.relationshipType!.includes(profile.relationshipType)
      );
    }

    if (filters.hasChildren !== undefined) {
      filteredProfiles = filteredProfiles.filter(
        profile => profile.hasChildren === filters.hasChildren
      );
    }

    if (filters.isMonogamous !== undefined) {
      filteredProfiles = filteredProfiles.filter(
        profile => profile.isMonogamous === filters.isMonogamous
      );
    }

    // Filtrar por distancia si se especifica
    if (filters.maxDistance && userLocation) {
      filteredProfiles = filterUsersByDistance(filteredProfiles, userLocation, filters.maxDistance);
    }

    // Ordenar por distancia si hay ubicación
    if (userLocation) {
      filteredProfiles = sortUsersByDistance(filteredProfiles, userLocation);
    }

    return filteredProfiles;
  } catch (error) {
    console.error('Error getting filtered profiles:', error);
    throw error;
  }
}; 