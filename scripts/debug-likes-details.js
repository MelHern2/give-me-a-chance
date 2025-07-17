import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

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

const debugLikesDetails = async () => {
  try {
    const userId = 'Pg2xxBEHZtYWOCOdoVopAqezaDG2'; // ID de D Lucian
    
    console.log('🔍 Debug: Verificando likes con detalles...');
    const likesRef = collection(db, 'likes');
    const likesQuery = query(likesRef, where('fromUserId', '==', userId));
    const likesSnapshot = await getDocs(likesQuery);
    
    console.log('📊 Likes enviados por D Lucian:', likesSnapshot.size);
    
    for (const likeDoc of likesSnapshot.docs) {
      const likeData = likeDoc.data();
      console.log('\n🔍 Like ID:', likeDoc.id);
      console.log('  - De:', likeData.fromUserId);
      console.log('  - A:', likeData.toUserId);
      console.log('  - Creado:', likeData.createdAt);
      
      // Verificar si el usuario que recibió el like es admin
      try {
        const toUserDoc = await getDoc(doc(db, 'users', likeData.toUserId));
        const toUserData = toUserDoc.data();
        console.log('  - Usuario que recibió el like:');
        console.log('    * Nombre:', toUserData?.name);
        console.log('    * Email:', toUserData?.id);
        console.log('    * isAdmin:', toUserData?.isAdmin);
        
        if (toUserData?.isAdmin) {
          console.log('  ✅ Este usuario ES admin - debería haber creado match automático');
        } else {
          console.log('  ❌ Este usuario NO es admin');
        }
      } catch (error) {
        console.log('  ❌ Error obteniendo datos del usuario:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
  }
};

debugLikesDetails(); 