import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { MAX_DOCUMENT_FILE_SIZE_BYTES } from '../../schemas/document-schemas';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<unknown>;
  uploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  uploading,
  uploadProgress,
  uploadError,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const modalRef = useFocusTrap<HTMLDivElement>({
    isOpen,
    onClose: uploading ? undefined : onClose,
    initialFocusSelector: '#upload-dropzone',
  });

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setLocalError(null);
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setLocalError('Only PDF documents are supported at this stage.');
      return;
    }

    if (file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
      setLocalError('File size exceeds the 25 MB limit.');
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    try {
      const result = await onUpload(selectedFile);
      if (result) {
        setSelectedFile(null);
        onClose();
      }
    } catch {
      // error handled in hook
    }
  };

  const handleDropzoneKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const displayError = localError || uploadError;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl p-6"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 id="upload-modal-title" className="font-serif text-lg font-medium text-slate-900">
            Upload Legal Document
          </h3>
          <button
            id="close-upload-modal-btn"
            onClick={onClose}
            disabled={uploading}
            className="text-slate-600 hover:text-slate-800 p-1.5 rounded-md focus:outline-hidden focus:ring-2 focus:ring-indigo-300"
            aria-label="Close upload dialog"
          >
            ✕
          </button>
        </div>

        {/* Drag and Drop Zone */}
        <div
          id="upload-dropzone"
          role="button"
          tabIndex={0}
          aria-label={
            selectedFile
              ? `Selected file: ${selectedFile.name}. Press Enter or Space to replace file.`
              : 'PDF upload area. Press Enter or Space to browse and select a PDF file from your computer.'
          }
          onKeyDown={handleDropzoneKeyDown}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-400 ${
            dragOver
              ? 'border-indigo-500 bg-indigo-50/50'
              : selectedFile
              ? 'border-emerald-300 bg-emerald-50/30'
              : 'border-slate-300 hover:border-indigo-300 bg-slate-50/50'
          }`}
        >
          <label htmlFor="pdf-upload-input" className="sr-only">
            Upload PDF Document
          </label>
          <input
            id="pdf-upload-input"
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,application/pdf"
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center">
            {selectedFile ? (
              <>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3" aria-hidden="true">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="text-xs font-semibold text-slate-800">{selectedFile.name}</div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Ready to ingest
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3" aria-hidden="true">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-xs font-medium text-slate-700">
                  Drag and drop your PDF here, or <span className="text-indigo-600 underline font-semibold">browse files</span>
                </p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Supported format: PDF up to 25 MB
                </p>
              </>
            )}
          </div>
        </div>

        {/* Error message */}
        {displayError && (
          <div
            role="alert"
            aria-live="assertive"
            className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{displayError}</span>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="mt-4" role="status" aria-live="polite">
            <div className="flex items-center justify-between text-xs text-slate-700 mb-1">
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" aria-hidden="true" />
                <span>Ingesting document & generating structural index...</span>
              </span>
              <span className="font-mono font-medium">{uploadProgress}%</span>
            </div>
            <div
              className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={uploadProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Upload and indexing progress"
            >
              <div
                className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end gap-2">
          <button
            type="button"
            id="cancel-upload-btn"
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-300"
          >
            Cancel
          </button>
          <button
            type="button"
            id="confirm-upload-btn"
            onClick={handleSubmit}
            disabled={!selectedFile || uploading}
            className="px-5 py-2 text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs disabled:opacity-50 flex items-center gap-1.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-400"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Start Ingestion</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
