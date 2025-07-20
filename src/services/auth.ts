import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import type { User } from '@/types';

export const registerUser = async (email: string, password: string, userData: Omit<User, 'id' | 'email' | 'createdAt' | 'updatedAt'>): Promise<User> => {
  try {
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Crear objeto de usuario completo
    const user: User = {
      id: firebaseUser.uid,
      email,
      ...userData,
      isAdmin: false, // Siempre false por defecto
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Guardar datos del usuario en Firestore
    await setDoc(doc(db, 'users', firebaseUser.uid), user);

    return user;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Obtener datos del usuario desde Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      throw new Error('User data not found');
    }

    return userDoc.data() as User;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      unsubscribe();
      
      if (!firebaseUser) {
        resolve(null);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          resolve(userDoc.data() as User);
        } else {
          resolve(null);
        }
      } catch (error) {
        console.error('Error getting current user:', error);
        resolve(null);
      }
    });
  });
};

export const loginWithGoogle = async (): Promise<User> => {
  try {
    console.log('🔄 Configurando Google Auth Provider...');
    const provider = new GoogleAuthProvider();
    
    // Configurar scopes adicionales si es necesario
    provider.addScope('email');
    provider.addScope('profile');
    
    // Configurar parámetros adicionales para evitar problemas
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    console.log('🔄 Iniciando popup de Google...');
    console.log('🔄 URL actual:', window.location.href);
    console.log('🔄 Dominio actual:', window.location.hostname);
    
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;
    
    console.log('✅ Usuario autenticado con Google:', {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL
    });

    // Verificar si el usuario ya tiene perfil en Firestore
    console.log('🔄 Verificando perfil en Firestore...');
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      console.log('📝 Creando nuevo perfil para usuario de Google...');
      // Si no existe, crear perfil básico
      const userData: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || '',
        age: 18,
        gender: '', // Por defecto vacío
        city: '',
        photos: firebaseUser.photoURL ? [firebaseUser.photoURL] : [],
        bio: '',
        interests: [],
        location: {
          latitude: 0,
          longitude: 0,
        },
        isVerified: false,
        isSuperVerified: false,
        isAdmin: false, // Por defecto
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      console.log('✅ Perfil creado exitosamente');
      return userData;
    } else {
      console.log('✅ Perfil existente encontrado');
      // Si ya existe, retornar los datos existentes
      const data = userDoc.data() as User;
      // Si no tiene fotos pero sí photoURL, agregarla
      if ((!data.photos || data.photos.length === 0) && firebaseUser.photoURL) {
        console.log('📸 Agregando foto de Google al perfil existente');
        data.photos = [firebaseUser.photoURL];
        await setDoc(doc(db, 'users', firebaseUser.uid), data);
      }
      return data;
    }
  } catch (error: any) {
    console.error('❌ Error detallado en loginWithGoogle:', {
      code: error.code,
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      domain: window.location.hostname
    });
    
    // Re-lanzar el error para que el componente lo maneje
    throw error;
  }
}; 

export const loginWithGoogleRedirect = async (): Promise<void> => {
  try {
    console.log('🔄 Configurando Google Auth Provider para redirect...');
    const provider = new GoogleAuthProvider();
    
    // Configurar scopes adicionales si es necesario
    provider.addScope('email');
    provider.addScope('profile');
    
    console.log('🔄 Iniciando redirect a Google...');
    await signInWithRedirect(auth, provider);
    // El usuario será redirigido a Google y luego de vuelta a la app
  } catch (error: any) {
    console.error('❌ Error en loginWithGoogleRedirect:', error);
    throw error;
  }
};

export const handleGoogleRedirectResult = async (): Promise<User | null> => {
  try {
    console.log('🔄 Verificando resultado de redirect de Google...');
    const result = await getRedirectResult(auth);
    
    if (!result) {
      console.log('ℹ️ No hay resultado de redirect');
      return null;
    }
    
    const firebaseUser = result.user;
    console.log('✅ Usuario autenticado con Google redirect:', {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL
    });

    // Verificar si el usuario ya tiene perfil en Firestore
    console.log('🔄 Verificando perfil en Firestore...');
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      console.log('📝 Creando nuevo perfil para usuario de Google...');
      // Si no existe, crear perfil básico
      const userData: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || '',
        age: 18,
        gender: '', // Por defecto vacío
        city: '',
        photos: firebaseUser.photoURL ? [firebaseUser.photoURL] : [],
        bio: '',
        interests: [],
        location: {
          latitude: 0,
          longitude: 0,
        },
        isVerified: false,
        isSuperVerified: false,
        isAdmin: false, // Por defecto
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      console.log('✅ Perfil creado exitosamente');
      return userData;
    } else {
      console.log('✅ Perfil existente encontrado');
      // Si ya existe, retornar los datos existentes
      const data = userDoc.data() as User;
      // Si no tiene fotos pero sí photoURL, agregarla
      if ((!data.photos || data.photos.length === 0) && firebaseUser.photoURL) {
        console.log('📸 Agregando foto de Google al perfil existente');
        data.photos = [firebaseUser.photoURL];
        await setDoc(doc(db, 'users', firebaseUser.uid), data);
      }
      return data;
    }
  } catch (error: any) {
    console.error('❌ Error en handleGoogleRedirectResult:', error);
    throw error;
  }
}; 