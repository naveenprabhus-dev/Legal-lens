import React from 'react';
import { Scale, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { TRUST_NOTE } from '../../config/constants';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginWithGoogle: () => Promise<unknown>;
  isSigningIn: boolean;
  error: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginWithGoogle,
  isSigningIn,
  error,
}) => {
  const modalRef = useFocusTrap<HTMLDivElement>({
    isOpen,
    onClose: isSigningIn ? undefined : onClose,
    initialFocusSelector: '#google-signin-btn',
  });

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-8 relative"
      >
        <button
          id="close-auth-modal-btn"
          onClick={onClose}
          disabled={isSigningIn}
          className="absolute top-4 right-4 text-slate-600 hover:text-slate-800 p-1.5 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-300"
          aria-label="Close authentication dialog"
        >
          ✕
        </button>

        <div className="text-center">
          {/* Logo */}
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-4" aria-hidden="true">
            <Scale className="w-6 h-6" />
          </div>

          <h2 id="auth-modal-title" className="font-serif text-2xl font-bold text-slate-900">
            Welcome to Legal Lens
          </h2>
          <p className="text-sm text-slate-600 mt-1 font-medium tracking-wide">
            Understand. Compare. Prepare.
          </p>

          <p className="text-xs text-slate-600 mt-4 leading-relaxed">
            Sign in to enter your private legal workspace. All documents and analysis remain strictly
            bound to your authenticated account.
          </p>

          {/* Error notice */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2 text-left"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-in Button */}
          <div className="mt-6">
            <button
              id="google-signin-btn"
              onClick={onLoginWithGoogle}
              disabled={isSigningIn}
              className="w-full py-3 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 font-medium text-sm shadow-2xs transition-all flex items-center justify-center gap-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" aria-hidden="true" />
                  <span>Connecting with Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </div>

          {/* Trust Note */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-600">
            <Lock className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
            <span>{TRUST_NOTE}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
