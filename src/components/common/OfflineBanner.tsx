import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/usePWA';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-14 left-0 right-0 z-40 bg-amber-500/90 backdrop-blur-md text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-lg border-b border-amber-600/30">
      <WifiOff className="w-4 h-4 text-slate-950 shrink-0" />
      <span>Offline Mode — Showing cached routes and saved schedules. Reports will sync upon reconnection.</span>
    </div>
  );
};
