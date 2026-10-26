import React, { createContext, useContext, useEffect, useState } from 'react';
import { notificationService } from '../services/notificationService';
import { storageService, STORAGE_KEYS } from '../services/storageService';
import { BusRoute, BusStop, CommunityReport, ScheduledDeparture } from '../types/transit';
import { useAuth } from './AuthContext';

interface TransitContextType {
  routes: BusRoute[];
  stops: BusStop[];
  schedules: ScheduledDeparture[];
  reports: CommunityReport[];
  selectedRoute: BusRoute | null;
  setSelectedRoute: (r: BusRoute | null) => void;
  selectedStop: BusStop | null;
  setSelectedStop: (s: BusStop | null) => void;
  selectedOrigin: string;
  setSelectedOrigin: (origin: string) => void;
  selectedDestination: string;
  setSelectedDestination: (dest: string) => void;
  submitReport: (
    data: Omit<CommunityReport, 'id' | 'timestamp' | 'confirmationsCount' | 'confirmedByUserIds' | 'reliabilityScore' | 'reporterId' | 'reporterName' | 'reporterRole'>
  ) => { success: boolean; error?: string };
  confirmReport: (reportId: string) => { success: boolean; error?: string };
  toggleFavorite: (routeId: string) => boolean;
  isFavorite: (routeId: string) => boolean;
  adminSaveRoute: (route: BusRoute) => void;
  adminDeleteRoute: (routeId: string) => void;
  adminSaveStop: (stop: BusStop) => void;
  adminFlagReport: (reportId: string) => void;
  adminDeleteReport: (reportId: string) => void;
  adminSaveSchedule: (schedule: ScheduledDeparture) => void;
  adminDeleteSchedule: (scheduleId: string) => void;
  resetDemoData: () => void;
  lastSyncTimestamp: number;
}

const TransitContext = createContext<TransitContextType | undefined>(undefined);

export const TransitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, updateUser } = useAuth();
  const [routes, setRoutes] = useState<BusRoute[]>(() => storageService.getRoutes());
  const [stops, setStops] = useState<BusStop[]>(() => storageService.getStops());
  const [schedules, setSchedules] = useState<ScheduledDeparture[]>(() => storageService.getSchedules());
  const [reports, setReports] = useState<CommunityReport[]>(() => storageService.getReports());

  const [selectedRoute, setSelectedRoute] = useState<BusRoute | null>(() => routes[0] || null);
  const [selectedStop, setSelectedStop] = useState<BusStop | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<string>('');
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number>(Date.now());

  // Subscribe to live storage changes
  useEffect(() => {
    const unsubRoutes = storageService.subscribe<BusRoute[]>(STORAGE_KEYS.ROUTES, (data) => {
      if (data) {
        setRoutes(data);
        setLastSyncTimestamp(Date.now());
      }
    });

    const unsubStops = storageService.subscribe<BusStop[]>(STORAGE_KEYS.STOPS, (data) => {
      if (data) {
        setStops(data);
        setLastSyncTimestamp(Date.now());
      }
    });

    const unsubSchedules = storageService.subscribe<ScheduledDeparture[]>(STORAGE_KEYS.SCHEDULES, (data) => {
      if (data) {
        setSchedules(data);
        setLastSyncTimestamp(Date.now());
      }
    });

    const unsubReports = storageService.subscribe<CommunityReport[]>(STORAGE_KEYS.REPORTS, (data) => {
      if (data) {
        setReports(data);
        setLastSyncTimestamp(Date.now());
      }
    });

    return () => {
      unsubRoutes();
      unsubStops();
      unsubSchedules();
      unsubReports();
    };
  }, []);

  const submitReport = (
    data: Omit<CommunityReport, 'id' | 'timestamp' | 'confirmationsCount' | 'confirmedByUserIds' | 'reliabilityScore' | 'reporterId' | 'reporterName' | 'reporterRole'>
  ) => {
    const res = storageService.submitReport({
      ...data,
      reporterId: currentUser.id,
      reporterName: currentUser.name,
      reporterRole: currentUser.role,
    });

    if (res.success && res.report) {
      const routeObj = routes.find((r) => r.id === data.routeId);
      const stopObj = stops.find((s) => s.id === data.stopId);
      notificationService.sendNotification(
        `Report Published: ${data.reportType.toUpperCase()}`,
        `Your update for ${routeObj?.routeNumber || 'Bus'} at ${stopObj?.name || 'Stop'} is live.`,
        data.reportType === 'delayed' ? 'delay' : 'arrival',
        data.routeId,
        data.stopId
      );
    }

    return res;
  };

  const confirmReport = (reportId: string) => {
    const res = storageService.confirmReport(reportId, currentUser.id);
    if (res.success) {
      notificationService.sendNotification(
        'Community Verification Added',
        'Thank you for confirming this bus status. Your trust points have been updated.',
        'report_confirmed'
      );
    }
    return res;
  };

  const toggleFavorite = (routeId: string) => {
    const isNowSaved = storageService.toggleFavoriteRoute(routeId);
    const updatedFavs = isNowSaved
      ? [...(currentUser.savedRouteIds || []), routeId]
      : (currentUser.savedRouteIds || []).filter((id) => id !== routeId);
    updateUser({ savedRouteIds: updatedFavs });
    return isNowSaved;
  };

  const isFavorite = (routeId: string) => {
    return (currentUser.savedRouteIds || []).includes(routeId);
  };

  const adminSaveRoute = (route: BusRoute) => {
    storageService.saveRoute(route);
  };

  const adminDeleteRoute = (routeId: string) => {
    storageService.deleteRoute(routeId);
    if (selectedRoute?.id === routeId) {
      setSelectedRoute(routes.find((r) => r.id !== routeId) || null);
    }
  };

  const adminSaveStop = (stop: BusStop) => {
    storageService.saveStop(stop);
  };

  const adminFlagReport = (reportId: string) => {
    storageService.flagReport(reportId);
  };

  const adminDeleteReport = (reportId: string) => {
    storageService.deleteReport(reportId);
  };

  const adminSaveSchedule = (schedule: ScheduledDeparture) => {
    storageService.saveSchedule(schedule);
  };

  const adminDeleteSchedule = (scheduleId: string) => {
    storageService.deleteSchedule(scheduleId);
  };

  const resetDemoData = () => {
    storageService.resetAllToDemo();
  };

  return (
    <TransitContext.Provider
      value={{
        routes,
        stops,
        schedules,
        reports,
        selectedRoute,
        setSelectedRoute,
        selectedStop,
        setSelectedStop,
        selectedOrigin,
        setSelectedOrigin,
        selectedDestination,
        setSelectedDestination,
        submitReport,
        confirmReport,
        toggleFavorite,
        isFavorite,
        adminSaveRoute,
        adminDeleteRoute,
        adminSaveStop,
        adminFlagReport,
        adminDeleteReport,
        adminSaveSchedule,
        adminDeleteSchedule,
        resetDemoData,
        lastSyncTimestamp,
      }}
    >
      {children}
    </TransitContext.Provider>
  );
};

export function useTransit() {
  const context = useContext(TransitContext);
  if (!context) {
    throw new Error('useTransit must be used within a TransitProvider');
  }
  return context;
}
