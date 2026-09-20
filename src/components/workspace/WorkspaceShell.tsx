import React, { useState, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  FileText,
  Upload,
  Clock,
  Trash2,
  Sparkles,
  AlertTriangle,
  Calendar,
  HelpCircle,
  FolderKanban,
  FileCheck,
  Search,
  BookOpen,
  ArrowRight,
  Shield,
  Layers,
  ChevronRight,
  CheckCircle,
  Copy,
  Check,
  PanelRightClose,
  PanelRightOpen,
  DollarSign,
  Users,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Info,
} from 'lucide-react';
import {
  Workspace,
  LegalDocument,
  Clause,
  Insight,
  TimelineEvent,
  AttentionItem,
  DocumentAnalysisRecord,
  ProcessingLifecycleStage,
  AttentionCategory,
} from '../../types';
import { DocumentUploadModal } from './DocumentUploadModal';
import { AskDocumentDrawer } from './AskDocumentDrawer';

interface WorkspaceShellProps {
  user: User;
  workspace: Workspace;
  documents: LegalDocument[];
  activeDocument: LegalDocument | null;
  onSelectDocument: (docId: string) => void;
  onUploadDocument: (file: File) => Promise<unknown>;
  onDeleteDocument: (docId: string) => Promise<void>;
  onTriggerAnalysis: (doc: LegalDocument) => Promise<void>;
  uploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
  lifecycleStage?: ProcessingLifecycleStage;
  analyzing: boolean;
  clauses: Clause[];
  insights: Insight[];
  attentionItems?: AttentionItem[];
  timeline: TimelineEvent[];
  analysisRecord?: DocumentAnalysisRecord | null;
  onSaveQuestion: (queryText: string, answerSummary?: string) => Promise<unknown>;
}

type SubNavTab = 'overview' | 'attention' | 'clauses' | 'timeline' | 'evidence' | 'questions';

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({
  user,
  workspace,
  documents,
  activeDocument,
  onSelectDocument,
  onUploadDocument,
  onDeleteDocument,
  onTriggerAnalysis,
  uploading,
  uploadProgress,
  uploadError,
  lifecycleStage,
  analyzing,
  clauses,
  insights,
  attentionItems = [],
  timeline,
  analysisRecord,
  onSaveQuestion,
}) => {
  const [activeTab, setActiveTab] = useState<SubNavTab>('overview');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchDocQuery, setSearchDocQuery] = useState('');
  const [clauseSearchQuery, setClauseSearchQuery] = useState('');
  const [selectedClauseType, setSelectedClauseType] = useState<string>('all');
  const [selectedAttentionCategory, setSelectedAttentionCategory] = useState<'ALL' | AttentionCategory>('ALL');
  const [copiedClauseId, setCopiedClauseId] = useState<string | null>(null);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(true);

  // Consultation questions
  const [newQuestionText, setNewQuestionText] = useState('');
  const [questionsList, setQuestionsList] = useState<
    { id: string; text: string; status: string; answer?: string }[]
  >([]);

  // Mobile layout column selector: 'left' | 'center' | 'right'
  const [mobileColumn, setMobileColumn] = useState<'left' | 'center' | 'right'>('center');

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(d =>
      d.fileName.toLowerCase().includes(searchDocQuery.toLowerCase())
    );
  }, [documents, searchDocQuery]);

  // Filtered clauses
  const filteredClauses = useMemo(() => {
    return clauses.filter(c => {
      const matchesSearch =
        c.title.toLowerCase().includes(clauseSearchQuery.toLowerCase()) ||
        c.originalText.toLowerCase().includes(clauseSearchQuery.toLowerCase()) ||
        c.plainExplanation.toLowerCase().includes(clauseSearchQuery.toLowerCase());
      const matchesType =
        selectedClauseType === 'all' ||
        (c.type && c.type.toLowerCase() === selectedClauseType.toLowerCase());
      return matchesSearch && matchesType;
    });
  }, [clauses, clauseSearchQuery, selectedClauseType]);

  // Filtered attention items
  const filteredAttention = useMemo(() => {
    if (selectedAttentionCategory === 'ALL') return attentionItems;
    return attentionItems.filter(item => item.category === selectedAttentionCategory);
  }, [attentionItems, selectedAttentionCategory]);

  const handleCopyClause = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedClauseId(id);
    setTimeout(() => setCopiedClauseId(null), 2500);
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;

    try {
      await onSaveQuestion(newQuestionText.trim());
      setQuestionsList(prev => [
        {
          id: `q_${Date.now()}`,
          text: newQuestionText.trim(),
          status: 'prepared_for_consultation',
        },
        ...prev,
      ]);
      setNewQuestionText('');
    } catch (err) {
      console.error('Failed to add question:', err);
    }
  };

  // Lifecycle messaging helper
  const getLifecycleMessage = () => {
    switch (lifecycleStage) {
      case 'UPLOADING':
        return `Uploading document... (${uploadProgress}%)`;
      case 'VALIDATING':
        return 'Validating PDF structure and security...';
      case 'PROCESSING':
        return 'Reading document text...';
      case 'ANALYZING':
        return 'Extracting clauses, timelines, and attention items...';
      case 'VALIDATING_RESULTS':
        return 'Verifying source citations and grounding...';
      case 'READY':
        return 'Ready';
      case 'PROCESSING_FAILED':
        return 'Processing failed. You can re-run analysis.';
      default:
        return analyzing ? 'Analyzing document structure...' : null;
    }
  };

  const redCount = attentionItems.filter(i => i.category === 'RED').length;
  const amberCount = attentionItems.filter(i => i.category === 'AMBER').length;
  const greenCount = attentionItems.filter(i => i.category === 'GREEN').length;

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full max-w-full overflow-x-hidden bg-[#faf9f6]">
      {/* Workspace Sub-Header / Breadcrumb */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FolderKanban className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="font-serif text-sm font-semibold text-slate-900 truncate">
            {workspace.name}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-600 truncate">
            {activeDocument ? activeDocument.fileName : 'No Document Selected'}
          </span>
          {activeDocument && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-medium shrink-0 ${
                activeDocument.analysisStatus === 'completed'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : activeDocument.analysisStatus === 'analyzing'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {activeDocument.analysisStatus}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeDocument && activeDocument.analysisStatus !== 'analyzing' && (
            <button
              onClick={() => onTriggerAnalysis(activeDocument)}
              disabled={analyzing}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-slate-700 flex items-center gap-1.5 transition-colors"
              title="Re-run document intelligence pipeline"
            >
              <RefreshCw className={`w-3 h-3 text-slate-500 ${analyzing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Re-Analyze</span>
            </button>
          )}

          {/* Toggle AI Context Panel (desktop / tablet) */}
          <button
            onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
            className="hidden lg:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-slate-700 transition-colors"
            title={isAiPanelOpen ? 'Collapse AI Panel' : 'Expand AI Panel'}
          >
            {isAiPanelOpen ? (
              <>
                <PanelRightClose className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden xl:inline text-[11px]">Hide AI Panel</span>
              </>
            ) : (
              <>
                <PanelRightOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden xl:inline text-[11px] font-medium text-indigo-700">Show AI Panel</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Processing Lifecycle Banner */}
      {(analyzing || uploading || lifecycleStage === 'PROCESSING_FAILED') && (
        <div
          role="status"
          aria-live="polite"
          className={`px-4 sm:px-6 py-2 text-xs flex items-center justify-between border-b ${
            lifecycleStage === 'PROCESSING_FAILED'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-indigo-50/80 text-indigo-900 border-indigo-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <RefreshCw
              aria-hidden="true"
              className={`w-3.5 h-3.5 ${
                lifecycleStage === 'PROCESSING_FAILED' ? 'text-rose-600' : 'animate-spin text-indigo-600'
              }`}
            />
            <span className="font-medium">{getLifecycleMessage()}</span>
          </div>
          {lifecycleStage === 'PROCESSING_FAILED' && activeDocument && (
            <button
              onClick={() => onTriggerAnalysis(activeDocument)}
              className="text-[11px] font-semibold underline text-rose-900 hover:text-rose-950 focus:outline-hidden focus:ring-2 focus:ring-rose-400 rounded"
            >
              Retry Analysis
            </button>
          )}
        </div>
      )}

      {/* Mobile Column Switcher (visible only on small screens) */}
      <div className="lg:hidden bg-white border-b border-slate-200 flex text-xs font-medium shrink-0" role="tablist" aria-label="Mobile column switcher">
        <button
          role="tab"
          aria-selected={mobileColumn === 'left'}
          aria-controls="mobile-col-left"
          id="tab-mobile-docs"
          onClick={() => setMobileColumn('left')}
          className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
            mobileColumn === 'left'
              ? 'border-indigo-600 text-indigo-700 font-semibold'
              : 'border-transparent text-slate-600'
          }`}
        >
          Docs ({documents.length})
        </button>
        <button
          role="tab"
          aria-selected={mobileColumn === 'center'}
          aria-controls="mobile-col-center"
          id="tab-mobile-analysis"
          onClick={() => setMobileColumn('center')}
          className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
            mobileColumn === 'center'
              ? 'border-indigo-600 text-indigo-700 font-semibold'
              : 'border-transparent text-slate-600'
          }`}
        >
          Analysis Views
        </button>
        <button
          role="tab"
          aria-selected={mobileColumn === 'right'}
          aria-controls="mobile-col-right"
          id="tab-mobile-ai"
          onClick={() => setMobileColumn('right')}
          className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
            mobileColumn === 'right'
              ? 'border-indigo-600 text-indigo-700 font-semibold'
              : 'border-transparent text-slate-600'
          }`}
        >
          AI Q&A & Context
        </button>
      </div>

      {/* ============================================================ */}
      {/* THREE-COLUMN WORKSPACE BODY                                   */}
      {/* ============================================================ */}
      <div className="flex-1 flex min-w-0 w-full overflow-hidden">
        {/* ============================================================ */}
        {/* LEFT COLUMN: Document Drawer & Files Ingestion               */}
        {/* ============================================================ */}
        <aside
          id="mobile-col-left"
          aria-label="Documents repository"
          className={`w-full lg:w-64 xl:w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto ${
            mobileColumn === 'left' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Header & Upload CTA */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Documents ({documents.length})
              </h2>
              <p className="text-[11px] text-slate-600">Client-scoped evidence</p>
            </div>
            <button
              id="upload-document-btn"
              onClick={() => setIsUploadModalOpen(true)}
              className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-300"
              title="Upload PDF Document"
              aria-label="Upload PDF Document"
            >
              <Upload className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Search Documents */}
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <label htmlFor="search-documents-input" className="sr-only">
                Filter documents
              </label>
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="text"
                id="search-documents-input"
                value={searchDocQuery}
                onChange={e => setSearchDocQuery(e.target.value)}
                placeholder="Filter documents..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-300 focus:bg-white"
              />
            </div>
          </div>

          {/* Document Items List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1" role="list" aria-label="Document list">
            {filteredDocuments.length === 0 ? (
              <div className="p-6 text-center text-slate-600">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" aria-hidden="true" />
                <p className="text-xs font-medium">No documents yet</p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Upload a PDF contract to begin analysis.
                </p>
              </div>
            ) : (
              filteredDocuments.map(doc => {
                const isSelected = activeDocument?.documentId === doc.documentId;
                return (
                  <div
                    key={doc.documentId}
                    role="listitem"
                    tabIndex={0}
                    aria-label={`Select document ${doc.fileName}`}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectDocument(doc.documentId);
                        setMobileColumn('center');
                      }
                    }}
                    onClick={() => {
                      onSelectDocument(doc.documentId);
                      setMobileColumn('center');
                    }}
                    className={`p-3 rounded-xl cursor-pointer transition-all border text-xs group focus:outline-hidden focus:ring-2 focus:ring-indigo-300 ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-200 shadow-2xs'
                        : 'border-transparent hover:bg-slate-50 hover:border-slate-200/80 text-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <FileText
                          aria-hidden="true"
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            isSelected ? 'text-indigo-600' : 'text-slate-400'
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate leading-snug">
                            {doc.fileName}
                          </p>
                          <span className="text-[10px] text-slate-600 block mt-0.5">
                            {(doc.fileSize / (1024 * 1024)).toFixed(1)} MB · PDF
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={async e => {
                          e.stopPropagation();
                          if (confirm(`Remove "${doc.fileName}" from this workspace?`)) {
                            await onDeleteDocument(doc.documentId);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-slate-400 hover:text-rose-600 p-1 rounded-sm transition-opacity focus:outline-hidden focus:ring-2 focus:ring-rose-300"
                        title={`Delete document ${doc.fileName}`}
                        aria-label={`Delete document ${doc.fileName}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-600">
                      <span className="font-mono">
                        {new Date(doc.uploadTimestamp).toLocaleDateString()}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded capitalize font-medium ${
                          doc.analysisStatus === 'completed'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : doc.analysisStatus === 'analyzing'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {doc.analysisStatus}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Privacy & Isolation Footer */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-600 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
            <span className="truncate">Encrypted & Owner-Isolated</span>
          </div>
        </aside>

        {/* ============================================================ */}
        {/* CENTER COLUMN: Document / Content Area with Sub-Navigation   */}
        {/* ============================================================ */}
        <main
          id="mobile-col-center"
          className={`flex-1 min-w-0 flex flex-col bg-[#faf9f6] overflow-x-hidden ${
            mobileColumn === 'center' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Sub-Navigation Bar */}
          <div className="bg-white border-b border-slate-200 px-4 sm:px-6 shrink-0 w-full overflow-x-auto">
            <div className="flex items-center gap-4 sm:gap-6 min-w-max text-xs font-medium" role="tablist" aria-label="Document analysis sections">
              {[
                { id: 'overview' as const, label: 'Overview', icon: Layers, count: undefined },
                { id: 'attention' as const, label: 'Attention', icon: AlertTriangle, count: attentionItems.length },
                { id: 'clauses' as const, label: 'Clauses', icon: BookOpen, count: clauses.length },
                { id: 'timeline' as const, label: 'Timeline', icon: Calendar, count: timeline.length },
                { id: 'evidence' as const, label: 'Evidence', icon: FileCheck, count: undefined },
                { id: 'questions' as const, label: 'Questions', icon: HelpCircle, count: questionsList.length > 0 ? questionsList.length : undefined },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`subnav-${tab.id}-btn`}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`tabpanel-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3.5 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap focus:outline-hidden focus:ring-2 focus:ring-indigo-300 ${
                      isActive
                        ? 'border-indigo-600 text-indigo-700 font-semibold'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          isActive
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content View Area */}
          <div
            className="flex-1 overflow-y-auto p-4 sm:p-6 min-w-0 focus:outline-hidden"
            role="tabpanel"
            id={`tabpanel-${activeTab}`}
            aria-labelledby={`subnav-${activeTab}-btn`}
            tabIndex={0}
          >
            {!activeDocument ? (
              <div className="max-w-md mx-auto text-center py-16">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-serif text-lg font-medium text-slate-800">
                  Select or upload a document
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Upload a contract or legal agreement to inspect structured clauses, attention points, and timeline milestones.
                </p>
                <button
                  id="empty-state-upload-btn"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-medium hover:bg-indigo-700 transition-colors shadow-2xs"
                >
                  Upload PDF
                </button>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-6">
                {/* 1. OVERVIEW TAB */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Document Header Card */}
                    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold uppercase tracking-wider">
                            {analysisRecord?.documentType || 'Legal Document'}
                          </span>
                          <span className="text-[11px] text-slate-600 font-mono">
                            {activeDocument.fileName}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-600">
                          Uploaded {new Date(activeDocument.uploadTimestamp).toLocaleDateString()}
                        </span>
                      </div>

                      <div>
                        <h2 className="font-serif text-xl sm:text-2xl font-normal text-slate-900 tracking-tight">
                          {analysisRecord?.title || activeDocument.fileName}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-700 mt-2 leading-relaxed font-sans">
                          {analysisRecord?.summary || activeDocument.summaryPreview || 'Document pending structural analysis. Click Re-Analyze to trigger extraction.'}
                        </p>
                      </div>

                      {/* Key Takeaways */}
                      {analysisRecord?.keyTakeaways && analysisRecord.keyTakeaways.length > 0 && (
                        <div className="pt-3 border-t border-slate-100">
                          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">
                            Key Factual Takeaways
                          </h4>
                          <ul className="space-y-1.5">
                            {analysisRecord.keyTakeaways.map((takeaway, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{takeaway}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Parties and Financial Terms Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Identified Parties */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                          <Users className="w-4 h-4 text-indigo-600" />
                          <span>Identified Parties</span>
                        </div>
                        {analysisRecord?.parties && analysisRecord.parties.length > 0 ? (
                          <div className="space-y-2">
                            {analysisRecord.parties.map((p, idx) => (
                              <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                                <div className="font-semibold text-slate-900">{p.name}</div>
                                <div className="text-slate-600 text-[11px] mt-0.5">{p.role}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-600">Parties will populate after analysis completes.</p>
                        )}
                      </div>

                      {/* Financial Terms & Considerations */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          <span>Financial Terms & Caps</span>
                        </div>
                        {analysisRecord?.financialTerms && analysisRecord.financialTerms.length > 0 ? (
                          <div className="space-y-2">
                            {analysisRecord.financialTerms.map((f, idx) => (
                              <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-slate-900">{f.term}</span>
                                  {f.amountOrRate && (
                                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium">
                                      {f.amountOrRate}
                                    </span>
                                  )}
                                </div>
                                <p className="text-slate-600 text-[11px] mt-1">{f.description}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-600">Financial conditions will populate after analysis.</p>
                        )}
                      </div>
                    </div>

                    {/* Quick Stats Metric Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                        <div className="text-[11px] text-slate-600">Extracted Clauses</div>
                        <div className="text-xl font-serif font-bold text-slate-900 mt-0.5">
                          {clauses.length}
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                        <div className="text-[11px] text-slate-600">Attention Points</div>
                        <div className="text-xl font-serif font-bold text-slate-900 mt-0.5">
                          {attentionItems.length}
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                        <div className="text-[11px] text-slate-600">Critical Red Flags</div>
                        <div className="text-xl font-serif font-bold text-rose-600 mt-0.5">
                          {redCount}
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                        <div className="text-[11px] text-slate-600">Timeline Milestones</div>
                        <div className="text-xl font-serif font-bold text-indigo-600 mt-0.5">
                          {timeline.length}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. ATTENTION ENGINE TAB */}
                {activeTab === 'attention' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                      <div>
                        <h3 className="font-serif text-base font-semibold text-slate-900">
                          Structured Attention Engine
                        </h3>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Factual, non-alarmist points that warrant review or consultation with your legal counsel.
                        </p>
                      </div>

                      {/* Category Filter Pills */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => setSelectedAttentionCategory('ALL')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                            selectedAttentionCategory === 'ALL'
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          All ({attentionItems.length})
                        </button>
                        <button
                          onClick={() => setSelectedAttentionCategory('RED')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                            selectedAttentionCategory === 'RED'
                              ? 'bg-rose-700 text-white'
                              : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                          }`}
                        >
                          Red ({redCount})
                        </button>
                        <button
                          onClick={() => setSelectedAttentionCategory('AMBER')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                            selectedAttentionCategory === 'AMBER'
                              ? 'bg-amber-700 text-white'
                              : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                          }`}
                        >
                          Amber ({amberCount})
                        </button>
                        <button
                          onClick={() => setSelectedAttentionCategory('GREEN')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                            selectedAttentionCategory === 'GREEN'
                              ? 'bg-emerald-700 text-white'
                              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          }`}
                        >
                          Green ({greenCount})
                        </button>
                      </div>
                    </div>

                    {filteredAttention.length === 0 ? (
                      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
                        <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <p className="text-xs text-slate-700 font-medium">
                          No attention items in this category.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredAttention.map(item => {
                          const isRed = item.category === 'RED';
                          const isAmber = item.category === 'AMBER';
                          return (
                            <div
                              key={item.id}
                              className={`bg-white p-5 rounded-2xl border transition-all shadow-2xs space-y-3 ${
                                isRed
                                  ? 'border-rose-200 hover:border-rose-300'
                                  : isAmber
                                  ? 'border-amber-200 hover:border-amber-300'
                                  : 'border-emerald-200 hover:border-emerald-300'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-2.5 min-w-0">
                                  {isRed ? (
                                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                  ) : isAmber ? (
                                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                  ) : (
                                    <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                  )}
                                  <div>
                                    <h4 className="font-serif text-sm font-semibold text-slate-900">
                                      {item.title}
                                    </h4>
                                    <span
                                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full inline-block mt-1 font-semibold ${
                                        isRed
                                          ? 'bg-rose-100 text-rose-800'
                                          : isAmber
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'bg-emerald-100 text-emerald-800'
                                      }`}
                                    >
                                      {isRed
                                        ? 'Needs Attention'
                                        : isAmber
                                        ? 'Worth Understanding'
                                        : 'Informational'}
                                    </span>
                                  </div>
                                </div>

                                {item.source && (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono shrink-0">
                                    {item.source.pageNumber ? `P. ${item.source.pageNumber} · ` : ''}
                                    {item.source.section || 'Document'}
                                  </span>
                                )}
                              </div>

                              {/* Factual Description */}
                              <p className="text-xs text-slate-700 leading-relaxed font-sans">
                                {item.description}
                              </p>

                              {/* Source Quote */}
                              {item.source?.sourceText && (
                                <blockquote className="border-l-2 border-slate-300 pl-3 text-[11px] text-slate-600 italic font-serif bg-slate-50 p-2 rounded-r-lg">
                                  "{item.source.sourceText}"
                                </blockquote>
                              )}

                              {/* Attorney Consultation Prompt */}
                              {item.recommendation && (
                                <div className="pt-2 border-t border-slate-100 flex items-start gap-2 text-[11px] text-indigo-900 bg-indigo-50/50 p-2.5 rounded-xl">
                                  <HelpCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-semibold">Consultation Consideration: </span>
                                    <span>{item.recommendation}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. CLAUSES TAB */}
                {activeTab === 'clauses' && (
                  <div className="space-y-4">
                    {/* Clause Filters Bar */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="relative flex-1">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={clauseSearchQuery}
                            onChange={e => setClauseSearchQuery(e.target.value)}
                            placeholder="Search clause text, title, or explanation..."
                            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-300 focus:bg-white text-slate-800"
                          />
                        </div>

                        {/* Clause Type Selector */}
                        <div className="flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
                          {['all', 'termination', 'liability', 'confidentiality', 'payment', 'dispute_resolution'].map(
                            t => (
                              <button
                                key={t}
                                onClick={() => setSelectedClauseType(t)}
                                className={`px-2.5 py-1 rounded-lg text-xs capitalize whitespace-nowrap transition-colors ${
                                  selectedClauseType === t
                                    ? 'bg-indigo-600 text-white font-medium'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {t.replace('_', ' ')}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    {filteredClauses.length === 0 ? (
                      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
                        <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-700 font-medium">
                          No matching clauses found.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredClauses.map((clause, idx) => (
                          <div
                            key={clause.clauseId || idx}
                            className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden"
                          >
                            {/* Clause Header */}
                            <div className="p-4 bg-slate-50/70 border-b border-slate-200/60 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-serif text-sm font-semibold text-slate-900 truncate">
                                  {clause.title}
                                </span>
                                {clause.section && (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 font-mono shrink-0">
                                    {clause.section}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() =>
                                    handleCopyClause(clause.clauseId || `${idx}`, clause.originalText)
                                  }
                                  className="text-[11px] text-slate-500 hover:text-slate-800 p-1.5 rounded-md hover:bg-slate-200/60 flex items-center gap-1 transition-colors"
                                  title="Copy original legal text"
                                >
                                  {copiedClauseId === (clause.clauseId || `${idx}`) ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      <span className="text-emerald-700 text-[10px]">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      <span className="text-[10px] hidden sm:inline">Copy Text</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Clause Body: Original + Plain Explanation */}
                            <div className="p-5 space-y-4">
                              {/* Verbatim Original Legal Text */}
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
                                    Exact Original Legal Text
                                  </span>
                                  {clause.sourceReference && (
                                    <span className="text-[10px] text-slate-600 font-mono">
                                      {clause.sourceReference.pageNumber
                                        ? `Page ${clause.sourceReference.pageNumber}`
                                        : 'Source Verified'}
                                    </span>
                                  )}
                                </div>
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 leading-relaxed select-all">
                                  {clause.originalText}
                                </div>
                              </div>

                              {/* Plain Language Explanation */}
                              <div className="space-y-1">
                                <span className="text-[10px] font-semibold text-indigo-900 uppercase tracking-wider">
                                  Plain-English Translation
                                </span>
                                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans bg-indigo-50/30 p-3 rounded-xl border border-indigo-100/60">
                                  {clause.plainExplanation}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. TIMELINE TAB */}
                {activeTab === 'timeline' && (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                      <h3 className="font-serif text-base font-semibold text-slate-900">
                        Operational Timeline & Deadlines
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Chronological sequence of notice periods, renewal dates, payment terms, and milestones.
                      </p>
                    </div>

                    {timeline.length === 0 ? (
                      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
                        <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-700 font-medium">
                          No timeline events extracted yet.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-6">
                        <div className="relative pl-6 sm:pl-8 border-l-2 border-indigo-200 space-y-6">
                          {timeline.map((event, idx) => (
                            <div key={event.eventId || idx} className="relative group">
                              {/* Dot on Timeline */}
                              <div
                                className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                                  event.importance === 'critical'
                                    ? 'bg-rose-600'
                                    : event.importance === 'important'
                                    ? 'bg-amber-500'
                                    : 'bg-indigo-600'
                                }`}
                              />

                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 hover:border-indigo-200 transition-colors">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="font-mono text-xs font-semibold text-indigo-700">
                                    {event.date}
                                  </span>
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded capitalize font-medium ${
                                      event.importance === 'critical'
                                        ? 'bg-rose-100 text-rose-800'
                                        : event.importance === 'important'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-slate-200 text-slate-700'
                                    }`}
                                  >
                                    {event.importance}
                                  </span>
                                </div>
                                <h4 className="font-serif text-sm font-semibold text-slate-900 mt-1">
                                  {event.title}
                                </h4>
                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                  {event.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. EVIDENCE TAB */}
                {activeTab === 'evidence' && (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                      <h3 className="font-serif text-base font-semibold text-slate-900">
                        Evidence Grounding & Source Citations
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Audit trail linking extracted clauses and attention items directly to verifiable document excerpts.
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-4 border-b border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-500 text-[11px] block">Document File</span>
                          <span className="font-medium text-slate-900">{activeDocument.fileName}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[11px] block">Storage Reference</span>
                          <span className="font-mono text-[11px] text-slate-700 truncate block">
                            {activeDocument.storageReference || 'Isolated Cloud Storage'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[11px] block">Verification Status</span>
                          <span className="font-medium text-emerald-700 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Factual Grounding Verified
                          </span>
                        </div>
                      </div>

                      {/* Excerpts list */}
                      <div className="space-y-3">
                        {clauses.map((c, idx) => (
                          <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-slate-800">{c.title}</span>
                              <span className="font-mono text-slate-600">
                                {c.section || `Clause ${idx + 1}`}
                              </span>
                            </div>
                            <blockquote className="italic border-l-2 border-indigo-400 pl-2.5 text-slate-600 text-[11px] font-serif">
                              "{c.originalText}"
                            </blockquote>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. QUESTIONS TAB */}
                {activeTab === 'questions' && (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                      <h3 className="font-serif text-base font-semibold text-slate-900">
                        Attorney Consultation Preparation
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Prepare strategic questions and points of clarification before meeting with your legal counsel.
                      </p>
                    </div>

                    {/* Add new question form */}
                    <form
                      onSubmit={handleAddQuestion}
                      className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex gap-2"
                    >
                      <input
                        type="text"
                        id="new-question-input"
                        value={newQuestionText}
                        onChange={e => setNewQuestionText(e.target.value)}
                        placeholder="e.g. Can we negotiate a mutual cure period for Section 4?"
                        className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-300 focus:bg-white"
                      />
                      <button
                        type="submit"
                        id="add-question-btn"
                        disabled={!newQuestionText.trim()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                      >
                        Add Question
                      </button>
                    </form>

                    {questionsList.length === 0 ? (
                      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
                        <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-700 font-medium">
                          No consultation questions added yet.
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Use the "Ask Document" AI drawer on the right to discover questions, or type one above.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {questionsList.map((q, idx) => (
                          <div
                            key={q.id}
                            className="bg-white p-4 rounded-xl border border-slate-200/80 flex items-start gap-3 shadow-2xs"
                          >
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <div className="flex-1 text-xs">
                              <p className="font-medium text-slate-900">{q.text}</p>
                              {q.answer && (
                                <p className="text-slate-600 mt-1 text-[11px] bg-slate-50 p-2 rounded border border-slate-200/60 font-sans">
                                  {q.answer}
                                </p>
                              )}
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                              Ready
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: AI Context & Insights Panel                     */}
        {/* ============================================================ */}
        {isAiPanelOpen && (
          <aside
            className={`w-full lg:w-72 xl:w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-y-auto p-4 space-y-4 ${
              mobileColumn === 'right' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-semibold text-slate-800">Document Intelligence</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono">
                Gemini 3.8
              </span>
            </div>

            {/* Ask Document Drawer */}
            <AskDocumentDrawer
              document={activeDocument}
              onSaveQuestionToConsultation={async (queryText, answerText) => {
                await onSaveQuestion(queryText, answerText);
                setQuestionsList(prev => [
                  {
                    id: `q_${Date.now()}`,
                    text: queryText,
                    answer: answerText,
                    status: 'prepared_for_consultation',
                  },
                  ...prev,
                ]);
              }}
            />

            {/* Quick Legal Preparation Card */}
            <div className="bg-amber-50/60 rounded-xl border border-amber-200/70 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
                <Shield className="w-4 h-4 text-amber-700" />
                <span>Consultation Preparation</span>
              </div>
              <p className="text-[11px] text-amber-950/80 leading-relaxed">
                When meeting with your lawyer, bring your flagged attention points and chronological deadlines. This helps counsel focus on material risks immediately.
              </p>
            </div>

            {/* Critical Attention Flags Quick Glance */}
            {redCount > 0 && (
              <div className="bg-white rounded-xl border border-rose-200 p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-rose-950">Critical Red Flags</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-mono">
                    {redCount} flagged
                  </span>
                </div>
                <div className="space-y-2">
                  {attentionItems
                    .filter(i => i.category === 'RED')
                    .slice(0, 3)
                    .map(r => (
                      <div
                        key={r.id}
                        className="p-2.5 rounded-lg bg-rose-50/40 border border-rose-100 text-xs"
                      >
                        <div className="font-medium text-rose-900 text-[11px]">{r.title}</div>
                        <p className="text-slate-600 text-[10px] mt-0.5 line-clamp-2">
                          {r.description}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Trust and Non-Advisory Disclaimer */}
            <div className="pt-2 text-[10px] text-slate-500 leading-normal border-t border-slate-100">
              Legal Lens is an evidence-grounded legal information workspace and does not provide formal legal advice or attorney representation.
            </div>
          </aside>
        )}
      </div>

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={onUploadDocument}
        uploading={uploading}
        uploadProgress={uploadProgress}
        uploadError={uploadError}
      />
    </div>
  );
};
