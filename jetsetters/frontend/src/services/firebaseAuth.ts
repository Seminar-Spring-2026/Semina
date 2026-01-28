import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import type { User, UserCredential } from 'firebase/auth';
import { auth } from '../config/firebase';

const googleProvider = new GoogleAuthProvider();

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const msg = (error as Record<string, unknown>).message;
    if (typeof msg === 'string') return msg;
  }
  return 'Unknown error';
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export const firebaseAuthService = {
  signupWithEmail: async (
    email: string,
    password: string
  ): Promise<AuthResult> => {
    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      return { success: true, user: userCredential.user };
    } catch (error: unknown) {
      console.error('Signup error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  loginWithEmail: async (
    email: string,
    password: string
  ): Promise<AuthResult> => {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return { success: true, user: userCredential.user };
    } catch (error: unknown) {
      console.error('Login error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  signInWithGoogle: async (): Promise<AuthResult> => {
    try {
      const result: UserCredential = await signInWithPopup(auth, googleProvider);
      return { success: true, user: result.user };
    } catch (error: unknown) {
      console.error('Google sign-in error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  logout: async (): Promise<AuthResult> => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: unknown) {
      console.error('Logout error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  getCurrentUser: (): User | null => {
    return auth.currentUser;
  },

  isAuthenticated: (): boolean => {
    return auth.currentUser !== null;
  },
};

