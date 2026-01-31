'use client';

import { addDoc, collection, serverTimestamp, type Firestore } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export interface FeedbackData {
    name: string;
    email: string;
    feedback?: string;
    suggestion?: string;
}

export const submitFeedback = (firestore: Firestore, feedback: FeedbackData) => {
    const feedbacksCollection = collection(firestore, 'feedbacks');
    
    const dataToSubmit = {
        ...feedback,
        createdAt: serverTimestamp()
    };

    return addDoc(feedbacksCollection, dataToSubmit)
        .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
              path: feedbacksCollection.path,
              operation: 'create',
              requestResourceData: dataToSubmit,
            });
            errorEmitter.emit('permission-error', permissionError);
            throw serverError;
        });
}
