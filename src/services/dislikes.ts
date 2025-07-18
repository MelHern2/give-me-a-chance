import { collection, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
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