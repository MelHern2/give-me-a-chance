const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');

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

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Ubicaciones de ejemplo en España (Madrid, Barcelona, Valencia, etc.)
const sampleLocations = [
  { latitude: 40.416775, longitude: -3.703790 }, // Madrid
  { latitude: 41.385064, longitude: 2.173404 },  // Barcelona
  { latitude: 39.469907, longitude: -0.376288 }, // Valencia
  { latitude: 37.389092, longitude: -5.984459 }, // Sevilla
  { latitude: 43.262706, longitude: -2.925281 }, // Bilbao
  { latitude: 37.992239, longitude: -1.130654 }, // Murcia
  { latitude: 39.862832, longitude: -4.027323 }, // Toledo
  { latitude: 41.648823, longitude: -0.889085 }, // Zaragoza
  { latitude: 36.721261, longitude: -4.421671 }, // Málaga
  { latitude: 38.345996, longitude: -0.490686 }, // Alicante
];

async function addLocationToProfiles() {
  try {
    console.log('📍 Agregando ubicaciones a los perfiles...');
    
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    console.log(`📊 Encontrados ${querySnapshot.size} usuarios`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    let index = 0;
    for (const document of querySnapshot.docs) {
      const userData = document.data();
      const userName = userData.name || userData.displayName || `Usuario ${index + 1}`;
      
      // Solo actualizar si no tiene ubicación
      if (!userData.location || !userData.location.latitude) {
        const locationIndex = index % sampleLocations.length;
        const location = sampleLocations[locationIndex];
        
        console.log(`📍 Agregando ubicación a ${userName}:`, location);
        
        try {
          // Actualizar el documento
          await updateDoc(doc(db, 'users', document.id), {
            location: location
          });
          console.log(`✅ Ubicación agregada a ${userName}`);
          updatedCount++;
        } catch (error) {
          console.error(`❌ Error actualizando ${userName}:`, error);
        }
      } else {
        console.log(`⏭️ ${userName} ya tiene ubicación:`, userData.location);
        skippedCount++;
      }
      index++;
    }
    
    console.log(`📊 Resumen:`);
    console.log(`✅ Perfiles actualizados: ${updatedCount}`);
    console.log(`⏭️ Perfiles saltados: ${skippedCount}`);
    console.log(`📊 Total: ${querySnapshot.size}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addLocationToProfiles(); 