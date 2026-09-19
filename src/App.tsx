import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useWorkspaces } from './hooks/useWorkspaces';
import { useDocuments } from './hooks/useDocuments';
import { LandingPage } from './components/landing/LandingPage';
import { AuthModal } from './components/auth/AuthModal';
import { Header } from './components/common/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { WorkspaceShell } from './components/workspace/WorkspaceShell';
import { CompareView } from './components/views/CompareView';
import { PreparationBriefsView } from './components/views/PreparationBriefsView';
import { saveQuestion } from './services/firebase/firestore';
import { Scale, Loader2 } from 'lucide-react';

export default function App() {
  const { user, loading: authLoading, error: authError, isSigningIn, login, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'workspace' | 'compare' | 'briefs'>('dashboard');

  // Workspaces hook
  const {
    workspaces,
    activeWorkspace,
    setActiveWorkspaceId,
    loading: loadingWorkspaces,
    createWorkspace,
    deleteWorkspace,
  } = useWorkspaces(user?.uid);

  // Documents hook for the active workspace
  const {
    documents,
    activeDocument,
    setActiveDocumentId,
    uploading,
    uploadProgress,
    uploadError,
    lifecycleStage,
    analyzing,
    clauses,
    insights,
    attentionItems,
    timeline,
    analysisRecord,
    uploadDocument,
    triggerDocumentAnalysis,
    removeDocument,
  } = useDocuments(user?.uid, activeWorkspace?.id);

  // Handle Question saving from Q&A drawer or questions tab
  const handleSaveQuestion = async (queryText: string, answerSummary?: string) => {
    if (!user || !activeWorkspace) return;
    await saveQuestion(
      user.uid,
      activeWorkspace.id,
      queryText,
      activeDocument?.documentId,
      answerSummary
    );
  };

  // 1. Initial auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center p-6 text-slate-700">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-2xs">
          <Scale className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          <span>Initializing Legal Lens workspace...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated state -> Landing Page + Auth Modal
  if (!user) {
    return (
      <>
        <LandingPage onGetStarted={() => setIsAuthModalOpen(true)} />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onLoginWithGoogle={async () => {
            await login();
            setIsAuthModalOpen(false);
          }}
          isSigningIn={isSigningIn}
          error={authError}
        />
      </>
    );
  }

  // 3. Authenticated state -> Full Workspace Application
  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col selection:bg-indigo-100 selection:text-indigo-900 w-full max-w-full overflow-x-hidden">
      {/* Top Header & Navigation */}
      <Header
        user={user}
        onSignOut={logout}
        activeView={activeView}
        onNavigate={view => setActiveView(view)}
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={id => setActiveWorkspaceId(id)}
        onOpenNewWorkspaceModal={() => {
          setActiveView('dashboard');
        }}
      />

      {/* Main View Router */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
        {activeView === 'dashboard' && (
          <Dashboard
            user={user}
            workspaces={workspaces}
            loadingWorkspaces={loadingWorkspaces}
            onSelectWorkspace={id => {
              setActiveWorkspaceId(id);
              setActiveView('workspace');
            }}
            onCreateWorkspace={async (name, desc) => {
              const ws = await createWorkspace(name, desc);
              setActiveWorkspaceId(ws.id);
            }}
            onDeleteWorkspace={deleteWorkspace}
            onNavigateToWorkspace={() => setActiveView('workspace')}
          />
        )}

        {activeView === 'workspace' && (
          activeWorkspace ? (
            <WorkspaceShell
              user={user}
              workspace={activeWorkspace}
              documents={documents}
              activeDocument={activeDocument}
              onSelectDocument={setActiveDocumentId}
              onUploadDocument={uploadDocument}
              onDeleteDocument={removeDocument}
              onTriggerAnalysis={triggerDocumentAnalysis}
              uploading={uploading}
              uploadProgress={uploadProgress}
              uploadError={uploadError}
              lifecycleStage={lifecycleStage}
              analyzing={analyzing}
              clauses={clauses}
              insights={insights}
              attentionItems={attentionItems}
              timeline={timeline}
              analysisRecord={analysisRecord}
              onSaveQuestion={handleSaveQuestion}
            />
          ) : (
            <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-2xl border border-slate-200 text-center shadow-2xs">
              <Scale className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="font-serif text-lg font-medium text-slate-800">
                No active workspace selected
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Please return to your dashboard or select a workspace to inspect documents.
              </p>
              <button
                id="return-to-dashboard-btn"
                onClick={() => setActiveView('dashboard')}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-medium"
              >
                Go to Dashboard
              </button>
            </div>
          )
        )}

        {activeView === 'compare' && (
          <CompareView onBackToDashboard={() => setActiveView('dashboard')} />
        )}

        {activeView === 'briefs' && (
          <PreparationBriefsView onBackToDashboard={() => setActiveView('dashboard')} />
        )}
      </div>
    </div>
  );
}
