import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'My Revenue' };

import { getCreatorRevenue } from '@/app/actions/admin';
import { getCreatorWithdrawals } from '@/app/actions/withdrawals';
import { CreatorRevenueClient } from './revenue-client';

export default async function CreatorRevenuePage() {
  const [revenueResult, withdrawalResult] = await Promise.all([
    getCreatorRevenue(),
    getCreatorWithdrawals(),
  ]);

  if (!revenueResult.success || !revenueResult.data) {
    return (
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-destructive'>
        {revenueResult.error ?? 'Failed to load revenue data.'}
      </div>
    );
  }

  return (
    <CreatorRevenueClient
      rows={revenueResult.data}
      school={revenueResult.school!}
      withdrawalData={withdrawalResult.success ? withdrawalResult.data : null}
    />
  );
}
