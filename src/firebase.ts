import { initializeApp, getApps, getApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth, signInWithPopup, signOut } from 'firebase/auth';

export interface AppUser {
  uid: string;
  id?: string;
  email: string;
  displayName: string;
  name?: string;
  photoURL?: string;
  accessToken?: string;
  isMock?: boolean;
}

const firebaseConfig = {
  apiKey: 'AIzaSyDZm_-4nQ75LDt9gpnMSCZiA-3N5bgeuus',
  authDomain: 'spendlyyy.firebaseapp.com',
  projectId: 'spendlyyy',
  storageBucket: 'spendlyyy.firebasestorage.app',
  messagingSenderId: '443073055459',
  appId: '1:443073055459:web:ceaea2fd9d04d784cb53d6',
  measurementId: 'G-46NSMG48ER'
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const isFirebaseConfigured = true;

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

export const signInWithGoogle = async (email?: string, name?: string): Promise<AppUser> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const user = result.user;

    return {
      uid: user.uid,
      id: user.uid,
      email: user.email || email || 'unknown@example.com',
      displayName: user.displayName || name || 'Google User',
      name: user.displayName || name,
      photoURL: user.photoURL || undefined,
      accessToken: credential?.accessToken || undefined,
      isMock: false,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Google sign-in failed';
    throw new Error(message);
  }
};

export const logOut = async (): Promise<void> => {
  await signOut(auth);
};
