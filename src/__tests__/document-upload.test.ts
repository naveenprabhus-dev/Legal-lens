import { describe, it, expect } from 'vitest';
import {
  validatePdfFile,
  checkDuplicateFileName,
  sanitizeFileName,
  MAX_DOCUMENT_FILE_SIZE_BYTES,
} from '../schemas/document-schemas';

describe('Document Upload Validation', () => {
  it('should accept valid PDF file metadata', () => {
    const mockFile = {
      name: 'Commercial_Agreement_2025.pdf',
      size: 1024 * 1024 * 5, // 5 MB
      type: 'application/pdf',
    } as File;

    const result = validatePdfFile(mockFile);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should reject non-PDF file extension', () => {
    const mockFile = {
      name: 'invoice.docx',
      size: 1024 * 500,
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    } as File;

    const result = validatePdfFile(mockFile);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Legal Lens only supports PDF documents');
  });

  it('should reject files exceeding 25MB', () => {
    const mockFile = {
      name: 'oversized_archive.pdf',
      size: MAX_DOCUMENT_FILE_SIZE_BYTES + 1024,
      type: 'application/pdf',
    } as File;

    const result = validatePdfFile(mockFile);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('exceeds maximum allowed limit of 25 MB');
  });

  it('should detect duplicate file names in the workspace', () => {
    const existing = ['NDA_Alpha.pdf', 'Master_Services_Agreement.pdf'];
    expect(checkDuplicateFileName(existing, 'nda_alpha.pdf')).toBe(true);
    expect(checkDuplicateFileName(existing, 'Commercial_Lease.pdf')).toBe(false);
  });

  it('should sanitize unsafe characters from file names', () => {
    const raw = 'My/Unsafe:Lease#Doc*2025.pdf';
    const clean = sanitizeFileName(raw);
    expect(clean).toBe('My_Unsafe_Lease_Doc_2025.pdf');
  });
});
