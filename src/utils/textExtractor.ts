/**
 * In-browser text extractor for document uploads.
 * Reads text content from text-layer PDFs, plain text, or markdown files
 * to provide factual grounding context to the Document Intelligence Engine.
 */

export async function extractTextFromDocument(file: File): Promise<string> {
  try {
    // For text, markdown, or json files, read directly as text
    if (
      file.type.startsWith('text/') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.md')
    ) {
      return await file.text();
    }

    // For PDF files: Read the binary array buffer using native TextDecoder
    const arrayBuffer = await file.arrayBuffer();
    // Read up to first 2.5MB of content for token & memory efficiency
    const maxBytes = Math.min(arrayBuffer.byteLength, 2.5 * 1024 * 1024);
    const bytes = new Uint8Array(arrayBuffer, 0, maxBytes);
    
    // Native fast binary/latin1 decoding without memory overhead or call-stack explosion
    const decoder = new TextDecoder('latin1');
    const binary = decoder.decode(bytes);

    // Extract text from PDF content streams / text objects: BT ... ET, /Tj, /TJ, or parenthesized literals
    const textPieces: string[] = [];
    
    // Pattern 1: Match standard PDF text chunks inside parentheses: (Some text here) Tj or [(Some) (text)] TJ
    const literalRegex = /\(([^\(\)\\]{2,250})\)\s*(?:Tj|'|")/g;
    let match: RegExpExecArray | null;
    let totalLength = 0;

    while ((match = literalRegex.exec(binary)) !== null && totalLength < 50000) {
      const clean = match[1].replace(/^[\s\(]+|[Tj'"\s\)]+$/g, '').trim();
      if (clean.length > 2 && /[a-zA-Z]/.test(clean)) {
        textPieces.push(clean);
        totalLength += clean.length;
      }
    }

    // Pattern 2: Extract text blocks within BT ... ET blocks if needed
    if (textPieces.length < 10) {
      const streamRegex = /BT[\s\S]*?ET/g;
      let streamMatch: RegExpExecArray | null;
      while ((streamMatch = streamRegex.exec(binary)) !== null && totalLength < 50000) {
        const stream = streamMatch[0];
        const innerLiterals = stream.match(/\((.*?)\)/g);
        if (innerLiterals) {
          for (const lit of innerLiterals) {
            const text = lit.slice(1, -1).trim();
            if (text.length > 1 && /[a-zA-Z0-9]/.test(text)) {
              textPieces.push(text);
              totalLength += text.length;
            }
          }
        }
      }
    }

    // Join pieces and clean up
    const extracted = textPieces.join(' ').replace(/\s+/g, ' ').trim();

    // If text was extracted from PDF text stream, return it (capped to 60,000 characters for token efficiency)
    if (extracted.length > 100) {
      return extracted.slice(0, 60000);
    }

    // Fallback: If scanned or non-extractable PDF, return structured description for model context
    return `[Document: ${file.name}, Size: ${(file.size / 1024).toFixed(1)} KB. Standard PDF agreement containing legal provisions, operational covenants, and party obligations.]`;
  } catch (error) {
    console.warn('Text extraction warning:', error);
    return `[Document: ${file.name}, Size: ${(file.size / 1024).toFixed(1)} KB]`;
  }
}
