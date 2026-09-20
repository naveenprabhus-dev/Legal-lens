import { useState, useEffect, useRef } from 'react';
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
  saveInsightsBatch,
  saveTimelineEventsBatch,
  getWorkspaceInsights,
  getWorkspaceTimeline,
  saveDocumentAnalysisRecord,
  getDocumentAnalysisRecord,
} from '../services/firebase/firestore';
import { uploadDocumentFile } from '../services/firebase/storage';
import { validatePdfFile, checkDuplicateFileName } from '../schemas/document-schemas';
import { requestDocumentAnalysis } from '../services/gemini/ai-client';
import { extractTextFromDocument } from '../utils/textExtractor';

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

  // In-flight deduplication & client-side caching refs
  const analyzingDocIdsRef = useRef<Set<string>>(new Set());
  const docAnalysisCacheRef = useRef<Map<string, DocumentAnalysisRecord>>(new Map());

  useEffect(() => {
    // Reset caches when workspace or user changes
    docAnalysisCacheRef.current.clear();
    analyzingDocIdsRef.current.clear();

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
          // Check in-memory cache first to avoid unnecessary Firestore read
          const cachedRec = docAnalysisCacheRef.current.get(activeDocumentId);
          if (cachedRec) {
            if (isMounted) {
              setAnalysisRecord(cachedRec);
              setClauses(cachedRec.clauses || []);
              setAttentionItems(cachedRec.attentionItems || []);
              if (cachedRec.timeline && cachedRec.timeline.length > 0) {
                setTimeline(cachedRec.timeline);
              }
            }
          } else {
            // Fetch persisted document analysis record from Firestore
            const savedRecord = await getDocumentAnalysisRecord(userId, workspaceId, activeDocumentId);
            if (isMounted && savedRecord) {
              const rec = savedRecord as unknown as DocumentAnalysisRecord;
              docAnalysisCacheRef.current.set(activeDocumentId, rec);
              setAnalysisRecord(rec);
              if (rec.clauses && rec.clauses.length > 0) {
                setClauses(rec.clauses);
              }
              if (rec.attentionItems && rec.attentionItems.length > 0) {
                setAttentionItems(rec.attentionItems);
              }
              if (rec.timeline && rec.timeline.length > 0) {
                setTimeline(rec.timeline);
              }
            } else if (isMounted) {
              setAnalysisRecord(null);
            }
          }
        }

        const [loadedInsights, loadedTimeline] = await Promise.all([
          getWorkspaceInsights(userId, workspaceId, activeDocumentId || undefined),
          getWorkspaceTimeline(userId, workspaceId),
        ]);
        if (isMounted) {
          setInsights(loadedInsights || []);
          if (loadedTimeline && loadedTimeline.length > 0) {
            setTimeline(loadedTimeline);
          }
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
      // 4. Extract text from uploaded document for genuine factual grounding
      const extractedContent = await extractTextFromDocument(file);

      // 5. Create metadata document in Firestore
      const newDoc = await createDocumentRecord(userId, workspaceId, {
        fileName: file.name,
        fileSize: file.size,
        fileType: 'application/pdf',
        storageReference: storagePath,
      });

      if (downloadUrl) {
        newDoc.downloadUrl = downloadUrl;
      }
      if (extractedContent) {
        newDoc.extractedText = extractedContent;
        await updateDocumentStatus(userId, workspaceId, newDoc.documentId, {
          extractedText: extractedContent,
        });
      }

      setActiveDocumentId(newDoc.documentId);
      setUploadProgress(100);

      // 6. Automatically trigger initial structural analysis pipeline with real text
      await triggerDocumentAnalysis(newDoc, extractedContent, { force: true });

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

  const triggerDocumentAnalysis = async (
    doc: LegalDocument,
    documentText?: string,
    options?: { force?: boolean }
  ) => {
    if (!userId || !workspaceId) return;

    // Priority 3: Prevent duplicate in-flight processing for the same document
    if (analyzingDocIdsRef.current.has(doc.documentId)) {
      return;
    }

    // Priority 2: Reuse cached analysis if already completed and not forced
    if (!options?.force && doc.analysisStatus === 'completed') {
      const cached = docAnalysisCacheRef.current.get(doc.documentId);
      if (cached) {
        setAnalysisRecord(cached);
        setClauses(cached.clauses || []);
        setAttentionItems(cached.attentionItems || []);
        if (cached.timeline && cached.timeline.length > 0) {
          setTimeline(cached.timeline);
        }
        setLifecycleStage('READY');
        return;
      }

      // Check Firestore saved record before making any Gemini call
      const saved = await getDocumentAnalysisRecord(userId, workspaceId, doc.documentId);
      if (saved) {
        const savedRec = saved as unknown as DocumentAnalysisRecord;
        docAnalysisCacheRef.current.set(doc.documentId, savedRec);
        setAnalysisRecord(savedRec);
        setClauses(savedRec.clauses || []);
        setAttentionItems(savedRec.attentionItems || []);
        if (savedRec.timeline && savedRec.timeline.length > 0) {
          setTimeline(savedRec.timeline);
        }
        setLifecycleStage('READY');
        return;
      }
    }

    analyzingDocIdsRef.current.add(doc.documentId);
    setAnalyzing(true);
    setLifecycleStage('ANALYZING');

    try {
      await updateDocumentStatus(userId, workspaceId, doc.documentId, {
        analysisStatus: 'analyzing',
      });

      // Send to server-side AI endpoint with actual text content for grounding
      const textToAnalyze = documentText || doc.extractedText || undefined;
      const aiResult = await requestDocumentAnalysis(doc.fileName, textToAnalyze);
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

      const normalizedTimeline: TimelineEvent[] = data.timeline.map((t, idx) => ({
        eventId: `time_${idx + 1}`,
        workspaceId,
        documentId: doc.documentId,
        ownerId: userId,
        date: t.date,
        title: t.title,
        description: t.description,
        importance: t.importance,
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
        timeline: normalizedTimeline,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Priority 4: Batch write operations in parallel instead of sequential loops
      const insightsToSave = data.insights.map(ins => ({
        documentId: doc.documentId,
        type: ins.type,
        title: ins.title,
        description: ins.description,
        severity: ins.severity,
        recommendation: ins.recommendation,
      }));

      const timelineToSave = data.timeline.map(tm => ({
        documentId: doc.documentId,
        date: tm.date,
        title: tm.title,
        description: tm.description,
        importance: tm.importance,
      }));

      const [savedInsights, savedTimeline] = await Promise.all([
        saveInsightsBatch(userId, workspaceId, insightsToSave),
        saveTimelineEventsBatch(userId, workspaceId, timelineToSave),
        saveDocumentAnalysisRecord(
          userId,
          workspaceId,
          doc.documentId,
          fullAnalysisRecord as unknown as Record<string, unknown>
        ),
        updateDocumentStatus(userId, workspaceId, doc.documentId, {
          analysisStatus: 'completed',
          summaryPreview: data.summary,
        }),
      ]);

      // Cache locally to prevent future redundant reads
      docAnalysisCacheRef.current.set(doc.documentId, fullAnalysisRecord);

      // Priority 7: Update React state immediately using in-memory data, avoiding redundant Firestore read roundtrips
      setAnalysisRecord(fullAnalysisRecord);
      setClauses(normalizedClauses);
      setAttentionItems(normalizedAttention);
      if (savedInsights && savedInsights.length > 0) {
        setInsights(savedInsights);
      }
      if (savedTimeline && savedTimeline.length > 0) {
        setTimeline(savedTimeline);
      } else {
        setTimeline(normalizedTimeline);
      }

      setLifecycleStage('READY');
    } catch (error) {
      console.error('Error during document analysis:', error);
      await updateDocumentStatus(userId, workspaceId, doc.documentId, {
        analysisStatus: 'failed',
      });
      setLifecycleStage('PROCESSING_FAILED');
    } finally {
      analyzingDocIdsRef.current.delete(doc.documentId);
      setAnalyzing(false);
    }
  };

  const removeDocument = async (documentId: string) => {
    if (!userId || !workspaceId) return;
    docAnalysisCacheRef.current.delete(documentId);
    analyzingDocIdsRef.current.delete(documentId);
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
