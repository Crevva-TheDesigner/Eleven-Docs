'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useUser } from '@/firebase/auth/use-user';
import { firestore } from '@/firebase/client';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const usageOptions = [
  { id: 'studying', label: 'Studying' },
  { id: 'professional-work', label: 'Professional Work' },
  { id: 'personal-projects', label: 'Personal Projects' },
];

const interestOptions = [
  { id: 'productivity', label: 'Productivity' },
  { id: 'development', label: 'Development & Code' },
  { id: 'mindfulness', label: 'Mindfulness & Journaling' },
  { id: 'organization', label: 'Organization & Planning' },
  { id: 'computer-science', label: 'Computer Science' },
  { id: 'psychology', label: 'Psychology' },
  { id: 'economics', label: 'Economics' },
];

export default function SurveyPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const { toast } = useToast();
  
  const [selectedUsage, setSelectedUsage] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleCheckboxChange = (
    id: string,
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (list.includes(id)) {
      setter(list.filter((item) => item !== id));
    } else {
      setter([...list, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) return;

    const dataToUpdate = {
      interests: [...selectedUsage, ...selectedInterests],
      surveyCompleted: true,
    };
    const userRef = doc(firestore, 'users', user.uid);

    updateDoc(userRef, dataToUpdate)
      .then(() => {
        toast({
          title: 'Thank you!',
          description: 'Your preferences have been saved.',
        });
        router.push('/');
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: dataToUpdate,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
            variant: 'destructive',
            title: 'Error saving preferences',
            description: "Could not save your preferences. Please try again.",
        });
      });
  };

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-8 md:py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Tell us about yourself</CardTitle>
          <CardDescription>
            Help us personalize your experience by answering a couple of questions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h3 className="mb-4 font-semibold">What will you be using Crevva for?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {usageOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.id}
                      onCheckedChange={() => handleCheckboxChange(option.label, selectedUsage, setSelectedUsage)}
                    />
                    <Label htmlFor={option.id}>{option.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-4 font-semibold">What are your interests?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {interestOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.id}
                      onCheckedChange={() => handleCheckboxChange(option.label, selectedInterests, setSelectedInterests)}
                    />
                    <Label htmlFor={option.id}>{option.label}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            <Button type="submit" className="w-full" size="lg">
              Save Preferences & Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
