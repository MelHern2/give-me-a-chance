import { collection, getDocs, addDoc, query, where, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface Dislike {
  id?: string;
  fromUserId: string;
  toUserId: string;
  createdAt: Date;
}

export const giveDislike = async (fromUserId: string, toUserId: string): Promise<void> => {
  try {
    console.log('🔍 giveDislike: Iniciando proceso de dislike');
    
    // Verificar si ya existe un dislike
    const dislikesRef = collection(db, 'dislikes');
    const existingDislikeQuery = query(
      dislikesRef, 
      where('fromUserId', '==', fromUserId),
      where('toUserId', '==', toUserId)
    );
    const existingDislikeSnapshot = await getDocs(existingDislikeQuery);
    
    if (!existingDislikeSnapshot.empty) {
      console.log('❌ Dislike ya existe');
      return;
    }

    // Crear el dislike
    const dislikeData = {
      fromUserId,
      toUserId,
      createdAt: serverTimestamp(),
    };
    
    console.log('💾 Creando dislike en Firestore...');
    await addDoc(dislikesRef, dislikeData);
    console.log('✅ Dislike creado exitosamente');
  } catch (error) {
    console.error('Error giving dislike:', error);
    throw error;
  }
};

export const getDislikesGiven = async (userId: string): Promise<Dislike[]> => {
  try {
    const dislikesRef = collection(db, 'dislikes');
    const q = query(dislikesRef, where('fromUserId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const dislikes: Dislike[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      dislikes.push({
        id: doc.id,
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        createdAt: data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt,
      });
    });
    
    return dislikes;
  } catch (error) {
    console.error('Error getting dislikes given:', error);
    throw error;
  }
};

// Eliminar dislike entre dos usuarios
export const removeDislike = async (fromUserId: string, toUserId: string): Promise<void> => {
  try {
    console.log('🗑️ removeDislike: Eliminando dislike de', fromUserId, 'a', toUserId);
    
    const dislikesRef = collection(db, 'dislikes');
    const dislikeQuery = query(
      dislikesRef,
      where('fromUserId', '==', fromUserId),
      where('toUserId', '==', toUserId)
    );
    const dislikeSnapshot = await getDocs(dislikeQuery);
    
    if (dislikeSnapshot.empty) {
      console.log('⚠️ No se encontró dislike para eliminar');
      return;
    }
    
    // Eliminar todos los dislikes encontrados (debería ser solo uno)
    const deletePromises = dislikeSnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    await Promise.all(deletePromises);
    
    console.log('✅ Dislike eliminado correctamente');
  } catch (error) {
    console.error('❌ Error removing dislike:', error);
    throw error;
  }
};

// Eliminar todos los dislikes entre dos usuarios (bidireccional)
export const removeAllDislikesBetweenUsers = async (userA: string, userB: string): Promise<void> => {
  try {
    console.log('🗑️ removeAllDislikesBetweenUsers: Eliminando dislikes entre', userA, 'y', userB);
    
    // Eliminar dislikes de A a B
    await removeDislike(userA, userB);
    
    // Eliminar dislikes de B a A
    await removeDislike(userB, userA);
    
    console.log('✅ Todos los dislikes entre usuarios eliminados');
  } catch (error) {
    console.error('❌ Error removing all dislikes between users:', error);
    throw error;
  }
};