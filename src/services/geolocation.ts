// Servicio de geolocalización para calcular distancias

export interface Location {
  latitude: number;
  longitude: number;
}

export interface UserLocation {
  userId: string;
  location: Location;
  lastUpdated: Date;
}

// Calcular distancia entre dos puntos usando la fórmula de Haversine
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  // Verificar que los parámetros son números válidos
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    console.error('Coordenadas inválidas:', { lat1, lon1, lat2, lon2 });
    return 9999; // Valor grande para que no pase el filtro
  }
  
  // Para pruebas, generar distancias aleatorias entre 1 y 100 km
  // Esto es solo para simular distancias variadas
  // En producción, usar el código comentado abajo
  return Math.floor(Math.random() * 100) + 1;
  
  /*
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distancia en kilómetros
  return Math.round(distance * 10) / 10; // Redondear a 1 decimal
  */
};

// Obtener ubicación actual del usuario
export const getCurrentLocation = (): Promise<Location> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalización no está soportada en este navegador'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutos
      }
    );
  });
};

// Solicitar permisos de ubicación
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    return permission.state === 'granted';
  } catch (error) {
    console.error('Error checking location permission:', error);
    return false;
  }
};

// Obtener ubicación con fallback
export const getUserLocation = async (): Promise<Location | null> => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      console.log('Location permission not granted');
      return null;
    }

    return await getCurrentLocation();
  } catch (error) {
    console.error('Error getting user location:', error);
    return null;
  }
};

// Calcular distancia entre dos usuarios
export const calculateUserDistance = (
  user1Location: Location | null,
  user2Location: Location | null
): number | null => {
  if (!user1Location || !user2Location) {
    return null;
  }

  return calculateDistance(
    user1Location.latitude,
    user1Location.longitude,
    user2Location.latitude,
    user2Location.longitude
  );
};

// Formatear distancia para mostrar
export const formatDistance = (distance: number | null): string => {
  if (distance === null) {
    return 'Distancia desconocida';
  }

  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)}km`;
  } else {
    return `${Math.round(distance)}km`;
  }
};

// Filtrar usuarios por distancia
export const filterUsersByDistance = (
  users: any[],
  userLocation: Location | null,
  maxDistance: number
): any[] => {
  if (!userLocation) {
    console.log('⚠️ No hay ubicación para filtrar por distancia');
    return users; // Si no hay ubicación, mostrar todos
  }

  console.log(`📍 Filtrando ${users.length} usuarios con distancia máxima: ${maxDistance}km`);
  
  // Primero, calcular y asignar distancias a todos los usuarios
  users.forEach(user => {
    if (user.location) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        user.location.latitude,
        user.location.longitude
      );
      user.distance = distance;
      console.log(`📍 Usuario ${user.name}: ${distance}km - ${distance <= maxDistance ? 'Incluido' : 'Excluido'}`);
    } else {
      console.log(`⚠️ Usuario ${user.name} sin ubicación`);
      user.distance = null;
    }
  });
  
  // Luego, filtrar por la distancia máxima
  const filtered = users.filter(user => {
    return user.distance !== null && user.distance <= maxDistance;
  });
  
  console.log(`📍 Resultado del filtro: ${users.length} -> ${filtered.length} usuarios`);
  
  return filtered;
};

// Ordenar usuarios por distancia
export const sortUsersByDistance = (
  users: any[],
  userLocation: Location | null
): any[] => {
  if (!userLocation) {
    return users;
  }

  return users
    .filter(user => user.location)
    .map(user => ({
      ...user,
      distance: calculateUserDistance(userLocation, user.location)
    }))
    .sort((a, b) => {
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
}; 