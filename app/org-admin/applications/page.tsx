import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Applications' };

import { getOrgApplications } from '@/app/actions/org-admin';
import ApplicationsClient from '@/app/admin/applications/applications-client';

export default async function OrgApplicationsPage() {
  const result = await getOrgApplications();
  const applications = result.success ? (result.data ?? []) : [];
  const org = result.success ? result.org : null;

  return (
    <div>
      {org && (
        <div className='px-8 pt-8 mb-0'>
          <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1'>{org.name}</p>
          <h1 className='text-2xl font-bold text-foreground'>Applications</h1>
          <p className='text-sm text-muted-foreground mt-1'>Creator applications for your organization</p>
        </div>
      )}
      <ApplicationsClient applications={applications as any} />
    </div>
  );
}
