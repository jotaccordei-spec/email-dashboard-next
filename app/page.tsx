import Dashboard from '@/components/Dashboard';
import { readDashboardState } from '@/lib/store';
import { Filters } from '@/lib/types';

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const state = readDashboardState();
  const params = await searchParams;

  const filters: Filters = {
    grupo: typeof params.grupo === 'string' ? params.grupo : undefined,
    campanha: typeof params.campanha === 'string' ? params.campanha : undefined,
    fase: typeof params.fase === 'string' ? params.fase : undefined,
    dateFrom: typeof params.dateFrom === 'string' ? `${params.dateFrom}-01` : undefined,
    dateTo: typeof params.dateTo === 'string' ? `${params.dateTo}-31` : undefined,
  };

  return <Dashboard state={state} filters={filters} />;
}
