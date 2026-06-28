'use client';

import { useEffect, useState } from 'react';
import { getSchools, createSchool, deleteSchool } from '@/app/actions/admin';
import { Building2, Trash2, ExternalLink, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function PlatformSchoolsPage() {
  const [schools, setSchools]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName]         = useState('');
  const [slug, setSlug]         = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    getSchools().then((r) => {
      if (r.success) setSchools(r.data as any[]);
      setLoading(false);
    });
  }, []);

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim()) { setError('Name and slug are required'); return; }
    setCreating(true);
    setError('');
    const r = await createSchool({ name: name.trim(), slug: slug.trim() });
    setCreating(false);
    if (r.success) {
      setSchools((prev) => [...prev, r.data]);
      setName(''); setSlug(''); setShowForm(false);
    } else {
      setError((r as any).error || 'Failed to create school');
    }
  };

  const handleDelete = async (id: string, schoolName: string) => {
    if (!confirm(`Delete "${schoolName}"? This cannot be undone.`)) return;
    await deleteSchool(id);
    setSchools((prev) => prev.filter((s) => s.id !== id));
  };

  const inputCls = 'w-full px-3 py-2 text-sm border border-border rounded focus:border-primary focus:outline-none bg-white';

  return (
    <div className='px-8 py-8'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-2xl font-bold text-foreground'>Schools</h1>
          <p className='text-sm text-muted-foreground mt-1'>Manage all schools on the platform</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className='inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded hover:bg-primary/90 transition-colors'
        >
          <Plus size={14} /> New school
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className='bg-white border border-border rounded p-6 mb-6 border-l-[3px] border-l-primary space-y-4 max-w-lg'>
          <h2 className='text-sm font-semibold text-foreground'>Create school</h2>
          <div className='space-y-3'>
            <input value={name} onChange={(e) => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')); }}
              className={inputCls} placeholder='School name (e.g. Obin Finance)' />
            <div className='flex items-center gap-2'>
              <input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className={inputCls} placeholder='URL slug (e.g. obin)' />
              <span className='text-xs text-muted-foreground whitespace-nowrap'>.platform.com</span>
            </div>
          </div>
          {error && <p className='text-xs text-destructive'>{error}</p>}
          <div className='flex gap-2'>
            <button onClick={handleCreate} disabled={creating}
              className='inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded hover:bg-primary/90 disabled:opacity-60'>
              {creating ? <><Loader2 size={13} className='animate-spin' /> Creating…</> : 'Create school'}
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
        <div className='bg-white border border-border rounded py-16 text-center text-muted-foreground text-sm'>
          <Building2 className='w-8 h-8 mx-auto mb-3 opacity-30' />
          No schools yet. Create the first one above.
        </div>
      ) : (
        <div className='bg-white border border-border rounded overflow-hidden'>
          <table className='w-full text-sm'>
            <thead className='bg-secondary text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              <tr>
                <th className='px-6 py-3 text-left'>Name</th>
                <th className='px-6 py-3 text-left'>Slug</th>
                <th className='px-6 py-3 text-left'>Created</th>
                <th className='px-6 py-3 text-left'></th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border'>
              {schools.map((s) => (
                <tr key={s.id} className='hover:bg-secondary/40 transition-colors'>
                  <td className='px-6 py-4 font-medium text-foreground'>{s.name}</td>
                  <td className='px-6 py-4 font-mono text-xs text-muted-foreground'>{s.slug}</td>
                  <td className='px-6 py-4 text-muted-foreground'>{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td className='px-6 py-4'>
                    <div className='flex items-center gap-3 justify-end'>
                      <Link href={`/platform/admin/schools/${s.id}`}
                        className='text-primary text-xs font-semibold hover:underline'>
                        Manage
                      </Link>
                      <a href={(() => {
                            const base = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3000';
                            return base.startsWith('localhost')
                              ? `http://${s.slug}.${base}`
                              : `https://${s.slug}.${base}`;
                          })()} target='_blank' rel='noreferrer'
                        className='inline-flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground'>
                        <ExternalLink size={11} /> Preview
                      </a>
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
