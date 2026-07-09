import React from 'react';

export function HoldingsSkeleton() {
  const rows = Array.from({ length: 5 });
  return (
    <div className="rounded-2xl border border-zinc-850 bg-zinc-900/40 p-6 shadow-xl backdrop-blur-md">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-5 bg-zinc-800 rounded animate-pulse w-36" />
        <div className="h-4 bg-zinc-800 rounded animate-pulse w-16" />
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-full divide-y divide-zinc-850">
          <div className="grid grid-cols-8 gap-4 pb-3 text-left">
            <div className="h-3 bg-zinc-700 rounded animate-pulse w-12" />
            <div className="h-3 bg-zinc-700 rounded animate-pulse w-12" />
            <div className="h-3 bg-zinc-700 rounded animate-pulse w-8 justify-self-end" />
            <div className="h-3 bg-zinc-700 rounded animate-pulse w-16 justify-self-end" />
            <div className="h-3 bg-zinc-700 rounded animate-pulse w-16 justify-self-end" />
            <div className="h-3 bg-zinc-700 rounded animate-pulse w-12 justify-self-end" />
            <div className="h-3 bg-zinc-700 rounded animate-pulse w-12 justify-self-end" />
            <div className="h-3 bg-zinc-700 rounded animate-pulse w-12 justify-self-end" />
          </div>
          {rows.map((_, i) => (
            <div key={i} className="grid grid-cols-8 gap-4 py-4 border-b border-zinc-850/50 items-center">
              <div className="h-4 bg-zinc-800 rounded animate-pulse w-16" />
              <div className="h-4 bg-zinc-800 rounded animate-pulse w-12" />
              <div className="h-4 bg-zinc-800 rounded animate-pulse w-8 justify-self-end" />
              <div className="h-4 bg-zinc-800 rounded animate-pulse w-16 justify-self-end" />
              <div className="h-4 bg-zinc-800 rounded animate-pulse w-16 justify-self-end" />
              <div className="h-4 bg-zinc-800 rounded animate-pulse w-12 justify-self-end" />
              <div className="h-4 bg-zinc-800 rounded animate-pulse w-12 justify-self-end" />
              <div className="h-4 bg-zinc-800 rounded animate-pulse w-12 justify-self-end" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
