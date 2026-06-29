import { getApplications } from '@/app/actions/applications';
import ApplicationsClient from './applications-client';

export default async function ApplicationsPage() {
  const result = await getApplications();
  const applications = result.data ?? [];
  return <ApplicationsClient applications={applications} />;
}
