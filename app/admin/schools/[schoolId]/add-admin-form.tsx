'use client';

import { useState } from 'react';
import { addSchoolAdmin } from '@/app/actions/platform';
import { Loader2, UserPlus } from 'lucide-react';

export function AddSchoolAdminForm({ schoolId }: { schoolId: string }) {
  const [open, setOpen]     = useState(false);
  const [email, setEmail]   = useState('');
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');

  const submit = async () => {
    if (!email.trim()) return;
    setBusy(true); setError(''); setSuccess('');
    const r = await addSchoolAdmin(schoolId, email.trim());
    setBusy(false);
    if (r.success) {
      setSuccess(`${email} added as school admin`);
      setEmail('');
      setTimeout(() => { setSuccess(''); setOpen(false); }, 2000);
    } else {
      setError((r as any).error || 'Failed');
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors'>
        <UserPlus size={12} /> Add admin
      </button>
    );
  }

  return (
    <div className='flex items-center gap-2'>
      <input
        type='email'
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder='admin@email.com'
        className='px-3 py-1.5 text-xs border border-border rounded focus:border-primary focus:outline-none bg-white w-48'
        autoFocus
      />
      <button onClick={submit} disabled={busy}
        className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-60'>
        {busy ? <Loader2 size={11} className='animate-spin' /> : 'Add'}
      </button>
      <button onClick={() => setOpen(false)} className='text-xs text-muted-foreground hover:text-foreground'>Cancel</button>
      {error   && <span className='text-xs text-destructive'>{error}</span>}
      {success && <span className='text-xs text-accent'>{success}</span>}
    </div>
  );
}
