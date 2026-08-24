'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to your error reporting service here if needed
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-gray-500 mb-1">
          We hit an unexpected error. Your data is safe — this is a display problem.
        </p>
        {error.digest && (
          <p className="text-xs font-mono text-gray-400 mb-6">
            Error ID: {error.digest}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B00FF] text-white text-sm font-semibold rounded-xl hover:bg-[#0B00FF]/90 transition-colors"
          >
            <RotateCcw size={14} />
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-xl border border-black/[0.08] hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeft size={14} />
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
