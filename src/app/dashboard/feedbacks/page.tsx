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
import type { Feedback } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function FeedbacksPage() {
  const { user } = useUser();
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.email !== 'the.designer.crevva@gmail.com') {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (user && user.email === 'the.designer.crevva@gmail.com' && firestore) {
      const feedbacksQuery = query(collection(firestore, 'feedbacks'), orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(feedbacksQuery, (snapshot) => {
        const fetchedFeedbacks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback));
        setFeedbacks(fetchedFeedbacks);
        setLoading(false);
      }, (error) => {
        const permissionError = new FirestorePermissionError({
          path: collection(firestore, 'feedbacks').path,
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
            <h1 className="text-3xl font-bold mb-8">User Feedbacks</h1>
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
        <h1 className="text-3xl font-bold mb-8">User Feedbacks</h1>
        <Card>
            <CardHeader>
                <CardTitle>Inbox</CardTitle>
                <CardDescription>
                    Here are the feedbacks submitted by your users.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>From</TableHead>
                            <TableHead>Message</TableHead>
                            <TableHead className="text-right">Received</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {feedbacks.length > 0 ? (
                            feedbacks.map(msg => (
                                <TableRow key={msg.id}>
                                    <TableCell>
                                        <div className="font-medium">{msg.name}</div>
                                        <div className="text-sm text-muted-foreground">{msg.email}</div>
                                    </TableCell>
                                    <TableCell>
                                        {msg.feedback && (
                                            <div>
                                                <p className="font-semibold text-sm">Feedback</p>
                                                <p className="text-sm text-muted-foreground max-w-md">{msg.feedback}</p>
                                            </div>
                                        )}
                                        {msg.suggestion && (
                                            <div className={msg.feedback ? 'mt-2' : ''}>
                                                <p className="font-semibold text-sm">Suggestion</p>
                                                <p className="text-sm text-muted-foreground max-w-md">{msg.suggestion}</p>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {msg.createdAt ? formatDistanceToNow(msg.createdAt.toDate(), { addSuffix: true }) : ''}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    No feedbacks yet.
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
