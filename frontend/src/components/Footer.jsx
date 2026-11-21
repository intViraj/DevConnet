import React from 'react';
import { Code2, Heart, Github, Globe } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/80 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-purple-400" />
          <span className="font-bold text-slate-200">DevConnect</span>
          <span className="text-xs text-slate-500 font-mono">v1.0.0</span>
        </div>

        <p className="text-sm text-slate-400 flex items-center gap-1">
          Built with <Heart className="w-4 h-4 text-rose-500 fill-rose-500 inline" /> for the global developer community.
        </p>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Backend Connected
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
