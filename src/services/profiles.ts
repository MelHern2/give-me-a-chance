import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { UserProfile } from '@/types';
import { 
  filterUsersByDistance, 
  sortUsersByDistance, 
  getUserLocation,
  calculateDistance,
  type Location 
} from '@/services/geolocation';

export const getProfiles = async (currentUserId: string): Promise<UserProfile[]> => {
  try {
    console.log('🔄 Obteniendo perfiles para usuario:', currentUserId);
    const usersRef = collection(db, 'users');
    
    // Obtener todos los usuarios y filtrar en el cliente para evitar problemas de índice
    const q = query(
      usersRef,
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    
    console.log('📋 Ejecutando query en Firestore...');
    const querySnapshot = await getDocs(q);
    console.log(`📊 Query completada. Documentos encontrados: ${querySnapshot.size}`);
    
    const profiles: UserProfile[] = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      console.log('👤 Procesando usuario:', userData.name, 'ID:', userData.id);
      
      // Filtrar el usuario actual en el cliente
      if (userData.id !== currentUserId) {
        const profile: UserProfile = {
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
        };
        
        console.log('✅ Perfil agregado:', profile.name);
        profiles.push(profile);
      } else {
        console.log('❌ Usuario actual filtrado:', userData.name);
      }
    });
    
    // Eliminar duplicados basados en el ID
    const uniqueProfiles = profiles.filter((profile, index, self) => 
      index === self.findIndex(p => p.id === profile.id)
    );
    
    console.log(`🎉 Perfiles únicos obtenidos: ${uniqueProfiles.length}`);
    return uniqueProfiles;
  } catch (error) {
    console.error('❌ Error getting profiles:', error);
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
      try {
        userLocation = await getUserLocation();
        console.log('📍 Ubicación obtenida:', userLocation);
      } catch (error) {
        console.error('Error obteniendo ubicación:', error);
        // Usar ubicación por defecto si no se puede obtener la real
        userLocation = { latitude: 40.416775, longitude: -3.703790 }; // Madrid como ejemplo
      }
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
      console.log(`📍 Filtrando por distancia: ${filters.maxDistance}km con ubicación:`, userLocation);
      const beforeCount = filteredProfiles.length;
      
      // Crear un array para almacenar perfiles con sus distancias
      const profilesWithDistance = [];
      
      // Calcular distancias para cada perfil
      for (const profile of filteredProfiles) {
        if (profile.location && profile.location.latitude && profile.location.longitude) {
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            profile.location.latitude,
            profile.location.longitude
          );
          
          console.log(`Perfil ${profile.name}: distancia = ${distance}km, maxDistance = ${filters.maxDistance}km`);
          
          // Solo incluir perfiles dentro de la distancia máxima
          if (distance <= filters.maxDistance) {
            profilesWithDistance.push({
              ...profile,
              distance: distance
            });
          }
        }
      }
      
      // Reemplazar los perfiles filtrados con los que están dentro de la distancia
      filteredProfiles = profilesWithDistance;
      
      console.log(`📍 Perfiles filtrados por distancia: ${beforeCount} -> ${filteredProfiles.length}`);
      
      // Ordenar por distancia
      filteredProfiles.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    } else {
      console.log('⚠️ No se pudo aplicar filtro de distancia:', { maxDistance: filters.maxDistance, hasLocation: !!userLocation });
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

export const getProfileById = async (profileId: string): Promise<UserProfile> => {
  try {
    // Buscar por email (que es el ID que usamos en los datos de prueba)
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('id', '==', profileId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Perfil no encontrado');
    }
    
    const userData = querySnapshot.docs[0].data();
    
    return {
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
    };
  } catch (error) {
    console.error('Error getting profile by ID:', error);
    throw error;
  }
}; 