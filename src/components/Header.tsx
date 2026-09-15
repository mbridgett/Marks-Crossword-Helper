import React from 'react';
import { Wifi, WifiOff, CheckCircle2 } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface HeaderProps {
  wordCount: number;
  isLoadingLexicon: boolean;
}

export const Header: React.FC<HeaderProps> = ({ wordCount, isLoadingLexicon }) => {
  const isOnline = useOnlineStatus();

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-2.5 transition-all">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & Word Count */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/20 text-white font-black text-lg tracking-wider">
            CW
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100 tracking-tight leading-none">
                Crossword Solver
              </h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 px-1.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Offline
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
              {isLoadingLexicon ? (
                <span className="animate-pulse">Loading dictionary...</span>
              ) : (
                <span>{wordCount.toLocaleString()} words on-device</span>
              )}
            </p>
          </div>
        </div>

        {/* Right side controls: Connection status & Install button */}
        <div className="flex items-center gap-2">
          {/* Status badge */}
          <div 
            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300"
            title={isOnline ? "Online (auto-caches definitions for offline travel)" : "Offline Mode active"}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3 text-sky-400" />
                <span className="hidden sm:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-amber-400" />
                <span className="hidden sm:inline text-amber-300">Offline</span>
              </>
            )}
          </div>

          {/* PWA Install Button */}
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
