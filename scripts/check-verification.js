// Script para verificar el estado de verificación de un usuario
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD2T2kGXwpaz84mvKpxPZiVgnG8lNflBo0",
  authDomain: "dating-app-ca189.firebaseapp.com",
  projectId: "dating-app-ca189",
  storageBucket: "dating-app-ca189.firebasestorage.app",
  messagingSenderId: "814656156894",
  appId: "1:814656156894:web:ff33b8c01aef2848827e4f",
  measurementId: "G-W1CBF2KY97"
};

console.log('🚀 Verificando estado de verificación...');

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkVerification() {
  try {
    const userId = 'melenasdoblaktocas3@gmail.com';
    console.log('🔍 Verificando usuario:', userId);
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log('❌ Usuario no encontrado');
      return;
    }
    
    const userData = userDoc.data();
    console.log('👤 Usuario encontrado:', userData.name);
    console.log('📊 Estado de verificación:', {
      isVerified: userData.isVerified,
      isSuperVerified: userData.isSuperVerified,
      verifiedAt: userData.verifiedAt
    });
    
    if (userData.isVerified || userData.isSuperVerified) {
      console.log('⚠️  Usuario SÍ está verificado en Firestore');
    } else {
      console.log('✅ Usuario NO está verificado en Firestore');
    }
    
  } catch (error) {
    console.error('❌ Error verificando usuario:', error);
  }
}

// Ejecutar el script
checkVerification().then(() => {
  console.log('🏁 Verificación completada');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
}); 