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
  limit
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