import React, { useState } from 'react';
import {
  X,
  Database,
  ShieldCheck,
  Check,
  Copy,
  Terminal,
  ExternalLink,
  Save,
  Server,
  CloudRain,
} from 'lucide-react';
import { storageService, FirebaseConnectionConfig } from '../../services/storageService';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({ isOpen, onClose }) => {
  const [currentConfig, setCurrentConfig] = useState<FirebaseConnectionConfig>(() =>
    storageService.getFirebaseConfig()
  );
  const [apiKey, setApiKey] = useState(currentConfig.apiKey || '');
  const [authDomain, setAuthDomain] = useState(currentConfig.authDomain || '');
  const [projectId, setProjectId] = useState(currentConfig.projectId || '');
  const [storageBucket, setStorageBucket] = useState(currentConfig.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(currentConfig.messagingSenderId || '');
  const [appId, setAppId] = useState(currentConfig.appId || '');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const isConfigured = !!(apiKey.trim() && projectId.trim());
    const updated: FirebaseConnectionConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
      isConfigured,
    };
    storageService.saveFirebaseConfig(updated);
    setCurrentConfig(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const FIRESTORE_RULES_SAMPLE = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper: is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper: is admin
    function isAdmin() {
      return isAuthenticated() && 
        request.auth.token.role == 'Admin' ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'Admin';
    }

    // Public read for routes, stops, schedules
    match /routes/{routeId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /stops/{stopId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /schedules/{scheduleId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Community reports: authenticated users can create; prevent updating others' reports
    match /reports/{reportId} {
      allow read: if true;
      allow create: if isAuthenticated() && 
        request.resource.data.reporterId == request.auth.uid &&
        request.resource.data.reliabilityScore <= 85;
      allow update: if isAuthenticated() || isAdmin();
      allow delete: if isAdmin();
    }

    // User profiles & favorites
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }
    match /confirmations/{confId} {
      allow read: if true;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-100 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Cloud Database & Firebase Setup</h2>
              <p className="text-xs text-slate-400">Architecture, Firestore Collections & Demo Mode Status</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status banner */}
        <div className="my-5 p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
          <Server className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">Current Mode:</span>
              <span
                className={`font-semibold ${
                  currentConfig.isConfigured ? 'text-emerald-400' : 'text-cyan-400'
                }`}
              >
                {currentConfig.isConfigured ? 'Connected to Firebase Firestore' : 'Offline-First Demo Mode Active'}
              </span>
            </div>
            <p className="text-slate-400 mt-1 leading-relaxed">
              BusTrace features full local offline storage and reactive event subscribers simulating real-time Firestore listeners. When you're ready to deploy to a live Firebase project, paste your configuration keys below or deploy security rules.
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Firebase configuration saved!</span>
          </div>
        )}

        {/* Firebase Config Form */}
        <form onSubmit={handleSave} className="space-y-3.5 mb-6">
          <h3 className="text-xs font-bold text-slate-300">Firebase Web App SDK Credentials</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">API Key</label>
              <input
                type="text"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Project ID</label>
              <input
                type="text"
                placeholder="bustrace-prod"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Auth Domain</label>
              <input
                type="text"
                placeholder="bustrace-prod.firebaseapp.com"
                value={authDomain}
                onChange={(e) => setAuthDomain(e.target.value)}
                className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">App ID</label>
              <input
                type="text"
                placeholder="1:211582837295:web:..."
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>

        {/* Security Rules Preview */}
        <div className="space-y-2 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Firestore Security Rules (firestore.rules)</span>
            </div>
            <button
              onClick={() => copyToClipboard(FIRESTORE_RULES_SAMPLE, 'rules')}
              className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
            >
              {copiedSection === 'rules' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Rules
                </>
              )}
            </button>
          </div>

          <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48">
            {FIRESTORE_RULES_SAMPLE}
          </pre>
        </div>

        {/* Collections Schema Summary */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <h4 className="text-xs font-bold text-slate-300 mb-2">Firestore Collections Schema</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-400">
            <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-800">
              <strong className="text-white block font-mono">/routes</strong>
              <span>Corridor geometries & stops</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-800">
              <strong className="text-white block font-mono">/stops</strong>
              <span>GPS coords & names</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-800">
              <strong className="text-white block font-mono">/schedules</strong>
              <span>Departure timetables</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-800">
              <strong className="text-white block font-mono">/reports</strong>
              <span>Live community status</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-800">
              <strong className="text-white block font-mono">/confirmations</strong>
              <span>Peer verifications</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-800">
              <strong className="text-white block font-mono">/users</strong>
              <span>Profiles & trust scores</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
