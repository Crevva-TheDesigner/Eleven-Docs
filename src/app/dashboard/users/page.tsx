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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface AppUser {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: Timestamp;
}

export default function UsersPage() {
  const { user } = useUser();
  const router = useRouter();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.email !== 'the.designer.crevva@gmail.com') {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (user && user.email === 'the.designer.crevva@gmail.com' && firestore) {
      const usersQuery = query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
        const fetchedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser));
        setUsers(fetchedUsers);
        setLoading(false);
      }, (error) => {
        const permissionError = new FirestorePermissionError({
          path: collection(firestore, 'users').path,
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
            <h1 className="text-3xl font-bold mb-8">Users</h1>
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
        <h1 className="text-3xl font-bold mb-8">Users</h1>
        <Card>
            <CardHeader>
                <CardTitle>All Registered Users</CardTitle>
                <CardDescription>
                    A list of all users who have created an account.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-right">Joined</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length > 0 ? (
                            users.map(appUser => (
                                <TableRow key={appUser.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={appUser.photoURL || ''} alt={appUser.displayName}/>
                                                <AvatarFallback>{appUser.displayName?.charAt(0) || 'U'}</AvatarFallback>
                                            </Avatar>
                                            <div className="font-medium">{appUser.displayName}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {appUser.email}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {appUser.createdAt ? formatDistanceToNow(appUser.createdAt.toDate(), { addSuffix: true }) : ''}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    No users found.
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
