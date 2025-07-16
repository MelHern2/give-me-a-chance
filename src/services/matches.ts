import { collection, getDocs, deleteDoc, doc, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Match } from '@/types';

export const getMatches = async (userId: string): Promise<Match[]> => {
  try {
    const matchesRef = collection(db, 'matches');
    const q = query(matchesRef, where('users', 'array-contains', userId));
    const querySnapshot = await getDocs(q);
    const matches: Match[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      matches.push({
        id: docSnap.id,
        users: data.users,
        createdAt: data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt,
        lastMessage: data.lastMessage,
        lastMessageAt: data.lastMessageAt ? (data.lastMessageAt.toDate ? data.lastMessageAt.toDate() : data.lastMessageAt) : undefined,
      });
    });
    return matches;
  } catch (error) {
    console.error('Error getting matches:', error);
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
    // Verificar si ya existe
    const matchesRef = collection(db, 'matches');
    const q = query(matchesRef, where('users', 'in', [[userA, userB], [userB, userA]]));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].id;
    }
    // Crear nuevo match
    const docRef = await addDoc(matchesRef, {
      users: [userA, userB],
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating match:', error);
    throw error;
  }
}; 