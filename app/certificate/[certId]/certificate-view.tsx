'use client';

import Link from 'next/link';
import { ArrowLeft, Download, Printer, Share2, CheckCircle2 } from 'lucide-react';

type Cert = {
  id:             string;
  learnerName:    string;
  courseTitle:    string;
  instructorName: string | null;
  schoolName:     string | null;
  issuedAt:       Date;
};

export function CertificateView({ cert }: { cert: Cert }) {
  const issuedDate = new Date(cert.issuedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const handleShare = async () => {
    const url  = window.location.href;
    const text = `I just completed "${cert.courseTitle}" on ObinAcademy! 🎓`;
    if (navigator.share) {
      await navigator.share({ title: 'My Certificate', text, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ── Action bar ── */}
      <div className="flex items-center justify-between gap-4 mb-6 print:hidden">
        <Link href="/learn/achievements"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft size={14} /> Back to Achievements
        </Link>

        <div className="flex items-center gap-2">
          <button onClick={handleShare}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-black/[0.08] text-sm font-medium text-foreground rounded-xl hover:bg-secondary transition-colors shadow-sm">
            <Share2 size={13} /> Share
          </button>
          <button onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-black/[0.08] text-sm font-medium text-foreground rounded-xl hover:bg-secondary transition-colors shadow-sm">
            <Printer size={13} /> Print
          </button>
          <button onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
            title="Use your browser's print dialog → Save as PDF">
            <Download size={13} /> Save as PDF
          </button>
        </div>
      </div>

      {/* ── Verified badge (screen only) ── */}
      <div className="flex items-center justify-center gap-2 mb-6 print:hidden">
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2 rounded-full">
          <CheckCircle2 size={14} className="text-green-600" />
          <span className="text-sm font-semibold text-green-700">Verified certificate · ID: {cert.id.slice(-8).toUpperCase()}</span>
        </div>
      </div>

      {/* ── Certificate ── */}
      <div
        id="certificate"
        className="bg-white rounded-3xl shadow-lg overflow-hidden"
        style={{ aspectRatio: '1.414 / 1' }}
      >
        <div className="w-full h-full flex flex-col items-center justify-center relative px-16 py-12 text-center">

          {/* Top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-primary" />

          {/* Corner ornaments */}
          <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-primary/25 rounded-tl-xl" />
          <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-primary/25 rounded-tr-xl" />
          <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-primary/25 rounded-bl-xl" />
          <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-primary/25 rounded-br-xl" />

          {/* Issuer */}
          {cert.schoolName && (
            <p className="text-xs font-black text-primary uppercase tracking-[0.25em] mb-5">
              {cert.schoolName}
            </p>
          )}

          {/* Eyebrow */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.2em] mb-4">
            Certificate of Completion
          </p>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5 w-72">
            <div className="flex-1 h-px bg-primary/15" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
            <div className="flex-1 h-px bg-primary/15" />
          </div>

          <p className="text-xs text-muted-foreground mb-3">This is proudly awarded to</p>

          {/* Learner name */}
          <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            {cert.learnerName}
          </h1>
          <div className="w-52 h-px bg-foreground/15 mb-5" />

          <p className="text-xs text-muted-foreground max-w-sm leading-relaxed mb-2">
            for successfully completing the course
          </p>

          {/* Course title */}
          <h2 className="text-xl font-bold text-primary mb-8 max-w-lg leading-snug">
            {cert.courseTitle}
          </h2>

          {/* Footer signatures */}
          <div className="flex items-end justify-center gap-16">
            <div className="text-center">
              <div className="w-36 h-px bg-foreground/20 mb-2" />
              <p className="text-xs font-semibold text-foreground">{issuedDate}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">Date issued</p>
            </div>
            {cert.instructorName && (
              <div className="text-center">
                <div className="w-36 h-px bg-foreground/20 mb-2" />
                <p className="text-xs font-semibold text-foreground">{cert.instructorName}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">Instructor</p>
              </div>
            )}
          </div>

          {/* Cert ID watermark */}
          <p className="absolute bottom-4 text-[9px] text-muted-foreground/40 tracking-widest uppercase">
            Certificate ID: {cert.id}
          </p>

          {/* Bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
        </div>
      </div>

      {/* ── Print styles ── */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #certificate, #certificate * { visibility: visible; }
          #certificate {
            position: fixed; inset: 0;
            width: 100vw; height: 100vh;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
