import React from 'react';
import { Bell, ShieldCheck, User, Settings, Database, PlusCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenReportModal: () => void;
  onOpenProfileModal: () => void;
  onOpenTransparencyModal: () => void;
  onOpenFirebaseModal: () => void;
  unreadCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenReportModal,
  onOpenProfileModal,
  onOpenTransparencyModal,
  onOpenFirebaseModal,
  unreadCount,
}) => {
  const { currentUser, isDemoMode } = useAuth();

  return (
    <header className="sticky top-0 z-30 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Clean single-element in display face) */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className="flex items-center gap-2.5 text-left text-lg font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
            <span className="text-white font-black text-sm border border-white px-1 rounded-sm">BT</span>
          </div>
          <span className="text-white">
            Bus<span className="text-blue-400">Trace</span>
          </span>
        </button>

        {/* Zone 2: 4-5 Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              currentTab === 'dashboard' ? 'text-blue-400 font-semibold border-b-2 border-blue-400' : 'hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onSelectTab('search')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              currentTab === 'search' ? 'text-blue-400 font-semibold border-b-2 border-blue-400' : 'hover:text-white'
            }`}
          >
            Routes & ETA
          </button>
          <button
            onClick={() => onSelectTab('live')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              currentTab === 'live' ? 'text-blue-400 font-semibold border-b-2 border-blue-400' : 'hover:text-white'
            }`}
          >
            Community Feed
          </button>
          <button
            onClick={() => onSelectTab('map')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              currentTab === 'map' ? 'text-blue-400 font-semibold border-b-2 border-blue-400' : 'hover:text-white'
            }`}
          >
            Transit Map
          </button>
          {currentUser.role === 'Admin' && (
            <button
              onClick={() => onSelectTab('admin')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
                currentTab === 'admin' ? 'text-purple-400 font-semibold border-b-2 border-purple-400' : 'hover:text-white'
              }`}
            >
              Admin Desk
            </button>
          )}
        </nav>

        {/* Zone 3: 1 Primary Action Area */}
        <div className="flex items-center gap-3 shrink-0">
          <PWAInstallButton />

          {/* Report CTA */}
          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm shadow-blue-600/30 transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Report Status</span>
            <span className="sm:hidden">Report</span>
          </button>

          {/* Transparency Trigger */}
          <button
            onClick={onOpenTransparencyModal}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="View BusTrace Transparency Charter"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Firebase / Cloud status button */}
          <button
            onClick={onOpenFirebaseModal}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title={isDemoMode ? 'Cloud Firestore Setup (Currently in Offline/Demo Mode)' : 'Firebase Cloud Connected'}
          >
            <Database className={`w-4 h-4 ${isDemoMode ? 'text-slate-400' : 'text-blue-400'}`} />
          </button>

          {/* User Profile trigger */}
          <button
            onClick={onOpenProfileModal}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer border border-slate-700/60"
            title={`Signed in as ${currentUser.name} (${currentUser.role})`}
          >
            <div className="w-7 h-7 rounded-md bg-slate-800 text-blue-400 font-bold text-xs flex items-center justify-center border border-slate-700">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-medium text-slate-200 hidden lg:inline max-w-[100px] truncate">
              {currentUser.name.split(' ')[0]}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
