import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, onSnapshot, QuerySnapshot } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Message } from '@/types';
import { pushNotificationService } from './pushNotifications';

import { doc, updateDoc } from 'firebase/firestore';

export const sendMessage = async (matchId: string, senderId: string, content: string): Promise<void> => {
  try {
    // Guardar el mensaje
    await addDoc(collection(db, 'messages'), {
      matchId,
      senderId,
      content,
      createdAt: serverTimestamp(),
    });

    // Actualizar el match con el último mensaje
    await updateDoc(doc(db, 'matches', matchId), {
      lastMessage: content,
      lastMessageAt: serverTimestamp(),
      hasMessages: true, // Marcar que el match ya tiene mensajes
    });

    // Enviar notificación push al destinatario
    // Nota: Esto requiere implementar la lógica para obtener el token FCM del destinatario
    // y usar Firebase Cloud Functions o un backend para enviar la notificación push
    console.log('Mensaje enviado, notificación push pendiente de implementar');
    
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const getMessages = async (matchId: string): Promise<Message[]> => {
  try {
    const q = query(collection(db, 'messages'), where('matchId', '==', matchId), orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
};

export const subscribeToMessages = (
  matchId: string,
  callback: (messages: Message[]) => void
): (() => void) => {
  const q = query(collection(db, 'messages'), where('matchId', '==', matchId), orderBy('createdAt', 'asc'));
  const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
    callback(msgs);
  });
  return unsubscribe;
}; 