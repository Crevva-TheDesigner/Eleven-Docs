'use client';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  type Firestore,
  type DocumentData,
  getDoc,
  doc
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';
import type { CartItem } from '@/lib/types';
import type { Order } from '@/lib/types';
import { useEffect, useState } from 'react';

// Function to create a new order
export const createOrder = (firestore: Firestore, userId: string, items: CartItem[], totalAmount: number, userDisplayName: string, userEmail: string, userUpiId?: string) => {
    const ordersCollection = collection(firestore, 'users', userId, 'orders');
    
    const orderData: any = {
        userId,
        userDisplayName,
        userEmail,
        items: items.map(item => ({ id: item.id, name: item.name, price: item.price, category: item.category })),
        totalAmount,
        createdAt: serverTimestamp()
    };

    if (userUpiId) {
        orderData.userUpiId = userUpiId;
    }

    return addDoc(ordersCollection, orderData)
        .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
              path: ordersCollection.path,
              operation: 'create',
              requestResourceData: orderData,
            });
            errorEmitter.emit('permission-error', permissionError);
            throw serverError;
        });
};


// Hook to fetch orders for a user
export function useOrders(firestore: Firestore | null, userId: string | undefined) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !userId) {
      setLoading(false);
      return;
    }

    const ordersQuery = query(
      collection(firestore, 'users', userId, 'orders'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const fetchedOrders = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Order));
        setOrders(fetchedOrders);
        setLoading(false);
      },
      (error) => {
        if (firestore && userId) {
            const permissionError = new FirestorePermissionError({
              path: collection(firestore, 'users', userId, 'orders').path,
              operation: 'list'
            });
            errorEmitter.emit('permission-error', permissionError);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, userId]);

  return { orders, loading };
}

// Function to fetch a single order
export const getOrder = async (firestore: Firestore, userId: string, orderId: string): Promise<Order | null> => {
    const orderRef = doc(firestore, 'users', userId, 'orders', orderId);
    try {
        const orderSnap = await getDoc(orderRef);

        if (orderSnap.exists()) {
            return { id: orderSnap.id, ...orderSnap.data() } as Order;
        } else {
            return null;
        }
    } catch (e) {
        const permissionError = new FirestorePermissionError({
            path: orderRef.path,
            operation: 'get'
        });
        errorEmitter.emit('permission-error', permissionError);
        return null;
    }
}
