import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Withdrawals' };

import { getOwnerWithdrawals, ownerApproveWithdrawal, rejectWithdrawal } from '@/app/actions/withdrawals';
import { AdminWithdrawalsClient } from './withdrawals-client';

export default async function AdminWithdrawalsPage() {
  const result = await getOwnerWithdrawals();

  if (!result.success) {
    return (
      <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-destructive'>
        {result.error ?? 'Failed to load withdrawals.'}
      </div>
    );
  }

  return (
    <AdminWithdrawalsClient
      rows={result.data ?? []}
      onFinalApprove={ownerApproveWithdrawal}
      onReject={rejectWithdrawal}
    />
  );
}
