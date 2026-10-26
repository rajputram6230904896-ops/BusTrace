import React, { useState } from 'react';
import { X, Check, AlertTriangle, Clock, Users, Send, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTransit } from '../../context/TransitContext';
import { CrowdLevel, ReportType } from '../../types/transit';

interface SubmitReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedRouteId?: string;
  preselectedStopId?: string;
}

export const SubmitReportModal: React.FC<SubmitReportModalProps> = ({
  isOpen,
  onClose,
  preselectedRouteId,
  preselectedStopId,
}) => {
  const { currentUser } = useAuth();
  const { routes, stops, submitReport } = useTransit();

  const [routeId, setRouteId] = useState<string>(preselectedRouteId || routes[0]?.id || '');
  const [stopId, setStopId] = useState<string>(preselectedStopId || stops[0]?.id || '');
  const [reportType, setReportType] = useState<ReportType>('arrived');
  const [delayMinutes, setDelayMinutes] = useState<number>(10);
  const [delayReason, setDelayReason] = useState<string>('Heavy traffic near highway bypass');
  const [crowdLevel, setCrowdLevel] = useState<CrowdLevel>('seats_available');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentRoute = routes.find((r) => r.id === routeId);
  const routeStops = currentRoute
    ? stops.filter((s) => currentRoute.stops.some((rs) => rs.stopId === s.id))
    : stops;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const res = submitReport({
      routeId,
      stopId: stopId || (routeStops[0]?.id ?? ''),
      reportType,
      delayMinutes: reportType === 'delayed' ? Number(delayMinutes) : 0,
      delayReason: reportType === 'delayed' ? delayReason : undefined,
      crowdLevel,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to submit report.');
    } else {
      setSuccessMessage('Thank you! Your verified status report is now broadcasting to all commuters.');
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-100 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">Broadcast Bus Status</h2>
            <p className="text-xs text-slate-400">Share live ground observation with fellow commuters</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Route selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Bus Route
            </label>
            <select
              value={routeId}
              onChange={(e) => {
                setRouteId(e.target.value);
                const nextRoute = routes.find((r) => r.id === e.target.value);
                if (nextRoute && nextRoute.stops.length > 0) {
                  setStopId(nextRoute.stops[0].stopId);
                }
              }}
              className="w-full text-xs bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
              required
            >
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.routeNumber} — {r.name} ({r.busType})
                </option>
              ))}
            </select>
          </div>

          {/* Stop selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Your Current Bus Stop
            </label>
            <select
              value={stopId}
              onChange={(e) => setStopId(e.target.value)}
              className="w-full text-xs bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
              required
            >
              {routeStops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.punjabiName ? `(${s.punjabiName})` : ''} · {s.city}
                </option>
              ))}
            </select>
          </div>

          {/* Report Type (Segmented control) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Current Bus Event
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setReportType('arrived')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-center cursor-pointer ${
                  reportType === 'arrived'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Bus Arrived
              </button>

              <button
                type="button"
                onClick={() => setReportType('departed')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-center cursor-pointer ${
                  reportType === 'departed'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Bus Departed
              </button>

              <button
                type="button"
                onClick={() => setReportType('delayed')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-center cursor-pointer ${
                  reportType === 'delayed'
                    ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-900/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Bus Delayed
              </button>
            </div>
          </div>

          {/* If Delayed, show delay duration & reason inputs */}
          {reportType === 'delayed' && (
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1">
                  Estimated Delay (Minutes)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="5"
                    value={delayMinutes}
                    onChange={(e) => setDelayMinutes(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  <span className="text-xs font-bold text-amber-300 font-mono w-12 text-right">
                    +{delayMinutes}m
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1">
                  Delay Reason
                </label>
                <select
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-amber-700/50 rounded-lg px-2.5 py-1.5 text-slate-200"
                >
                  <option value="Heavy highway traffic / bottleneck">Heavy highway traffic / bottleneck</option>
                  <option value="Toll plaza slowdown">Toll plaza slowdown</option>
                  <option value="Severe weather / rain / fog">Severe weather / rain / fog</option>
                  <option value="Mechanical check / tyre puncture">Mechanical check / tyre puncture</option>
                  <option value="Crowded boarding at previous university gate">Crowded boarding at previous university gate</option>
                </select>
              </div>
            </div>
          )}

          {/* Crowd Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Onboard Crowd Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCrowdLevel('seats_available')}
                className={`p-2 text-xs rounded-xl border text-center transition-all cursor-pointer ${
                  crowdLevel === 'seats_available'
                    ? 'bg-blue-600/30 border-blue-500 text-blue-200 font-medium'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                Seats Available
              </button>
              <button
                type="button"
                onClick={() => setCrowdLevel('standing_only')}
                className={`p-2 text-xs rounded-xl border text-center transition-all cursor-pointer ${
                  crowdLevel === 'standing_only'
                    ? 'bg-amber-600/30 border-amber-500 text-amber-200 font-medium'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                Standing Only
              </button>
              <button
                type="button"
                onClick={() => setCrowdLevel('packed')}
                className={`p-2 text-xs rounded-xl border text-center transition-all cursor-pointer ${
                  crowdLevel === 'packed'
                    ? 'bg-rose-600/30 border-rose-500 text-rose-200 font-medium'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                Crowded / Packed
              </button>
            </div>
          </div>

          {/* Reporter verification footer note */}
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              <span className="text-slate-300 font-medium">{currentUser.name}</span>
              <span className="text-slate-500"> ({currentUser.role})</span>
            </div>
            <span className="font-mono text-emerald-400 font-semibold">+15 Points</span>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Broadcasting...' : 'Publish Community Status'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
