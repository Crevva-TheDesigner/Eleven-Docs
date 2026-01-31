'use client';

import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged as onFirebaseAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  type User,
  type Auth
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, type Firestore } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function onAuthStateChanged(auth: Auth, callback: (user: User | null) => void) {
  return onFirebaseAuthStateChanged(auth, callback);
}

export async function signInWithGoogle(auth: Auth, firestore: Firestore) {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const userRef = doc(firestore, 'users', user.uid);

    const userDoc = await getDoc(userRef).catch((serverError) => {
      const permissionError = new FirestorePermissionError({
        path: userRef.path,
        operation: 'get',
      });
      errorEmitter.emit('permission-error', permissionError);
      throw serverError; // This will be caught by the outer try-catch
    });

    if (!userDoc.exists()) {
      const userData = {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        surveyCompleted: false,
        interests: [],
        purchaseHistory: [],
      };
      
      try {
        await setDoc(userRef, userData);
      } catch (serverError: any) {
        signOut(auth); // Sign out if profile creation fails
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'create',
          requestResourceData: userData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw new Error("Failed to create user profile in database.");
      }
    }
    
    return user;
  } catch (error: any) {
    if (error.name !== 'FirestorePermissionError' && error.code !== 'auth/popup-closed-by-user') {
      console.error("Error signing in with Google", error);
      throw new Error(error.message || "Could not sign in with Google.");
    }
    // For permission errors or popup closed, return undefined and let UI handle it.
  }
}

export async function signUpWithEmailPassword(auth: Auth, firestore: Firestore, displayName: string, email: string, password: string) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userRef = doc(firestore, 'users', user.uid);
        const userData = {
            displayName: displayName,
            email: user.email,
            photoURL: null,
            createdAt: serverTimestamp(),
            surveyCompleted: false,
            interests: [],
            purchaseHistory: [],
        };
        
        try {
            await setDoc(userRef, userData);
        } catch (serverError: any) {
             signOut(auth); // Sign out if profile creation fails
             const permissionError = new FirestorePermissionError({
                path: userRef.path,
                operation: 'create',
                requestResourceData: userData,
            });
            errorEmitter.emit('permission-error', permissionError);
            throw new Error("Could not create user profile in database.");
        }

        return user;
    } catch (error: any) {
        console.error("Error signing up with email and password", error);
        throw new Error(error.message || "Could not sign up.");
    }
}

export async function signInWithEmailPassword(auth: Auth, email: string, password: string) {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
    } catch (error: any) {
        console.error("Error signing in with email and password", error);
        throw new Error(error.message || "Could not sign in.");
  }
}


export async function signOutUser(auth: Auth) {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
}


export async function sendPasswordReset(auth: Auth, email: string) {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
        console.error("Error sending password reset email", error);
        throw new Error(error.message || "Could not send password reset email.");
    }
}

export async function verifyResetCode(auth: Auth, actionCode: string) {
    try {
        const email = await verifyPasswordResetCode(auth, actionCode);
        return email;
    } catch (error: any) {
        console.error("Error verifying password reset code", error);
        if (error.code === 'auth/invalid-action-code') {
             throw new Error("Invalid or expired password reset link. Please request a new one.");
        }
        throw new Error(error.message || "Invalid or expired password reset code.");
    }
}

export async function handlePasswordReset(auth: Auth, actionCode: string, newPassword: string) {
    try {
        await confirmPasswordReset(auth, actionCode, newPassword);
    } catch (error: any) {
        console.error("Error resetting password", error);
        if (error.code === 'auth/invalid-action-code') {
             throw new Error("Invalid or expired password reset link. Please request a new one.");
        }
        throw new Error(error.message || "Could not reset password.");
    }
}
