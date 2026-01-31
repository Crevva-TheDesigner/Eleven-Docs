'use client';
import { doc, updateDoc, arrayUnion, type Firestore } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export const addProductsToPurchaseHistory = (
  firestore: Firestore,
  userId: string,
  productIds: string[]
) => {
  const userRef = doc(firestore, 'users', userId);
  const dataToUpdate = {
    purchaseHistory: arrayUnion(...productIds),
  };
  return updateDoc(userRef, dataToUpdate).catch((serverError) => {
    const permissionError = new FirestorePermissionError({
      path: userRef.path,
      operation: 'update',
      requestResourceData: dataToUpdate,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
};
