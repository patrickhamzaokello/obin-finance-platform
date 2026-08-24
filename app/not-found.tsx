import Link from 'next/link';
import { ArrowLeft, SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Big 404 */}
        <p className="text-[120px] font-black leading-none text-[#0B00FF]/10 select-none mb-2">
          404
        </p>

        {/* Icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0B00FF]/10 mb-5 -mt-6">
          <SearchX className="w-7 h-7 text-[#0B00FF]" />
        </div>

        {/* Copy */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Page not found
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B00FF] text-white text-sm font-semibold rounded-xl hover:bg-[#0B00FF]/90 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to home
          </Link>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-xl border border-black/[0.08] hover:bg-gray-50 transition-colors shadow-sm"
          >
            Browse courses
          </Link>
        </div>
      </div>
    </div>
  );
}
