import Link from 'next/link';
import { aggregate, applyFilters, percentage, uniqueValues } from '@/lib/data';
import { DataRow, DashboardState, Filters } from '@/lib/types';
import { EvolutionChart, PhaseDonut } from '@/components/Charts';

function fmt(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString('pt-BR');
}

function buildMonthlySeries(data: DataRow[]) {
  const byMonth: Record<string, { enviados: number; abertos: number; cliques: number }> = {};
  for (const row of data) {
    if (!byMonth[row[4]]) byMonth[row[4]] = { enviados: 0, abertos: 0, cliques: 0 };
    byMonth[row[4]].enviados += row[5];
    byMonth[row[4]].abertos += row[7];
    byMonth[row[4]].cliques += row[8];
  }

  const months = Object.keys(byMonth).sort().slice(-24);
  return {
    labels: months.map((m) => m.slice(2)),
    enviados: months.map((m) => byMonth[m].enviados),
    abertos: months.map((m) => byMonth[m].abertos),
    cliques: months.map((m) => byMonth[m].cliques),
  };
}

export default function Dashboard({ state, filters }: { state: DashboardState; filters: Filters }) {
  const filtered = applyFilters(state.data, filters);
  const metrics = aggregate(filtered);

  const grupos = uniqueValues(state.data, 0);
  const campanhas = uniqueValues(state.data, 2).filter((v) => v !== '(sem nome)');
  const fases = uniqueValues(state.data, 3);

  const byGroup = new Map<string, { enviados: number; abertos: number; cliques: number }>();
  const byPhase = new Map<string, { enviados: number; abertos: number }>();
  const byCampaign = new Map<string, { campanha: string; grupo: string; enviados: number; abertos: number; cliques: number }>();

  for (const row of filtered) {
    const group = byGroup.get(row[0]) ?? { enviados: 0, abertos: 0, cliques: 0 };
    group.enviados += row[5];
    group.abertos += row[7];
    group.cliques += row[8];
    byGroup.set(row[0], group);

    const phase = byPhase.get(row[3]) ?? { enviados: 0, abertos: 0 };
    phase.enviados += row[5];
    phase.abertos += row[7];
    byPhase.set(row[3], phase);

    const key = `${row[2]}|||${row[0]}`;
    const campaign = byCampaign.get(key) ?? { campanha: row[2], grupo: row[0], enviados: 0, abertos: 0, cliques: 0 };
    campaign.enviados += row[5];
    campaign.abertos += row[7];
    campaign.cliques += row[8];
    byCampaign.set(key, campaign);
  }

  const topGroups = [...byGroup.entries()].sort((a, b) => b[1].enviados - a[1].enviados).slice(0, 10);
  const phaseEntries = [...byPhase.entries()].sort((a, b) => b[1].enviados - a[1].enviados);
  const topCampaigns = [...byCampaign.values()].sort((a, b) => b.enviados - a.enviados).slice(0, 10);
  const monthly = buildMonthlySeries(filtered);
  const now = new Date(state.uploadedAt);

  return (
    <div className="page">
      <div className="wrap">
        <header className="topbar">
          <div className="brand">
            <div className="brand-logo">🌱</div>
            <div>
              <div className="brand-name">Dashboard Email Marketing</div>
              <div className="brand-sub">Raiz Educação</div>
            </div>
          </div>
          <div className="topbar-right">
            <div className="meta-chip"><strong>{state.rowCount.toLocaleString('pt-BR')}</strong> registros</div>
            <div className="meta-chip">{state.fileName}</div>
            <div className="meta-chip">{now.toLocaleDateString('pt-BR')}</div>
            <Link href="/admin/upload" className="btn-update">Atualizar base</Link>
          </div>
        </header>

        <form className="filter-section" action="/">
          <div className="filter-row wrap" style={{ padding: 0 }}>
            <span className="filter-label">Filtros</span>
            <select name="grupo" defaultValue={filters.grupo ?? ''} className="select-chip">
              <option value="">Grupo / Marca</option>
              {grupos.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select name="campanha" defaultValue={filters.campanha ?? ''} className="select-chip">
              <option value="">Campanha / E-mail</option>
              {campanhas.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select name="fase" defaultValue={filters.fase ?? ''} className="select-chip">
              <option value="">Fase CRM</option>
              {fases.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <input className="select-chip" type="month" name="dateFrom" defaultValue={filters.dateFrom?.slice(0, 7)} />
            <input className="select-chip" type="month" name="dateTo" defaultValue={filters.dateTo?.slice(0, 7)} />
            <button className="primary-btn" type="submit">Aplicar</button>
            <Link href="/" className="btn-clr">Limpar tudo</Link>
            <div className="fres"><strong>{filtered.length.toLocaleString('pt-BR')}</strong> registros filtrados</div>
          </div>
        </form>

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
              <div className="chd"><div className="ctit"><span className="dot" style={{ background: 'var(--org)' }} />Resumo</div><span className="cbdg">{filters.grupo || filters.campanha || 'Consolidado'}</span></div>
              <div className="small-list">
                <div className="file-line"><span>Enviados</span><strong>{fmt(metrics.enviados)}</strong></div>
                <div className="file-line"><span>Entregues</span><strong>{fmt(metrics.entregues)} · {percentage(metrics.entregues, metrics.enviados)}%</strong></div>
                <div className="file-line"><span>Abertos</span><strong>{fmt(metrics.abertos)} · {percentage(metrics.abertos, metrics.enviados)}%</strong></div>
                <div className="file-line"><span>Cliques</span><strong>{fmt(metrics.cliques)} · {percentage(metrics.cliques, metrics.enviados)}%</strong></div>
              </div>
            </div>
            <div className="card">
              <div className="chd"><div className="ctit"><span className="dot" style={{ background: 'var(--tel)' }} />Evolução Mensal</div></div>
              <EvolutionChart {...monthly} />
            </div>
          </div>

          <div className="slbl">Grupos & Fases</div>
          <div className="g2">
            <div className="card">
              <div className="chd"><div className="ctit"><span className="dot" style={{ background: 'var(--org)' }} />Top Grupos por Volume</div><span className="cbdg">Top 10</span></div>
              <table className="dtbl"><thead><tr><th>#</th><th>Grupo</th><th>Abertura</th><th>CTOR</th></tr></thead><tbody>
                {topGroups.map(([group, values], index) => (
                  <tr key={group}>
                    <td><span className="rk">{index + 1}</span></td>
                    <td><div className="nm">{group}</div><div className="ns">{fmt(values.enviados)} envios</div></td>
                    <td><span className={`pill ${percentage(values.abertos, values.enviados) > 40 ? 'po' : 'pm'}`}>{percentage(values.abertos, values.enviados)}%</span></td>
                    <td><span className={`pill ${percentage(values.cliques, values.abertos) > 25 ? 'pt' : 'pm'}`}>{percentage(values.cliques, values.abertos)}%</span></td>
                  </tr>
                ))}
              </tbody></table>
            </div>
            <div className="card">
              <div className="chd"><div className="ctit"><span className="dot" style={{ background: 'var(--tel)' }} />Por Fase CRM</div></div>
              <div className="fgrid">
                {phaseEntries.map(([phase, values], index) => {
                  const colors = ['#FF6D00', '#FF9038', '#00BFA5', '#1DE9B6', '#7C6AF9', '#A78BFA', '#00C853'];
                  const color = colors[index % colors.length];
                  const max = phaseEntries[0]?.[1].enviados || 1;
                  return (
                    <div className="fi" key={phase}>
                      <div className="fdot" style={{ background: color, boxShadow: `0 0 5px ${color}55` }} />
                      <div className="fn">{phase}</div>
                      <div className="fb"><div className="fbf" style={{ width: `${Math.round((values.enviados / max) * 100)}%`, background: color }} /></div>
                      <div className="fpct" style={{ color }}>{percentage(values.abertos, values.enviados)}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="slbl">Campanhas</div>
          <div className="g32">
            <div className="card">
              <div className="chd"><div className="ctit"><span className="dot" style={{ background: 'var(--org)' }} />Performance de Campanhas</div><span className="cbdg">Top 10</span></div>
              <table className="dtbl"><thead><tr><th>#</th><th>Campanha</th><th>Grupo</th><th>Tx. Abertura</th><th>CTOR</th></tr></thead><tbody>
                {topCampaigns.map((campaign, index) => (
                  <tr key={`${campaign.campanha}-${campaign.grupo}`}>
                    <td><span className="rk">{index + 1}</span></td>
                    <td><div className="nm">{campaign.campanha}</div></td>
                    <td><div className="ns">{campaign.grupo}</div></td>
                    <td><span className={`pill ${percentage(campaign.abertos, campaign.enviados) > 40 ? 'po' : 'pm'}`}>{percentage(campaign.abertos, campaign.enviados)}%</span></td>
                    <td><span className={`pill ${percentage(campaign.cliques, campaign.abertos) > 25 ? 'pt' : 'pm'}`}>{percentage(campaign.cliques, campaign.abertos)}%</span></td>
                  </tr>
                ))}
              </tbody></table>
            </div>
            <div className="card">
              <div className="chd"><div className="ctit"><span className="dot" style={{ background: 'var(--tel)' }} />Volume por Fase</div></div>
              <PhaseDonut labels={phaseEntries.map(([label]) => label)} values={phaseEntries.map(([, value]) => value.enviados)} />
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
