import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { isPlatformOwner } from '@/lib/school-context'
import { AuthForm } from '@/components/auth-form'

export default async function SignInPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) {
    if (await isPlatformOwner()) redirect('/platform/admin')
    redirect('/platform')
  }
  return <AuthForm mode="sign-in" />
}
