import type { Metadata } from 'next';
import { getRevenueReport } from '@/app/actions/admin';
import { RevenueReportClient } from './revenue-client';

export const metadata: Metadata = { title: 'Revenue Report' };

export default async function RevenueReportPage() {
  const result = await getRevenueReport();
  const rows = result.success && result.data ? result.data : [];
  return <RevenueReportClient rows={rows} />;
}
