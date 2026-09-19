import { z } from 'zod';

export const RiskLevelEnum = z.enum(['low', 'moderate', 'high', 'critical']);
export const AttentionCategoryEnum = z.enum(['RED', 'AMBER', 'GREEN']);
export const InsightTypeEnum = z.enum(['risk', 'obligation', 'deadline', 'benefit', 'ambiguity']);
export const SeverityLevelEnum = z.enum(['info', 'attention', 'warning', 'critical']);
export const ImportanceLevelEnum = z.enum(['standard', 'important', 'critical']);

export const SourceReferenceSchema = z.object({
  documentId: z.string().optional(),
  documentName: z.string().optional(),
  pageNumber: z.number().int().positive().nullable().optional(),
  section: z.string().optional(),
  sourceText: z.string().optional(),
});

export type SourceReferenceType = z.infer<typeof SourceReferenceSchema>;

export const AttentionItemSchema = z.object({
  id: z.string().min(1),
  category: AttentionCategoryEnum,
  title: z.string().min(1).max(300),
  description: z.string().min(1).max(3000),
  source: SourceReferenceSchema.default({}),
  relatedClauseId: z.string().optional(),
  recommendation: z.string().max(2000).optional(),
});

export type AttentionItemType = z.infer<typeof AttentionItemSchema>;

export const ClauseSchema = z.object({
  clauseId: z.string().min(1),
  workspaceId: z.string().min(1).optional(),
  documentId: z.string().min(1).optional(),
  ownerId: z.string().min(1).optional(),
  type: z.string().optional(),
  title: z.string().min(1).max(200),
  originalText: z.string().min(1).max(10000),
  plainExplanation: z.string().min(1).max(5000),
  riskLevel: RiskLevelEnum.default('low'),
  affectedParty: z.string().optional(),
  obligations: z.array(z.string()).optional(),
  importantDetails: z.array(z.string()).optional(),
  importanceCategory: z.enum(['high', 'medium', 'low']).optional(),
  section: z.string().max(100).optional(),
  sourceReference: SourceReferenceSchema.optional(),
});

export const InsightSchema = z.object({
  insightId: z.string().min(1),
  workspaceId: z.string().min(1).optional(),
  documentId: z.string().min(1).optional(),
  ownerId: z.string().min(1).optional(),
  type: InsightTypeEnum,
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(3000),
  severity: SeverityLevelEnum,
  recommendation: z.string().max(2000).optional(),
  citation: z.string().max(500).optional(),
});

export const TimelineEventSchema = z.object({
  eventId: z.string().min(1),
  workspaceId: z.string().min(1).optional(),
  documentId: z.string().min(1).optional(),
  ownerId: z.string().min(1).optional(),
  date: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  importance: ImportanceLevelEnum,
  sourceReference: z.string().max(500).optional(),
});

export const QuestionSchema = z.object({
  questionId: z.string().min(1),
  workspaceId: z.string().min(1),
  documentId: z.string().optional(),
  ownerId: z.string().min(1),
  queryText: z.string().min(1).max(1000),
  answerSummary: z.string().max(5000).optional(),
  status: z.enum(['draft', 'answered', 'prepared_for_consultation']),
  createdAt: z.string(),
});

export const PreparationBriefSchema = z.object({
  briefId: z.string().min(1),
  workspaceId: z.string().min(1),
  ownerId: z.string().min(1),
  title: z.string().min(1).max(200),
  targetAudience: z.string().min(1).max(100),
  summary: z.string().min(1).max(5000),
  keyQuestions: z.array(z.string().max(500)).optional(),
  documentsReferenced: z.array(z.string().max(200)).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const DocumentAnalysisSchema = z.object({
  analysisId: z.string().min(1),
  workspaceId: z.string().min(1),
  documentId: z.string().min(1),
  ownerId: z.string().min(1),
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(5000),
  keyRisksCount: z.number().int().nonnegative(),
  clausesCount: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const AIAnalysisOutputSchema = z.object({
  summary: z.string(),
  documentType: z.string().optional(),
  title: z.string().optional(),
  keyTakeaways: z.array(z.string()),
  parties: z
    .array(
      z.object({
        name: z.string(),
        role: z.string(),
      })
    )
    .optional(),
  importantDates: z
    .array(
      z.object({
        date: z.string(),
        description: z.string(),
        source: z.string().optional(),
      })
    )
    .optional(),
  financialTerms: z
    .array(
      z.object({
        term: z.string(),
        amountOrRate: z.string().optional(),
        description: z.string(),
      })
    )
    .optional(),
  obligations: z
    .array(
      z.object({
        party: z.string(),
        obligation: z.string(),
        timing: z.string().optional(),
      })
    )
    .optional(),
  clauses: z.array(
    z.object({
      clauseId: z.string().optional(),
      type: z.string().optional(),
      title: z.string(),
      originalExcerpt: z.string().optional(),
      originalText: z.string().optional(),
      plainExplanation: z.string(),
      riskLevel: RiskLevelEnum.default('low'),
      affectedParty: z.string().optional(),
      obligations: z.array(z.string()).optional(),
      importantDetails: z.array(z.string()).optional(),
      importanceCategory: z.enum(['high', 'medium', 'low']).optional(),
      section: z.string().optional(),
      sourceReference: SourceReferenceSchema.optional(),
    })
  ),
  insights: z
    .array(
      z.object({
        type: InsightTypeEnum,
        title: z.string(),
        description: z.string(),
        severity: SeverityLevelEnum,
        recommendation: z.string().optional(),
        citation: z.string().optional(),
      })
    )
    .default([]),
  attentionItems: z.array(AttentionItemSchema).optional().default([]),
  timeline: z
    .array(
      z.object({
        date: z.string(),
        title: z.string(),
        description: z.string(),
        importance: ImportanceLevelEnum,
      })
    )
    .default([]),
  sourceReferences: z.array(SourceReferenceSchema).optional(),
});

export type AIAnalysisOutput = z.infer<typeof AIAnalysisOutputSchema>;

export const DocumentAnswerSchema = z.object({
  answer: z.string(),
  foundInDocument: z.boolean(),
  confidence: z.enum(['high', 'medium', 'low']).optional(),
  sourceReferences: z.array(SourceReferenceSchema).default([]),
  relatedClauses: z.array(z.string()).optional().default([]),
  limitation: z.string().optional(),
  disclaimer: z.string().optional(),
});

export type DocumentAnswerType = z.infer<typeof DocumentAnswerSchema>;
