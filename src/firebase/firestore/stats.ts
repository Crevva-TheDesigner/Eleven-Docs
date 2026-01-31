'use client';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, type Firestore, query } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useCollectionCount(firestore: Firestore | null, collectionName: string) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore) {
      setLoading(false);
      return;
    }

    const collectionRef = query(collection(firestore, collectionName));
    const unsubscribe = onSnapshot(
      collectionRef,
      (snapshot) => {
        setCount(snapshot.size);
        setLoading(false);
      },
      (error) => {
        if (firestore) {
            const permissionError = new FirestorePermissionError({
              path: collection(firestore, collectionName).path,
              operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, collectionName]);

  return { count, loading };
}
