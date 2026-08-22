'use client';

import { useState } from 'react';
import { updateSchool } from '@/app/actions/admin';
import { Loader2, Check, Pencil, X } from 'lucide-react';

export function CommissionEditor({ schoolId, current }: { schoolId: string; current: number }) {
  const [editing,  setEditing]  = useState(false);
  const [value,    setValue]    = useState(current);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const r = await updateSchool(schoolId, { commissionPercent: value });
    setSaving(false);
    if (r.success) {
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  if (editing) {
    return (
      <div className='flex items-center gap-2 mt-1'>
        <div className='relative w-24'>
          <input
            type='number' min='0' max='100' step='1'
            value={value}
            onChange={(e) => setValue(Math.min(100, Math.max(0, Number(e.target.value))))}
            className='w-full px-3 py-1.5 pr-7 text-sm border border-primary rounded focus:outline-none font-bold'
            autoFocus
          />
          <span className='absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground'>%</span>
        </div>
        <button onClick={handleSave} disabled={saving}
          className='p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50' title='Save'>
          {saving ? <Loader2 size={13} className='animate-spin' /> : <Check size={13} />}
        </button>
        <button onClick={() => { setEditing(false); setValue(current); }}
          className='p-1.5 border border-border rounded text-muted-foreground hover:text-foreground' title='Cancel'>
          <X size={13} />
        </button>
      </div>
    );
  }

  return (
    <div className='flex items-end gap-3 mt-1'>
      <p className='text-3xl font-bold text-foreground'>{value}%</p>
      {value !== 10 && (
        <span className='text-xs text-muted-foreground mb-1'>default 10%</span>
      )}
      <button
        onClick={() => setEditing(true)}
        className='mb-1 p-1 text-muted-foreground hover:text-primary transition-colors'
        title='Edit commission'>
        <Pencil size={13} />
      </button>
      {saved && <span className='text-xs text-green-600 mb-1 font-semibold'>Saved ✓</span>}
    </div>
  );
}
