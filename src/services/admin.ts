import { db } from '@/config/firebase';
import { 
  doc, 
  updateDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  deleteDoc,
  writeBatch,
  addDoc,
  orderBy,
  limit,
  startAfter
} from 'firebase/firestore';

// Banear un usuario
export const banUser = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isBanned: true,
      bannedAt: new Date(),
      bannedBy: 'admin' // En una implementación real, usar el ID del admin
    });

    // También eliminar todos los matches del usuario baneado
    const matchesRef = collection(db, 'matches');
    const matchesQuery = query(matchesRef, where('users', 'array-contains', userId));
    const matchesSnapshot = await getDocs(matchesQuery);
    
    const batch = writeBatch(db);
    matchesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

  } catch (error) {
    console.error('Error banning user:', error);
    throw error;
  }
};

// Desbanear un usuario
export const unbanUser = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isBanned: false,
      bannedAt: null,
      bannedBy: null
    });
  } catch (error) {
    console.error('Error unbanning user:', error);
    throw error;
  }
};

// Obtener estadísticas de la aplicación
export const getAppStats = async () => {
  try {
    const usersRef = collection(db, 'users');
    const matchesRef = collection(db, 'matches');
    const reportsRef = collection(db, 'reports');

    const [usersSnapshot, matchesSnapshot, reportsSnapshot] = await Promise.all([
      getDocs(usersRef),
      getDocs(matchesRef),
      getDocs(reportsRef)
    ]);

    const totalUsers = usersSnapshot.size;
    const totalMatches = matchesSnapshot.size;
    const totalReports = reportsSnapshot.size;

    // Calcular usuarios activos (registrados en los últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsers = usersSnapshot.docs.filter(doc => {
      const userData = doc.data();
      return userData.createdAt && userData.createdAt.toDate() > thirtyDaysAgo;
    }).length;

    // Calcular usuarios baneados
    const bannedUsers = usersSnapshot.docs.filter(doc => {
      const userData = doc.data();
      return userData.isBanned;
    }).length;

    return {
      totalUsers,
      activeUsers,
      bannedUsers,
      totalMatches,
      totalReports,
      averageMatchesPerUser: totalUsers > 0 ? (totalMatches / totalUsers).toFixed(2) : 0
    };
  } catch (error) {
    console.error('Error getting app stats:', error);
    throw error;
  }
};

// Obtener lista de usuarios baneados
export const getBannedUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const bannedQuery = query(usersRef, where('isBanned', '==', true));
    const snapshot = await getDocs(bannedQuery);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting banned users:', error);
    throw error;
  }
};

// Eliminar un usuario completamente
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    const batch = writeBatch(db);

    // Eliminar usuario
    const userRef = doc(db, 'users', userId);
    batch.delete(userRef);

    // Eliminar matches
    const matchesRef = collection(db, 'matches');
    const matchesQuery = query(matchesRef, where('users', 'array-contains', userId));
    const matchesSnapshot = await getDocs(matchesQuery);
    matchesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Eliminar mensajes
    const messagesRef = collection(db, 'messages');
    const messagesQuery = query(messagesRef, where('senderId', '==', userId));
    const messagesSnapshot = await getDocs(messagesQuery);
    messagesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Eliminar reportes donde el usuario es reportado o reportante
    const reportsRef = collection(db, 'reports');
    const reportsQuery = query(
      reportsRef, 
      where('reportedUserId', '==', userId)
    );
    const reportsSnapshot = await getDocs(reportsQuery);
    reportsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Obtener información detallada de un usuario
export const getUserDetails = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('Usuario no encontrado');
    }

    const userData = userDoc.data();

    // Obtener estadísticas del usuario
    const matchesRef = collection(db, 'matches');
    const userMatchesQuery = query(matchesRef, where('users', 'array-contains', userId));
    const matchesSnapshot = await getDocs(userMatchesQuery);

    const reportsRef = collection(db, 'reports');
    const userReportsQuery = query(reportsRef, where('reportedUserId', '==', userId));
    const reportsSnapshot = await getDocs(userReportsQuery);

    return {
      user: {
        id: userDoc.id,
        ...userData
      },
      stats: {
        totalMatches: matchesSnapshot.size,
        totalReports: reportsSnapshot.size,
        isBanned: userData.isBanned || false,
        createdAt: userData.createdAt,
        lastActive: userData.lastActive || userData.createdAt
      }
    };
  } catch (error) {
    console.error('Error getting user details:', error);
    throw error;
  }
};

// Forzar un match entre dos usuarios
export const forceMatch = async (userId1: string, userId2: string): Promise<void> => {
  try {
    // Verificar que ambos usuarios existen
    const [user1Doc, user2Doc] = await Promise.all([
      getDoc(doc(db, 'users', userId1)),
      getDoc(doc(db, 'users', userId2))
    ]);

    if (!user1Doc.exists() || !user2Doc.exists()) {
      throw new Error('Uno o ambos usuarios no existen');
    }

    // Crear el match
    const matchesRef = collection(db, 'matches');
    await addDoc(matchesRef, {
      users: [userId1, userId2],
      createdAt: new Date(),
      forcedBy: 'admin'
    });

  } catch (error) {
    console.error('Error forcing match:', error);
    throw error;
  }
};

// Obtener logs de actividad de administradores
export const getAdminLogs = async () => {
  try {
    const logsRef = collection(db, 'adminLogs');
    const logsQuery = query(logsRef, orderBy('createdAt', 'desc'), limit(100));
    const snapshot = await getDocs(logsQuery);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting admin logs:', error);
    throw error;
  }
};

// Crear un log de actividad administrativa
export const createAdminLog = async (action: string, details: any, adminId: string) => {
  try {
    const logsRef = collection(db, 'adminLogs');
    await addDoc(logsRef, {
      action,
      details,
      adminId,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Error creating admin log:', error);
    // No lanzar error para no interrumpir la operación principal
  }
}; 

// Buscar usuarios con filtros
export const searchUsers = async (filters: any, page: number = 1, itemsPerPage: number = 20) => {
  try {
    // Obtener todos los usuarios primero (para simplificar)
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'), limit(100));
    const querySnapshot = await getDocs(q);
    
    let users: any[] = [];

    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      let includeUser = true;

      // Aplicar filtros en el cliente
      if (filters.name && !userData.name?.toLowerCase().includes(filters.name.toLowerCase())) {
        includeUser = false;
      }

      if (filters.email && userData.email !== filters.email) {
        includeUser = false;
      }

      if (filters.country && userData.country !== filters.country) {
        includeUser = false;
      }

      if (filters.region && userData.region !== filters.region) {
        includeUser = false;
      }

      if (filters.city && !userData.city?.toLowerCase().includes(filters.city.toLowerCase())) {
        includeUser = false;
      }

      if (filters.gender && userData.gender !== filters.gender) {
        includeUser = false;
      }

      if (filters.verification) {
        switch (filters.verification) {
          case 'verified':
            if (!userData.isVerified) includeUser = false;
            break;
          case 'super-verified':
            if (!userData.isSuperVerified) includeUser = false;
            break;
          case 'unverified':
            if (userData.isVerified || userData.isSuperVerified) includeUser = false;
            break;
        }
      }

      if (filters.ageMin && userData.age < parseInt(filters.ageMin)) {
        includeUser = false;
      }

      if (filters.ageMax && userData.age > parseInt(filters.ageMax)) {
        includeUser = false;
      }

      if (includeUser) {
        users.push({
          id: doc.id,
          ...userData
        });
      }
    });

    // Aplicar paginación
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedUsers = users.slice(startIndex, endIndex);

    return {
      users: paginatedUsers,
      total: users.length,
      hasMore: endIndex < users.length
    };

  } catch (error) {
    console.error('Error buscando usuarios:', error);
    throw error;
  }
};

// Quitar verificación a un usuario
export const removeUserVerification = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isVerified: false,
      isSuperVerified: false,
      verifiedAt: null,
      updatedAt: new Date()
    });
    
    // Importar el store de auth para actualizar el usuario actual si es el mismo
    const { useAuthStore } = await import('@/stores/auth');
    const authStore = useAuthStore();
    
    // Si el usuario actual es el mismo que se está desverificando, actualizar el store
    if (authStore.user && authStore.user.id === userId) {
      const updatedUser = {
        ...authStore.user,
        isVerified: false,
        isSuperVerified: false,
        verifiedAt: undefined
      };
      authStore.setUser(updatedUser);
      console.log('✅ Usuario actual actualizado en store después de quitar verificación');
    }
    
    return { success: true, message: 'Verificación removida exitosamente' };
  } catch (error) {
    console.error('Error removiendo verificación:', error);
    throw error;
  }
};

// Agregar verificación a un usuario
export const addUserVerification = async (userId: string, isSuperVerified: boolean = false) => {
  try {
    const userRef = doc(db, 'users', userId);
    const verificationDate = new Date();
    
    await updateDoc(userRef, {
      isVerified: true,
      isSuperVerified: isSuperVerified,
      verifiedAt: verificationDate,
      updatedAt: new Date()
    });
    
    // Importar el store de auth para actualizar el usuario actual si es el mismo
    const { useAuthStore } = await import('@/stores/auth');
    const authStore = useAuthStore();
    
    // Si el usuario actual es el mismo que se está verificando, actualizar el store
    if (authStore.user && authStore.user.id === userId) {
      const updatedUser = {
        ...authStore.user,
        isVerified: true,
        isSuperVerified: isSuperVerified,
        verifiedAt: verificationDate
      };
      authStore.setUser(updatedUser);
      console.log('✅ Usuario actual actualizado en store después de agregar verificación');
    }
    
    return { success: true, message: 'Usuario verificado exitosamente' };
  } catch (error) {
    console.error('Error verificando usuario:', error);
    throw error;
  }
};

// Recargar datos del usuario desde Firestore
export const reloadUserData = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('Usuario no encontrado');
    }
    
    const userData = userDoc.data();
    
    // Importar el store de auth para actualizar el usuario actual
    const { useAuthStore } = await import('@/stores/auth');
    const authStore = useAuthStore();
    
    // Si es el usuario actual, actualizar el store
    if (authStore.user && authStore.user.id === userId) {
      const updatedUser = {
        id: userDoc.id,
        ...userData
      } as any; // Type assertion para evitar problemas de tipos
      authStore.setUser(updatedUser);
      console.log('✅ Datos del usuario actualizados desde Firestore');
    }
    
    return {
      id: userDoc.id,
      ...userData
    };
  } catch (error) {
    console.error('Error recargando datos del usuario:', error);
    throw error;
  }
};

 