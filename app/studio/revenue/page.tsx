import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'My Revenue' };

import { getCreatorRevenue } from '@/app/actions/admin';
import { CreatorRevenueClient } from './revenue-client';

export default async function CreatorRevenuePage() {
  const result = await getCreatorRevenue();
  if (!result.success || !result.data) {
    return (
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-destructive'>
        {result.error ?? 'Failed to load revenue data.'}
      </div>
    );
  }
  return <CreatorRevenueClient rows={result.data} school={result.school!} />;
}
