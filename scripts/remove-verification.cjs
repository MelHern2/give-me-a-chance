const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, getDoc } = require('firebase/firestore');

// Configuración de Firebase (configuración real del proyecto)
const firebaseConfig = {
  apiKey: "AIzaSyD2T2kGXwpaz84mvKpxPZiVgnG8lNflBo0",
  authDomain: "dating-app-ca189.firebaseapp.com",
  projectId: "dating-app-ca189",
  storageBucket: "dating-app-ca189.firebasestorage.app",
  messagingSenderId: "814656156894",
  appId: "1:814656156894:web:ff33b8c01aef2848827e4f",
  measurementId: "G-W1CBF2KY97"
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