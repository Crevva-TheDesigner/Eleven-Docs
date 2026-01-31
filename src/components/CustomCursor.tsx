'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isPointer, setIsPointer] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });

      const target = e.target as HTMLElement;
      // Check for interactive elements
      const isInteractive = !!target.closest(
        'a, button, [role="button"], input, textarea, select, [data-state="open"]'
      ) || window.getComputedStyle(target).cursor === 'pointer';
      
      setIsPointer(isInteractive);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <>
      <div 
        className="cursor-dot"
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
      />
      <div 
        className={cn("cursor-outline", isPointer && "cursor-outline--hover")}
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
      />
    </>
  );
}
