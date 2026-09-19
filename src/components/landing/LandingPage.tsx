import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  Search,
  Calendar,
  HelpCircle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  ChevronRight,
  Scale,
} from 'lucide-react';
import {
  APP_HEADLINE,
  APP_SUBHEADLINE,
  APP_TAGLINE,
  LEGAL_DISCLAIMER,
  TRUST_NOTE,
} from '../../config/constants';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [showDemoModal, setShowDemoModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#faf9f6] text-slate-900 flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Bar */}
      <header className="border-b border-slate-200/70 bg-[#faf9f6]/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-700 shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-slate-900">
                Legal Lens
              </span>
              <span className="hidden sm:inline-block ml-3 text-xs uppercase tracking-widest text-slate-600 font-medium">
                Workspace
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              id="header-how-it-works-btn"
              onClick={() => setShowDemoModal(true)}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-300 rounded-lg"
            >
              See how it works
            </button>
            <button
              id="header-get-started-btn"
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-xs hover:shadow-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
            >
              Get started
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 text-center">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50/80 border border-indigo-200/60 text-indigo-800 text-xs font-medium mb-8">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>{APP_TAGLINE}</span>
          </div>

          {/* Primary Headline */}
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
            {APP_HEADLINE}
          </h1>

          {/* Supporting Headline */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            {APP_SUBHEADLINE}
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="hero-primary-cta"
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-base shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
            >
              Get started
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              id="hero-secondary-cta"
              onClick={() => setShowDemoModal(true)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-medium text-base border border-slate-300 shadow-2xs transition-all flex items-center justify-center gap-2 focus:outline-hidden focus:ring-2 focus:ring-slate-300"
            >
              See how it works
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-600">
            <Lock className="w-3.5 h-3.5 text-slate-600" />
            <span>{TRUST_NOTE}</span>
          </div>

          {/* Interactive Transformation Graphic */}
          <div className="mt-16 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 text-left">
              <div className="flex flex-col md:flex-row gap-6 items-stretch">
                {/* Left: Dense Legal Document Card */}
                <div className="flex-1 p-6 rounded-xl bg-slate-50/70 border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono uppercase text-slate-600 tracking-wider">
                      Original Legal Text
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                      Standard Commercial Agreement
                    </span>
                  </div>
                  <div className="font-serif text-sm text-slate-700 leading-relaxed space-y-3">
                    <p className="border-l-2 border-slate-300 pl-3 italic text-xs text-slate-600">
                      "Notwithstanding anything herein to the contrary, either Party may terminate
                      this Agreement without cause upon providing thirty (30) calendar days prior
                      written notice..."
                    </p>
                    <p className="border-l-2 border-slate-300 pl-3 italic text-xs text-slate-600">
                      "In no event shall either party's aggregate monetary liability exceed the
                      aggregate fees paid under this statement of work in the twelve (12) months
                      immediately preceding the claim..."
                    </p>
                  </div>
                </div>

                {/* Arrow Bridge */}
                <div className="hidden md:flex items-center justify-center px-2 text-indigo-400">
                  <ChevronRight className="w-8 h-8" />
                </div>

                {/* Right: Structured Legal Lens Output */}
                <div className="flex-1 p-6 rounded-xl bg-indigo-50/40 border border-indigo-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono uppercase text-indigo-700 font-semibold tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Structured Lens Insights
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                        Plain English
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-800">
                            Early Termination Right
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            30-Day Notice
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-normal">
                          Either side can exit anytime without penalty, provided written notice is
                          delivered 30 days prior.
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-800">
                            Liability Ceiling
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            12-Month Cap
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-normal">
                          Damages are strictly limited to the amount paid during the prior year.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-indigo-100 flex items-center justify-between text-xs text-indigo-900 font-medium">
                    <span>Evidence-grounded citations attached</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Pillars Section */}
        <section className="border-t border-slate-200 bg-white py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs uppercase tracking-widest text-indigo-600 font-semibold">
                Built For Clarity
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-slate-900 mt-2">
                Understand. Compare. Prepare. Navigate.
              </h2>
              <p className="text-slate-600 text-sm mt-3">
                Transform intimidating legal jargon into actionable clarity, organized timelines,
                and precise questions for your attorney.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Pillar 1 */}
              <div className="p-8 rounded-2xl bg-[#faf9f6] border border-slate-200 hover:border-slate-300 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl text-slate-900 font-medium mb-3">
                  Understand Complex Terms
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Extract clauses into readable explanations. Spot hidden risks, liability
                  limitations, and unilateral commitments with line-by-line citations.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="p-8 rounded-2xl bg-[#faf9f6] border border-slate-200 hover:border-slate-300 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 mb-6">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl text-slate-900 font-medium mb-3">
                  Organize Timelines & Evidence
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Automatically map critical renewal dates, notice deadlines, and deliverable
                  milestones in a chronological sequence to prevent missed windows.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="p-8 rounded-2xl bg-[#faf9f6] border border-slate-200 hover:border-slate-300 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 mb-6">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl text-slate-900 font-medium mb-3">
                  Prepare For Consultations
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Formulate focused, intelligent questions before you meet with legal counsel,
                  saving valuable consultation billable hours.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Professional Disclaimer Banner */}
        <section className="bg-slate-50 border-t border-slate-200 py-10">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-medium mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Responsible Information Guarantee</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              {LEGAL_DISCLAIMER}
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-slate-700">Legal Lens</span>
            <span>&copy; {new Date().getFullYear()} — Evidence-grounded legal workspace</span>
          </div>
          <div>
            <span>Private & secure workspace powered by Google AI Studio</span>
          </div>
        </div>
      </footer>

      {/* How it works modal */}
      {showDemoModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-serif text-xl font-medium text-slate-900">
                  How Legal Lens Works
                </h3>
              </div>
              <button
                id="close-demo-modal-btn"
                onClick={() => setShowDemoModal(false)}
                className="text-slate-600 hover:text-slate-600 p-1.5 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-medium text-slate-800">Secure Document Ingestion</h4>
                  <p className="mt-1">
                    Upload your legal PDF (contracts, leases, terms of service) into your private,
                    user-owned Firestore workspace.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-slate-800">Structured AI Extraction</h4>
                  <p className="mt-1">
                    Our server-side Gemini service breaks the document down into plain-English
                    clauses, severity-rated attention points, and key calendar dates.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-slate-800">Attorney Consultation Prep</h4>
                  <p className="mt-1">
                    Assemble a synthesized preparation brief highlighting ambiguities and questions
                    to discuss directly with your licensed attorney.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                id="modal-got-it-btn"
                onClick={() => setShowDemoModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
              >
                Close
              </button>
              <button
                id="modal-get-started-btn"
                onClick={() => {
                  setShowDemoModal(false);
                  onGetStarted();
                }}
                className="px-5 py-2 text-sm rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
              >
                Get started now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
