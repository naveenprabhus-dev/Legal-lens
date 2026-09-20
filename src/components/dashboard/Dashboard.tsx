import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  FolderPlus,
  FileText,
  Clock,
  ArrowRight,
  Trash2,
  FolderOpen,
  Sparkles,
  ShieldCheck,
  Search,
  Plus,
} from 'lucide-react';
import { Workspace } from '../../types';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface DashboardProps {
  user: User;
  workspaces: Workspace[];
  loadingWorkspaces: boolean;
  onSelectWorkspace: (workspaceId: string) => void;
  onCreateWorkspace: (name: string, description?: string) => Promise<unknown>;
  onDeleteWorkspace: (workspaceId: string) => Promise<void>;
  onNavigateToWorkspace: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  workspaces,
  loadingWorkspaces,
  onSelectWorkspace,
  onCreateWorkspace,
  onDeleteWorkspace,
  onNavigateToWorkspace,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wsName, setWsName] = useState('');
  const [wsDesc, setWsDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const modalRef = useFocusTrap<HTMLDivElement>({
    isOpen: isModalOpen,
    onClose: submitting ? undefined : () => setIsModalOpen(false),
    initialFocusSelector: '#workspace-name-input',
  });

  const filteredWorkspaces = workspaces.filter(w =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.description && w.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName.trim()) return;

    setSubmitting(true);
    try {
      await onCreateWorkspace(wsName.trim(), wsDesc.trim());
      setWsName('');
      setWsDesc('');
      setIsModalOpen(false);
      onNavigateToWorkspace();
    } catch (err) {
      console.error('Failed to create workspace:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const totalDocuments = workspaces.reduce((acc, curr) => acc + (curr.documentCount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Dashboard Top Hero */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-8 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl font-normal text-slate-900 tracking-tight">
              Legal Workspace
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" aria-hidden="true" />
              <span>Owner Isolated</span>
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1.5">
            Welcome, {user.displayName || user.email}. Review documents, analyze clauses, and prepare
            consultation briefs.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            id="dashboard-new-workspace-btn"
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-400"
          >
            <FolderPlus className="w-4 h-4" aria-hidden="true" />
            <span>New Workspace</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8" role="region" aria-label="Workspace metrics summary">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-xs text-slate-600 font-medium">Workspaces Active</div>
          <div className="text-2xl font-serif text-slate-900 font-semibold mt-1">
            {workspaces.length}
          </div>
          <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" aria-hidden="true" />
            <span>Bound to user ID {user.uid.slice(0, 6)}...</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-xs text-slate-600 font-medium">Legal Documents Ingested</div>
          <div className="text-2xl font-serif text-slate-900 font-semibold mt-1">
            {totalDocuments}
          </div>
          <div className="text-[11px] text-slate-600 mt-1">
            <span>PDF files with structured metadata</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-xs text-slate-600 font-medium">AI Service Engine</div>
          <div className="text-sm font-semibold text-indigo-900 mt-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600" aria-hidden="true" />
            <span>Server-side Gemini 3.8</span>
          </div>
          <div className="text-[11px] text-slate-600 mt-1">
            <span>Evidence-grounded structured extraction</span>
          </div>
        </div>
      </div>

      {/* Workspace Section Header & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Your Document Workspaces</h2>
          <p className="text-xs text-slate-600">Select a workspace to view documents, timeline, and insights</p>
        </div>

        {workspaces.length > 0 && (
          <div className="relative w-full sm:w-64">
            <label htmlFor="search-workspaces-input" className="sr-only">
              Search workspaces
            </label>
            <Search className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="text"
              id="search-workspaces-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search workspaces..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-300 text-slate-800"
            />
          </div>
        )}
      </div>

      {/* Loading state */}
      {loadingWorkspaces ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200" role="status" aria-live="polite">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" aria-hidden="true"></div>
          <p className="text-xs text-slate-600 mt-3">Loading workspaces...</p>
        </div>
      ) : workspaces.length === 0 ? (
        /* Empty State for first time users */
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-2xl mx-auto shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-4" aria-hidden="true">
            <FolderPlus className="w-7 h-7" />
          </div>
          <h3 className="font-serif text-2xl font-normal text-slate-900">
            Your legal workspace is empty
          </h3>
          <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
            Upload a document to start understanding what's inside. Create your first workspace to
            organize contracts, leases, or legal notices.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="empty-create-workspace-btn"
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-xs hover:shadow-sm transition-all flex items-center gap-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-400"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Create workspace</span>
            </button>
          </div>
        </div>
      ) : (
        /* Workspaces List */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" role="list" aria-label="Workspaces">
          {filteredWorkspaces.map(ws => (
            <div
              key={ws.id}
              role="listitem"
              className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:border-indigo-200 transition-all shadow-2xs flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0" aria-hidden="true">
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                    {ws.status}
                  </span>
                </div>

                <h3 className="font-medium text-slate-900 text-sm line-clamp-1 group-hover:text-indigo-700 transition-colors">
                  {ws.name}
                </h3>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2 min-h-[32px]">
                  {ws.description || 'General legal document workspace for contract analysis.'}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
                    <span>{ws.documentCount || 0} files</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
                    <span>{new Date(ws.updatedAt).toLocaleDateString()}</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    id={`delete-ws-${ws.id}-btn`}
                    onClick={async e => {
                      e.stopPropagation();
                      if (confirm(`Delete workspace "${ws.name}" and its documents?`)) {
                        await onDeleteWorkspace(ws.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors focus:outline-hidden focus:ring-2 focus:ring-rose-300"
                    aria-label={`Delete workspace ${ws.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>

                  <button
                    id={`open-ws-${ws.id}-btn`}
                    onClick={() => {
                      onSelectWorkspace(ws.id);
                      onNavigateToWorkspace();
                    }}
                    aria-label={`Open workspace ${ws.name}`}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium flex items-center gap-1 transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-300"
                  >
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Workspace Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-workspace-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        >
          <div
            ref={modalRef}
            className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-6"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <h3 id="create-workspace-modal-title" className="font-serif text-lg font-medium text-slate-900">
                Create New Legal Workspace
              </h3>
              <button
                id="close-create-ws-modal-btn"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-600 hover:text-slate-800 p-1.5 rounded-md focus:outline-hidden focus:ring-2 focus:ring-indigo-300"
                aria-label="Close workspace dialog"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="workspace-name-input" className="block text-xs font-medium text-slate-700 mb-1">
                  Workspace Name *
                </label>
                <input
                  type="text"
                  id="workspace-name-input"
                  required
                  maxLength={100}
                  value={wsName}
                  onChange={e => setWsName(e.target.value)}
                  placeholder="e.g. Commercial Lease Review, Vendor Master Agreement"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-300 focus:bg-white text-slate-800"
                />
              </div>

              <div>
                <label htmlFor="workspace-desc-input" className="block text-xs font-medium text-slate-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="workspace-desc-input"
                  rows={3}
                  maxLength={300}
                  value={wsDesc}
                  onChange={e => setWsDesc(e.target.value)}
                  placeholder="e.g. Analyzing renewal clauses, liability caps, and notice deadlines..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-300 focus:bg-white text-slate-800"
                />
              </div>

              <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed">
                <span className="font-medium">Data Boundary:</span> This workspace and all uploaded
                PDF documents will be strictly owned by your user ID ({user.uid.slice(0, 8)}...).
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  id="cancel-create-ws-btn"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-create-ws-btn"
                  disabled={submitting || !wsName.trim()}
                  className="px-5 py-2 text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs disabled:opacity-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-400"
                >
                  {submitting ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
