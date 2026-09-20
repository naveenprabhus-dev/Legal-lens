import React, { useState, useRef } from 'react';
import { Send, HelpCircle, Loader2, Sparkles, BookOpen, AlertCircle, BookmarkPlus, Check } from 'lucide-react';
import { requestGroundedQuestion } from '../../services/gemini/ai-client';
import { DocumentAnswerType } from '../../schemas/ai-schemas';
import { LegalDocument } from '../../types';

interface AskDocumentDrawerProps {
  document: LegalDocument | null;
  onSaveQuestionToConsultation?: (queryText: string, answerText?: string) => Promise<void>;
}

export const AskDocumentDrawer: React.FC<AskDocumentDrawerProps> = ({
  document,
  onSaveQuestionToConsultation,
}) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<DocumentAnswerType | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Client-side Q&A cache to prevent duplicate requests
  const qaCacheRef = useRef<Map<string, DocumentAnswerType>>(new Map());

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQ = question.trim();
    if (!cleanQ) return;

    const cacheKey = `${document?.documentId || 'ws'}_${cleanQ.toLowerCase()}`;
    const cached = qaCacheRef.current.get(cacheKey);
    if (cached) {
      setResponse(cached);
      return;
    }

    setLoading(true);
    setSavedSuccess(false);
    try {
      const excerpt = document?.extractedText ? document.extractedText.slice(0, 8000) : '';
      const docContext = document
        ? `Document: ${document.fileName}. Status: ${document.analysisStatus}. Size: ${document.fileSize} bytes. Summary: ${document.summaryPreview || 'Standard commercial contract'}.${excerpt ? ` Text: ${excerpt}` : ''}`
        : 'Active legal workspace context.';

      const result = await requestGroundedQuestion(cleanQ, docContext, document?.fileName);
      qaCacheRef.current.set(cacheKey, result.data);
      setResponse(result.data);
    } catch (err) {
      console.error('Failed to answer question:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestion = async () => {
    if (!onSaveQuestionToConsultation || !question.trim()) return;
    try {
      await onSaveQuestionToConsultation(question.trim(), response?.answer);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to save question:', err);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <HelpCircle className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-slate-800">Ask Document</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">
          Evidence Grounded
        </span>
      </div>

      <p className="text-[11px] text-slate-600">
        Ask a factual question about {document ? `"${document.fileName}"` : 'your active document'}. The AI will only cite what is present in the text.
      </p>

      <form onSubmit={handleAsk} className="space-y-2">
        <div className="relative">
          <label htmlFor="ask-document-input" className="sr-only">
            Ask a question about this document
          </label>
          <input
            type="text"
            id="ask-document-input"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="e.g., What is the notice period for termination?"
            className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-300 focus:bg-white text-slate-800"
          />
          <button
            type="submit"
            id="submit-ask-document-btn"
            disabled={loading || !question.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-700 transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-400"
            aria-label="Send question"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" /> : <Send className="w-3 h-3" aria-hidden="true" />}
          </button>
        </div>
      </form>

      {/* Answer Area */}
      {loading && (
        <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2 text-slate-600" role="status" aria-live="polite">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" aria-hidden="true" />
          <span>Searching document text with Gemini...</span>
        </div>
      )}

      {response && !loading && (
        <div className="mt-3 p-3.5 rounded-xl bg-indigo-50/40 border border-indigo-100 text-xs space-y-2.5" role="region" aria-live="polite" aria-label="Question answer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-900">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
              <span>Grounded Findings</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                response.foundInDocument
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-900 border border-amber-200'
              }`}
            >
              {response.foundInDocument ? 'Found in Document' : 'Not in Document'}
            </span>
          </div>

          <p className="text-slate-800 leading-relaxed text-[11px]">{response.answer}</p>

          {/* Source References */}
          {response.sourceReferences && response.sourceReferences.length > 0 && (
            <div className="pt-2 border-t border-indigo-100/60 space-y-1.5">
              <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block">
                Evidence Sources
              </span>
              {response.sourceReferences.map((ref, i) => (
                <div
                  key={i}
                  className="p-2 rounded-lg bg-white border border-indigo-100 text-[10px] text-slate-700 space-y-1 shadow-2xs"
                >
                  <div className="flex items-center gap-1.5 font-medium text-indigo-950">
                    <BookOpen className="w-3 h-3 text-indigo-600" aria-hidden="true" />
                    <span>
                      {ref.pageNumber ? `Page ${ref.pageNumber} · ` : ''}
                      {ref.section || ref.documentName || 'Document Section'}
                    </span>
                  </div>
                  {ref.sourceText && (
                    <blockquote className="italic border-l-2 border-indigo-200 pl-2 text-slate-600 text-[10px] font-serif">
                      "{ref.sourceText}"
                    </blockquote>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Related Clauses */}
          {response.relatedClauses && response.relatedClauses.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {response.relatedClauses.map((rc, idx) => (
                <span
                  key={idx}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono"
                >
                  #{rc}
                </span>
              ))}
            </div>
          )}

          {/* Limitation Note */}
          {response.limitation && (
            <div className="text-[10px] text-slate-600 flex items-start gap-1 pt-1">
              <AlertCircle className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{response.limitation}</span>
            </div>
          )}

          {/* Save to Attorney Consultation Questions */}
          {onSaveQuestionToConsultation && (
            <div className="pt-2 border-t border-indigo-100/50 flex justify-end">
              <button
                id="save-question-to-brief-btn"
                onClick={handleSaveQuestion}
                disabled={savedSuccess}
                className="inline-flex items-center gap-1 text-[11px] text-indigo-700 hover:text-indigo-900 font-medium py-1 px-2.5 rounded-lg hover:bg-indigo-100/50 transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-300"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                    <span className="text-emerald-700">Added to consultation list</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="w-3 h-3" aria-hidden="true" />
                    <span>Save to attorney consultation questions</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
