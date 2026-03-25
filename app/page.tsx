import Dashboard from '@/components/Dashboard';
import { isViewerAuthenticated } from '@/lib/auth';
import { readDashboardState } from '@/lib/store';
import { Filters } from '@/lib/types';

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const error = typeof params.error === 'string' ? params.error : '';

  let viewerAuthenticated = false;
  let configError = '';

  try {
    viewerAuthenticated = await isViewerAuthenticated();
  } catch (authError) {
    configError = authError instanceof Error ? authError.message : 'Falha ao validar o acesso do dashboard.';
  }

  if (!viewerAuthenticated) {
    return (
      <div className="login-shell page">
        <div className="auth-card">
          <h1>Dashboard protegido</h1>
          {configError ? <div className="error-box" style={{ marginTop: 18 }}>{configError}</div> : null}
          {error ? <div className="error-box" style={{ marginTop: 18 }}>{error}</div> : null}
          <form action="/api/dashboard-login" method="post" className="form-grid">
            <div className="field"><label htmlFor="user">Usuário</label><input id="user" name="user" type="text" required /></div>
            <div className="field"><label htmlFor="password">Senha</label><input id="password" name="password" type="password" required /></div>
            <button className="primary-btn" type="submit" disabled={Boolean(configError)}>Entrar no dashboard</button>
          </form>
        </div>
      </div>
    );
  }

  const state = readDashboardState();

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
