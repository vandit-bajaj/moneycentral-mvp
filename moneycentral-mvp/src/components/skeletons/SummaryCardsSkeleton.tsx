import React from 'react';

export function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-zinc-900/30 border border-zinc-850 rounded-2xl p-6 space-y-3 animate-pulse">
          <div className="h-3 bg-zinc-800 rounded w-24" />
          <div className="h-7 bg-zinc-800 rounded w-36" />
        </div>
      ))}
    </div>
  );
}
