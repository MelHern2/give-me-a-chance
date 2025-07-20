import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';

// Configuración de Firebase (usar la misma que en el proyecto)
const firebaseConfig = {
  apiKey: "AIzaSyBvQvQvQvQvQvQvQvQvQvQvQvQvQvQvQvQ",
  authDomain: "dating-app-12345.firebaseapp.com",
  projectId: "dating-app-12345",
  storageBucket: "dating-app-12345.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function removeVerification() {
  try {
    console.log('🔍 Buscando usuario: melenasdoblaktocas3@gmail.com');
    
    // Buscar el usuario por email
    const userRef = doc(db, 'users', 'melenasdoblaktocas3@gmail.com');
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log('❌ Usuario no encontrado');
      return;
    }
    
    const userData = userDoc.data();
    console.log('👤 Usuario encontrado:', userData.name);
    console.log('Estado actual de verificación:', {
      isVerified: userData.isVerified,
      isSuperVerified: userData.isSuperVerified
    });
    
    // Quitar la verificación
    await updateDoc(userRef, {
      isVerified: false,
      isSuperVerified: false,
      verifiedAt: null,
      updatedAt: new Date()
    });
    
    console.log('✅ Verificación removida exitosamente');
    console.log('Nuevo estado:', {
      isVerified: false,
      isSuperVerified: false
    });
    
  } catch (error) {
    console.error('❌ Error removiendo verificación:', error);
  }
}

// Ejecutar el script
removeVerification(); 