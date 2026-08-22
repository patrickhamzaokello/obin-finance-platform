'use client';

import { useEffect, useState } from 'react';
import { getSchools, createSchool, deleteSchool, updateSchool } from '@/app/actions/admin';
import { User, Trash2, ExternalLink, Plus, Loader2, Check, Pencil, X } from 'lucide-react';
import Link from 'next/link';

export default function PlatformCommunitiesPage() {
  const [schools,    setSchools]    = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [creating,   setCreating]   = useState(false);
  const [name,       setName]       = useState('');
  const [slug,       setSlug]       = useState('');
  const [commission, setCommission] = useState(10);
  const [showForm,   setShowForm]   = useState(false);
  const [error,      setError]      = useState('');

  // Inline commission edit state
  const [editingId,         setEditingId]         = useState<string | null>(null);
  const [editCommission,    setEditCommission]    = useState(10);
  const [savingCommission,  setSavingCommission]  = useState(false);

  useEffect(() => {
    getSchools().then((r) => {
      if (r.success) setSchools(r.data as any[]);
      setLoading(false);
    });
  }, []);

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim()) { setError('Name and slug are required'); return; }
    setCreating(true); setError('');
    const r = await createSchool({ name: name.trim(), slug: slug.trim(), commissionPercent: commission });
    setCreating(false);
    if (r.success) {
      setSchools((prev) => [...prev, { ...r.data, commissionPercent: commission }]);
      setName(''); setSlug(''); setCommission(10); setShowForm(false);
    } else {
      setError((r as any).error || 'Failed to create community');
    }
  };

  const handleDelete = async (id: string, creatorName: string) => {
    if (!confirm(`Delete "${creatorName}"? This cannot be undone.`)) return;
    await deleteSchool(id);
    setSchools((prev) => prev.filter((s) => s.id !== id));
  };

  const startEditCommission = (s: any) => {
    setEditingId(s.id);
    setEditCommission(s.commissionPercent ?? 10);
  };

  const cancelEdit = () => { setEditingId(null); };

  const saveCommission = async (schoolId: string) => {
    setSavingCommission(true);
    const r = await updateSchool(schoolId, { commissionPercent: editCommission });
    setSavingCommission(false);
    if (r.success) {
      setSchools((prev) => prev.map((s) => s.id === schoolId ? { ...s, commissionPercent: editCommission } : s));
      setEditingId(null);
    }
  };

  const inputCls = 'w-full px-3 py-2 text-sm border border-border rounded focus:border-primary focus:outline-none bg-white';

  return (
    <div className='px-8 py-8'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-2xl font-bold text-foreground'>Communities</h1>
          <p className='text-sm text-muted-foreground mt-1'>All communities on the platform</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className='inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors'>
          <Plus size={14} /> New Creator
        </button>
      </div>

      {showForm && (
        <div className='bg-white rounded-2xl shadow-sm p-6 mb-6 space-y-4 max-w-lg'>
          <h2 className='text-sm font-semibold text-foreground'>Create community</h2>
          <div className='space-y-3'>
            <input value={name}
              onChange={(e) => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')); }}
              className={inputCls} placeholder='Creator name (e.g. Alex Finance)' />
            <div className='flex items-center gap-2'>
              <span className='text-xs text-muted-foreground whitespace-nowrap flex-shrink-0'>/creator/</span>
              <input value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className={inputCls} placeholder='slug (e.g. alexfinance)' />
            </div>
            <div>
              <label className='block text-xs font-semibold text-muted-foreground mb-1'>Platform commission (%)</label>
              <div className='relative'>
                <input type='number' min='0' max='100' step='1' value={commission}
                  onChange={(e) => setCommission(Math.min(100, Math.max(0, Number(e.target.value))))}
                  className={`${inputCls} pr-8`} placeholder='e.g. 10' />
                <span className='absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground'>%</span>
              </div>
              <p className='text-[10px] text-muted-foreground mt-1'>
                Platform keeps this % of each class sale. Default is 10%.
              </p>
            </div>
          </div>
          {error && <p className='text-xs text-destructive'>{error}</p>}
          <div className='flex gap-2'>
            <button onClick={handleCreate} disabled={creating}
              className='inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded hover:bg-primary/90 disabled:opacity-60'>
              {creating ? <><Loader2 size={13} className='animate-spin' /> Creating…</> : 'Create community'}
            </button>
            <button onClick={() => { setShowForm(false); setError(''); }}
              className='px-4 py-2 border border-border text-muted-foreground text-sm font-semibold rounded hover:bg-secondary'>
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className='flex items-center gap-2 text-muted-foreground text-sm py-8'>
          <Loader2 size={15} className='animate-spin' /> Loading…
        </div>
      ) : schools.length === 0 ? (
        <div className='bg-white rounded-2xl shadow-sm py-16 text-center text-muted-foreground text-sm'>
          <User className='w-8 h-8 mx-auto mb-3 opacity-30' />
          No communities yet. Add the first one above.
        </div>
      ) : (
        <div className='bg-white rounded-2xl shadow-sm overflow-hidden'>
          <table className='w-full text-sm'>
            <thead className='bg-secondary text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              <tr>
                <th className='px-6 py-3 text-left'>Creator</th>
                <th className='px-6 py-3 text-left'>Profile URL</th>
                <th className='px-6 py-3 text-left'>Commission</th>
                <th className='px-6 py-3 text-left'>Created</th>
                <th className='px-6 py-3 text-left'></th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border'>
              {schools.map((s) => (
                <tr key={s.id} className='hover:bg-secondary/40 transition-colors'>
                  <td className='px-6 py-4 font-medium text-foreground'>{s.name}</td>
                  <td className='px-6 py-4 font-mono text-xs text-muted-foreground'>/creator/{s.slug}</td>

                  {/* Inline-editable commission cell */}
                  <td className='px-6 py-4'>
                    {editingId === s.id ? (
                      <div className='flex items-center gap-1.5'>
                        <div className='relative w-20'>
                          <input
                            type='number' min='0' max='100' step='1'
                            value={editCommission}
                            onChange={(e) => setEditCommission(Math.min(100, Math.max(0, Number(e.target.value))))}
                            className='w-full px-2 py-1 pr-6 text-sm border border-primary rounded focus:outline-none'
                            autoFocus
                          />
                          <span className='absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground'>%</span>
                        </div>
                        <button
                          onClick={() => saveCommission(s.id)}
                          disabled={savingCommission}
                          className='p-1 text-primary hover:text-primary/80 disabled:opacity-50'
                          title='Save'>
                          {savingCommission ? <Loader2 size={13} className='animate-spin' /> : <Check size={13} />}
                        </button>
                        <button onClick={cancelEdit} className='p-1 text-muted-foreground hover:text-foreground' title='Cancel'>
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <div className='flex items-center gap-2 group/commission'>
                        <span className={`font-semibold ${(s.commissionPercent ?? 0) === 10 ? 'text-foreground' : 'text-primary'}`}>
                          {s.commissionPercent ?? 10}%
                        </span>
                        {(s.commissionPercent ?? 10) !== 10 && (
                          <span className='text-[10px] text-muted-foreground'>(default 10%)</span>
                        )}
                        <button
                          onClick={() => startEditCommission(s)}
                          className='opacity-0 group-hover/commission:opacity-100 transition-opacity p-0.5 text-muted-foreground hover:text-primary'
                          title='Edit commission'>
                          <Pencil size={11} />
                        </button>
                      </div>
                    )}
                  </td>

                  <td className='px-6 py-4 text-muted-foreground'>{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td className='px-6 py-4'>
                    <div className='flex items-center gap-3 justify-end'>
                      <Link href={`/admin/schools/${s.id}`}
                        className='text-primary text-xs font-semibold hover:underline'>Manage</Link>
                      <Link href={`/creator/${s.slug}`} target='_blank'
                        className='inline-flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground'>
                        <ExternalLink size={11} /> View profile
                      </Link>
                      <button onClick={() => handleDelete(s.id, s.name)}
                        className='text-destructive/60 hover:text-destructive transition-colors'>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
