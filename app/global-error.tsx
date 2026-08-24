'use client';

import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

// Catches errors thrown inside the root layout itself.
// Must include its own <html> and <body> since the layout is unavailable.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#F5F5F7' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            flexDirection: 'column',
            textAlign: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: '#FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#EF4444" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111', margin: 0 }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#666', margin: 0, maxWidth: 360 }}>
            A critical error occurred. Please try reloading the page.
            {error.digest && (
              <><br /><span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#999' }}>
                ID: {error.digest}
              </span></>
            )}
          </p>

          <button
            onClick={reset}
            style={{
              marginTop: '0.5rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              background: '#0B00FF',
              color: '#fff',
              fontSize: '0.875rem',
              fontWeight: 600,
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={14} />
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
