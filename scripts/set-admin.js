import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD2T2kGXwpaz84mvKpxPZiVgnG8lNflBo0",
  authDomain: "dating-app-ca189.firebaseapp.com",
  projectId: "dating-app-ca189",
  storageBucket: "dating-app-ca189.firebasestorage.app",
  messagingSenderId: "814656156894",
  appId: "1:814656156894:web:ff33b8c01aef2848827e4f",
  measurementId: "G-W1CBF2KY97"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const setAdminUser = async () => {
  try {
    const userId = 'Pg2xxBEHZtYWOCOdoVopAqezaDG2'; // ID de D Lucian
    
    // Verificar si el usuario existe
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      console.log('Usuario no encontrado');
      return;
    }
    
    // Actualizar el usuario para marcarlo como admin
    await updateDoc(doc(db, 'users', userId), {
      isAdmin: true
    });
    
    console.log('Usuario D Lucian marcado como administrador');
  } catch (error) {
    console.error('Error al marcar como admin:', error);
  }
};

setAdminUser(); 