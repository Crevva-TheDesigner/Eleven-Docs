'use client';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '@/firebase/client';
import type { User as AuthUser } from 'firebase/auth';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export interface UserProfile {
    displayName: string;
    email: string;
    photoURL: string | null;
    createdAt: any;
    interests: string[];
    surveyCompleted: boolean;
    purchaseHistory: string[];
}

export function useUserProfile(user: AuthUser | null) {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            setLoading(true);
            const userRef = doc(firestore, 'users', user.uid);
            const unsubscribe = onSnapshot(userRef, (doc) => {
                if (doc.exists()) {
                    setUserProfile(doc.data() as UserProfile);
                } else {
                    // This can happen briefly when a user is created
                    setUserProfile(null);
                }
                setLoading(false);
            }, (error) => {
                const permissionError = new FirestorePermissionError({
                    path: userRef.path,
                    operation: 'get',
                });
                errorEmitter.emit('permission-error', permissionError);
                setLoading(false);
                setUserProfile(null);
            });
            return () => unsubscribe();
        } else {
            setUserProfile(null);
            setLoading(false);
        }
    }, [user]);

    return { userProfile, loading };
}
