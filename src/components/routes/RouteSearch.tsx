import React, { useState } from 'react';
import {
  ArrowUpDown,
  Search,
  Bookmark,
  Clock,
  MapPin,
  ChevronRight,
  Info,
  ShieldCheck,
  Radio,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTransit } from '../../context/TransitContext';
import { calculateStopETA } from '../../services/etaEngine';
import { BusRoute, BusStop } from '../../types/transit';

interface RouteSearchProps {
  onOpenReportModalWithContext: (routeId: string, stopId: string) => void;
  onViewOnMap: (route: BusRoute) => void;
}

export const RouteSearch: React.FC<RouteSearchProps> = ({
  onOpenReportModalWithContext,
  onViewOnMap,
}) => {
  const { routes, stops, schedules, reports, selectedRoute, setSelectedRoute, toggleFavorite, isFavorite } = useTransit();

  const [originQuery, setOriginQuery] = useState<string>('');
  const [destQuery, setDestQuery] = useState<string>('');
  const [selectedStopId, setSelectedStopId] = useState<string>('');
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);

  // Quick swap origin and destination
  const handleSwap = () => {
    const temp = originQuery;
    setOriginQuery(destQuery);
    setDestQuery(temp);
  };

  // Filter routes based on search queries
  const filteredRoutes = routes.filter((r) => {
    const originMatch = !originQuery
      ? true
      : r.origin.toLowerCase().includes(originQuery.toLowerCase()) ||
        stops.some(
          (s) =>
            r.stops.some((rs) => rs.stopId === s.id) &&
            s.name.toLowerCase().includes(originQuery.toLowerCase())
        );

    const destMatch = !destQuery
      ? true
      : r.destination.toLowerCase().includes(destQuery.toLowerCase()) ||
        stops.some(
          (s) =>
            r.stops.some((rs) => rs.stopId === s.id) &&
            s.name.toLowerCase().includes(destQuery.toLowerCase())
        );

    return originMatch && destMatch;
  });

  const activeRoute = selectedRoute || filteredRoutes[0] || routes[0];

  // Stop list for active route
  const activeRouteStops = activeRoute
    ? activeRoute.stops
        .map((rs) => {
          const meta = stops.find((s) => s.id === rs.stopId);
          return {
            ...rs,
            meta,
          };
        })
        .sort((a, b) => a.order - b.order)
    : [];

  const targetStopIdForETA = selectedStopId || activeRouteStops[0]?.stopId;
  const etaBreakdown = activeRoute && targetStopIdForETA
    ? calculateStopETA(activeRoute, targetStopIdForETA, stops, schedules, reports)
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-12">
      {/* Search Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Bus Route Explorer & Smart ETAs
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Explore Punjab transit corridors, scheduled depot timetables, and transparent crowd-verified arrivals.
        </p>
      </div>

      {/* Origin / Destination Search Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl mb-8">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto] gap-3 items-center">
          {/* Origin Search */}
          <div className="relative">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Starting From (Origin / Stop)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Rajpura, Bahadurgarh, Patiala"
                value={originQuery}
                onChange={(e) => setOriginQuery(e.target.value)}
                className="w-full text-xs sm:text-sm bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center md:pt-5">
            <button
              onClick={handleSwap}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title="Swap origin and destination"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {/* Destination Search */}
          <div className="relative">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Going To (Destination / Campus)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Chandigarh ISBT, Chitkara, Punjabi Univ"
                value={destQuery}
                onChange={(e) => setDestQuery(e.target.value)}
                className="w-full text-xs sm:text-sm bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Search Button */}
          <div className="flex md:pt-5">
            <button
              type="button"
              onClick={() => {
                // Focus on filtered results
                if (filteredRoutes.length > 0) {
                  setSelectedRoute(filteredRoutes[0]);
                  if (filteredRoutes[0].stops.length > 0) {
                    setSelectedStopId(filteredRoutes[0].stops[0].stopId);
                  }
                }
              }}
              className="w-full md:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search Routes</span>
            </button>
          </div>
        </div>

        {/* Demo Data Disclaimer Flag */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            Sample corridor schedules for student & commuter testing (fictional demonstration).
          </span>
          <span className="font-mono text-slate-400">{filteredRoutes.length} Route(s) Found</span>
        </div>
      </div>

      {/* 2-Column Split: Routes List on Left, Active Route Details & ETA on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Route Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xs font-bold text-slate-400">
              Matching Transit Corridors
            </h2>
            <span className="text-xs text-slate-400">Click to inspect</span>
          </div>

          {filteredRoutes.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
              No matching routes found. Try clearing your search filters.
            </div>
          ) : (
            filteredRoutes.map((route) => {
              const isSelected = activeRoute?.id === route.id;
              const isFav = isFavorite(route.id);

              return (
                <div
                  key={route.id}
                  onClick={() => {
                    setSelectedRoute(route);
                    if (route.stops.length > 0) {
                      setSelectedStopId(route.stops[0].stopId);
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-slate-900 border-blue-500 shadow-md shadow-blue-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {/* Unboxed Route Number & Name */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white tracking-tight">
                          {route.routeNumber}
                        </span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="text-xs font-medium text-slate-300">
                          {route.name}
                        </span>
                      </div>

                      {/* Origin to Destination */}
                      <div className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                        <span className="text-slate-200">{route.origin}</span>
                        <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                        <span className="text-slate-200">{route.destination}</span>
                      </div>

                      {/* Metadata */}
                      <div className="text-xs text-slate-400 mt-2.5 flex items-center gap-2">
                        <span>{route.busType}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{route.totalDistanceKm} km</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">~{route.approxDurationMin} min</span>
                      </div>
                    </div>

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(route.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                      title={isFav ? 'Remove from saved' : 'Save route to favorites'}
                    >
                      <Bookmark className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Route Details, ETA Engine Inspector & Stop Timeline (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {activeRoute && (
            <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
              {/* Header Banner */}
              <div className="p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-lg font-bold text-white">
                        {activeRoute.routeNumber}
                      </span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="text-sm font-semibold text-blue-400">
                        {activeRoute.name}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Depot Carrier: {activeRoute.busType} · Frequency: Every {activeRoute.frequencyMinutes} min
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewOnMap(activeRoute)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-blue-600/30 transition-colors cursor-pointer"
                    >
                      View on Map
                    </button>
                    <button
                      onClick={() => onOpenReportModalWithContext(activeRoute.id, targetStopIdForETA)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
                    >
                      Report Here
                    </button>
                  </div>
                </div>

                {/* Smart ETA Engine Box */}
                {etaBreakdown && (
                  <div className="mt-5 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                      <div>
                        <div className="text-[11px] text-slate-400">
                          Transparent Arrival Estimate for Stop:
                        </div>
                        <div className="text-sm font-bold text-white">
                          {etaBreakdown.stopName}
                        </div>
                      </div>

                      {/* Confidence Score Pill-Free Indicator */}
                      <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
                        <span className="text-slate-400">Confidence:</span>
                        <span
                          className={`font-bold ${
                            etaBreakdown.confidenceScore >= 75
                              ? 'text-emerald-400'
                              : etaBreakdown.confidenceScore >= 50
                              ? 'text-cyan-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {etaBreakdown.confidenceScore}% ({etaBreakdown.confidenceLevel})
                        </span>
                      </div>
                    </div>

                    {/* Arrival Window Numbers */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3">
                      <div>
                        <span className="block text-[11px] text-slate-400">Arrival Window</span>
                        <span className="text-lg font-bold text-blue-400 font-mono tabular-nums">
                          ~{etaBreakdown.estimatedArrivalMin} min
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-slate-400">Expected Time</span>
                        <span className="text-lg font-bold text-white font-mono tabular-nums">
                          {etaBreakdown.estimatedArrivalTimeFormatted}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-slate-400">Timetable Time</span>
                        <span className="text-lg font-semibold text-slate-300 font-mono tabular-nums">
                          {etaBreakdown.scheduledTime}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-slate-400">Traffic Delay</span>
                        <span
                          className={`text-lg font-bold font-mono tabular-nums ${
                            etaBreakdown.delayMinutes > 0 ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {etaBreakdown.delayMinutes > 0 ? `+${etaBreakdown.delayMinutes}m` : 'On Schedule'}
                        </span>
                      </div>
                    </div>

                    {/* ETA Engine Assumptions List */}
                    <div className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-1">
                      <div className="text-[11px] font-semibold text-slate-400">
                        Transparent Calculation Assumptions:
                      </div>
                      {etaBreakdown.assumptions.map((assump, idx) => (
                        <div key={idx} className="text-[11px] text-slate-400 flex items-start gap-1.5 leading-relaxed">
                          <span className="text-blue-400">›</span>
                          <span>{assump}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Intermediate Stops Timeline */}
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-300">
                    Intermediate Stops & Progress ({activeRouteStops.length} Stops)
                  </h3>
                  <span className="text-xs text-slate-400">Select any stop to inspect ETA</span>
                </div>

                <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {activeRouteStops.map((item, idx) => {
                    const isTarget = item.stopId === targetStopIdForETA;
                    const isOrigin = idx === 0;
                    const isFinal = idx === activeRouteStops.length - 1;

                    return (
                      <div
                        key={item.stopId}
                        onClick={() => setSelectedStopId(item.stopId)}
                        className={`relative cursor-pointer group transition-all p-3 rounded-xl ${
                          isTarget
                            ? 'bg-slate-800/90 border border-blue-500/60 shadow-md'
                            : 'hover:bg-slate-800/40 border border-transparent'
                        }`}
                      >
                        {/* Timeline Node Icon */}
                        <div
                          className={`absolute -left-[27px] top-4 w-3.5 h-3.5 rounded-full border-2 transition-transform group-hover:scale-110 ${
                            isTarget
                              ? 'bg-blue-500 border-white ring-4 ring-blue-500/20'
                              : isOrigin || isFinal
                              ? 'bg-slate-900 border-blue-400'
                              : 'bg-slate-900 border-slate-600'
                          }`}
                        />

                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-semibold ${
                                  isTarget ? 'text-blue-400' : 'text-slate-200 group-hover:text-white'
                                }`}
                              >
                                {item.meta?.name}
                              </span>
                              {item.meta?.punjabiName && (
                                <span className="text-xs text-slate-400 font-normal">
                                  {item.meta.punjabiName}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {item.meta?.landmark || item.meta?.city}
                            </div>
                          </div>

                          <div className="text-right text-xs font-mono tabular-nums text-slate-400 shrink-0">
                            <div>+{item.scheduledMinutesFromOrigin}m</div>
                            <div className="text-[11px] text-slate-400">{item.distanceFromStartKm} km</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
