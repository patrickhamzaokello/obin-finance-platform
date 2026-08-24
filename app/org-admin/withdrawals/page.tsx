import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Withdrawals' };

import { getOrgWithdrawals, orgApproveWithdrawal, rejectWithdrawal } from '@/app/actions/withdrawals';
import { OrgWithdrawalsClient } from './withdrawals-client';

export default async function OrgWithdrawalsPage() {
  const result = await getOrgWithdrawals();

  if (!result.success) {
    return (
      <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-destructive'>
        {result.error ?? 'Failed to load withdrawals.'}
      </div>
    );
  }

  return (
    <OrgWithdrawalsClient
      rows={result.data ?? []}
      onApprove={orgApproveWithdrawal}
      onReject={rejectWithdrawal}
    />
  );
}
