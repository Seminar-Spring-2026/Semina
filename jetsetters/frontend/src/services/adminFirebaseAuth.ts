import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  RecaptchaVerifier,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  multiFactor,
  getMultiFactorResolver,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import type { 
  User, 
  UserCredential, 
  MultiFactorError, 
  MultiFactorResolver,
  MultiFactorSession 
} from 'firebase/auth';
import { auth } from '../config/firebase';

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  requiresMFA?: boolean;
  resolver?: MultiFactorResolver;
}

export interface MFAEnrollResult {
  success: boolean;
  error?: string;
  verificationId?: string;
}

// reCAPTCHA verifier instance
let recaptchaVerifier: RecaptchaVerifier | null = null;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const msg = (error as Record<string, unknown>).message;
    if (typeof msg === 'string') return msg;
  }
  return 'Unknown error';
}

function isFirebaseError(error: unknown): error is { code: string; message?: string } {
  return typeof error === 'object' && error !== null && 'code' in error;
}

export const adminFirebaseAuth = {
  // Initialize reCAPTCHA (call this before MFA operations)
  initRecaptcha: (containerId: string, invisible: boolean = false): RecaptchaVerifier => {
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
    }

    recaptchaVerifier = new RecaptchaVerifier(
      auth,
      containerId,
      {
        size: invisible ? 'invisible' : 'normal',
        callback: () => {
          // no-op (required by Firebase)
        },
        'expired-callback': () => {
          // no-op (required by Firebase)
        },
      }
    );

    return recaptchaVerifier;
  },

  // Email/Password signup
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
      console.error('Admin signup error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  // Email/Password login (first factor)
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
      console.error('Admin login error:', error);
      
      // Check if MFA is required
      if (isFirebaseError(error) && error.code === 'auth/multi-factor-auth-required') {
        const resolver = getMultiFactorResolver(auth, error as MultiFactorError);
        return { 
          success: false, 
          requiresMFA: true, 
          resolver,
          error: 'Multi-factor authentication required' 
        };
      }
      
      return { success: false, error: getErrorMessage(error) };
    }
  },

  // Enroll phone number as second factor
  enrollMFA: async (
    user: User,
    phoneNumber: string,
    recaptchaContainerId: string
  ): Promise<MFAEnrollResult> => {
    try {
      // Initialize reCAPTCHA if not already done
      if (!recaptchaVerifier) {
        recaptchaVerifier = adminFirebaseAuth.initRecaptcha(recaptchaContainerId, true);
      }

      // Get multi-factor session
      const multiFactorSession: MultiFactorSession = await multiFactor(user).getSession();

      // Send verification code
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const phoneInfoOptions = {
        phoneNumber,
        session: multiFactorSession,
      };

      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions,
        recaptchaVerifier
      );

      return { success: true, verificationId };
    } catch (error: unknown) {
      console.error('MFA enrollment error:', error);
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
      }
      return { success: false, error: getErrorMessage(error) };
    }
  },

  // Complete MFA enrollment with verification code
  completeMFAEnrollment: async (
    user: User,
    verificationId: string,
    verificationCode: string,
    displayName: string = 'Phone number'
  ): Promise<AuthResult> => {
    try {
      const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);

      await multiFactor(user).enroll(multiFactorAssertion, displayName);
      
      return { success: true, user };
    } catch (error: unknown) {
      console.error('MFA enrollment completion error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  // Send MFA verification code during sign-in
  sendMFAVerification: async (
    resolver: MultiFactorResolver,
    recaptchaContainerId: string,
    hintIndex: number = 0
  ): Promise<MFAEnrollResult> => {
    try {
      // Initialize reCAPTCHA if not already done
      if (!recaptchaVerifier) {
        recaptchaVerifier = adminFirebaseAuth.initRecaptcha(recaptchaContainerId, true);
      }

      const phoneInfoOptions = {
        multiFactorHint: resolver.hints[hintIndex],
        session: resolver.session,
      };

      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions,
        recaptchaVerifier
      );

      return { success: true, verificationId };
    } catch (error: unknown) {
      console.error('MFA verification send error:', error);
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
      }
      return { success: false, error: getErrorMessage(error) };
    }
  },

  // Complete MFA sign-in with verification code
  completeMFASignIn: async (
    resolver: MultiFactorResolver,
    verificationId: string,
    verificationCode: string
  ): Promise<AuthResult> => {
    try {
      const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);

      const userCredential = await resolver.resolveSignIn(multiFactorAssertion);
      
      return { success: true, user: userCredential.user };
    } catch (error: unknown) {
      console.error('MFA sign-in completion error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  // Sign out
  logout: async (): Promise<AuthResult> => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: unknown) {
      console.error('Logout error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  // Get current user
  getCurrentUser: (): User | null => {
    return auth.currentUser;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return auth.currentUser !== null;
  },

  // Check if user has MFA enrolled
  hasMFAEnrolled: (user: User): boolean => {
    return multiFactor(user).enrolledFactors.length > 0;
  },

  // Get enrolled MFA factors
  getEnrolledFactors: (user: User) => {
    return multiFactor(user).enrolledFactors;
  },

  // Send password reset email
  sendPasswordReset: async (email: string): Promise<AuthResult> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: unknown) {
      console.error('Password reset error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  // Clear reCAPTCHA
  clearRecaptcha: () => {
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      recaptchaVerifier = null;
    }
  },
};

