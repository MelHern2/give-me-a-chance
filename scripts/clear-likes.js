import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, query, where } from 'firebase/firestore';

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

const clearLikes = async () => {
  try {
    console.log('🧹 Limpiando todos los likes...');
    const likesRef = collection(db, 'likes');
    const likesSnapshot = await getDocs(likesRef);
    
    console.log('📊 Likes encontrados:', likesSnapshot.size);
    
    for (const likeDoc of likesSnapshot.docs) {
      await deleteDoc(likeDoc.ref);
      console.log('🗑️ Like eliminado:', likeDoc.id);
    }
    
    console.log('✅ Todos los likes han sido eliminados');
  } catch (error) {
    console.error('❌ Error limpiando likes:', error);
  }
};

clearLikes(); 