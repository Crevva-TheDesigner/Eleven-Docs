'use client';

import { useEffect } from 'react';

export function PaymentSuccessAnimation({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 4500); // Total duration of visible effect
    return () => clearTimeout(timer);
  }, [onComplete]);

  const confettiColors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800'];

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[1000] flex items-center justify-center overflow-hidden animate-in fade-in-0 duration-500">
      <div className="relative text-center">
        <h1 className="text-8xl md:text-9xl font-extrabold animate-hurray bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 bg-clip-text text-transparent">
          Hurray!
        </h1>
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 80 }).map((_, i) => {
            const size = Math.random() * 8 + 6;
            return (
              <div
                key={i}
                className="absolute animate-confetti-pop"
                style={{
                  width: `${size}px`,
                  height: `${size * 1.5}px`,
                  background: confettiColors[i % confettiColors.length],
                  top: '50%',
                  left: '50%',
                  '--tx': `${(Math.random() - 0.5) * 800}px`,
                  '--ty': `${(Math.random() - 0.5) * 800}px`,
                  '--r': `${(Math.random() - 0.5) * 720}deg`,
                  animationDelay: `${Math.random() * 0.2}s`,
                  animationDuration: `${Math.random() * 1 + 1.5}s`,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
