import React, { useState } from 'react';
import {
  X,
  User,
  ShieldCheck,
  Bell,
  Bookmark,
  Award,
  LogOut,
  Users,
  Check,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTransit } from '../../context/TransitContext';
import { notificationService } from '../../services/notificationService';
import { UserProfile } from '../../types/transit';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoute: (routeId: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onSelectRoute,
}) => {
  const { currentUser, switchUser, allDemoUsers, updateUser, logout } = useAuth();
  const { routes, reports, toggleFavorite } = useTransit();
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const userSubmittedReports = reports.filter((r) => r.reporterId === currentUser.id);
  const userSavedRoutes = routes.filter((r) => (currentUser.savedRouteIds || []).includes(r.id));

  const handleToggleNotifications = async () => {
    if (!currentUser.notificationsEnabled) {
      const granted = await notificationService.requestBrowserPermission();
      if (granted) {
        updateUser({ notificationsEnabled: true });
        notificationService.sendNotification(
          'Notifications Activated',
          'You will now receive departure alerts and crowd delay notifications in this browser.'
        );
        setNotificationMsg('Browser notifications enabled successfully!');
      } else {
        setNotificationMsg('Browser notification permission was not granted.');
      }
    } else {
      updateUser({ notificationsEnabled: false });
      setNotificationMsg('Notifications muted.');
    }

    setTimeout(() => setNotificationMsg(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 font-bold flex items-center justify-center text-sm">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{currentUser.name}</h2>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>{currentUser.role}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>{currentUser.organization || 'Public Commuter'}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-3 my-5">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-800 text-center">
            <span className="block text-[11px] text-slate-400">Trust Points</span>
            <span className="text-lg font-bold text-blue-400 font-mono tabular-nums">
              {currentUser.points}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-800 text-center">
            <span className="block text-[11px] text-slate-400">Reliability Score</span>
            <span className="text-lg font-bold text-emerald-400 font-mono tabular-nums">
              {currentUser.trustScore}%
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-800 text-center">
            <span className="block text-[11px] text-slate-400">Reports Given</span>
            <span className="text-lg font-bold text-white font-mono tabular-nums">
              {userSubmittedReports.length}
            </span>
          </div>
        </div>

        {/* Switch Demo Persona */}
        <div className="mb-6 p-4 rounded-xl bg-slate-800/40 border border-slate-800">
          <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-blue-400" />
            Switch Active Commuter Persona (Testing & Demo)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {allDemoUsers.map((user) => {
              const isSelected = user.id === currentUser.id;
              return (
                <button
                  key={user.id}
                  onClick={() => switchUser(user)}
                  className={`p-2 rounded-lg text-left text-xs border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 text-white font-semibold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                  }`}
                >
                  <div className="truncate font-medium">{user.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{user.role} · {user.points} pts</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="mb-6 p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-400" />
              <div>
                <span className="text-xs font-semibold text-white block">Arrival & Delay Notifications</span>
                <span className="text-[11px] text-slate-400 block">
                  Alert me when a bus on my saved corridors is within 10 minutes
                </span>
              </div>
            </div>

            <button
              onClick={handleToggleNotifications}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                currentUser.notificationsEnabled
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {currentUser.notificationsEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {notificationMsg && (
            <div className="text-[11px] text-blue-300 p-2 rounded-lg bg-blue-950/60 border border-blue-900/40">
              {notificationMsg}
            </div>
          )}

          <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
            Note: Background push notifications when the browser tab is closed require full Service Worker and Firebase Cloud Messaging (FCM) integration.
          </div>
        </div>

        {/* Saved Routes */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
            <Bookmark className="w-4 h-4 text-amber-400 fill-amber-400" />
            Saved Corridors ({userSavedRoutes.length})
          </h3>
          {userSavedRoutes.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-800/30 text-center text-xs text-slate-500">
              No saved routes yet. Bookmark routes in the Explorer to access them quickly here.
            </div>
          ) : (
            <div className="space-y-2">
              {userSavedRoutes.map((route) => (
                <div
                  key={route.id}
                  onClick={() => {
                    onSelectRoute(route.id);
                    onClose();
                  }}
                  className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 flex items-center justify-between cursor-pointer group"
                >
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                      {route.routeNumber} — {route.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {route.origin} → {route.destination}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(route.id);
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded"
                      title="Remove from saved"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submitted Reports History */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-slate-300 mb-2">
            Your Status Broadcasts ({userSubmittedReports.length})
          </h3>
          {userSubmittedReports.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-800/30 text-center text-xs text-slate-500">
              You haven't posted any bus reports yet. Help fellow commuters by reporting arrival times!
            </div>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {userSubmittedReports.map((report) => (
                <div
                  key={report.id}
                  className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-white capitalize">{report.reportType}</span>
                    <span className="text-slate-400 ml-2">({report.confirmationsCount} confirmations)</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-mono font-medium">
                    {report.reliabilityScore}% verified
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Reset / Sign Out</span>
          </button>

          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
