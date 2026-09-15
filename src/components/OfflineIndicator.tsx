import React, { useState, useEffect } from 'react';
import { WifiOff, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (showReconnected) {
    return (
      <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Back online — Cloud lookups enabled
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-slate-800/95 border border-slate-700 px-3.5 py-1.5 text-xs font-semibold text-amber-300 shadow-xl backdrop-blur">
        <WifiOff className="w-3.5 h-3.5 text-amber-400" />
        Offline Travel Mode — 100% on-device dictionary active
      </div>
    );
  }

  return null;
};
