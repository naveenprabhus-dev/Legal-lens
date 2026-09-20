import React, { useState, useMemo } from 'react';
import {
  GitCompare,
  ArrowLeft,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Layers,
  ArrowRight,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { LegalDocument, DocumentAnalysisRecord, Workspace } from '../../types';

interface CompareViewProps {
  onBackToDashboard: () => void;
  activeWorkspace?: Workspace | null;
  documents?: LegalDocument[];
  activeDocument?: LegalDocument | null;
  analysisRecord?: DocumentAnalysisRecord | null;
  onNavigateToWorkspace?: () => void;
}

export const CompareView: React.FC<CompareViewProps> = ({
  onBackToDashboard,
  activeWorkspace,
  documents = [],
  activeDocument,
  analysisRecord,
  onNavigateToWorkspace,
}) => {
  const [docAId, setDocAId] = useState<string>(
    activeDocument ? activeDocument.documentId : (documents.length > 0 ? documents[0].documentId : '')
  );
  const [docBId, setDocBId] = useState<string>(
    documents.length > 1 ? documents[1].documentId : (documents.length > 0 ? documents[0].documentId : '')
  );

  const docA = useMemo(() => documents.find(d => d.documentId === docAId) || documents[0] || null, [documents, docAId]);
  const docB = useMemo(() => documents.find(d => d.documentId === docBId) || documents[1] || null, [documents, docBId]);

  // Comparison metrics
  const clausesA = useMemo(() => analysisRecord?.clauses || [], [analysisRecord?.clauses]);
  const attentionA = useMemo(() => analysisRecord?.attentionItems || [], [analysisRecord?.attentionItems]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Header & Navigation */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            id="back-to-dashboard-from-compare-btn"
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          {onNavigateToWorkspace && (
            <button
              id="goto-workspace-from-compare-btn"
              onClick={onNavigateToWorkspace}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 hover:text-indigo-800 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Workspace</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-mono font-medium">
            Contract Comparison Engine
          </span>
        </div>
      </div>

      {documents.length < 2 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-10 sm:p-12 text-center shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-4">
            <GitCompare className="w-7 h-7" />
          </div>
          <h2 className="font-serif text-2xl font-normal text-slate-900">
            Compare Multiple Agreements
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-lg mx-auto leading-relaxed">
            Upload two or more contracts into your workspace to analyze clause variance, risk differences, and differing liability caps side-by-side.
          </p>

          <div className="mt-6 max-w-md mx-auto text-left space-y-2.5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <div className="font-medium text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>How Comparison Works:</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              1. Add two versions (e.g. Master Lease vs. Proposed Amendment, or Initial NDA vs. Mutual NDA).
            </p>
            <p className="text-slate-600 leading-relaxed">
              2. Review side-by-side risk ratings, notice periods, and indemnity allocations.
            </p>
          </div>

          <button
            onClick={onNavigateToWorkspace || onBackToDashboard}
            className="mt-6 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-medium hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
          >
            <span>Open Workspace to Upload Second Document</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Document Comparison Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <label htmlFor="compare-doc-a-select" className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 block">
                Document A (Baseline)
              </label>
              <select
                id="compare-doc-a-select"
                value={docAId}
                onChange={e => setDocAId(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-300 font-sans"
              >
                {documents.map(d => (
                  <option key={d.documentId} value={d.documentId}>
                    {d.fileName}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <label htmlFor="compare-doc-b-select" className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 block">
                Document B (Comparison Draft)
              </label>
              <select
                id="compare-doc-b-select"
                value={docBId}
                onChange={e => setDocBId(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-300 font-sans"
              >
                {documents.map(d => (
                  <option key={d.documentId} value={d.documentId}>
                    {d.fileName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comparison Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                <h3 className="font-serif text-sm font-semibold text-slate-900">Side-by-Side Provision Comparison</h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Workspace: {activeWorkspace?.name || 'Primary'}
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {/* Row 1: Document Names */}
              <div className="grid grid-cols-2 p-4 bg-slate-50/50">
                <div className="font-semibold text-slate-800">{docA?.fileName}</div>
                <div className="font-semibold text-slate-800">{docB?.fileName}</div>
              </div>

              {/* Row 2: Status */}
              <div className="grid grid-cols-2 p-4">
                <div>
                  <span className="text-slate-500 text-[11px] block">Analysis Status</span>
                  <span className="capitalize font-medium text-emerald-700">{docA?.analysisStatus}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Analysis Status</span>
                  <span className="capitalize font-medium text-emerald-700">{docB?.analysisStatus}</span>
                </div>
              </div>

              {/* Row 3: Identified Risk Flags */}
              <div className="grid grid-cols-2 p-4 bg-slate-50/30">
                <div>
                  <span className="text-slate-500 text-[11px] block">Identified Attention Points</span>
                  <span className="font-medium text-slate-800">{attentionA.length} points flagged</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Identified Attention Points</span>
                  <span className="font-medium text-slate-800">
                    {docAId === docBId ? `${attentionA.length} points flagged` : 'Review in Document Workspace'}
                  </span>
                </div>
              </div>

              {/* Row 4: Key Clauses */}
              <div className="p-4 space-y-3">
                <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider block">
                  Identified Clauses & Terms ({clausesA.length} clauses analyzed)
                </span>
                <div className="space-y-2">
                  {clausesA.slice(0, 5).map(c => (
                    <div key={c.clauseId} className="p-3 rounded-lg border border-slate-200 bg-white flex items-start justify-between gap-4">
                      <div>
                        <span className="font-medium text-slate-900">{c.title}</span>
                        <p className="text-[11px] text-slate-600 mt-0.5">{c.plainExplanation}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono shrink-0 ${
                        c.riskLevel === 'critical' || c.riskLevel === 'high'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {c.riskLevel}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
