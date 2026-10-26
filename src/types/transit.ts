export type ReportType = 'arrived' | 'departed' | 'delayed';
export type CrowdLevel = 'seats_available' | 'standing_only' | 'packed';
export type BusType = 'PRTC Ordinary' | 'Punbus HVAC' | 'AC Superfast' | 'Campus Shuttle';

export interface BusStop {
  id: string;
  name: string;
  hindiName?: string;
  punjabiName?: string;
  city: string;
  lat: number;
  lng: number;
  landmark?: string;
  isTerminal?: boolean;
}

export interface RouteStopSchedule {
  stopId: string;
  order: number;
  distanceFromStartKm: number;
  scheduledMinutesFromOrigin: number;
}

export interface BusRoute {
  id: string;
  routeNumber: string;
  name: string;
  origin: string;
  destination: string;
  originStopId: string;
  destinationStopId: string;
  totalDistanceKm: number;
  approxDurationMin: number;
  color: string;
  busType: BusType;
  operatingHours: string;
  frequencyMinutes: number;
  stops: RouteStopSchedule[];
  geometry?: [number, number][]; // lat, lng polyline points
  isFictionalDemo?: boolean;
}

export interface ScheduledDeparture {
  id: string;
  routeId: string;
  departureTime: string; // "07:30", "08:15", etc.
  busType: BusType;
  days: string[]; // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  carrier: string; // e.g. "PRTC", "Punbus", "College Transit"
}

export interface CommunityReport {
  id: string;
  routeId: string;
  stopId: string;
  reportType: ReportType;
  delayMinutes?: number;
  delayReason?: string;
  crowdLevel?: CrowdLevel;
  timestamp: number; // Unix timestamp ms
  reporterId: string;
  reporterName: string;
  reporterRole: 'Student' | 'Commuter' | 'Volunteer' | 'Admin';
  reliabilityScore: number;
  confirmationsCount: number;
  confirmedByUserIds: string[];
  isFlagged?: boolean;
}

export interface Confirmation {
  id: string;
  reportId: string;
  userId: string;
  confirmedAt: number;
  isAgreement: boolean; // true = confirmed, false = disputed
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'Student' | 'Commuter' | 'Volunteer' | 'Admin';
  organization?: string; // e.g., "Punjabi University, Patiala", "Thapar Institute", "Daily Commuter"
  joinedDate: string;
  points: number;
  trustScore: number; // 0 - 100
  savedRouteIds: string[];
  notificationsEnabled: boolean;
  arrivalAlertThresholdMin: number;
}

export interface ETAResult {
  routeId: string;
  stopId: string;
  stopName: string;
  scheduledTime: string;
  estimatedArrivalMin: number;
  estimatedArrivalTimeFormatted: string;
  confidenceScore: number; // 0 - 100
  confidenceLevel: 'High' | 'Moderate' | 'Limited Information';
  status: 'On Time' | 'Delayed' | 'Approaching' | 'Departed' | 'Scheduled Only';
  delayMinutes: number;
  lastReportAgeMinutes?: number;
  supportingReportsCount: number;
  assumptions: string[];
}
