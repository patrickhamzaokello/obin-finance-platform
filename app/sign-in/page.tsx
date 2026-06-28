import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { isPlatformOwner } from '@/lib/school-context'
import { AuthForm } from '@/components/auth-form'

export default async function PlatformSignInPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) {
    if (await isPlatformOwner()) redirect('/platform/admin')
    redirect('/platform')
  }

  return (
    <main className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo / branding */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-primary-foreground" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Platform Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to manage your platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <AuthForm
            mode="sign-in"
            redirectTo="/platform/admin"
            hideToggle
          />
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Platform access is restricted to authorized administrators.
        </p>
      </div>
    </main>
  )
}
