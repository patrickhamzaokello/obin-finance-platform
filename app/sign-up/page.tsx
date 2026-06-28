// Platform admin accounts are provisioned manually — no self-service sign-up on the apex domain.
import { redirect } from 'next/navigation'

export default function PlatformSignUpPage() {
  redirect('/sign-in')
}
