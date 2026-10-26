import React from 'react';
import { ShieldCheck, Info, Users, Clock, Radio, X } from 'lucide-react';

interface TransparencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TransparencyModal: React.FC<TransparencyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">BusTrace Transparency Charter</h2>
              <p className="text-xs text-slate-400">Ethical Commuter Information Commitment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/40">
            <h4 className="font-semibold text-blue-300 flex items-center gap-1.5 mb-1">
              <Radio className="w-4 h-4 text-blue-400" />
              Why We Never Fake Live GPS Tracking
            </h4>
            <p>
              Unlike applications that animate artificial bus icons along roads to simulate GPS, BusTrace never fabricates live coordinates.
              In India, many regional state transport buses (PRTC, Punbus, private campus shuttles) do not expose public GPS APIs.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-blue-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white block font-medium">1. Official Timetable Baselines</strong>
                <span>We start with verified depot departure schedules and typical stop-to-stop transit durations.</span>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-cyan-400">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white block font-medium">2. Peer-Verified Passenger Reports</strong>
                <span>Students and commuters at stops submit real-time arrival, departure, and delay updates. Reports require community confirmations to gain high confidence scores.</span>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-indigo-400">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white block font-medium">3. Transparent Confidence Metrics</strong>
                <span>Every ETA explicitly shows its confidence percentage (High, Moderate, or Limited Information) and lists the exact assumptions used.</span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-slate-400 border-t border-slate-800">
            <p>
              By participating, verifying reports, and keeping notifications active, our commuter community builds a dependable transit network together.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white transition-colors cursor-pointer"
          >
            I Understand & Support Transparent Transit
          </button>
        </div>
      </div>
    </div>
  );
};
