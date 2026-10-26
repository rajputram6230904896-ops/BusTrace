import { BusRoute, BusStop, CommunityReport, ScheduledDeparture, UserProfile } from '../types/transit';
import { DEMO_USERS, INITIAL_ROUTES, INITIAL_SCHEDULES, INITIAL_STOPS, getInitialReports } from '../data/mockData';

const STORAGE_KEYS = {
  ROUTES: 'bustrace_routes_v1',
  STOPS: 'bustrace_stops_v1',
  SCHEDULES: 'bustrace_schedules_v1',
  REPORTS: 'bustrace_reports_v1',
  FAVORITES: 'bustrace_favorites_v1',
  CURRENT_USER: 'bustrace_current_user_v1',
  USERS: 'bustrace_users_v1',
  FIREBASE_CONFIG: 'bustrace_firebase_config_v1',
  NOTIFICATION_PREFS: 'bustrace_notification_prefs_v1',
};

export interface FirebaseConnectionConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  isConfigured: boolean;
}

type ListenerCallback<T> = (data: T) => void;

class StorageService {
  private listeners: Map<string, Set<ListenerCallback<any>>> = new Map();

  constructor() {
    this.initDefaults();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key && this.listeners.has(e.key)) {
          this.notifyKey(e.key);
        }
      });
    }
  }

  private initDefaults() {
    if (typeof window === 'undefined') return;

    const existingStops = this.getItem<BusStop[]>(STORAGE_KEYS.STOPS);
    if (!existingStops || !existingStops.some((s) => s.id === 'stop_aryans_college')) {
      localStorage.setItem(STORAGE_KEYS.STOPS, JSON.stringify(INITIAL_STOPS));
    }

    if (!localStorage.getItem(STORAGE_KEYS.ROUTES)) {
      localStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(INITIAL_ROUTES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SCHEDULES)) {
      localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(INITIAL_SCHEDULES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(getInitialReports()));
    }

    const existingUsers = this.getItem<UserProfile[]>(STORAGE_KEYS.USERS);
    if (!existingUsers || existingUsers.some((u) => u.name.toLowerCase().includes('navjot'))) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEMO_USERS));
    }

    const currentActiveUser = this.getItem<UserProfile>(STORAGE_KEYS.CURRENT_USER);
    if (!currentActiveUser || currentActiveUser.name.toLowerCase().includes('navjot')) {
      // Set to Rajput Ram (Aryans Group of Colleges, Rajpura)
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(DEMO_USERS[0]));
    }
  }

  private notifyKey(key: string) {
    const callbacks = this.listeners.get(key);
    if (!callbacks) return;
    const data = this.getItem(key);
    callbacks.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error('Error invoking storage listener', err);
      }
    });
  }

  private getItem<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  }

  private setItem<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(data));
    this.notifyKey(key);
  }

  public subscribe<T>(key: string, callback: ListenerCallback<T>): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    const set = this.listeners.get(key)!;
    set.add(callback);

    // Initial emit
    callback(this.getItem<T>(key) as T);

    return () => {
      set.delete(callback);
    };
  }

  // --- Routes ---
  public getRoutes(): BusRoute[] {
    return this.getItem<BusRoute[]>(STORAGE_KEYS.ROUTES) || INITIAL_ROUTES;
  }

  public saveRoute(route: BusRoute): void {
    const current = this.getRoutes();
    const idx = current.findIndex((r) => r.id === route.id);
    if (idx >= 0) {
      current[idx] = route;
    } else {
      current.push(route);
    }
    this.setItem(STORAGE_KEYS.ROUTES, current);
  }

  public deleteRoute(routeId: string): void {
    const current = this.getRoutes().filter((r) => r.id !== routeId);
    this.setItem(STORAGE_KEYS.ROUTES, current);
  }

  // --- Stops ---
  public getStops(): BusStop[] {
    return this.getItem<BusStop[]>(STORAGE_KEYS.STOPS) || INITIAL_STOPS;
  }

  public saveStop(stop: BusStop): void {
    const current = this.getStops();
    const idx = current.findIndex((s) => s.id === stop.id);
    if (idx >= 0) {
      current[idx] = stop;
    } else {
      current.push(stop);
    }
    this.setItem(STORAGE_KEYS.STOPS, current);
  }

  // --- Schedules ---
  public getSchedules(): ScheduledDeparture[] {
    return this.getItem<ScheduledDeparture[]>(STORAGE_KEYS.SCHEDULES) || INITIAL_SCHEDULES;
  }

  public saveSchedule(schedule: ScheduledDeparture): void {
    const current = this.getSchedules();
    const idx = current.findIndex((s) => s.id === schedule.id);
    if (idx >= 0) {
      current[idx] = schedule;
    } else {
      current.push(schedule);
    }
    this.setItem(STORAGE_KEYS.SCHEDULES, current);
  }

  public deleteSchedule(scheduleId: string): void {
    const current = this.getSchedules().filter((s) => s.id !== scheduleId);
    this.setItem(STORAGE_KEYS.SCHEDULES, current);
  }

  // --- Community Reports ---
  public getReports(): CommunityReport[] {
    return this.getItem<CommunityReport[]>(STORAGE_KEYS.REPORTS) || [];
  }

  public submitReport(report: Omit<CommunityReport, 'id' | 'timestamp' | 'confirmationsCount' | 'confirmedByUserIds' | 'reliabilityScore'>): {
    success: boolean;
    report?: CommunityReport;
    error?: string;
  } {
    const current = this.getReports();
    const now = Date.now();

    // 1. Duplicate detection: Check if same reporter submitted report for same route & stop within last 5 minutes
    const duplicate = current.find(
      (r) =>
        r.reporterId === report.reporterId &&
        r.routeId === report.routeId &&
        r.stopId === report.stopId &&
        now - r.timestamp < 5 * 60 * 1000
    );

    if (duplicate) {
      return {
        success: false,
        error: 'You already submitted a report for this stop within the last 5 minutes. Thank you for your contribution!',
      };
    }

    // 2. Conflict detection: Check if there's a recent conflicting report (e.g., departed vs arrived in under 2 mins)
    const recentAtSameStop = current.find(
      (r) =>
        r.routeId === report.routeId &&
        r.stopId === report.stopId &&
        now - r.timestamp < 2 * 60 * 1000 &&
        r.reportType !== report.reportType
    );

    let baseReliability = 85;
    if (recentAtSameStop) {
      baseReliability = 70; // slight flag for conflicting submissions awaiting confirmation
    }

    const newReport: CommunityReport = {
      ...report,
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
      reliabilityScore: baseReliability,
      confirmationsCount: 1, // Author counts as initial confirmation
      confirmedByUserIds: [report.reporterId],
      isFlagged: false,
    };

    current.unshift(newReport);
    this.setItem(STORAGE_KEYS.REPORTS, current);

    // Award commuter points
    this.awardUserPoints(report.reporterId, 15);

    return {
      success: true,
      report: newReport,
    };
  }

  public confirmReport(reportId: string, userId: string): { success: boolean; error?: string } {
    const current = this.getReports();
    const idx = current.findIndex((r) => r.id === reportId);
    if (idx === -1) return { success: false, error: 'Report not found' };

    const report = current[idx];

    // Restriction: Cannot confirm your own report!
    if (report.reporterId === userId) {
      return { success: false, error: 'You cannot confirm your own report.' };
    }

    // Restriction: Already confirmed
    if (report.confirmedByUserIds.includes(userId)) {
      return { success: false, error: 'You have already verified this report.' };
    }

    report.confirmedByUserIds.push(userId);
    report.confirmationsCount += 1;
    report.reliabilityScore = Math.min(99, report.reliabilityScore + 4);

    this.setItem(STORAGE_KEYS.REPORTS, current);
    this.awardUserPoints(userId, 5); // Award confirmation points
    return { success: true };
  }

  public flagReport(reportId: string): void {
    const current = this.getReports();
    const rep = current.find((r) => r.id === reportId);
    if (rep) {
      rep.isFlagged = true;
      rep.reliabilityScore = Math.max(10, rep.reliabilityScore - 30);
      this.setItem(STORAGE_KEYS.REPORTS, current);
    }
  }

  public deleteReport(reportId: string): void {
    const current = this.getReports().filter((r) => r.id !== reportId);
    this.setItem(STORAGE_KEYS.REPORTS, current);
  }

  // --- Users & Profiles ---
  public getUsers(): UserProfile[] {
    return this.getItem<UserProfile[]>(STORAGE_KEYS.USERS) || DEMO_USERS;
  }

  public getCurrentUser(): UserProfile {
    return this.getItem<UserProfile>(STORAGE_KEYS.CURRENT_USER) || DEMO_USERS[0];
  }

  public setCurrentUser(user: UserProfile): void {
    this.setItem(STORAGE_KEYS.CURRENT_USER, user);
  }

  public updateUserProfile(updated: Partial<UserProfile>): void {
    const current = this.getCurrentUser();
    const merged = { ...current, ...updated };
    this.setItem(STORAGE_KEYS.CURRENT_USER, merged);

    const allUsers = this.getUsers();
    const uIdx = allUsers.findIndex((u) => u.id === merged.id);
    if (uIdx >= 0) {
      allUsers[uIdx] = merged;
      this.setItem(STORAGE_KEYS.USERS, allUsers);
    }
  }

  public awardUserPoints(userId: string, pointsToAdd: number): void {
    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      current.points += pointsToAdd;
      current.trustScore = Math.min(100, Math.floor(current.points / 5) + 50);
      this.updateUserProfile(current);
    }
  }

  public toggleFavoriteRoute(routeId: string): boolean {
    const current = this.getCurrentUser();
    const favs = new Set(current.savedRouteIds || []);
    let isNowSaved = false;
    if (favs.has(routeId)) {
      favs.delete(routeId);
      isNowSaved = false;
    } else {
      favs.add(routeId);
      isNowSaved = true;
    }
    this.updateUserProfile({ savedRouteIds: Array.from(favs) });
    return isNowSaved;
  }

  // --- Firebase Cloud Config ---
  public getFirebaseConfig(): FirebaseConnectionConfig {
    const cfg = this.getItem<FirebaseConnectionConfig>(STORAGE_KEYS.FIREBASE_CONFIG);
    return cfg || { isConfigured: false };
  }

  public saveFirebaseConfig(config: FirebaseConnectionConfig): void {
    this.setItem(STORAGE_KEYS.FIREBASE_CONFIG, config);
  }

  public resetAllToDemo(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.ROUTES);
    localStorage.removeItem(STORAGE_KEYS.STOPS);
    localStorage.removeItem(STORAGE_KEYS.SCHEDULES);
    localStorage.removeItem(STORAGE_KEYS.REPORTS);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    this.initDefaults();
    this.notifyKey(STORAGE_KEYS.ROUTES);
    this.notifyKey(STORAGE_KEYS.STOPS);
    this.notifyKey(STORAGE_KEYS.REPORTS);
    this.notifyKey(STORAGE_KEYS.CURRENT_USER);
  }
}

export const storageService = new StorageService();
export { STORAGE_KEYS };
