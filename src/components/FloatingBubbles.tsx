'use client';

import { useState, useEffect } from 'react';

export function FloatingBubbles() {
  const [bubbles, setBubbles] = useState<JSX.Element[]>([]);

  useEffect(() => {
    // Generate bubbles only on the client-side to avoid hydration mismatch
    const generalBubbles = Array.from({ length: 15 }).map((_, i) => {
      const size = `${Math.random() * 12 + 6}rem`; // 6rem to 18rem
      const style = {
        width: size,
        height: size,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        transform: `translate(-${Math.random() * 50}%, -${Math.random() * 50}%)`,
      };
      return <div key={`general-${i}`} className="bubble" style={style as React.CSSProperties} />;
    });

    const topBubbles = Array.from({ length: 5 }).map((_, i) => {
        const size = `${Math.random() * 10 + 5}rem`; // 5rem to 15rem
        const style = {
          width: size,
          height: size,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 30}%`, // Concentrated at the top 30%
          transform: `translate(-${Math.random() * 50}%, -${Math.random() * 50}%)`,
        };
        return <div key={`top-${i}`} className="bubble" style={style as React.CSSProperties} />;
    });
    
    const headerBubbles = Array.from({ length: 5 }).map((_, i) => {
        const size = `${Math.random() * 4 + 2}rem`; // 2rem to 6rem (small)
        const style = {
            width: size,
            height: size,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 5}%`, // Position within the top 5% of viewport
            transform: `translateY(-50%)`,
            filter: 'blur(24px)', // A bit less blur for smaller bubbles to be visible
        };
        return <div key={`header-${i}`} className="bubble" style={style as React.CSSProperties} />;
    });


    setBubbles([...generalBubbles, ...topBubbles, ...headerBubbles]);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
      {bubbles}
    </div>
  );
}
