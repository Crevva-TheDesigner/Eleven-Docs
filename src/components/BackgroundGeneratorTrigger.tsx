'use client';

import { useEffect } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { scheduleNextGeneration } from '@/lib/background-generator';

export function BackgroundGeneratorTrigger() {
  const { user } = useUser();

  useEffect(() => {
    // The background generator requires a logged-in user to save content to the database.
    // If no user is logged in, there is nothing to do.
    if (!user) {
      return;
    }

    console.log('User is logged in. Initializing background content generator...');

    // Run once shortly after the app loads to see if a job is due.
    const initialCheck = setTimeout(() => {
      scheduleNextGeneration();
    }, 5000); // 5s delay to let more critical initial processes finish

    // Then, set up a recurring check every minute to ensure the queue keeps moving.
    const interval = setInterval(() => {
      scheduleNextGeneration();
    }, 60 * 1000); // Check every 60 seconds

    // Cleanup on component unmount or user logout
    return () => {
      console.log('Cleaning up background generator.');
      clearTimeout(initialCheck);
      clearInterval(interval);
    };
  }, [user]); // Re-run this effect if the user logs in or out.

  return null; // This component does not render anything.
}
