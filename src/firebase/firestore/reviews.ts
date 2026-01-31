'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import type { Review } from '@/lib/types';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export interface ReviewData {
    userId: string;
    displayName: string;
    avatarUrl: string | null;
    rating: number;
    comment: string;
}

// Hook to fetch reviews for a product
export function useReviews(firestore: Firestore | null, productId: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !productId) {
        setLoading(false);
        return;
    };

    // Correcting the path to include 'products' collection
    const reviewsQuery = query(
      collection(firestore, 'products', productId, 'reviews'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      reviewsQuery,
      (snapshot) => {
        const fetchedReviews = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Review));
        setReviews(fetchedReviews);
        setLoading(false);
      },
      (error) => {
        if (firestore) {
            const permissionError = new FirestorePermissionError({
              path: collection(firestore, 'products', productId, 'reviews').path,
              operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, productId]);

  return { reviews, loading };
}

// Function to submit a new review
export const submitReview = (firestore: Firestore, productId: string, reviewData: ReviewData) => {
    const reviewsCollection = collection(firestore, 'products', productId, 'reviews');
    
    const dataToSubmit = {
        ...reviewData,
        createdAt: serverTimestamp()
    };

    return addDoc(reviewsCollection, dataToSubmit)
        .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
              path: reviewsCollection.path,
              operation: 'create',
              requestResourceData: dataToSubmit,
            });
            errorEmitter.emit('permission-error', permissionError);
            throw serverError;
        });
}
