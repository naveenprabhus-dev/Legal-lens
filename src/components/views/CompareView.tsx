import React from 'react';
import { GitCompare, Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface CompareViewProps {
  onBackToDashboard: () => void;
}

export const CompareView: React.FC<CompareViewProps> = ({ onBackToDashboard }) => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <button
        id="back-to-dashboard-btn"
        onClick={onBackToDashboard}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Dashboard</span>
      </button>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-2xs">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-4">
          <GitCompare className="w-7 h-7" />
        </div>

        <span className="text-xs uppercase font-mono tracking-widest text-indigo-600 font-semibold">
          Phase 2 Capability
        </span>
        <h2 className="font-serif text-3xl font-normal text-slate-900 mt-2">
          Document Comparison Engine
        </h2>
        <p className="text-sm text-slate-600 mt-3 max-w-lg mx-auto leading-relaxed">
          Side-by-side legal diffing, clause deviation analysis, redline review, and negotiation
          concession tracking will activate in the next development phase.
        </p>

        <div className="mt-8 max-w-md mx-auto text-left space-y-3 p-5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700">
          <div className="font-medium text-slate-900 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Planned Architectural Features</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Dual-PDF synchronization with linked scroll navigation</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Standard vs. modified clause variance scoring</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Redline export with attorney summary notes</span>
          </div>
        </div>
      </div>
    </div>
  );
};
