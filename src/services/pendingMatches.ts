import { collection, getDocs, query, where, orderBy, limit, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { getMatches } from './matches';
import { getProfileById } from './profiles';
import type { Match } from '@/types';

export interface PendingMatch extends Match {
  name: string;
  age: number;
  city: string;
  photo: string;
  userId: string;
}

// Función para verificar si un match tiene mensajes
export const hasMessages = async (matchId: string): Promise<boolean> => {
  try {
    // Primero verificar si el match tiene el campo hasMessages
    const matchDoc = await getDoc(doc(db, 'matches', matchId));
    if (matchDoc.exists() && matchDoc.data().hasMessages) {
      return true;
    }
    
    // Si no tiene el campo, verificar si hay mensajes
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('matchId', '==', matchId),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    const hasMsg = !snapshot.empty;
    
    // Si hay mensajes pero el campo hasMessages no está actualizado, actualizarlo
    if (hasMsg) {
      await updateDoc(doc(db, 'matches', matchId), {
        hasMessages: true
      });
    }
    
    return hasMsg;
  } catch (error) {
    console.error('Error verificando mensajes del match:', error);
    return false;
  }
};

// Función para obtener matches pendientes (sin mensajes)
export const getPendingMatches = async (userId: string): Promise<PendingMatch[]> => {
  try {
    console.log('🔍 Buscando matches pendientes para usuario:', userId);
    
    // Obtener todos los matches del usuario
    const allMatches = await getMatches(userId);
    console.log(`📊 Total de matches: ${allMatches.length}`);
    
    // Filtrar matches que no tienen mensajes
    const pendingMatches: PendingMatch[] = [];
    
    for (const match of allMatches) {
      const hasAnyMessages = await hasMessages(match.id);
      
      if (!hasAnyMessages) {
        // Obtener el ID del otro usuario en el match
        const otherUserId = match.users.find(id => id !== userId);
        
        if (otherUserId) {
          try {
            // Obtener el perfil completo del otro usuario
            const userProfile = await getProfileById(otherUserId);
            
            pendingMatches.push({
              ...match,
              name: userProfile.name,
              age: userProfile.age,
              city: userProfile.city,
              photo: userProfile.photos && userProfile.photos.length > 0 ? userProfile.photos[0] : '',
              userId: otherUserId
            });
          } catch (error) {
            console.error('Error obteniendo perfil de usuario:', otherUserId, error);
          }
        }
      }
    }
    
    console.log(`✅ Matches pendientes: ${pendingMatches.length}`);
    return pendingMatches;
  } catch (error) {
    console.error('Error obteniendo matches pendientes:', error);
    throw error;
  }
};