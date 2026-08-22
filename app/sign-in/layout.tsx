import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Sign In — ObinAcademy' };
export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
