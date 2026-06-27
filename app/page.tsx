import { redirect } from 'next/navigation';

// Middleware redirects apex / → /platform, but keep this as a fallback
export default function RootPage() {
  redirect('/platform');
}
