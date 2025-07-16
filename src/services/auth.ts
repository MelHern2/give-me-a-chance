import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
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
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;

    // Verificar si el usuario ya tiene perfil en Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      // Si no existe, crear perfil básico
      const userData: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || '',
        age: 18,
        gender: '', // Por defecto vacío
        city: '',
        religion: '',
        isMonogamous: true,
        sexualOrientation: '',
        politicalOrientation: '',
        hasChildren: false,
        relationshipType: '',
        description: '',
        photos: firebaseUser.photoURL ? [firebaseUser.photoURL] : [],
        location: {
          latitude: 0,
          longitude: 0,
        },
        isAdmin: false, // Por defecto
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      return userData;
    } else {
      // Si ya existe, retornar los datos existentes
      const data = userDoc.data() as User;
      // Si no tiene fotos pero sí photoURL, agregarla
      if ((!data.photos || data.photos.length === 0) && firebaseUser.photoURL) {
        data.photos = [firebaseUser.photoURL];
        await setDoc(doc(db, 'users', firebaseUser.uid), data);
      }
      return data;
    }
  } catch (error) {
    console.error('Error logging in with Google:', error);
    throw error;
  }
}; 