import Dashboard from '@/components/Dashboard';
import { readDashboardState } from '@/lib/store';
import { Filters } from '@/lib/types';

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const state = readDashboardState();
  const params = await searchParams;

  if (!state) {
    return (
      <div className="empty-shell page">
        <div className="empty-card">
          <h1>Dashboard Email Marketing</h1>
          <p className="muted">
            Ainda não existe uma base carregada no servidor. O upload agora fica fora da home principal, em uma área restrita,
            como você pediu.
          </p>
          <div className="small-list">
            <div className="file-line"><span>Área de upload</span><strong>/admin/upload</strong></div>
            <div className="file-line"><span>Persistência</span><strong>server-side</strong></div>
            <div className="file-line"><span>Estado</span><strong>mantido entre acessos</strong></div>
          </div>
        </div>
      </div>
    );
  }

  const filters: Filters = {
    grupo: typeof params.grupo === 'string' ? params.grupo : undefined,
    campanha: typeof params.campanha === 'string' ? params.campanha : undefined,
    fase: typeof params.fase === 'string' ? params.fase : undefined,
    dateFrom: typeof params.dateFrom === 'string' ? `${params.dateFrom}-01` : undefined,
    dateTo: typeof params.dateTo === 'string' ? `${params.dateTo}-31` : undefined,
  };

  return <Dashboard state={state} filters={filters} />;
}
