'use client';

import { addDoc, collection, serverTimestamp, type Firestore } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export interface SubscriptionData {
    name: string;
    email: string;
}

export const submitSubscription = (firestore: Firestore, subscription: SubscriptionData) => {
    const subscriptionsCollection = collection(firestore, 'subscriptions');
    
    const dataToSubmit = {
        ...subscription,
        createdAt: serverTimestamp()
    };

    return addDoc(subscriptionsCollection, dataToSubmit)
        .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
              path: subscriptionsCollection.path,
              operation: 'create',
              requestResourceData: dataToSubmit,
            });
            errorEmitter.emit('permission-error', permissionError);
            throw serverError;
        });
}
