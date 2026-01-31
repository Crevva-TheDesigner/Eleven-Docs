'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { GlobalLoadingIndicator } from '@/components/GlobalLoadingIndicator';

interface GlobalLoadingContextType {
  showGlobalLoader: () => void;
  hideGlobalLoader: () => void;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | undefined>(undefined);

export function GlobalLoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  const showGlobalLoader = useCallback(() => {
    setIsLoading(true);
  }, []);

  const hideGlobalLoader = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <GlobalLoadingContext.Provider value={{ showGlobalLoader, hideGlobalLoader }}>
      {isLoading && <GlobalLoadingIndicator />}
      {children}
    </GlobalLoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const context = useContext(GlobalLoadingContext);
  if (context === undefined) {
    throw new Error('useGlobalLoading must be used within a GlobalLoadingProvider');
  }
  return context;
}
