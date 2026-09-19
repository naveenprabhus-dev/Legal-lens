/**
 * Core type definitions for Legal Lens
 */

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
}

export type WorkspaceStatus = 'active' | 'archived';

export interface Workspace {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  documentCount: number;
  status: WorkspaceStatus;
  createdAt: string;
  updatedAt: string;
}

export type ProcessingStatus = 'pending' | 'processed' | 'failed';
export type AnalysisStatus = 'not_started' | 'analyzing' | 'completed' | 'failed';

export type ProcessingLifecycleStage =
  | 'IDLE'
  | 'UPLOADING'
  | 'VALIDATING'
  | 'PROCESSING'
  | 'ANALYZING'
  | 'VALIDATING_RESULTS'
  | 'READY'
  | 'PROCESSING_FAILED';

export interface LegalDocument {
  documentId: string;
  workspaceId: string;
  ownerId: string;
  fileName: string;
  fileType: 'application/pdf';
  fileSize: number;
  uploadTimestamp: string;
  processingStatus: ProcessingStatus;
  analysisStatus: AnalysisStatus;
  storageReference?: string;
  pageCount?: number;
  summaryPreview?: string;
  downloadUrl?: string;
  extractedText?: string;
}

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';
export type AttentionCategory = 'RED' | 'AMBER' | 'GREEN';

export interface SourceReference {
  documentId?: string;
  documentName?: string;
  pageNumber?: number | null;
  section?: string;
  sourceText?: string;
}

export interface Clause {
  clauseId: string;
  workspaceId?: string;
  documentId?: string;
  ownerId?: string;
  type?: string;
  title: string;
  originalText: string;
  plainExplanation: string;
  riskLevel: RiskLevel;
  affectedParty?: string;
  obligations?: string[];
  importantDetails?: string[];
  importanceCategory?: 'high' | 'medium' | 'low';
  section?: string;
  sourceReference?: SourceReference;
}

export type InsightType = 'risk' | 'obligation' | 'deadline' | 'benefit' | 'ambiguity';
export type SeverityLevel = 'info' | 'attention' | 'warning' | 'critical';

export interface Insight {
  insightId: string;
  workspaceId: string;
  documentId: string;
  ownerId: string;
  type: InsightType;
  title: string;
  description: string;
  severity: SeverityLevel;
  recommendation?: string;
  citation?: string;
}

export interface AttentionItem {
  id: string;
  category: AttentionCategory;
  title: string;
  description: string;
  source: SourceReference;
  relatedClauseId?: string;
  recommendation?: string;
}

export interface TimelineEvent {
  eventId: string;
  workspaceId: string;
  documentId: string;
  ownerId: string;
  date: string;
  title: string;
  description: string;
  importance: 'standard' | 'important' | 'critical';
  sourceReference?: string;
}

export interface Question {
  questionId: string;
  workspaceId: string;
  documentId?: string;
  ownerId: string;
  queryText: string;
  answerSummary?: string;
  status: 'draft' | 'answered' | 'prepared_for_consultation';
  createdAt: string;
}

export interface PreparationBrief {
  briefId: string;
  workspaceId: string;
  ownerId: string;
  title: string;
  targetAudience: string;
  summary: string;
  keyQuestions?: string[];
  documentsReferenced?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentParty {
  name: string;
  role: string;
}

export interface ImportantDate {
  date: string;
  description: string;
  source?: string;
}

export interface FinancialTerm {
  term: string;
  amountOrRate?: string;
  description: string;
}

export interface DocumentObligation {
  party: string;
  obligation: string;
  timing?: string;
}

export interface DocumentAnalysisRecord {
  analysisId: string;
  workspaceId: string;
  documentId: string;
  ownerId: string;
  documentType?: string;
  title: string;
  summary: string;
  parties?: DocumentParty[];
  importantDates?: ImportantDate[];
  financialTerms?: FinancialTerm[];
  obligations?: DocumentObligation[];
  keyTakeaways: string[];
  clauses: Clause[];
  attentionItems: AttentionItem[];
  timeline: TimelineEvent[];
  sourceReferences?: SourceReference[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentAnalysis {
  analysisId: string;
  workspaceId: string;
  documentId: string;
  ownerId: string;
  title: string;
  summary: string;
  keyRisksCount: number;
  clausesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentAnswer {
  answer: string;
  foundInDocument: boolean;
  confidence?: 'high' | 'medium' | 'low';
  sourceReferences: SourceReference[];
  relatedClauses?: string[];
  limitation?: string;
  disclaimer?: string;
}
