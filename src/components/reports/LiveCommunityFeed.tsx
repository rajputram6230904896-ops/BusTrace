import React, { useState } from 'react';
import { Radio, Check, ThumbsUp, AlertCircle, Clock, Users, Filter, Flag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTransit } from '../../context/TransitContext';
import { CommunityReport } from '../../types/transit';

interface LiveCommunityFeedProps {
  onOpenReportModal: () => void;
}

export const LiveCommunityFeed: React.FC<LiveCommunityFeedProps> = ({ onOpenReportModal }) => {
  const { currentUser } = useAuth();
  const { routes, stops, reports, confirmReport, adminFlagReport } = useTransit();
  const [filterRouteId, setFilterRouteId] = useState<string>('all');
  const [confirmStatusMsg, setConfirmStatusMsg] = useState<{ id: string; msg: string; isError?: boolean } | null>(null);

  const activeReports = reports
    .filter((r) => !r.isFlagged)
    .filter((r) => (filterRouteId === 'all' ? true : r.routeId === filterRouteId))
    .sort((a, b) => b.timestamp - a.timestamp);

  const handleConfirm = (report: CommunityReport) => {
    const res = confirmReport(report.id);
    if (!res.success) {
      setConfirmStatusMsg({ id: report.id, msg: res.error || 'Cannot verify report', isError: true });
    } else {
      setConfirmStatusMsg({ id: report.id, msg: 'Verified! Added +5 community points.', isError: false });
    }

    setTimeout(() => {
      setConfirmStatusMsg(null);
    }, 3000);
  };

  const formatAge = (timestamp: number) => {
    const diffMin = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
    if (diffMin < 1) return 'Just now';
    if (diffMin === 1) return '1 min ago';
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHours = Math.floor(diffMin / 60);
    return `${diffHours} hr ago`;
  };

  const getRoute = (routeId: string) => routes.find((r) => r.id === routeId);
  const getStop = (stopId: string) => stops.find((s) => s.id === stopId);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-20 md:pb-12">
      {/* Header & Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-400 animate-pulse" />
            Live Community Transit Feed
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real passenger observations verified by commuters on the ground.
          </p>
        </div>

        <button
          onClick={onOpenReportModal}
          className="self-start sm:self-auto py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white shadow-md shadow-blue-600/30 transition-all cursor-pointer whitespace-nowrap"
        >
          Submit New Update
        </button>
      </div>

      {/* Filter Segmented Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 border-b border-slate-800 scrollbar-none">
        <span className="text-xs font-semibold text-slate-400 shrink-0 flex items-center gap-1 mr-1">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        <button
          onClick={() => setFilterRouteId('all')}
          className={`py-1.5 px-3 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            filterRouteId === 'all'
              ? 'bg-blue-600 text-white font-semibold'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          All Routes ({reports.length})
        </button>

        {routes.map((r) => {
          const count = reports.filter((rep) => rep.routeId === r.id && !rep.isFlagged).length;
          return (
            <button
              key={r.id}
              onClick={() => setFilterRouteId(r.id)}
              className={`py-1.5 px-3 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filterRouteId === r.id
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {r.routeNumber} ({count})
            </button>
          );
        })}
      </div>

      {/* Reports List */}
      {activeReports.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800">
          <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No recent community updates for this corridor</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Be the first passenger at this stop to report bus arrival, departure, or road delay.
          </p>
          <button
            onClick={onOpenReportModal}
            className="mt-4 py-2 px-4 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 text-xs font-medium hover:bg-blue-600/30 transition-colors"
          >
            Post First Status Update
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {activeReports.map((report) => {
            const route = getRoute(report.routeId);
            const stop = getStop(report.stopId);
            const isUserAuthor = report.reporterId === currentUser.id;
            const hasUserConfirmed = report.confirmedByUserIds.includes(currentUser.id);
            const isRecent = Date.now() - report.timestamp < 15 * 60 * 1000;

            let typeLabel = 'Arrived at Stop';
            let typeColor = 'text-emerald-400';
            if (report.reportType === 'departed') {
              typeLabel = 'Departed Stop';
              typeColor = 'text-blue-400';
            } else if (report.reportType === 'delayed') {
              typeLabel = `Delayed (+${report.delayMinutes || 10}m)`;
              typeColor = 'text-amber-400';
            }

            return (
              <div
                key={report.id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-sm"
              >
                {/* Top unboxed metadata line */}
                <div className="flex items-center justify-between gap-2 text-xs text-slate-400 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white tracking-tight">
                      {route?.routeNumber || 'Transit Bus'}
                    </span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-slate-300">{route?.name}</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="font-mono text-slate-400">{formatAge(report.timestamp)}</span>
                  </div>

                  {/* Reliability score text */}
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <span className="text-slate-400">Trust:</span>
                    <span className={`font-semibold ${report.reliabilityScore >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {report.reliabilityScore}%
                    </span>
                  </div>
                </div>

                {/* Main Stop & Event Line */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${typeColor}`}>
                        {typeLabel}
                      </span>
                      <span className="text-sm font-semibold text-white">
                        @ {stop?.name || 'Bus Stop'}
                      </span>
                    </div>

                    {report.delayReason && (
                      <p className="text-xs text-amber-200/90 mt-1.5 bg-amber-950/30 border border-amber-900/40 p-2 rounded-lg">
                        Reason: {report.delayReason}
                      </p>
                    )}

                    {/* Unboxed passenger & crowd metadata */}
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                      <span>Reported by {report.reporterName}</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span>{report.reporterRole}</span>
                      {report.crowdLevel && (
                        <>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className="capitalize">
                            {report.crowdLevel.replace('_', ' ')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions / Peer Verification */}
                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <button
                      onClick={() => handleConfirm(report)}
                      disabled={isUserAuthor || hasUserConfirmed}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        hasUserConfirmed
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-600/40 cursor-default'
                          : isUserAuthor
                          ? 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:text-white'
                      }`}
                      title={
                        isUserAuthor
                          ? 'You cannot confirm your own report'
                          : hasUserConfirmed
                          ? 'You have verified this report'
                          : 'Confirm this bus report on the ground'
                      }
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>
                        {hasUserConfirmed
                          ? `Verified (${report.confirmationsCount})`
                          : `Confirm (${report.confirmationsCount})`}
                      </span>
                    </button>

                    {/* Quick admin or volunteer flag trigger */}
                    {(currentUser.role === 'Admin' || currentUser.role === 'Volunteer') && (
                      <button
                        onClick={() => adminFlagReport(report.id)}
                        className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Flag inaccurate report"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Status toast message for confirmation action */}
                {confirmStatusMsg && confirmStatusMsg.id === report.id && (
                  <div
                    className={`mt-3 p-2 rounded-lg text-xs ${
                      confirmStatusMsg.isError
                        ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                        : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                    }`}
                  >
                    {confirmStatusMsg.msg}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
