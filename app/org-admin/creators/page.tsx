import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Creators' };

import { getOrgCreators } from '@/app/actions/org-admin';
import { Building2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default async function OrgCreatorsPage() {
  const result = await getOrgCreators();
  if (!result.success) return <div className='px-8 py-8 text-sm text-destructive'>{result.error}</div>;

  const schools = result.data ?? [];
  const org     = result.org!;

  return (
    <div className='px-8 py-8'>
      <div className='mb-8'>
        <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1'>{org.name}</p>
        <h1 className='text-2xl font-bold text-foreground'>Creators</h1>
        <p className='text-sm text-muted-foreground mt-1'>{schools.length} creator{schools.length !== 1 ? 's' : ''} in this organization</p>
      </div>

      {schools.length === 0 ? (
        <div className='bg-white rounded-2xl shadow-sm py-16 text-center text-muted-foreground text-sm'>
          <Building2 className='w-8 h-8 mx-auto mb-3 opacity-30' />
          No creators assigned to this organization yet.
        </div>
      ) : (
        <div className='bg-white rounded-2xl shadow-sm overflow-hidden'>
          <table className='w-full text-sm'>
            <thead className='bg-secondary text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              <tr>
                <th className='px-6 py-3 text-left'>Creator</th>
                <th className='px-6 py-3 text-left'>Slug</th>
                <th className='px-6 py-3 text-left'>Commission</th>
                <th className='px-6 py-3 text-left'>Category</th>
                <th className='px-6 py-3 text-left'>Joined</th>
                <th className='px-6 py-3 text-left'></th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border'>
              {schools.map((s) => (
                <tr key={s.id} className='hover:bg-secondary/40 transition-colors'>
                  <td className='px-6 py-4'>
                    <div className='flex items-center gap-3'>
                      {s.logoUrl
                        ? <img src={s.logoUrl} alt={s.name} className='w-8 h-8 rounded-full object-cover' />
                        : <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs'>{s.name.charAt(0)}</div>}
                      <span className='font-medium text-foreground'>{s.name}</span>
                    </div>
                  </td>
                  <td className='px-6 py-4 font-mono text-xs text-muted-foreground'>/creator/{s.slug}</td>
                  <td className='px-6 py-4 text-muted-foreground'>{s.commissionPercent ?? 10}%</td>
                  <td className='px-6 py-4 text-muted-foreground'>{s.category ?? '—'}</td>
                  <td className='px-6 py-4 text-muted-foreground'>{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td className='px-6 py-4'>
                    <div className='flex items-center gap-3 justify-end'>
                      <Link href={`/creator/${s.slug}`} target='_blank'
                        className='inline-flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground'>
                        <ExternalLink size={11} /> View profile
                      </Link>
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
