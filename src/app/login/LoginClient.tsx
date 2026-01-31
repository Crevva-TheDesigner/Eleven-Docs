'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { signInWithGoogle, signInWithEmailPassword, signUpWithEmailPassword } from '@/firebase/auth/auth';
import { useUser } from '@/firebase/auth/use-user';
import { auth, firestore } from '@/firebase/client';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/firebase/firestore/use-user-profile';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  const { toast } = useToast();
  const { user, loading: authLoading } = useUser();
  const { userProfile, loading: profileLoading } = useUserProfile(user);
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  useEffect(() => {
    if (!authLoading && !profileLoading && user && userProfile) {
        if (!userProfile.surveyCompleted) {
            router.push('/survey');
        } else if (redirect) {
            router.push(redirect);
        } else {
            router.push('/dashboard');
        }
    }
  }, [user, userProfile, authLoading, profileLoading, router, redirect]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle(auth, firestore);
      // The useEffect will handle redirection
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Login Failed', description: error.message });
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailPassword(auth, loginEmail, loginPassword);
      // The useEffect will handle redirection
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Login Failed', description: error.message });
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signUpWithEmailPassword(auth, firestore, registerName, registerEmail, registerPassword);
      // The useEffect will handle redirection
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Registration Failed', description: error.message });
    }
  };
  
  if (authLoading || (user && profileLoading)) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-14rem)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    )
  }
  
  if (user && userProfile) {
    // This will be handled by the useEffect, but as a fallback:
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-14rem)]">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-14rem)] px-4 py-8 sm:py-12">
      {redirect && (
          <Alert variant="destructive" className="max-w-md w-full mb-4">
            <AlertTitle>Login Required</AlertTitle>
            <AlertDescription>
                Please log in or create an account to continue.
            </AlertDescription>
          </Alert>
      )}
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
           <div className="flex justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="240" height="45" viewBox="0 0 400 80">
                <text x="10" y="60" fontFamily="Poppins, sans-serif" fontSize="60" fontWeight="800" fill="url(#logo-gradient-login)">
                    Eleven Docs
                </text>
                <defs>
                    <linearGradient id="logo-gradient-login" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: 'hsl(var(--primary))'}} />
                        <stop offset="100%" style={{stopColor: 'hsl(220 13% 61%)'}} />
                    </linearGradient>
                </defs>
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Sign in or create an account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="space-y-4 pt-4">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" placeholder="m@example.com" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="rounded-full" />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                        <Link href="/forgot-password" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
                            Forgot Password?
                        </Link>
                    </div>
                    <Input id="login-password" type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="rounded-full" />
                </div>
                <Button type="submit" className="w-full">Sign In</Button>
              </form>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
              </div>
              <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-4 w-4 mr-2">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C39.712,34.464,44,28.756,44,20C44,22.659,43.862,21.35,43.611,20.083z"/>
                </svg>
                Sign in with Google
              </Button>
            </TabsContent>
            <TabsContent value="register" className="space-y-4 pt-4">
              <form onSubmit={handleEmailRegister} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="register-name">Display Name</Label>
                    <Input id="register-name" placeholder="John Doe" required value={registerName} onChange={(e) => setRegisterName(e.target.value)} className="rounded-full"/>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input id="register-email" type="email" placeholder="m@example.com" required value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} className="rounded-full"/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input id="register-password" type="password" required minLength={6} value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} className="rounded-full"/>
                </div>
                <Button type="submit" className="w-full">Create Account</Button>
              </form>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
              </div>
              <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-4 w-4 mr-2">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C39.712,34.464,44,28.756,44,20C44,22.659,43.862,21.35,43.611,20.083z"/>
                </svg>
                Sign in with Google
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
