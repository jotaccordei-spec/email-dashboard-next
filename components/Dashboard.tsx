import Link from 'next/link';
import { FunnelChart, ReguaOpenRateChart } from '@/components/Charts';
import {
  aggregate,
  applyEmailTypeFilter,
  applyFilters,
  buildCampaignPerformance,
  buildFunnelSteps,
  buildGroupPerformance,
  buildPhasePerformance,
  buildReguaPerformance,
  buildReguaSeries,
  percentage,
  uniqueValues,
} from '@/lib/data';
import { DashboardState, Filters, PhasePerformance, ReguaPerformance } from '@/lib/types';

function fmt(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString('pt-BR');
}

function hasActiveGlobalFilters(filters: Filters): boolean {
  return Boolean(filters.grupo || filters.campanha || filters.faseCrm || filters.dateFrom || filters.dateTo);
}

function buildAppliedFilters(filters: Filters): Array<[string, string]> {
  return [
    ['Grupo', filters.grupo ?? 'Todos'],
    ['Campanha', filters.campanha ?? 'Todas'],
    ['Fase CRM', filters.faseCrm ?? 'Todas'],
    ['Tipo de e-mail (régua)', filters.emailType ?? 'Todos'],
    ['Período', filters.dateFrom || filters.dateTo
      ? `${filters.dateFrom ?? 'início'} até ${filters.dateTo ?? 'hoje'}`
      : 'Completo'],
  ];
}

function DashboardTopbar({ state, filteredCount }: { state: DashboardState | null; filteredCount: number }) {
  const now = state ? new Date(state.uploadedAt) : null;

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-logo">🌱</div>
        <div>
          <div className="brand-name">Dashboard Email Marketing</div>
          <div className="brand-sub">Raiz Educação</div>
        </div>
      </div>
      <div className="topbar-right">
        <div className="meta-chip"><strong>{state ? state.rowCount.toLocaleString('pt-BR') : '0'}</strong> registros</div>
        <div className="meta-chip">{state ? state.fileName : 'Nenhuma base carregada'}</div>
        <div className="meta-chip">{now ? now.toLocaleDateString('pt-BR') : 'Sem atualização'}</div>
        {state ? <div className="meta-chip"><strong>{filteredCount.toLocaleString('pt-BR')}</strong> visíveis</div> : null}
        <form action="/api/dashboard-logout" method="post">
          <button className="secondary-btn" type="submit">Sair do dashboard</button>
        </form>
        <Link href="/admin/upload" className="btn-update">{state ? 'Atualizar base' : 'Carregar base'}</Link>
      </div>
    </header>
  );
}

function DashboardFilters({
  filters,
  grupos,
  campanhas,
  fases,
  filteredCount,
}: {
  filters: Filters;
  grupos: string[];
  campanhas: string[];
  fases: string[];
  filteredCount: number;
}) {
  return (
    <form className="filter-section" action="/">
      <div className="filter-row wrap" style={{ padding: 0 }}>
        <span className="filter-label">Filtros</span>
        <select name="grupo" defaultValue={filters.grupo ?? ''} className="select-chip">
          <option value="">Grupo / Marca</option>
          {grupos.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select name="campanha" defaultValue={filters.campanha ?? ''} className="select-chip">
          <option value="">Campanha</option>
          {campanhas.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select name="faseCrm" defaultValue={filters.faseCrm ?? ''} className="select-chip">
          <option value="">Fase CRM</option>
          {fases.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select name="emailType" defaultValue={filters.emailType ?? ''} className="select-chip">
          <option value="">Tipo de e-mail (régua)</option>
          {fases.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input className="select-chip" type="month" name="dateFrom" defaultValue={filters.dateFrom} />
        <input className="select-chip" type="month" name="dateTo" defaultValue={filters.dateTo} />
        <button className="primary-btn" type="submit">Aplicar</button>
        <Link href="/" className="btn-clr">Limpar tudo</Link>
        <div className="fres"><strong>{filteredCount.toLocaleString('pt-BR')}</strong> registros filtrados</div>
      </div>
    </form>
  );
}

function DashboardEmptyState({
  title,
  description,
  details,
  showClearFilters,
}: {
  title: string;
  description: string;
  details: Array<[string, string]>;
  showClearFilters: boolean;
}) {
  return (
    <main className="main">
      <section className="dashboard-empty">
        <div className="dashboard-empty-copy">
          <span className="empty-eyebrow">Dashboard pronto</span>
          <h1>{title}</h1>
          <p className="muted">{description}</p>
        </div>

        <div className="dashboard-empty-actions">
          {showClearFilters ? <Link href="/" className="secondary-btn">Limpar filtros</Link> : null}
          <Link href="/admin/upload" className="primary-btn">Ir para upload</Link>
        </div>

        <div className="small-list dashboard-empty-list">
          {details.map(([label, value]) => (
            <div className="file-line" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function InlineCardEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className="chart-empty">
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}

function PhaseOpenRateList({ entries }: { entries: PhasePerformance[] }) {
  const maxRate = entries[0]?.openRate || 1;

  return (
    <div className="fgrid">
      {entries.map((entry, index) => {
        const colors = ['#E07A1F', '#178F83', '#2F9E44', '#3B82F6', '#8B5CF6', '#D97706', '#0EA5E9'];
        const color = colors[index % colors.length];
        return (
          <div className="fi" key={entry.faseCrm}>
            <div className="fdot" style={{ background: color, boxShadow: `0 0 5px ${color}33` }} />
            <div className="fn">{entry.faseCrm}</div>
            <div className="fb"><div className="fbf" style={{ width: `${Math.max(8, Math.round((entry.openRate / maxRate) * 100))}%`, background: color }} /></div>
            <div className="fpct" style={{ color }}>{entry.openRate}%</div>
          </div>
        );
      })}
    </div>
  );
}

function ReguaPerformanceList({ entries }: { entries: ReguaPerformance[] }) {
  const topEntries = entries.slice(0, 8);
  const maxRate = topEntries[0]?.openRate || 1;

  return (
    <div className="small-list">
      {topEntries.map((entry) => (
        <div className="regua-line" key={`${entry.etapaRegua}-${entry.faseCrm}`}>
          <div className="regua-line-copy">
            <strong>{entry.etapaRegua}</strong>
            <span>{entry.faseCrm}</span>
          </div>
          <div className="regua-line-metric">
            <div className="regua-line-bar">
              <div className="regua-line-fill" style={{ width: `${Math.max(10, Math.round((entry.openRate / maxRate) * 100))}%` }} />
            </div>
            <strong>{entry.openRate}%</strong>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({ state, filters }: { state: DashboardState | null; filters: Filters }) {
  const sourceData = state?.data ?? [];
  const filtered = state ? applyFilters(sourceData, filters) : [];
  const metrics = aggregate(filtered);
  const hasResults = filtered.length > 0;

  const grupos = uniqueValues(sourceData, (row) => row.grupo);
  const campanhas = uniqueValues(sourceData, (row) => row.campanha).filter((value) => value !== '(sem nome)');
  const fases = uniqueValues(sourceData, (row) => row.faseCrm);

  if (!state) {
    return (
      <div className="page">
        <div className="wrap">
          <DashboardTopbar state={null} filteredCount={0} />
          <DashboardEmptyState
            title="Nenhuma base carregada"
            description="O dashboard já está pronto, mas ainda não existe uma base carregada em memória no servidor. Assim que o primeiro arquivo for salvo na área administrativa, a home passa a refletir os novos dados."
            details={[
              ['Área de upload', '/admin/upload'],
              ['Origem da análise', 'Base_Looker'],
              ['Exibição', 'empty state do dashboard'],
            ]}
            showClearFilters={false}
          />
          <footer>
            <span>🌱 Raiz Educação — Dashboard Email Marketing</span>
            <span>Nenhuma base disponível</span>
            <span>Aguardando primeiro upload</span>
          </footer>
        </div>
      </div>
    );
  }

  if (!hasResults) {
    return (
      <div className="page">
        <div className="wrap">
          <DashboardTopbar state={state} filteredCount={0} />
          <DashboardFilters
            filters={filters}
            grupos={grupos}
            campanhas={campanhas}
            fases={fases}
            filteredCount={0}
          />
          <DashboardEmptyState
            title={hasActiveGlobalFilters(filters) ? 'Nenhum dado encontrado' : 'Nenhum dado disponível'}
            description={hasActiveGlobalFilters(filters)
              ? 'Os filtros globais aplicados não retornaram registros. Você pode limpar os filtros para voltar ao consolidado ou subir uma nova base se precisar atualizar a origem dos dados.'
              : 'A base atual existe, mas não há linhas utilizáveis para montar o dashboard neste recorte. Vale revisar a aba Base_Looker do arquivo carregado.'}
            details={buildAppliedFilters(filters)}
            showClearFilters={hasActiveGlobalFilters(filters)}
          />
          <footer>
            <span>🌱 Raiz Educação — Dashboard Email Marketing</span>
            <span>0 registros filtrados</span>
            <span>Atualizado em {new Date(state.uploadedAt).toLocaleDateString('pt-BR', { dateStyle: 'long' })}</span>
          </footer>
        </div>
      </div>
    );
  }

  const reguaFiltered = applyEmailTypeFilter(filtered, filters.emailType);
  const reguaSeries = buildReguaSeries(reguaFiltered);
  const funnelSteps = buildFunnelSteps(metrics);
  const groupEntries = buildGroupPerformance(filtered).slice(0, 10);
  const phaseEntries = buildPhasePerformance(filtered);
  const campaignEntries = buildCampaignPerformance(filtered).slice(0, 10);
  const reguaEntries = buildReguaPerformance(reguaFiltered).slice(0, 10);
  const now = new Date(state.uploadedAt);

  return (
    <div className="page">
      <div className="wrap">
        <DashboardTopbar state={state} filteredCount={filtered.length} />
        <DashboardFilters
          filters={filters}
          grupos={grupos}
          campanhas={campanhas}
          fases={fases}
          filteredCount={filtered.length}
        />

        <main className="main">
          <div className="slbl">Visão Geral</div>
          <div className="krow">
            <div className="kpi"><div className="kpi-acc" style={{ background: 'linear-gradient(90deg,var(--org),transparent)' }} /><div className="klbl">Total Enviados</div><div className="kval" style={{ color: 'var(--org2)' }}>{fmt(metrics.enviados)}</div><div className="ksub">{fmt(metrics.entregues)} entregues</div></div>
            <div className="kpi"><div className="kpi-acc" style={{ background: 'linear-gradient(90deg,var(--tel),transparent)' }} /><div className="klbl">Taxa de Entrega</div><div className="kval" style={{ color: 'var(--tel2)' }}>{percentage(metrics.entregues, metrics.enviados)}%</div><div className="ksub">Base entregue</div></div>
            <div className="kpi"><div className="kpi-acc" style={{ background: 'linear-gradient(90deg,var(--org),transparent)' }} /><div className="klbl">Taxa de Abertura</div><div className="kval" style={{ color: 'var(--org2)' }}>{percentage(metrics.abertos, metrics.enviados)}%</div><div className="ksub">{fmt(metrics.abertos)} aberturas</div></div>
            <div className="kpi"><div className="kpi-acc" style={{ background: 'linear-gradient(90deg,var(--grn),transparent)' }} /><div className="klbl">CTOR</div><div className="kval" style={{ color: 'var(--grn)' }}>{percentage(metrics.cliques, metrics.abertos)}%</div><div className="ksub">{fmt(metrics.cliques)} cliques</div></div>
            <div className="kpi"><div className="kpi-acc" style={{ background: 'linear-gradient(90deg,var(--red),transparent)' }} /><div className="klbl">Descadastros</div><div className="kval" style={{ color: 'var(--red)' }}>{percentage(metrics.descadastros, metrics.enviados)}%</div><div className="ksub">{fmt(metrics.descadastros)} descadastros</div></div>
          </div>

          <div className="slbl">Funil & Evolução</div>
          <div className="g32">
            <div className="card">
              <div className="chd">
                <div className="ctit"><span className="dot" style={{ background: 'var(--org)' }} />Funil literal</div>
                <span className="cbdg">{filters.grupo || filters.campanha || 'Consolidado'}</span>
              </div>
              <FunnelChart steps={funnelSteps} />
            </div>
            <div className="card">
              <div className="chd">
                <div className="ctit"><span className="dot" style={{ background: 'var(--tel)' }} />Taxa de abertura por dia da régua</div>
                <span className="cbdg">{filters.emailType || 'Todos os tipos'}</span>
              </div>
              {reguaSeries.length > 0 ? (
                <>
                  <ReguaOpenRateChart points={reguaSeries} />
                  <div className="card-caption">
                    Análise por `Dia_Regua`, com contexto de `Etapa_Régua` no tooltip.
                  </div>
                </>
              ) : (
                <InlineCardEmpty
                  title="Sem dados para a régua selecionada"
                  description="Ajuste o filtro de tipo de e-mail para visualizar a taxa de abertura por dia da régua."
                />
              )}
            </div>
          </div>

          <div className="slbl">Grupos & Fases</div>
          <div className="g2">
            <div className="card">
              <div className="chd"><div className="ctit"><span className="dot" style={{ background: 'var(--org)' }} />Top grupos por volume</div><span className="cbdg">Top 10</span></div>
              <table className="dtbl"><thead><tr><th>#</th><th>Grupo</th><th>Tx. Abertura</th><th>CTOR</th></tr></thead><tbody>
                {groupEntries.map((entry, index) => (
                  <tr key={entry.grupo}>
                    <td><span className="rk">{index + 1}</span></td>
                    <td><div className="nm">{entry.grupo}</div><div className="ns">{fmt(entry.enviados)} envios</div></td>
                    <td><span className={`pill ${entry.openRate > 40 ? 'po' : 'pm'}`}>{entry.openRate}%</span></td>
                    <td><span className={`pill ${entry.ctor > 25 ? 'pt' : 'pm'}`}>{entry.ctor}%</span></td>
                  </tr>
                ))}
              </tbody></table>
            </div>

            <div className="card">
              <div className="chd"><div className="ctit"><span className="dot" style={{ background: 'var(--tel)' }} />Taxa de abertura por fase CRM</div><span className="cbdg">Dado analisado</span></div>
              <PhaseOpenRateList entries={phaseEntries} />
              <div className="small-list compact-list">
                {phaseEntries.slice(0, 3).map((entry) => (
                  <div className="file-line" key={entry.faseCrm}>
                    <span>{entry.faseCrm}</span>
                    <strong>{fmt(entry.abertos)} abertos / {fmt(entry.enviados)} enviados</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="slbl">Campanhas & Etapas</div>
          <div className="g32">
            <div className="card">
              <div className="chd"><div className="ctit"><span className="dot" style={{ background: 'var(--org)' }} />Performance de campanhas</div><span className="cbdg">Top 10</span></div>
              <table className="dtbl"><thead><tr><th>#</th><th>Campanha</th><th>Grupo</th><th>Tx. Abertura</th><th>CTOR</th></tr></thead><tbody>
                {campaignEntries.map((campaign, index) => (
                  <tr key={`${campaign.campanha}-${campaign.grupo}`}>
                    <td><span className="rk">{index + 1}</span></td>
                    <td><div className="nm">{campaign.campanha}</div></td>
                    <td><div className="ns">{campaign.grupo}</div></td>
                    <td><span className={`pill ${campaign.openRate > 40 ? 'po' : 'pm'}`}>{campaign.openRate}%</span></td>
                    <td><span className={`pill ${campaign.ctor > 25 ? 'pt' : 'pm'}`}>{campaign.ctor}%</span></td>
                  </tr>
                ))}
              </tbody></table>
            </div>
            <div className="card">
              <div className="chd"><div className="ctit"><span className="dot" style={{ background: 'var(--tel)' }} />Etapas da régua por taxa de abertura</div><span className="cbdg">{filters.emailType || 'Todos os tipos'}</span></div>
              {reguaEntries.length > 0 ? (
                <ReguaPerformanceList entries={reguaEntries} />
              ) : (
                <InlineCardEmpty
                  title="Nenhuma etapa disponível"
                  description="Não há etapas da régua para o tipo de e-mail selecionado neste recorte."
                />
              )}
            </div>
          </div>
        </main>

        <footer>
          <span>🌱 Raiz Educação — Dashboard Email Marketing</span>
          <span>{filtered.length.toLocaleString('pt-BR')} registros filtrados · {fmt(metrics.enviados)} envios</span>
          <span>Atualizado em {now.toLocaleDateString('pt-BR', { dateStyle: 'long' })}</span>
        </footer>
      </div>
    </div>
  );
}
