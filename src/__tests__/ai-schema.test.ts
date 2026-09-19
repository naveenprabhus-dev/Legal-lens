import { describe, it, expect } from 'vitest';
import { AIAnalysisOutputSchema } from '../schemas/ai-schemas';

describe('AI Structured Response Parsing & Validation', () => {
  it('should successfully validate well-formed AI analysis output', () => {
    const validData = {
      summary: 'A standard non-disclosure agreement protecting intellectual property.',
      keyTakeaways: [
        'Establishes a 3-year confidentiality term.',
        'Requires certified destruction upon termination.',
      ],
      clauses: [
        {
          title: 'Confidentiality Term',
          originalExcerpt: 'The confidentiality obligations herein shall endure for three (3) years.',
          plainExplanation: 'You must maintain secrecy of covered materials for 3 years from receipt.',
          riskLevel: 'moderate',
          section: 'Section 4',
        },
      ],
      insights: [
        {
          type: 'obligation',
          title: 'Return of Materials',
          description: 'Within 14 days of termination, all tangible records must be returned or certified destroyed.',
          severity: 'info',
          recommendation: 'Establish an internal record disposal protocol.',
        },
      ],
      timeline: [
        {
          date: '2025-12-31',
          title: 'Initial Agreement Expiration',
          description: 'Term concludes unless renewed in writing.',
          importance: 'important',
        },
      ],
    };

    const parsed = AIAnalysisOutputSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.clauses.length).toBe(1);
      expect(parsed.data.clauses[0].riskLevel).toBe('moderate');
      expect(parsed.data.keyTakeaways.length).toBe(2);
    }
  });

  it('should reject invalid risk levels', () => {
    const invalidData = {
      summary: 'Short summary',
      keyTakeaways: ['Note 1'],
      clauses: [
        {
          title: 'Term',
          originalExcerpt: 'Text',
          plainExplanation: 'Explanation',
          riskLevel: 'extreme_danger', // invalid enum
        },
      ],
      insights: [],
      timeline: [],
    };

    const parsed = AIAnalysisOutputSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });
});
