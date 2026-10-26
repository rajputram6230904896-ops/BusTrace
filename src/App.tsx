/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TransitProvider, useTransit } from './context/TransitContext';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { OfflineBanner } from './components/common/OfflineBanner';
import { TransparencyModal } from './components/common/TransparencyModal';
import { HomeDashboard } from './components/home/HomeDashboard';
import { RouteSearch } from './components/routes/RouteSearch';
import { LiveCommunityFeed } from './components/reports/LiveCommunityFeed';
import { TransitMap } from './components/map/TransitMap';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SubmitReportModal } from './components/reports/SubmitReportModal';
import { UserProfileModal } from './components/profile/UserProfileModal';
import { FirebaseConfigModal } from './components/firebase/FirebaseConfigModal';
import { AuthModal } from './components/auth/AuthModal';
import { notificationService, AppNotification } from './services/notificationService';
import { BusRoute } from './types/transit';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isTransparencyModalOpen, setIsTransparencyModalOpen] = useState<boolean>(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Preselected context for reporting
  const [reportContext, setReportContext] = useState<{ routeId?: string; stopId?: string }>({});

  // Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotificationToast, setShowNotificationToast] = useState<AppNotification | null>(null);

  const [quotaExceeded, setQuotaExceeded] = useState<boolean>(false);

  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  const { setSelectedRoute } = useTransit();

  useEffect(() => {
    const unsub = notificationService.subscribe((list) => {
      setNotifications(list);
      if (list.length > 0 && !list[0].read && Date.now() - list[0].timestamp < 3000) {
        setShowNotificationToast(list[0]);
        setTimeout(() => setShowNotificationToast(null), 4000);
      }
    });
    return unsub;
  }, []);

  const handleOpenReportWithContext = (routeId?: string, stopId?: string) => {
    setReportContext({ routeId, stopId });
    setIsReportModalOpen(true);
  };

  const handleViewRouteOnMap = (route: BusRoute) => {
    setSelectedRoute(route);
    setCurrentTab('map');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Google Maps Quota Warning Banner */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Offline Alert Banner */}
      <OfflineBanner />

      {/* Top Bar Header compliant with Top Bar Contract */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenReportModal={() => handleOpenReportWithContext()}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenTransparencyModal={() => setIsTransparencyModalOpen(true)}
        onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
        unreadCount={notifications.filter((n) => !n.read).length}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 w-full">
        {currentTab === 'dashboard' && (
          <HomeDashboard
            onNavigateToTab={setCurrentTab}
            onOpenReportModal={() => handleOpenReportWithContext()}
            onOpenTransparencyModal={() => setIsTransparencyModalOpen(true)}
          />
        )}

        {currentTab === 'search' && (
          <RouteSearch
            onOpenReportModalWithContext={handleOpenReportWithContext}
            onViewOnMap={handleViewRouteOnMap}
          />
        )}

        {currentTab === 'live' && (
          <LiveCommunityFeed onOpenReportModal={() => handleOpenReportWithContext()} />
        )}

        {currentTab === 'map' && <TransitMap />}

        {currentTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Floating In-App Notification Toast */}
      {showNotificationToast && (
        <div className="fixed bottom-16 md:bottom-6 right-4 z-50 max-w-sm rounded-2xl bg-slate-900 border border-blue-500/50 shadow-2xl p-4 text-slate-100 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-blue-400">
                {showNotificationToast.title}
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                {showNotificationToast.message}
              </p>
            </div>
            <button
              onClick={() => setShowNotificationToast(null)}
              className="text-slate-500 hover:text-slate-300 p-0.5"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Modal: Submit Community Status Report */}
      <SubmitReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        preselectedRouteId={reportContext.routeId}
        preselectedStopId={reportContext.stopId}
      />

      {/* Modal: User Profile & Demo Persona Switcher */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSelectRoute={(routeId) => {
          const target = useTransit;
          setCurrentTab('search');
        }}
      />

      {/* Modal: Transparency & Ethical Transit Charter */}
      <TransparencyModal
        isOpen={isTransparencyModalOpen}
        onClose={() => setIsTransparencyModalOpen(false)}
      />

      {/* Modal: Firebase Cloud Config & Architecture Rules */}
      <FirebaseConfigModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
      />

      {/* Modal: Custom Authentication */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <TransitProvider>
        <AppContent />
      </TransitProvider>
    </AuthProvider>
  );
}
