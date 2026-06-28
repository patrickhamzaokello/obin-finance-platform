'use client';

import { Download, Printer } from 'lucide-react';

type Cert = {
  id: string;
  learnerName: string;
  courseTitle: string;
  instructorName: string | null;
  schoolName: string | null;
  issuedAt: Date;
};

export function CertificateView({ cert }: { cert: Cert }) {
  const issuedDate = new Date(cert.issuedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10'>

      {/* Actions */}
      <div className='flex items-center justify-end gap-2 mb-6 print:hidden'>
        <button
          onClick={() => window.print()}
          className='inline-flex items-center gap-2 px-4 py-2 bg-white border border-black/[0.08] text-sm font-medium text-foreground rounded-xl hover:bg-secondary transition-colors shadow-sm'
        >
          <Printer size={14} /> Print
        </button>
        <button
          onClick={() => window.print()}
          className='inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors shadow-sm'
        >
          <Download size={14} /> Download PDF
        </button>
      </div>

      {/* ── Certificate ── */}
      <div
        id='certificate'
        className='bg-white rounded-3xl shadow-sm overflow-hidden'
        style={{ aspectRatio: '1.414 / 1' }} /* A4 landscape ratio */
      >
        <div className='w-full h-full flex flex-col items-center justify-center relative px-16 py-12 text-center'>

          {/* Top accent bar */}
          <div className='absolute top-0 left-0 right-0 h-1.5 bg-primary' />

          {/* Corner ornaments — pure CSS, no dark colours */}
          <div className='absolute top-6 left-6 w-10 h-10 border-t-2 border-l-2 border-primary/30 rounded-tl-xl' />
          <div className='absolute top-6 right-6 w-10 h-10 border-t-2 border-r-2 border-primary/30 rounded-tr-xl' />
          <div className='absolute bottom-6 left-6 w-10 h-10 border-b-2 border-l-2 border-primary/30 rounded-bl-xl' />
          <div className='absolute bottom-6 right-6 w-10 h-10 border-b-2 border-r-2 border-primary/30 rounded-br-xl' />

          {/* Issuer */}
          {cert.schoolName && (
            <p className='text-xs font-bold text-primary uppercase tracking-[0.2em] mb-6'>
              {cert.schoolName}
            </p>
          )}

          {/* Headline */}
          <p className='text-sm font-medium text-muted-foreground uppercase tracking-widest mb-3'>
            Certificate of Completion
          </p>

          {/* Divider */}
          <div className='flex items-center gap-3 mb-6 w-64'>
            <div className='flex-1 h-px bg-primary/20' />
            <div className='w-1.5 h-1.5 rounded-full bg-primary/40' />
            <div className='flex-1 h-px bg-primary/20' />
          </div>

          {/* "This is awarded to" */}
          <p className='text-xs text-muted-foreground mb-2'>This is proudly awarded to</p>

          {/* Learner name */}
          <h1 className='text-4xl font-bold text-foreground tracking-tight mb-1' style={{ fontFamily: 'Georgia, serif' }}>
            {cert.learnerName}
          </h1>

          {/* Underline */}
          <div className='w-48 h-px bg-foreground/20 mb-6' />

          {/* Body text */}
          <p className='text-sm text-muted-foreground max-w-sm leading-relaxed mb-2'>
            for successfully completing the course
          </p>

          {/* Course title */}
          <h2 className='text-xl font-bold text-primary mb-8 max-w-lg leading-snug'>
            {cert.courseTitle}
          </h2>

          {/* Footer row */}
          <div className='flex items-end justify-center gap-16'>
            {/* Date */}
            <div className='text-center'>
              <div className='w-36 h-px bg-foreground/20 mb-2' />
              <p className='text-xs font-semibold text-foreground'>{issuedDate}</p>
              <p className='text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider'>Date issued</p>
            </div>

            {/* Instructor / school signature */}
            {cert.instructorName && (
              <div className='text-center'>
                <div className='w-36 h-px bg-foreground/20 mb-2' />
                <p className='text-xs font-semibold text-foreground'>{cert.instructorName}</p>
                <p className='text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider'>Instructor</p>
              </div>
            )}
          </div>

          {/* Certificate ID */}
          <p className='absolute bottom-4 text-[9px] text-muted-foreground/40 tracking-widest uppercase'>
            Certificate ID: {cert.id}
          </p>

          {/* Bottom accent bar */}
          <div className='absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30' />
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #certificate, #certificate * { visibility: visible; }
          #certificate {
            position: fixed; inset: 0;
            width: 100vw; height: 100vh;
            border-radius: 0;
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
}
