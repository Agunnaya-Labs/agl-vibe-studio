import React from 'react';

export default function PageLoader() {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-screen bg-[#050505]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-purple to-blue-500 rounded-full animate-spin opacity-20"></div>
          <div className="absolute inset-1 bg-[#050505] rounded-full"></div>
          <div className="absolute inset-2 bg-gradient-to-r from-brand-purple to-blue-500 rounded-full animate-pulse"></div>
        </div>
        <p className="text-sm text-zinc-400 font-mono">Loading page...</p>
      </div>
    </div>
  );
}
