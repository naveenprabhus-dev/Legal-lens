import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './config';
import { handleFirestoreError, OperationType } from './errors';
import {
  Workspace,
  LegalDocument,
  DocumentAnalysis,
  Insight,
  TimelineEvent,
  Question,
  PreparationBrief,
} from '../../types';

// Helper for generating unique alphanumeric IDs conforming to regex '^[a-zA-Z0-9_-]+$'
export function generateSafeId(prefix: string = 'id'): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${randomStr}`;
}

// ========================
// Workspaces
// ========================

export async function getUserWorkspaces(userId: string): Promise<Workspace[]> {
  const path = `users/${userId}/workspaces`;
  try {
    const colRef = collection(db, 'users', userId, 'workspaces');
    const q = query(colRef, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as Workspace);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeUserWorkspaces(
  userId: string,
  onUpdate: (workspaces: Workspace[]) => void,
  onError?: (error: unknown) => void
) {
  const path = `users/${userId}/workspaces`;
  const colRef = collection(db, 'users', userId, 'workspaces');
  const q = query(colRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(
    q,
    snapshot => {
      const workspaces = snapshot.docs.map(d => d.data() as Workspace);
      onUpdate(workspaces);
    },
    error => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createWorkspace(
  userId: string,
  params: { name: string; description?: string }
): Promise<Workspace> {
  const workspaceId = generateSafeId('ws');
  const path = `users/${userId}/workspaces/${workspaceId}`;
  const now = new Date().toISOString();

  const workspace: Workspace = {
    id: workspaceId,
    ownerId: userId,
    name: params.name.trim(),
    description: params.description?.trim() || '',
    documentCount: 0,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = doc(db, 'users', userId, 'workspaces', workspaceId);
    await setDoc(docRef, workspace);
    return workspace;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getWorkspace(userId: string, workspaceId: string): Promise<Workspace | null> {
  const path = `users/${userId}/workspaces/${workspaceId}`;
  try {
    const docRef = doc(db, 'users', userId, 'workspaces', workspaceId);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as Workspace) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function updateWorkspace(
  userId: string,
  workspaceId: string,
  updates: Partial<Pick<Workspace, 'name' | 'description' | 'status' | 'documentCount'>>
): Promise<void> {
  const path = `users/${userId}/workspaces/${workspaceId}`;
  try {
    const docRef = doc(db, 'users', userId, 'workspaces', workspaceId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteWorkspace(userId: string, workspaceId: string): Promise<void> {
  const path = `users/${userId}/workspaces/${workspaceId}`;
  try {
    const docRef = doc(db, 'users', userId, 'workspaces', workspaceId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ========================
// Documents
// ========================

export async function getWorkspaceDocuments(
  userId: string,
  workspaceId: string
): Promise<LegalDocument[]> {
  const path = `users/${userId}/workspaces/${workspaceId}/documents`;
  try {
    const colRef = collection(db, 'users', userId, 'workspaces', workspaceId, 'documents');
    const q = query(colRef, orderBy('uploadTimestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as LegalDocument);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeWorkspaceDocuments(
  userId: string,
  workspaceId: string,
  onUpdate: (docs: LegalDocument[]) => void
) {
  const path = `users/${userId}/workspaces/${workspaceId}/documents`;
  const colRef = collection(db, 'users', userId, 'workspaces', workspaceId, 'documents');
  const q = query(colRef, orderBy('uploadTimestamp', 'desc'));

  return onSnapshot(
    q,
    snapshot => {
      const docs = snapshot.docs.map(d => d.data() as LegalDocument);
      onUpdate(docs);
    },
    error => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createDocumentRecord(
  userId: string,
  workspaceId: string,
  fileMeta: {
    fileName: string;
    fileSize: number;
    fileType: 'application/pdf';
    storageReference?: string;
    pageCount?: number;
  }
): Promise<LegalDocument> {
  const documentId = generateSafeId('doc');
  const path = `users/${userId}/workspaces/${workspaceId}/documents/${documentId}`;
  const now = new Date().toISOString();

  const legalDoc: LegalDocument = {
    documentId,
    workspaceId,
    ownerId: userId,
    fileName: fileMeta.fileName,
    fileType: fileMeta.fileType,
    fileSize: fileMeta.fileSize,
    uploadTimestamp: now,
    processingStatus: 'processed',
    analysisStatus: 'not_started',
    storageReference: fileMeta.storageReference || '',
    pageCount: fileMeta.pageCount || 1,
  };

  try {
    const docRef = doc(db, 'users', userId, 'workspaces', workspaceId, 'documents', documentId);
    await setDoc(docRef, legalDoc);

    // Update documentCount in workspace
    const wsRef = doc(db, 'users', userId, 'workspaces', workspaceId);
    const wsSnap = await getDoc(wsRef);
    if (wsSnap.exists()) {
      const currentCount = (wsSnap.data() as Workspace).documentCount || 0;
      await updateDoc(wsRef, {
        documentCount: currentCount + 1,
        updatedAt: now,
      });
    }

    return legalDoc;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateDocumentStatus(
  userId: string,
  workspaceId: string,
  documentId: string,
  updates: Partial<Pick<LegalDocument, 'processingStatus' | 'analysisStatus' | 'summaryPreview' | 'pageCount'>>
): Promise<void> {
  const path = `users/${userId}/workspaces/${workspaceId}/documents/${documentId}`;
  try {
    const docRef = doc(db, 'users', userId, 'workspaces', workspaceId, 'documents', documentId);
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteDocumentRecord(
  userId: string,
  workspaceId: string,
  documentId: string
): Promise<void> {
  const path = `users/${userId}/workspaces/${workspaceId}/documents/${documentId}`;
  try {
    const docRef = doc(db, 'users', userId, 'workspaces', workspaceId, 'documents', documentId);
    await deleteDoc(docRef);

    // Decrement documentCount
    const wsRef = doc(db, 'users', userId, 'workspaces', workspaceId);
    const wsSnap = await getDoc(wsRef);
    if (wsSnap.exists()) {
      const currentCount = (wsSnap.data() as Workspace).documentCount || 1;
      await updateDoc(wsRef, {
        documentCount: Math.max(0, currentCount - 1),
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ========================
// Insights & Timeline & Questions
// ========================

export async function getWorkspaceInsights(
  userId: string,
  workspaceId: string,
  documentId?: string
): Promise<Insight[]> {
  const path = `users/${userId}/workspaces/${workspaceId}/insights`;
  try {
    const colRef = collection(db, 'users', userId, 'workspaces', workspaceId, 'insights');
    const q = documentId ? query(colRef, where('documentId', '==', documentId)) : colRef;
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as Insight);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveInsight(
  userId: string,
  workspaceId: string,
  insightData: Omit<Insight, 'insightId' | 'ownerId' | 'workspaceId'>
): Promise<Insight> {
  const insightId = generateSafeId('ins');
  const path = `users/${userId}/workspaces/${workspaceId}/insights/${insightId}`;

  const insight: Insight = {
    insightId,
    workspaceId,
    ownerId: userId,
    ...insightData,
  };

  try {
    const docRef = doc(db, 'users', userId, 'workspaces', workspaceId, 'insights', insightId);
    await setDoc(docRef, insight);
    return insight;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getWorkspaceTimeline(
  userId: string,
  workspaceId: string
): Promise<TimelineEvent[]> {
  const path = `users/${userId}/workspaces/${workspaceId}/timeline`;
  try {
    const colRef = collection(db, 'users', userId, 'workspaces', workspaceId, 'timeline');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(d => d.data() as TimelineEvent);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveTimelineEvent(
  userId: string,
  workspaceId: string,
  eventData: Omit<TimelineEvent, 'eventId' | 'ownerId' | 'workspaceId'>
): Promise<TimelineEvent> {
  const eventId = generateSafeId('time');
  const path = `users/${userId}/workspaces/${workspaceId}/timeline/${eventId}`;

  const event: TimelineEvent = {
    eventId,
    workspaceId,
    ownerId: userId,
    ...eventData,
  };

  try {
    const docRef = doc(db, 'users', userId, 'workspaces', workspaceId, 'timeline', eventId);
    await setDoc(docRef, event);
    return event;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getWorkspaceQuestions(
  userId: string,
  workspaceId: string
): Promise<Question[]> {
  const path = `users/${userId}/workspaces/${workspaceId}/questions`;
  try {
    const colRef = collection(db, 'users', userId, 'workspaces', workspaceId, 'questions');
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as Question);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveQuestion(
  userId: string,
  workspaceId: string,
  queryText: string,
  documentId?: string,
  answerSummary?: string
): Promise<Question> {
  const questionId = generateSafeId('q');
  const path = `users/${userId}/workspaces/${workspaceId}/questions/${questionId}`;
  const now = new Date().toISOString();

  const question: Question = {
    questionId,
    workspaceId,
    documentId,
    ownerId: userId,
    queryText: queryText.trim(),
    answerSummary,
    status: answerSummary ? 'prepared_for_consultation' : 'draft',
    createdAt: now,
  };

  try {
    const docRef = doc(db, 'users', userId, 'workspaces', workspaceId, 'questions', questionId);
    await setDoc(docRef, question);
    return question;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getWorkspaceBriefs(
  userId: string,
  workspaceId: string
): Promise<PreparationBrief[]> {
  const path = `users/${userId}/workspaces/${workspaceId}/briefs`;
  try {
    const colRef = collection(db, 'users', userId, 'workspaces', workspaceId, 'briefs');
    const q = query(colRef, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as PreparationBrief);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function savePreparationBrief(
  userId: string,
  workspaceId: string,
  briefData: Omit<PreparationBrief, 'briefId' | 'ownerId' | 'workspaceId' | 'createdAt' | 'updatedAt'>
): Promise<PreparationBrief> {
  const briefId = generateSafeId('brief');
  const path = `users/${userId}/workspaces/${workspaceId}/briefs/${briefId}`;
  const now = new Date().toISOString();

  const brief: PreparationBrief = {
    briefId,
    workspaceId,
    ownerId: userId,
    ...briefData,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = doc(db, 'users', userId, 'workspaces', workspaceId, 'briefs', briefId);
    await setDoc(docRef, brief);
    return brief;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// ========================
// Document Structured Analyses & Clauses
// ========================

export async function saveDocumentAnalysisRecord(
  userId: string,
  workspaceId: string,
  documentId: string,
  analysisData: Record<string, unknown>
): Promise<void> {
  const path = `users/${userId}/workspaces/${workspaceId}/analyses/${documentId}`;
  const now = new Date().toISOString();

  try {
    const docRef = doc(db, 'users', userId, 'workspaces', workspaceId, 'analyses', documentId);
    await setDoc(docRef, {
      ...analysisData,
      analysisId: documentId,
      documentId,
      workspaceId,
      ownerId: userId,
      updatedAt: now,
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getDocumentAnalysisRecord(
  userId: string,
  workspaceId: string,
  documentId: string
): Promise<Record<string, unknown> | null> {
  const path = `users/${userId}/workspaces/${workspaceId}/analyses/${documentId}`;
  try {
    const docRef = doc(db, 'users', userId, 'workspaces', workspaceId, 'analyses', documentId);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as Record<string, unknown>) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

