import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-300">
      <div className="relative flex flex-col items-center">
        {/* Animated Rings */}
        <div className="absolute h-24 w-24 rounded-full border-4 border-primary/20 animate-ping" />
        <div className="absolute h-24 w-24 rounded-full border-4 border-t-primary animate-spin" />
        
        {/* Central Logo/Icon Placeholder */}
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-background shadow-xl">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
        
        {/* Text */}
        <div className="mt-8 flex flex-col items-center gap-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Dental Hub</h2>
          <p className="text-sm text-muted-foreground animate-pulse">Yuklanmoqda...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
