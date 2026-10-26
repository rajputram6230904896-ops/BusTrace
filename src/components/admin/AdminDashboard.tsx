import React, { useState } from 'react';
import {
  ShieldAlert,
  Plus,
  Trash2,
  Edit2,
  Check,
  AlertTriangle,
  RotateCcw,
  Clock,
  MapPin,
  Route as RouteIcon,
  Radio,
  Flag,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTransit } from '../../context/TransitContext';
import { BusRoute, BusStop, BusType, ScheduledDeparture } from '../../types/transit';

export const AdminDashboard: React.FC = () => {
  const { currentUser, isAdmin, switchUser, allDemoUsers } = useAuth();
  const {
    routes,
    stops,
    schedules,
    reports,
    adminSaveRoute,
    adminDeleteRoute,
    adminSaveStop,
    adminFlagReport,
    adminDeleteReport,
    adminSaveSchedule,
    adminDeleteSchedule,
    resetDemoData,
  } = useTransit();

  const [activeTab, setActiveTab] = useState<'overview' | 'routes' | 'stops' | 'schedules' | 'reports'>('overview');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // New route form state
  const [newRoute, setNewRoute] = useState<Partial<BusRoute>>({
    routeNumber: '',
    name: '',
    origin: '',
    destination: '',
    busType: 'PRTC Ordinary',
    totalDistanceKm: 30,
    approxDurationMin: 50,
    frequencyMinutes: 20,
    color: '#3b82f6',
  });

  // New stop form state
  const [newStop, setNewStop] = useState<Partial<BusStop>>({
    name: '',
    punjabiName: '',
    city: 'Patiala District',
    lat: 30.4,
    lng: 76.5,
    landmark: '',
    isTerminal: false,
  });

  // New schedule form state
  const [newSchedule, setNewSchedule] = useState<Partial<ScheduledDeparture>>({
    routeId: routes[0]?.id || '',
    departureTime: '08:00',
    busType: 'PRTC Ordinary',
    carrier: 'PRTC Fast',
  });

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleAddRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoute.routeNumber || !newRoute.name) return;

    const routeToAdd: BusRoute = {
      id: `route_${Date.now()}`,
      routeNumber: newRoute.routeNumber,
      name: newRoute.name,
      origin: newRoute.origin || 'Origin Terminal',
      destination: newRoute.destination || 'Destination Terminal',
      originStopId: stops[0]?.id || 'stop_1',
      destinationStopId: stops[stops.length - 1]?.id || 'stop_2',
      totalDistanceKm: Number(newRoute.totalDistanceKm) || 25,
      approxDurationMin: Number(newRoute.approxDurationMin) || 45,
      frequencyMinutes: Number(newRoute.frequencyMinutes) || 20,
      busType: (newRoute.busType as BusType) || 'PRTC Ordinary',
      color: newRoute.color || '#3b82f6',
      operatingHours: '06:00 AM – 09:30 PM',
      isFictionalDemo: true,
      stops: stops.slice(0, 4).map((s, idx) => ({
        stopId: s.id,
        order: idx + 1,
        distanceFromStartKm: idx * 8,
        scheduledMinutesFromOrigin: idx * 14,
      })),
      geometry: stops.slice(0, 4).map((s) => [s.lat, s.lng] as [number, number]),
    };

    adminSaveRoute(routeToAdd);
    showToast(`Route ${routeToAdd.routeNumber} successfully created.`);
    setNewRoute({
      routeNumber: '',
      name: '',
      origin: '',
      destination: '',
      busType: 'PRTC Ordinary',
      totalDistanceKm: 30,
      approxDurationMin: 50,
      frequencyMinutes: 20,
      color: '#3b82f6',
    });
  };

  const handleAddStop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStop.name) return;

    const stopToAdd: BusStop = {
      id: `stop_${Date.now()}`,
      name: newStop.name,
      punjabiName: newStop.punjabiName,
      city: newStop.city || 'Patiala District',
      lat: Number(newStop.lat) || 30.4,
      lng: Number(newStop.lng) || 76.5,
      landmark: newStop.landmark,
      isTerminal: !!newStop.isTerminal,
    };

    adminSaveStop(stopToAdd);
    showToast(`Bus stop "${stopToAdd.name}" added to transit network.`);
    setNewStop({
      name: '',
      punjabiName: '',
      city: 'Patiala District',
      lat: 30.4,
      lng: 76.5,
      landmark: '',
      isTerminal: false,
    });
  };

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedule.departureTime || !newSchedule.routeId) return;

    const schedToAdd: ScheduledDeparture = {
      id: `sch_${Date.now()}`,
      routeId: newSchedule.routeId,
      departureTime: newSchedule.departureTime,
      busType: (newSchedule.busType as BusType) || 'PRTC Ordinary',
      carrier: newSchedule.carrier || 'PRTC Depot',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    };

    adminSaveSchedule(schedToAdd);
    showToast(`Schedule ${schedToAdd.departureTime} departure saved.`);
  };

  if (!isAdmin) {
    const adminUser = allDemoUsers.find((u) => u.role === 'Admin');

    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Protected Admin Access</h2>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          The Admin Desk is restricted to transit dispatchers, depot supervisors, and regional moderators.
          Currently signed in as: <span className="text-slate-200">{currentUser.name} ({currentUser.role})</span>.
        </p>
        {adminUser && (
          <div className="mt-6">
            <button
              onClick={() => switchUser(adminUser)}
              className="py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              Switch to Transit Dispatcher Persona ({adminUser.name})
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-12">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Transit Administration Desk
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch corridors, verify community reports, manage stops, and audit reliability scores.
          </p>
        </div>

        {/* Reset Demo Data Action */}
        <button
          onClick={() => {
            if (window.confirm('Reset all demo routes, schedules, and community reports to factory state?')) {
              resetDemoData();
              showToast('Demo data restored to initial factory defaults.');
            }
          }}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Sample Corridors</span>
        </button>
      </div>

      {successToast && (
        <div className="mb-6 p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Tabs Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2 px-3.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'overview' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Overview & Metrics
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`py-2 px-3.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'reports' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Community Reports ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab('routes')}
          className={`py-2 px-3.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'routes' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Corridors & Routes ({routes.length})
        </button>
        <button
          onClick={() => setActiveTab('stops')}
          className={`py-2 px-3.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'stops' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Network Stops ({stops.length})
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`py-2 px-3.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'schedules' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Timetables ({schedules.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400">Total Corridor Routes</span>
              <div className="text-2xl font-bold text-white font-mono mt-1">{routes.length}</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400">Transit Stops Registered</span>
              <div className="text-2xl font-bold text-blue-400 font-mono mt-1">{stops.length}</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400">Passenger Reports</span>
              <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">{reports.length}</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400">Flagged Misinformation</span>
              <div className="text-2xl font-bold text-amber-400 font-mono mt-1">
                {reports.filter((r) => r.isFlagged).length}
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-2">Regional Dispatch Guidelines</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              When moderating community updates, keep reports active if at least one peer passenger has confirmed arrival.
              In case of confirmed highway blockades or weather interruptions, adjust default timetable departures or flag misleading entries.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: REPORTS MODERATION */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Community Report Queue</h2>
            <span className="text-xs text-slate-400">Real-time submissions</span>
          </div>

          <div className="divide-y divide-slate-800 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
            {reports.map((report) => {
              const route = routes.find((r) => r.id === report.routeId);
              const stop = stops.find((s) => s.id === report.stopId);

              return (
                <div key={report.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-white">{route?.routeNumber}</span>
                      <span className="text-slate-500">·</span>
                      <span className={report.reportType === 'delayed' ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                        {report.reportType.toUpperCase()} {report.delayMinutes ? `(+${report.delayMinutes}m)` : ''}
                      </span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-300">@ {stop?.name}</span>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-1">
                      Submitted by {report.reporterName} ({report.reporterRole}) · {report.confirmationsCount} confirmation(s) · Reliability: {report.reliabilityScore}%
                      {report.isFlagged && <span className="text-rose-400 font-bold ml-2">[FLAGGED MISLEADING]</span>}
                    </div>

                    {report.delayReason && (
                      <div className="text-[11px] text-amber-300 mt-1">
                        Note: {report.delayReason}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                    {!report.isFlagged && (
                      <button
                        onClick={() => {
                          adminFlagReport(report.id);
                          showToast('Report flagged and discounted from ETA calculation.');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-950/50 text-amber-300 border border-amber-800/40 text-xs hover:bg-amber-900 transition-colors"
                      >
                        Flag Misleading
                      </button>
                    )}
                    <button
                      onClick={() => {
                        adminDeleteReport(report.id);
                        showToast('Report removed from feed.');
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Delete report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ROUTES CRUD */}
      {activeTab === 'routes' && (
        <div className="space-y-6">
          {/* Add Route Form */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-purple-400" />
              Register New Transit Route
            </h3>
            <form onSubmit={handleAddRoute} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Route Identifier</label>
                <input
                  type="text"
                  placeholder="e.g. 105-PRTC"
                  value={newRoute.routeNumber}
                  onChange={(e) => setNewRoute({ ...newRoute, routeNumber: e.target.value })}
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Route Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rajpura – Sirhind Shuttle"
                  value={newRoute.name}
                  onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })}
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Origin City/Terminal</label>
                <input
                  type="text"
                  placeholder="e.g. Rajpura Bus Stand"
                  value={newRoute.origin}
                  onChange={(e) => setNewRoute({ ...newRoute, origin: e.target.value })}
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Destination City/Terminal</label>
                <input
                  type="text"
                  placeholder="e.g. Sirhind Junction"
                  value={newRoute.destination}
                  onChange={(e) => setNewRoute({ ...newRoute, destination: e.target.value })}
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Bus Classification</label>
                <select
                  value={newRoute.busType}
                  onChange={(e) => setNewRoute({ ...newRoute, busType: e.target.value as BusType })}
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="PRTC Ordinary">PRTC Ordinary</option>
                  <option value="Punbus HVAC">Punbus HVAC</option>
                  <option value="AC Superfast">AC Superfast</option>
                  <option value="Campus Shuttle">Campus Shuttle</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold text-xs text-white transition-all cursor-pointer"
                >
                  Create Route
                </button>
              </div>
            </form>
          </div>

          {/* Existing Routes List */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 divide-y divide-slate-800 overflow-hidden">
            {routes.map((route) => (
              <div key={route.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{route.routeNumber}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-300 font-normal">{route.name}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {route.origin} → {route.destination} · {route.stops.length} stops · {route.busType}
                  </div>
                </div>

                <button
                  onClick={() => {
                    adminDeleteRoute(route.id);
                    showToast(`Route ${route.routeNumber} deleted.`);
                  }}
                  className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Delete Route"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: STOPS CRUD */}
      {activeTab === 'stops' && (
        <div className="space-y-6">
          {/* Add Stop Form */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-purple-400" />
              Add Network Bus Stop
            </h3>
            <form onSubmit={handleAddStop} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Stop Name (English)</label>
                <input
                  type="text"
                  placeholder="e.g. Sirhind Road Gate"
                  value={newStop.name}
                  onChange={(e) => setNewStop({ ...newStop, name: e.target.value })}
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Name in Punjabi (Gurmukhi)</label>
                <input
                  type="text"
                  placeholder="e.g. ਸਰਹਿੰਦ ਰੋਡ ਗੇਟ"
                  value={newStop.punjabiName}
                  onChange={(e) => setNewStop({ ...newStop, punjabiName: e.target.value })}
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">City / District</label>
                <input
                  type="text"
                  placeholder="e.g. Patiala"
                  value={newStop.city}
                  onChange={(e) => setNewStop({ ...newStop, city: e.target.value })}
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={newStop.lat}
                  onChange={(e) => setNewStop({ ...newStop, lat: Number(e.target.value) })}
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={newStop.lng}
                  onChange={(e) => setNewStop({ ...newStop, lng: Number(e.target.value) })}
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold text-xs text-white transition-all cursor-pointer"
                >
                  Save Bus Stop
                </button>
              </div>
            </form>
          </div>

          {/* Stops List */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 divide-y divide-slate-800 overflow-hidden">
            {stops.map((stop) => (
              <div key={stop.id} className="p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{stop.name}</span>
                    {stop.punjabiName && <span className="text-slate-400 font-normal">{stop.punjabiName}</span>}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    {stop.city} · [{stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}]
                  </div>
                </div>
                <span className="text-xs text-slate-400">
                  {stop.isTerminal ? 'Terminal' : 'En Route'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: TIMETABLES */}
      {activeTab === 'schedules' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-3">Add Departure Timetable</h3>
            <form onSubmit={handleAddSchedule} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Route</label>
                <select
                  value={newSchedule.routeId}
                  onChange={(e) => setNewSchedule({ ...newSchedule, routeId: e.target.value })}
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.routeNumber} ({r.origin})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Departure Time (24h)</label>
                <input
                  type="time"
                  value={newSchedule.departureTime}
                  onChange={(e) => setNewSchedule({ ...newSchedule, departureTime: e.target.value })}
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Carrier Depot</label>
                <input
                  type="text"
                  placeholder="e.g. PRTC Depot-1"
                  value={newSchedule.carrier}
                  onChange={(e) => setNewSchedule({ ...newSchedule, carrier: e.target.value })}
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold text-xs text-white transition-all cursor-pointer"
                >
                  Add Schedule
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 divide-y divide-slate-800 overflow-hidden">
            {schedules.map((sch) => {
              const route = routes.find((r) => r.id === sch.routeId);
              return (
                <div key={sch.id} className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold font-mono text-white tabular-nums">
                      {sch.departureTime}
                    </span>
                    <span className="text-xs text-slate-300">
                      {route?.routeNumber} ({route?.name})
                    </span>
                    <span className="text-xs text-slate-500">· {sch.carrier}</span>
                  </div>

                  <button
                    onClick={() => {
                      adminDeleteSchedule(sch.id);
                      showToast('Schedule removed.');
                    }}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
