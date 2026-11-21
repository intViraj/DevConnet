import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ text = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 bg-purple-500/30 rounded-full animate-ping" />
        </div>
      </div>
      <p className="text-sm font-medium text-slate-400 tracking-wide animate-pulse">
        {text}
      </p>
    </div>
  );
};

export default LoadingSpinner;
