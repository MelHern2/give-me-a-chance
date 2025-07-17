import { collection, getDocs, deleteDoc, doc, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Match } from '@/types';

export const getMatches = async (userId: string): Promise<Match[]> => {
  try {
    console.log('🔍 getMatches: Buscando matches para usuario:', userId);
    const matchesRef = collection(db, 'matches');
    const q = query(matchesRef, where('users', 'array-contains', userId));
    const querySnapshot = await getDocs(q);
    
    console.log('🔍 getMatches: Documentos encontrados:', querySnapshot.size);
    
    const matches: Match[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      console.log('🔍 getMatches: Procesando match:', docSnap.id, data);
      
      matches.push({
        id: docSnap.id,
        users: data.users,
        createdAt: data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt,
        lastMessage: data.lastMessage,
        lastMessageAt: data.lastMessageAt ? (data.lastMessageAt.toDate ? data.lastMessageAt.toDate() : data.lastMessageAt) : undefined,
      });
    });
    
    console.log('✅ getMatches: Matches procesados:', matches.length);
    return matches;
  } catch (error) {
    console.error('❌ Error getting matches:', error);
    throw error;
  }
};

export const deleteMatch = async (matchId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'matches', matchId));
  } catch (error) {
    console.error('Error deleting match:', error);
    throw error;
  }
};

export const createMatch = async (userA: string, userB: string): Promise<string> => {
  // Crea un match entre userA y userB si no existe
  try {
    console.log('🔍 createMatch: Iniciando creación de match');
    console.log('🔍 createMatch: userA:', userA);
    console.log('🔍 createMatch: userB:', userB);
    
    // Verificar si ya existe
    const matchesRef = collection(db, 'matches');
    const q = query(matchesRef, where('users', 'in', [[userA, userB], [userB, userA]]));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      console.log('⚠️ Match ya existe, retornando ID existente:', querySnapshot.docs[0].id);
      return querySnapshot.docs[0].id;
    }
    
    // Crear nuevo match
    console.log('💾 Creando nuevo match en Firestore...');
    const docRef = await addDoc(matchesRef, {
      users: [userA, userB],
      createdAt: serverTimestamp(),
    });
    console.log('✅ Match creado exitosamente con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating match:', error);
    throw error;
  }
}; 