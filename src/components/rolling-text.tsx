
"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const TAGLINES = [
  "Track every unit with a unique QR code.",
  "Manage bills and link them to your inventory.",
  "Allot items to users and track assignments.",
  "Real-time dashboard for a complete overview.",
  "Search and filter your entire inventory instantly.",
];

type AnimationState = 'in' | 'paused' | 'out';

export function RollingText() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animationState, setAnimationState] = useState<AnimationState>('in');

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (animationState === 'in') {
      timer = setTimeout(() => {
        setAnimationState('paused');
      }, 500); // Duration of the 'in' animation
    } else if (animationState === 'paused') {
        timer = setTimeout(() => {
            setAnimationState('out');
        }, 3000); // 3-second pause
    } else if (animationState === 'out') {
      timer = setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % TAGLINES.length);
        setAnimationState('in');
      }, 500); // Duration of the 'out' animation
    }

    return () => clearTimeout(timer);
  }, [animationState]);

  return (
    <div className="relative h-7 overflow-hidden text-center">
      <span
        key={currentIndex}
        className={cn(
            "absolute inset-0 flex items-center justify-center text-muted-foreground",
            animationState === 'in' && 'animate-roll-in',
            animationState === 'out' && 'animate-roll-out'
        )}
      >
        {TAGLINES[currentIndex]}
      </span>
    </div>
  );
}
