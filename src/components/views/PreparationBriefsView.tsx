import React, { useState, useMemo } from 'react';
import {
  FileSignature,
  ArrowLeft,
  Printer,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  HelpCircle,
  Shield,
  FileText,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { LegalDocument, DocumentAnalysisRecord, Workspace } from '../../types';

interface PreparationBriefsViewProps {
  onBackToDashboard: () => void;
  activeWorkspace?: Workspace | null;
  documents?: LegalDocument[];
  activeDocument?: LegalDocument | null;
  analysisRecord?: DocumentAnalysisRecord | null;
  onSelectDocument?: (id: string) => void;
  onNavigateToWorkspace?: () => void;
}

export const PreparationBriefsView: React.FC<PreparationBriefsViewProps> = ({
  onBackToDashboard,
  activeWorkspace,
  documents = [],
  activeDocument,
  analysisRecord,
  onSelectDocument,
  onNavigateToWorkspace,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(
    activeDocument ? activeDocument.documentId : (documents.length > 0 ? documents[0].documentId : null)
  );

  const currentDoc = useMemo(() => {
    return documents.find(d => d.documentId === selectedDocId) || activeDocument || documents[0] || null;
  }, [documents, selectedDocId, activeDocument]);

  // Aggregate items for brief with useMemo to eliminate duplicate array allocations
  const attentionItems = useMemo(() => analysisRecord?.attentionItems || [], [analysisRecord?.attentionItems]);
  const redFlags = useMemo(() => attentionItems.filter(a => a.category === 'RED'), [attentionItems]);
  const amberFlags = useMemo(() => attentionItems.filter(a => a.category === 'AMBER'), [attentionItems]);
  const timelineEvents = useMemo(() => analysisRecord?.timeline || [], [analysisRecord?.timeline]);
  const criticalClauses = useMemo(
    () => (analysisRecord?.clauses || []).filter(c => c.riskLevel === 'critical' || c.riskLevel === 'high'),
    [analysisRecord?.clauses]
  );

  const handlePrint = () => {
    window.print();
  };

  const handleCopyMarkdown = () => {
    if (!currentDoc) return;
    const lines: string[] = [];
    lines.push(`# ATTORNEY CONSULTATION BRIEF`);
    lines.push(`**Prepared with Legal Lens Evidence-Grounded Workspace**`);
    lines.push(`**Date:** ${new Date().toLocaleDateString()}`);
    lines.push(`**Workspace:** ${activeWorkspace?.name || 'Legal Matters'}`);
    lines.push(`**Target Document:** ${currentDoc.fileName}`);
    if (analysisRecord?.documentType) {
      lines.push(`**Document Type:** ${analysisRecord.documentType}`);
    }
    lines.push(``);
    lines.push(`## 1. Executive Summary`);
    lines.push(analysisRecord?.summary || 'Standard commercial agreement under review.');
    lines.push(``);

    if (analysisRecord?.keyTakeaways && analysisRecord.keyTakeaways.length > 0) {
      lines.push(`### Key Takeaways`);
      analysisRecord.keyTakeaways.forEach(k => lines.push(`- ${k}`));
      lines.push(``);
    }

    lines.push(`## 2. Critical Attention Items (Red / Amber Flags)`);
    if (attentionItems.length === 0) {
      lines.push(`No critical attention flags identified.`);
    } else {
      attentionItems.forEach((att, idx) => {
        lines.push(`### ${idx + 1}. [${att.category}] ${att.title}`);
        lines.push(`**Factual Finding:** ${att.description}`);
        if (att.source?.sourceText) {
          lines.push(`> "${att.source.sourceText}" (${att.source.section || 'Document Excerpt'})`);
        }
        if (att.recommendation) {
          lines.push(`**Consultation Question for Counsel:** ${att.recommendation}`);
        }
        lines.push(``);
      });
    }

    if (timelineEvents.length > 0) {
      lines.push(`## 3. Critical Deadlines & Milestone Dates`);
      timelineEvents.forEach(t => {
        lines.push(`- **${t.date}**: ${t.title} - ${t.description} [${t.importance}]`);
      });
      lines.push(``);
    }

    lines.push(`## 4. Key Questions to Ask Legal Counsel`);
    lines.push(`1. What is our jurisdiction-specific exposure under the indemnification and limitation of liability clauses?`);
    lines.push(`2. Are the non-renewal and termination notice windows realistic given our operational timelines?`);
    lines.push(`3. What standard revisions or concessions should we request prior to signing?`);
    lines.push(``);
    lines.push(`---`);
    lines.push(`*DISCLAIMER: Legal Lens provides factual legal document intelligence and consultation preparation dossiers for educational and informational purposes. It does not provide formal legal advice or attorney representation.*`);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            id="back-to-dashboard-from-briefs-btn"
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          {onNavigateToWorkspace && (
            <button
              id="goto-workspace-from-briefs-btn"
              onClick={onNavigateToWorkspace}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 hover:text-indigo-800 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Open Workspace</span>
            </button>
          )}
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-2">
          <button
            id="copy-brief-btn"
            onClick={handleCopyMarkdown}
            disabled={!currentDoc}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-700 text-xs font-medium transition-colors shadow-2xs disabled:opacity-50"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Brief (Markdown)</span>
              </>
            )}
          </button>

          <button
            id="print-brief-btn"
            onClick={handlePrint}
            disabled={!currentDoc}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors shadow-2xs disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF Dossier</span>
          </button>
        </div>
      </div>

      {/* Selector & Document Picker Header */}
      {documents.length > 1 && (
        <div className="mb-6 p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-4">
          <label htmlFor="brief-active-doc-select" className="flex items-center gap-2 text-xs text-slate-700">
            <FileText className="w-4 h-4 text-indigo-600" aria-hidden="true" />
            <span className="font-medium">Active Document for Brief:</span>
          </label>
          <select
            id="brief-active-doc-select"
            value={selectedDocId || ''}
            onChange={e => {
              setSelectedDocId(e.target.value);
              if (onSelectDocument) onSelectDocument(e.target.value);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-300 font-sans"
          >
            {documents.map(d => (
              <option key={d.documentId} value={d.documentId}>
                {d.fileName} ({d.analysisStatus})
              </option>
            ))}
          </select>
        </div>
      )}

      {!currentDoc ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-4">
            <FileSignature className="w-7 h-7" />
          </div>
          <h3 className="font-serif text-2xl font-normal text-slate-900">
            No Documents Ingested Yet
          </h3>
          <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
            Upload or inspect a document in your workspace to generate an attorney-ready consultation brief with verifiable citations.
          </p>
          <button
            onClick={onNavigateToWorkspace || onBackToDashboard}
            className="mt-6 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-medium hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
          >
            <span>Go to Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* Printable Consultation Dossier */
        <div id="printable-consultation-dossier" className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Document Dossier Header */}
          <div className="p-6 sm:p-8 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200/80">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-700 font-semibold px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-100/80">
                Attorney Intake Dossier
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>

            <h1 className="font-serif text-3xl font-semibold text-slate-900">
              {analysisRecord?.title || currentDoc.fileName}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-3 border-t border-slate-200/60">
              <div>
                <span className="text-slate-500 font-medium">Workspace: </span>
                <span className="text-slate-800 font-semibold">{activeWorkspace?.name || 'Primary Matter'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Source Document: </span>
                <span className="text-slate-800 font-mono">{currentDoc.fileName}</span>
              </div>
              {analysisRecord?.documentType && (
                <div>
                  <span className="text-slate-500 font-medium">Agreement Type: </span>
                  <span className="text-slate-800 font-semibold">{analysisRecord.documentType}</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* Section 1: Executive Overview & Plain-English Translation */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-serif text-lg font-medium border-b border-slate-100 pb-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <h2>1. Executive Summary & Plain-English Overview</h2>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed font-sans">
                {analysisRecord?.summary || 'Standard bilateral commercial agreement governing mutual covenants and operational milestones.'}
              </p>

              {analysisRecord?.keyTakeaways && analysisRecord.keyTakeaways.length > 0 && (
                <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                  <h4 className="text-xs font-semibold text-slate-900 mb-2">Key Factual Takeaways:</h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {analysisRecord.keyTakeaways.map((k, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                        <span>{k}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* Section 2: Flagged Risks & Strategic Attention Points */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 text-slate-900 font-serif text-lg font-medium">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <h2>2. Flagged Provisions for Counsel Review</h2>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-medium">
                    {redFlags.length} Red Flags
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                    {amberFlags.length} Amber Points
                  </span>
                </div>
              </div>

              {attentionItems.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                  No critical unallocated liabilities identified. Standard operational terms apply.
                </div>
              ) : (
                <div className="space-y-3">
                  {attentionItems.map((att, idx) => {
                    const isRed = att.category === 'RED';
                    return (
                      <div
                        key={att.id || idx}
                        className={`p-4 rounded-xl border text-xs space-y-2 ${
                          isRed
                            ? 'bg-rose-50/30 border-rose-200/80'
                            : 'bg-amber-50/30 border-amber-200/80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isRed ? 'bg-rose-600' : 'bg-amber-500'
                              }`}
                            />
                            <span>{att.title}</span>
                          </div>
                          {att.source && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-mono shrink-0">
                              {att.source.section || 'Contract Section'}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed font-sans">
                          {att.description}
                        </p>

                        {att.source?.sourceText && (
                          <blockquote className="border-l-2 border-slate-300 pl-3 text-[11px] text-slate-600 italic bg-white p-2 rounded-r-lg">
                            "{att.source.sourceText}"
                          </blockquote>
                        )}

                        {att.recommendation && (
                          <div className="flex items-start gap-1.5 text-xs text-indigo-900 bg-indigo-50/70 p-2.5 rounded-lg">
                            <HelpCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold">Question to Ask Your Attorney: </span>
                              <span>{att.recommendation}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Section 3: Critical Dates & Deadlines */}
            {timelineEvents.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-serif text-lg font-medium border-b border-slate-100 pb-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <h2>3. Chronological Deadlines & Milestones</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {timelineEvents.map((t, idx) => (
                    <div
                      key={t.eventId || idx}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-mono text-xs font-semibold text-slate-900">{t.date}</div>
                        <div className="text-xs font-medium text-slate-800 mt-0.5">{t.title}</div>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{t.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Section 4: High-Exposure Clauses */}
            {criticalClauses.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-serif text-lg font-medium border-b border-slate-100 pb-2">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <h2>4. Verbatim High-Exposure Clause Exhibits</h2>
                </div>
                <div className="space-y-3">
                  {criticalClauses.map((c, idx) => (
                    <div key={c.clauseId || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{c.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-mono">
                          {c.riskLevel.toUpperCase()} RISK
                        </span>
                      </div>
                      <blockquote className="border-l-2 border-indigo-400 pl-3 text-[11px] text-slate-700 italic bg-white p-2.5 rounded-r-lg font-serif">
                        "{c.originalText}"
                      </blockquote>
                      <p className="text-[11px] text-slate-600">
                        <span className="font-medium text-slate-800">Plain Explanation: </span>
                        {c.plainExplanation}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Ethical Disclaimer Footer */}
            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
              <span className="font-semibold text-slate-800">Legal Information Disclaimer: </span>
              Legal Lens provides document structure extraction, plain-language translation, and consultation preparation dossiers for educational and informational purposes. Legal Lens is not an attorney or law firm and does not provide legal advice or predict legal outcomes. Always consult a licensed attorney in your jurisdiction before signing binding legal instruments.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
