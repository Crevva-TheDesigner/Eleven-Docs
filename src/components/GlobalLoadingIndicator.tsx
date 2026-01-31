'use client';

import { Loader2 } from "lucide-react";

export function GlobalLoadingIndicator() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[1000] flex items-center justify-center animate-in fade-in-0 duration-300">
        <div className="flex flex-col items-center gap-4 text-foreground">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="text-lg font-semibold">Buffering</p>
        </div>
    </div>
  );
}
