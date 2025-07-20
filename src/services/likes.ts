import { collection, getDocs, addDoc, query, where, serverTimestamp, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { createMatch } from './matches';
import { notifyNewLike, notifyNewMatch } from './notifications';
import type { UserProfile } from '@/types';

export interface Like {
  id?: string;
  fromUserId: string;
  toUserId: string;
  createdAt: Date;
}

export const giveLike = async (fromUserId: string, toUserId: string): Promise<{ isMatch: boolean; matchId?: string }> => {
  try {
    console.log('🔍 giveLike: Iniciando proceso de like');
    console.log('🔍 giveLike: fromUserId:', fromUserId);
    console.log('🔍 giveLike: toUserId:', toUserId);
    
    // Verificar si ya existe un like
    const likesRef = collection(db, 'likes');
    const existingLikeQuery = query(
      likesRef, 
      where('fromUserId', '==', fromUserId),
      where('toUserId', '==', toUserId)
    );
    const existingLikeSnapshot = await getDocs(existingLikeQuery);
    
    if (!existingLikeSnapshot.empty) {
      console.log('❌ Like ya existe');
      return { isMatch: false };
    }

    // Crear el like
    const likeData = {
      fromUserId,
      toUserId,
      createdAt: serverTimestamp(),
    };
    
    console.log('💾 Creando like en Firestore...');
    await addDoc(likesRef, likeData);
    console.log('✅ Like creado exitosamente');

    // Verificar si el usuario que ENVÍA el like es administrador
    console.log('🔍 Verificando si el usuario que envía el like es admin...');
    const fromUserDoc = await getDoc(doc(db, 'users', fromUserId));
    const fromUserData = fromUserDoc.data();
    
    console.log('🔍 Datos del usuario que envía:', fromUserData);
    console.log('🔍 isAdmin del que envía:', fromUserData?.isAdmin);
    
    if (fromUserData?.isAdmin) {
      // Si el usuario que ENVÍA el like es admin, crear match automático
      console.log('👑 Usuario admin enviando like, creando match automático');
      const matchId = await createMatch(fromUserId, toUserId);
      console.log('✅ Match creado con ID:', matchId);
      
      // Obtener datos del usuario que recibe el like
      const toUserDoc = await getDoc(doc(db, 'users', toUserId));
      const toUserDataForMatch = toUserDoc.data();
      
      // Notificar al usuario que recibe el like
      await notifyNewLike(toUserId, fromUserData.name || 'Admin');
      
      // Notificar al admin sobre el match
      await notifyNewMatch(fromUserId, toUserDataForMatch?.name || 'Usuario');
      
      return { isMatch: true, matchId };
    }

    // Verificar si hay like recíproco (match normal)
    const reciprocalLikeQuery = query(
      likesRef,
      where('fromUserId', '==', toUserId),
      where('toUserId', '==', fromUserId)
    );
    const reciprocalLikeSnapshot = await getDocs(reciprocalLikeQuery);
    
    if (!reciprocalLikeSnapshot.empty) {
      // Hay like recíproco, crear match
      console.log('Like recíproco detectado, creando match');
      const matchId = await createMatch(fromUserId, toUserId);
      
      // Notificar a ambos usuarios
      const fromUserDoc = await getDoc(doc(db, 'users', fromUserId));
      const fromUserData = fromUserDoc.data();
      
      // Obtener datos del usuario que recibe el like
      const toUserDocForReciprocal = await getDoc(doc(db, 'users', toUserId));
      const toUserDataForReciprocal = toUserDocForReciprocal.data();
      
      await notifyNewMatch(toUserId, fromUserData?.name || 'Usuario');
      await notifyNewMatch(fromUserId, toUserDataForReciprocal?.name || 'Usuario');
      
      return { isMatch: true, matchId };
    }

    // Solo like, no match
    console.log('Like creado, no hay match');
    
    // Obtener datos del usuario que recibe el like para la notificación
    const toUserDoc = await getDoc(doc(db, 'users', toUserId));
    const toUserData = toUserDoc.data();
    
    await notifyNewLike(toUserId, fromUserData?.name || 'Usuario');
    
    return { isMatch: false };
  } catch (error) {
    console.error('Error giving like:', error);
    throw error;
  }
};

export const getLikesReceived = async (userId: string): Promise<Like[]> => {
  try {
    const likesRef = collection(db, 'likes');
    const q = query(likesRef, where('toUserId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const likes: Like[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      likes.push({
        id: doc.id,
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        createdAt: data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt,
      });
    });
    
    return likes;
  } catch (error) {
    console.error('Error getting likes received:', error);
    throw error;
  }
};

export const getLikesGiven = async (userId: string): Promise<Like[]> => {
  try {
    const likesRef = collection(db, 'likes');
    const q = query(likesRef, where('fromUserId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const likes: Like[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      likes.push({
        id: doc.id,
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        createdAt: data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt,
      });
    });
    
    return likes;
  } catch (error) {
    console.error('Error getting likes given:', error);
    throw error;
  }
};

// Eliminar like entre dos usuarios
export const removeLike = async (fromUserId: string, toUserId: string): Promise<void> => {
  try {
    console.log('🗑️ removeLike: Eliminando like de', fromUserId, 'a', toUserId);
    
    const likesRef = collection(db, 'likes');
    const likeQuery = query(
      likesRef,
      where('fromUserId', '==', fromUserId),
      where('toUserId', '==', toUserId)
    );
    const likeSnapshot = await getDocs(likeQuery);
    
    if (likeSnapshot.empty) {
      console.log('⚠️ No se encontró like para eliminar');
      return;
    }
    
    // Eliminar todos los likes encontrados (debería ser solo uno)
    const deletePromises = likeSnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    await Promise.all(deletePromises);
    
    console.log('✅ Like eliminado correctamente');
  } catch (error) {
    console.error('❌ Error removing like:', error);
    throw error;
  }
};

// Eliminar todos los likes entre dos usuarios (bidireccional)
export const removeAllLikesBetweenUsers = async (userA: string, userB: string): Promise<void> => {
  try {
    console.log('🗑️ removeAllLikesBetweenUsers: Eliminando likes entre', userA, 'y', userB);
    
    // Eliminar likes de A a B
    await removeLike(userA, userB);
    
    // Eliminar likes de B a A
    await removeLike(userB, userA);
    
    console.log('✅ Todos los likes entre usuarios eliminados');
  } catch (error) {
    console.error('❌ Error removing all likes between users:', error);
    throw error;
  }
}; 