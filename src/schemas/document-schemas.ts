import { z } from 'zod';

export const MAX_DOCUMENT_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
export const ALLOWED_MIME_TYPES = ['application/pdf'] as const;

export const DocumentUploadSchema = z.object({
  name: z.string().min(1).max(255).refine(name => name.toLowerCase().endsWith('.pdf'), {
    message: 'Only PDF files are supported',
  }),
  size: z.number().int().positive().max(MAX_DOCUMENT_FILE_SIZE_BYTES, {
    message: `File size exceeds the 25MB limit`,
  }),
  type: z.literal('application/pdf'),
});

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validatePdfFile(file: { name: string; size: number; type: string }): ValidationResult {
  if (!file) {
    return { isValid: false, error: 'No file provided.' };
  }

  // Check extension and MIME type
  const isPdfExtension = file.name.toLowerCase().endsWith('.pdf');
  const isPdfMime = file.type === 'application/pdf' || file.type === ''; // Some systems leave type empty for drag-and-drop

  if (!isPdfExtension) {
    return { isValid: false, error: 'Invalid file format. Legal Lens only supports PDF documents.' };
  }

  if (file.size <= 0) {
    return { isValid: false, error: 'The uploaded file appears to be empty (0 bytes).' };
  }

  if (file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File size (${sizeMb} MB) exceeds maximum allowed limit of 25 MB.`,
    };
  }

  return { isValid: true };
}

export function checkDuplicateFileName(existingNames: string[], candidateName: string): boolean {
  const normalizedCandidate = candidateName.trim().toLowerCase();
  return existingNames.some(name => name.trim().toLowerCase() === normalizedCandidate);
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[/\\?%*:|"<>#]/g, '_').trim();
}
