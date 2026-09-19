import { AIAnalysisOutput, DocumentAnswerType } from '../../schemas/ai-schemas';

export async function requestDocumentAnalysis(
  fileName: string,
  documentExcerpt?: string,
  analysisScope: 'full' | 'clauses' | 'risks' = 'full'
): Promise<{ success: boolean; data: AIAnalysisOutput; geminiConfigured: boolean }> {
  const response = await fetch('/api/ai/analyze-structure', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName,
      documentExcerpt,
      analysisScope,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errData.error || `Analysis request failed with status ${response.status}`);
  }

  return response.json();
}

export async function requestGroundedQuestion(
  question: string,
  documentContext: string,
  documentTitle?: string
): Promise<{ success: boolean; data: DocumentAnswerType; geminiConfigured: boolean }> {
  const response = await fetch('/api/ai/ask-document', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question,
      documentContext,
      documentTitle,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errData.error || `Question request failed with status ${response.status}`);
  }

  return response.json();
}

export async function checkAiServiceHealth(): Promise<{
  status: string;
  geminiConfigured: boolean;
}> {
  try {
    const response = await fetch('/api/health');
    if (!response.ok) return { status: 'down', geminiConfigured: false };
    return await response.json();
  } catch {
    return { status: 'offline', geminiConfigured: false };
  }
}
