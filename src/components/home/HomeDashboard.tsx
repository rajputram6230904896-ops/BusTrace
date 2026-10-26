import React, { useState } from 'react';
import {
  Search,
  ArrowRight,
  Bookmark,
  MapPin,
  Clock,
  Radio,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Compass,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTransit } from '../../context/TransitContext';
import { calculateStopETA } from '../../services/etaEngine';
import { BusRoute } from '../../types/transit';

interface HomeDashboardProps {
  onNavigateToTab: (tab: string) => void;
  onOpenReportModal: () => void;
  onOpenTransparencyModal: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onNavigateToTab,
  onOpenReportModal,
  onOpenTransparencyModal,
}) => {
  const { currentUser } = useAuth();
  const { routes, stops, schedules, reports, setSelectedRoute, isFavorite, toggleFavorite } = useTransit();
  const [quickSearch, setQuickSearch] = useState<string>('');

  // Saved routes
  const savedRoutes = routes.filter((r) => (currentUser.savedRouteIds || []).includes(r.id));

  // Quick filtered routes
  const matchingRoutes = quickSearch.trim()
    ? routes.filter(
        (r) =>
          r.name.toLowerCase().includes(quickSearch.toLowerCase()) ||
          r.routeNumber.toLowerCase().includes(quickSearch.toLowerCase()) ||
          r.origin.toLowerCase().includes(quickSearch.toLowerCase()) ||
          r.destination.toLowerCase().includes(quickSearch.toLowerCase())
      )
    : routes;

  const recentReports = reports.filter((r) => !r.isFlagged).slice(0, 4);

  const handleRouteClick = (route: BusRoute) => {
    setSelectedRoute(route);
    onNavigateToTab('search');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12 space-y-10">
      {/* Hero Section: 2-Column Balanced Split */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[380px]">
          {/* Left Hero Content (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between z-10">
            <div>
              {/* Brand Wordmark & Tagline Lead */}
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/src/assets/images/bustrace_app_icon_1793000806882.jpg"
                  alt="BusTrace Emblem"
                  className="w-10 h-10 rounded-xl object-cover shadow-md shadow-blue-500/20"
                />
                <div className="text-xs font-semibold tracking-wider uppercase text-blue-400">
                  Public Transit Platform · Punjab Corridor
                </div>
              </div>

              {/* Tagline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.1] max-w-xl text-balance">
                Know Your Bus. <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                  Save Your Time.
                </span>
              </h1>

              <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-lg leading-relaxed">
                Smart, community-powered bus tracking and transparent arrival estimates for students and daily commuters across Rajpura, Patiala, and Chandigarh.
              </p>
            </div>

            {/* Quick Hero Search Input */}
            <div className="mt-8 pt-6 border-t border-slate-800/80">
              <div className="relative max-w-lg">
                <input
                  type="text"
                  placeholder="Search routes or stops (e.g. Rajpura, Punjabi Univ, ISBT 43)..."
                  value={quickSearch}
                  onChange={(e) => setQuickSearch(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-2xl pl-11 pr-28 py-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-inner"
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <button
                  onClick={() => onNavigateToTab('search')}
                  className="absolute right-2 top-2 bottom-2 px-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                >
                  Explore <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Unboxed Transparency Kicker */}
              <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                <button
                  onClick={onOpenTransparencyModal}
                  className="hover:text-blue-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verified Community Data</span>
                </button>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>Depot Timetables</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>Zero Fake GPS</span>
              </div>
            </div>
          </div>

          {/* Right Hero Image (5 cols) */}
          <div className="lg:col-span-5 relative min-h-[220px] lg:min-h-full">
            <img
              src="/public/assets/aistudio/images_a9588d06.jpg"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/src/assets/images/real_commuter_bus.jpg';
              }}
              alt="Commuter Express Bus"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent lg:bg-gradient-to-r lg:from-slate-900 lg:via-transparent lg:to-transparent" />
          </div>
        </div>
      </section>

      {/* 4-Item KPI Strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Active Corridors</div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums mt-1">
            {routes.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Rajpura - Patiala - CHD</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Network Stops</div>
          <div className="text-2xl font-extrabold text-blue-400 font-mono tabular-nums mt-1">
            {stops.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">With GPS coordinate pins</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Reports Today</div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono tabular-nums mt-1">
            {reports.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Crowd verified</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Average Confidence</div>
          <div className="text-2xl font-extrabold text-cyan-400 font-mono tabular-nums mt-1">
            88%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Multi-source estimation</div>
        </div>
      </section>

      {/* Main Grid: Featured Corridors & Quick Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Featured & Saved Corridors (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Saved Routes (if any) */}
          {savedRoutes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-amber-400 fill-amber-400" />
                  Your Saved Routes ({savedRoutes.length})
                </h2>
                <button
                  onClick={() => onNavigateToTab('search')}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  View all
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {savedRoutes.map((route) => {
                  // Compute sample ETA for first stop
                  const firstStopId = route.stops[0]?.stopId;
                  const eta = calculateStopETA(route, firstStopId, stops, schedules, reports);

                  return (
                    <div
                      key={route.id}
                      onClick={() => handleRouteClick(route)}
                      className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                            {route.routeNumber}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">{route.name}</div>
                        </div>
                        <span className="font-mono text-xs text-blue-400 font-semibold">
                          ~{eta.estimatedArrivalMin}m
                        </span>
                      </div>
                      <div className="mt-3 text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800">
                        <span>{route.stops.length} Stops</span>
                        <span>{route.busType}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Featured Corridor Routes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Featured Transit Routes
                </h2>
                <p className="text-xs text-slate-400">
                  Select a corridor to view timetable, intermediate stops, and live passenger reports.
                </p>
              </div>

              <button
                onClick={() => onNavigateToTab('search')}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                Search All
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {matchingRoutes.map((route) => {
                const isFav = isFavorite(route.id);
                const nextDeparture = schedules.find((s) => s.routeId === route.id);

                return (
                  <div
                    key={route.id}
                    onClick={() => handleRouteClick(route)}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/60 transition-all cursor-pointer group shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        {/* Unboxed Top Line */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                            {route.routeNumber}
                          </span>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className="text-xs font-medium text-slate-300">
                            {route.name}
                          </span>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className="text-xs text-slate-400">{route.busType}</span>
                        </div>

                        {/* Origin to Destination */}
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-300 font-medium">
                          <span>{route.origin}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                          <span>{route.destination}</span>
                        </div>

                        {/* Unboxed Metadata */}
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                          <span className="font-mono tabular-nums">{route.totalDistanceKm} km</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">~{route.approxDurationMin} min</span>
                          <span aria-hidden="true">·</span>
                          <span>Departs every {route.frequencyMinutes}m</span>
                        </div>
                      </div>

                      {/* Right Side: Next Schedule & Action */}
                      <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
                        {nextDeparture && (
                          <div className="text-right">
                            <span className="block text-[11px] text-slate-400">Timetable</span>
                            <span className="text-xs font-mono font-bold text-white tabular-nums">
                              {nextDeparture.departureTime}
                            </span>
                          </div>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(route.id);
                          }}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition-colors"
                          title={isFav ? 'Saved' : 'Save route'}
                        >
                          <Bookmark className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live Community Updates & Quick Map Action (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Action Map Card */}
          <div
            onClick={() => onNavigateToTab('map')}
            className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950/60 border border-slate-800 hover:border-blue-500/50 transition-all cursor-pointer relative overflow-hidden group shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-xs text-blue-400 font-semibold flex items-center gap-1">
                Open Map <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">Interactive Corridor Map</h3>
            <p className="text-xs text-slate-400 mt-1">
              Locate nearby bus stops along the highway and check stop-by-stop routes with OpenStreetMap.
            </p>
          </div>

          {/* Recent Community Updates Feed Glance */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Live Ground Reports
                </h3>
              </div>
              <button
                onClick={() => onNavigateToTab('live')}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                View all
              </button>
            </div>

            <div className="divide-y divide-slate-800/80 mt-1">
              {recentReports.map((report) => {
                const route = routes.find((r) => r.id === report.routeId);
                const stop = stops.find((s) => s.id === report.stopId);
                const diffMin = Math.max(0, Math.round((Date.now() - report.timestamp) / 60000));

                return (
                  <div key={report.id} className="py-3 text-xs">
                    <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                      <span className="font-semibold text-slate-300">{route?.routeNumber}</span>
                      <span className="font-mono">{diffMin < 1 ? 'Just now' : `${diffMin}m ago`}</span>
                    </div>

                    <div className="flex items-center gap-1.5 font-medium">
                      <span
                        className={
                          report.reportType === 'arrived'
                            ? 'text-emerald-400'
                            : report.reportType === 'delayed'
                            ? 'text-amber-400'
                            : 'text-blue-400'
                        }
                      >
                        {report.reportType === 'arrived'
                          ? 'Arrived'
                          : report.reportType === 'delayed'
                          ? `Delayed (+${report.delayMinutes}m)`
                          : 'Departed'}
                      </span>
                      <span className="text-slate-300">@ {stop?.name}</span>
                    </div>

                    <div className="mt-1 text-[11px] text-slate-400">
                      Reported by {report.reporterName} ({report.reporterRole}) · {report.confirmationsCount} confirmation(s)
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800">
              <button
                onClick={onOpenReportModal}
                className="w-full py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold transition-colors cursor-pointer"
              >
                Broadcast Status Update
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
