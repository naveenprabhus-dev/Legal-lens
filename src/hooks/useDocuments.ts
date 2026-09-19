import { useState, useEffect } from 'react';
import {
  LegalDocument,
  Clause,
  Insight,
  TimelineEvent,
  AttentionItem,
  DocumentAnalysisRecord,
  ProcessingLifecycleStage,
} from '../types';
import {
  subscribeWorkspaceDocuments,
  createDocumentRecord,
  deleteDocumentRecord,
  updateDocumentStatus,
  saveInsight,
  saveTimelineEvent,
  getWorkspaceInsights,
  getWorkspaceTimeline,
  saveDocumentAnalysisRecord,
  getDocumentAnalysisRecord,
} from '../services/firebase/firestore';
import { uploadDocumentFile } from '../services/firebase/storage';
import { validatePdfFile, checkDuplicateFileName } from '../schemas/document-schemas';
import { requestDocumentAnalysis } from '../services/gemini/ai-client';

export function useDocuments(userId: string | undefined, workspaceId: string | undefined) {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lifecycleStage, setLifecycleStage] = useState<ProcessingLifecycleStage>('IDLE');

  // Analysis state for active document
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [analysisRecord, setAnalysisRecord] = useState<DocumentAnalysisRecord | null>(null);

  useEffect(() => {
    if (!userId || !workspaceId) {
      setDocuments([]);
      setActiveDocumentId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeWorkspaceDocuments(userId, workspaceId, docs => {
      setDocuments(docs);
      setLoading(false);

      if (docs.length > 0) {
        setActiveDocumentId(prev => {
          if (!prev || !docs.some(d => d.documentId === prev)) {
            return docs[0].documentId;
          }
          return prev;
        });
      } else {
        setActiveDocumentId(null);
      }
    });

    return () => unsubscribe();
  }, [userId, workspaceId]);

  // Load analysis record, insights, and timeline when active document changes
  useEffect(() => {
    if (!userId || !workspaceId) return;

    let isMounted = true;
    const fetchAuxiliaryData = async () => {
      try {
        if (activeDocumentId) {
          // Fetch persisted document analysis record
          const savedRecord = await getDocumentAnalysisRecord(userId, workspaceId, activeDocumentId);
          if (isMounted && savedRecord) {
            const rec = savedRecord as unknown as DocumentAnalysisRecord;
            setAnalysisRecord(rec);
            if (rec.clauses && rec.clauses.length > 0) {
              setClauses(rec.clauses);
            }
            if (rec.attentionItems && rec.attentionItems.length > 0) {
              setAttentionItems(rec.attentionItems);
            }
          } else if (isMounted) {
            setAnalysisRecord(null);
          }
        }

        const [loadedInsights, loadedTimeline] = await Promise.all([
          getWorkspaceInsights(userId, workspaceId, activeDocumentId || undefined),
          getWorkspaceTimeline(userId, workspaceId),
        ]);
        if (isMounted) {
          setInsights(loadedInsights || []);
          setTimeline(loadedTimeline || []);
        }
      } catch (err) {
        console.warn('Could not fetch auxiliary workspace data:', err);
      }
    };

    fetchAuxiliaryData();
    return () => {
      isMounted = false;
    };
  }, [userId, workspaceId, activeDocumentId]);

  const uploadDocument = async (file: File): Promise<LegalDocument | null> => {
    setUploadError(null);
    if (!userId || !workspaceId) {
      setUploadError('Active workspace is required for upload.');
      return null;
    }

    setLifecycleStage('VALIDATING');
    // 1. Validate file format and size
    const validation = validatePdfFile(file);
    if (!validation.isValid) {
      setUploadError(validation.error || 'Invalid PDF file.');
      setLifecycleStage('PROCESSING_FAILED');
      return null;
    }

    // 2. Check duplicate filename in this workspace
    const existingFileNames = documents.map(d => d.fileName);
    if (checkDuplicateFileName(existingFileNames, file.name)) {
      setUploadError(`A document named "${file.name}" already exists in this workspace.`);
      setLifecycleStage('PROCESSING_FAILED');
      return null;
    }

    setUploading(true);
    setLifecycleStage('UPLOADING');
    setUploadProgress(15);

    try {
      // 3. Upload file to Storage
      const tempDocId = `doc_${Date.now()}`;
      const { storagePath, downloadUrl } = await uploadDocumentFile(
        userId,
        workspaceId,
        tempDocId,
        file,
        progress => setUploadProgress(progress)
      );

      setLifecycleStage('PROCESSING');
      // 4. Create metadata document in Firestore
      const newDoc = await createDocumentRecord(userId, workspaceId, {
        fileName: file.name,
        fileSize: file.size,
        fileType: 'application/pdf',
        storageReference: storagePath,
      });

      if (downloadUrl) {
        newDoc.downloadUrl = downloadUrl;
      }

      setActiveDocumentId(newDoc.documentId);
      setUploadProgress(100);

      // 5. Automatically trigger initial structural analysis pipeline
      await triggerDocumentAnalysis(newDoc);

      setLifecycleStage('READY');
      return newDoc;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload document.';
      setUploadError(msg);
      setLifecycleStage('PROCESSING_FAILED');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const triggerDocumentAnalysis = async (doc: LegalDocument) => {
    if (!userId || !workspaceId) return;
    setAnalyzing(true);
    setLifecycleStage('ANALYZING');
    try {
      await updateDocumentStatus(userId, workspaceId, doc.documentId, {
        analysisStatus: 'analyzing',
      });

      // Send to server-side AI endpoint
      const aiResult = await requestDocumentAnalysis(doc.fileName);
      setLifecycleStage('VALIDATING_RESULTS');
      const data = aiResult.data;

      // Transform clauses to our internal Clause interface
      const normalizedClauses: Clause[] = data.clauses.map((c, idx) => ({
        clauseId: c.clauseId || `clause_${idx + 1}`,
        workspaceId,
        documentId: doc.documentId,
        ownerId: userId,
        type: c.type || 'general',
        title: c.title,
        originalText: c.originalText || c.originalExcerpt || '',
        plainExplanation: c.plainExplanation,
        riskLevel: c.riskLevel || 'low',
        affectedParty: c.affectedParty,
        obligations: c.obligations,
        importantDetails: c.importantDetails,
        importanceCategory: c.importanceCategory || 'medium',
        section: c.section,
        sourceReference: c.sourceReference || {
          documentName: doc.fileName,
          pageNumber: 1,
          section: c.section,
          sourceText: c.originalText || c.originalExcerpt || '',
        },
      }));

      // Transform attention items
      const normalizedAttention: AttentionItem[] = (data.attentionItems || []).map((att, idx) => ({
        id: att.id || `att_${idx + 1}`,
        category: att.category || 'AMBER',
        title: att.title,
        description: att.description,
        source: att.source || {
          documentName: doc.fileName,
          pageNumber: 1,
          section: 'Identified Section',
        },
        relatedClauseId: att.relatedClauseId,
        recommendation: att.recommendation,
      }));

      // Persist full structured document analysis record
      const fullAnalysisRecord: DocumentAnalysisRecord = {
        analysisId: doc.documentId,
        workspaceId,
        documentId: doc.documentId,
        ownerId: userId,
        documentType: data.documentType,
        title: data.title || doc.fileName,
        summary: data.summary,
        parties: data.parties,
        importantDates: data.importantDates,
        financialTerms: data.financialTerms,
        obligations: data.obligations,
        keyTakeaways: data.keyTakeaways,
        clauses: normalizedClauses,
        attentionItems: normalizedAttention,
        timeline: data.timeline.map((t, idx) => ({
          eventId: `time_${idx + 1}`,
          workspaceId,
          documentId: doc.documentId,
          ownerId: userId,
          date: t.date,
          title: t.title,
          description: t.description,
          importance: t.importance,
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveDocumentAnalysisRecord(
        userId,
        workspaceId,
        doc.documentId,
        fullAnalysisRecord as unknown as Record<string, unknown>
      );

      // Persist individual insights for workspace query capability
      for (const ins of data.insights) {
        await saveInsight(userId, workspaceId, {
          documentId: doc.documentId,
          type: ins.type,
          title: ins.title,
          description: ins.description,
          severity: ins.severity,
          recommendation: ins.recommendation,
        });
      }

      // Persist individual timeline events
      for (const tm of data.timeline) {
        await saveTimelineEvent(userId, workspaceId, {
          documentId: doc.documentId,
          date: tm.date,
          title: tm.title,
          description: tm.description,
          importance: tm.importance,
        });
      }

      // Update document record status in Firestore
      await updateDocumentStatus(userId, workspaceId, doc.documentId, {
        analysisStatus: 'completed',
        summaryPreview: data.summary,
      });

      // Update state
      setAnalysisRecord(fullAnalysisRecord);
      setClauses(normalizedClauses);
      setAttentionItems(normalizedAttention);

      const [newInsights, newTimeline] = await Promise.all([
        getWorkspaceInsights(userId, workspaceId, doc.documentId),
        getWorkspaceTimeline(userId, workspaceId),
      ]);
      setInsights(newInsights);
      setTimeline(newTimeline);
      setLifecycleStage('READY');
    } catch (error) {
      console.error('Error during document analysis:', error);
      await updateDocumentStatus(userId, workspaceId, doc.documentId, {
        analysisStatus: 'failed',
      });
      setLifecycleStage('PROCESSING_FAILED');
    } finally {
      setAnalyzing(false);
    }
  };

  const removeDocument = async (documentId: string) => {
    if (!userId || !workspaceId) return;
    await deleteDocumentRecord(userId, workspaceId, documentId);
  };

  const activeDocument = documents.find(d => d.documentId === activeDocumentId) || null;

  return {
    documents,
    activeDocument,
    activeDocumentId,
    setActiveDocumentId,
    loading,
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
  };
}
