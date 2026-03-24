import Dashboard from '@/components/Dashboard';
import { readDashboardState } from '@/lib/store';
import { Filters } from '@/lib/types';

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const state = readDashboardState();
  const params = await searchParams;

  const filters: Filters = {
    grupo: typeof params.grupo === 'string' ? params.grupo : undefined,
    campanha: typeof params.campanha === 'string' ? params.campanha : undefined,
    faseCrm: typeof params.faseCrm === 'string'
      ? params.faseCrm
      : typeof params.fase === 'string'
        ? params.fase
        : undefined,
    emailType: typeof params.emailType === 'string' ? params.emailType : undefined,
    dateFrom: typeof params.dateFrom === 'string' ? params.dateFrom : undefined,
    dateTo: typeof params.dateTo === 'string' ? params.dateTo : undefined,
  };

  return <Dashboard state={state} filters={filters} />;
}
