import React from 'react';
import { FileSignature, Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface PreparationBriefsViewProps {
  onBackToDashboard: () => void;
}

export const PreparationBriefsView: React.FC<PreparationBriefsViewProps> = ({
  onBackToDashboard,
}) => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <button
        id="back-to-dashboard-from-briefs-btn"
        onClick={onBackToDashboard}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Dashboard</span>
      </button>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-2xs">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-4">
          <FileSignature className="w-7 h-7" />
        </div>

        <span className="text-xs uppercase font-mono tracking-widest text-indigo-600 font-semibold">
          Phase 2 Capability
        </span>
        <h2 className="font-serif text-3xl font-normal text-slate-900 mt-2">
          Attorney Consultation Briefs
        </h2>
        <p className="text-sm text-slate-600 mt-3 max-w-lg mx-auto leading-relaxed">
          One-click assembly of evidence dossiers, highlighted clause exhibits, and curated question
          lists tailored to hand directly to your legal counsel.
        </p>

        <div className="mt-8 max-w-md mx-auto text-left space-y-3 p-5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700">
          <div className="font-medium text-slate-900 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Planned Architectural Features</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>PDF Brief export with page-anchored citations</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Risk-ranked questions prioritized by potential liability</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Structured timelines ready for initial attorney intake</span>
          </div>
        </div>
      </div>
    </div>
  );
};
