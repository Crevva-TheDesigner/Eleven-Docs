import { Suspense } from 'react';
import ResetPasswordClient from './ResetPasswordClient';
import { Loader2 } from 'lucide-react';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
        <div className="flex h-[calc(100vh-14rem)] w-full items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    }>
        <ResetPasswordClient />
    </Suspense>
  );
}
