import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

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

const debugMatches = async () => {
  try {
    const userId = 'Pg2xxBEHZtYWOCOdoVopAqezaDG2'; // ID de D Lucian
    
    console.log('🔍 Debug: Verificando likes...');
    const likesRef = collection(db, 'likes');
    const likesQuery = query(likesRef, where('fromUserId', '==', userId));
    const likesSnapshot = await getDocs(likesQuery);
    
    console.log('📊 Likes enviados por D Lucian:', likesSnapshot.size);
    likesSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('  - Like a:', data.toUserId, 'en:', data.createdAt);
    });
    
    console.log('\n🔍 Debug: Verificando matches...');
    const matchesRef = collection(db, 'matches');
    const matchesQuery = query(matchesRef, where('users', 'array-contains', userId));
    const matchesSnapshot = await getDocs(matchesQuery);
    
    console.log('📊 Matches de D Lucian:', matchesSnapshot.size);
    matchesSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('  - Match ID:', doc.id, 'Usuarios:', data.users, 'Creado:', data.createdAt);
    });
    
    console.log('\n🔍 Debug: Verificando todos los likes...');
    const allLikesSnapshot = await getDocs(likesRef);
    console.log('📊 Total de likes en la base de datos:', allLikesSnapshot.size);
    
    console.log('\n🔍 Debug: Verificando todos los matches...');
    const allMatchesSnapshot = await getDocs(matchesRef);
    console.log('📊 Total de matches en la base de datos:', allMatchesSnapshot.size);
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
  }
};

debugMatches(); 