'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { firestore } from '@/firebase/client';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface Subscription {
  id: string;
  name: string;
  email: string;
  createdAt: Timestamp;
}

export default function SubscriptionsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.email !== 'the.designer.crevva@gmail.com') {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (user && user.email === 'the.designer.crevva@gmail.com' && firestore) {
      const subscriptionsQuery = query(collection(firestore, 'subscriptions'), orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(subscriptionsQuery, (snapshot) => {
        const fetchedSubscriptions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription));
        setSubscriptions(fetchedSubscriptions);
        setLoading(false);
      }, (error) => {
        const permissionError = new FirestorePermissionError({
          path: collection(firestore, 'subscriptions').path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
      });

      return () => unsubscribe();
    } else if (user) {
        setLoading(false);
    }
  }, [user]);
  
  if (loading) {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Newsletter Subscriptions</h1>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-80" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

  if (user?.email !== 'the.designer.crevva@gmail.com') {
      return (
          <div className="container mx-auto px-4 py-8 text-center">
              <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
              <p>You do not have permission to view this page.</p>
          </div>
      )
  }

  return (
    <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Newsletter Subscriptions</h1>
        <Card>
            <CardHeader>
                <CardTitle>Subscribers</CardTitle>
                <CardDescription>
                    Here are the names and email addresses of your subscribers.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-right">Subscribed</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {subscriptions.length > 0 ? (
                            subscriptions.map(sub => (
                                <TableRow key={sub.id}>
                                    <TableCell>
                                        <div className="font-medium">{sub.name}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{sub.email}</div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {sub.createdAt ? formatDistanceToNow(sub.createdAt.toDate(), { addSuffix: true }) : ''}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    No subscribers yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  )
}
