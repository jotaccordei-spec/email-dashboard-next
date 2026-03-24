import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { GMAP } from '@/lib/gmap';
import {
  AggregateMetrics,
  CampaignPerformance,
  DataRow,
  Filters,
  FunnelStep,
  GroupPerformance,
  PhasePerformance,
  ReguaPerformance,
  ReguaPoint,
} from '@/lib/types';

const REQUIRED_COLUMNS = ['Remetente', 'Ano_Mês', 'Enviados', 'Entregues', 'Abertos', 'Cliques', 'Campanha', 'Etapa_Régua', 'Fase_CRM', 'Dia_Regua'] as const;

type RawRow = Record<string, unknown>;

const EMPTY_METRICS: AggregateMetrics = {
  enviados: 0,
  entregues: 0,
  abertos: 0,
  cliques: 0,
  descadastros: 0,
};

function parseNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value !== 'string') return 0;
  const normalized = value.trim().replace(/\./g, '').replace(',', '.');
  const numeric = Number.parseFloat(normalized);
  return Number.isFinite(numeric) ? numeric : 0;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function normalizeDateParts(rawDate: unknown): { sentAt: string; sentMonth: string } | null {
  if (!rawDate) return null;

  const formatDate = (date: Date) => {
    if (Number.isNaN(date.getTime())) return null;

    const year = date.getUTCFullYear();
    const month = pad(date.getUTCMonth() + 1);
    const day = pad(date.getUTCDate());

    return {
      sentAt: `${year}-${month}-${day}`,
      sentMonth: `${year}-${month}`,
    };
  };

  if (typeof rawDate === 'number') {
    return formatDate(new Date(Math.round((rawDate - 25569) * 86400 * 1000)));
  }

  if (rawDate instanceof Date) {
    return formatDate(rawDate);
  }

  const str = String(rawDate).trim();
  if (!str) return null;

  const brDateTime = str.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+\d{2}:\d{2}(?::\d{2})?)?$/);
  if (brDateTime) {
    const [, day, month, year] = brDateTime;
    return {
      sentAt: `${year}-${month}-${day}`,
      sentMonth: `${year}-${month}`,
    };
  }

  const direct = formatDate(new Date(str));
  if (direct) return direct;

  const ymMatch = str.match(/^(\d{4})-(\d{2})/);
  if (ymMatch) {
    return {
      sentAt: `${ymMatch[1]}-${ymMatch[2]}-01`,
      sentMonth: `${ymMatch[1]}-${ymMatch[2]}`,
    };
  }

  return null;
}

export function parseSpreadsheet(fileName: string, bytes: Buffer): RawRow[] {
  const lower = fileName.toLowerCase();

  if (lower.endsWith('.csv')) {
    const csv = bytes.toString('utf-8');
    const result = Papa.parse<RawRow>(csv, {
      header: true,
      delimiter: csv.includes(';') ? ';' : ',',
      skipEmptyLines: true,
    });

    if (result.errors.length > 0) {
      throw new Error(`Falha ao ler CSV: ${result.errors[0]?.message ?? 'erro desconhecido'}`);
    }

    return result.data;
  }

  const workbook = XLSX.read(bytes, { type: 'buffer', cellDates: true });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<RawRow>(worksheet, { defval: '' });
}

export function validateColumns(rows: RawRow[]): void {
  if (rows.length === 0) throw new Error('Arquivo vazio.');
  const columns = Object.keys(rows[0]);
  const missing = REQUIRED_COLUMNS.filter((column) => !columns.includes(column));
  if (missing.length > 0) {
    throw new Error(`Colunas faltando: ${missing.join(', ')}`);
  }
}

export function processRows(rows: RawRow[]): DataRow[] {
  const processed: DataRow[] = [];

  for (const row of rows) {
    const enviados = parseNumber(row.Enviados);
    if (enviados <= 0) continue;

    const dateParts = normalizeDateParts(row['Ano_Mês'] ?? row.Ano_Mes ?? row.ano_mes ?? row.mes ?? '');
    if (!dateParts) continue;

    const remetente = String(row.Remetente ?? '').trim();
    const dominio = String(row['Domínio'] ?? row.Dominio ?? '').trim() || remetente;
    const campanha = String(row.Campanha ?? '').trim() || '(sem nome)';
    const etapaRegua = String(row['Etapa_Régua'] ?? row.Etapa_Regua ?? '').trim() || 'Sem etapa';
    const faseCrm = String(row.Fase_CRM ?? 'Outros').trim() || 'Outros';
    const diaReguaValue = parseNumber(row.Dia_Regua ?? row['Dia_Régua']);
    const diaRegua = diaReguaValue > 0 ? Math.round(diaReguaValue) : null;

    processed.push({
      grupo: GMAP[remetente] || remetente || 'Outros',
      remetente,
      dominio,
      campanha,
      etapaRegua,
      faseCrm,
      sentAt: dateParts.sentAt,
      sentMonth: dateParts.sentMonth,
      diaRegua,
      enviados,
      entregues: parseNumber(row.Entregues),
      abertos: parseNumber(row.Abertos),
      cliques: parseNumber(row.Cliques),
      descadastros: parseNumber(row.Descadastros),
    });
  }

  return processed;
}

export function applyFilters(data: DataRow[], filters: Filters): DataRow[] {
  return data.filter((row) => {
    if (filters.grupo && row.grupo !== filters.grupo) return false;
    if (filters.campanha && row.campanha !== filters.campanha) return false;
    if (filters.faseCrm && row.faseCrm !== filters.faseCrm) return false;
    if (filters.dateFrom && row.sentMonth < filters.dateFrom) return false;
    if (filters.dateTo && row.sentMonth > filters.dateTo) return false;
    return true;
  });
}

export function applyEmailTypeFilter(data: DataRow[], emailType?: string): DataRow[] {
  if (!emailType) return data;
  return data.filter((row) => row.faseCrm === emailType);
}

export function aggregate(data: DataRow[]): AggregateMetrics {
  return data.reduce((acc, row) => {
    acc.enviados += row.enviados;
    acc.entregues += row.entregues;
    acc.abertos += row.abertos;
    acc.cliques += row.cliques;
    acc.descadastros += row.descadastros;
    return acc;
  }, { ...EMPTY_METRICS });
}

export function percentage(part: number, total: number): number {
  if (total <= 0) return 0;
  return Number(((part / total) * 100).toFixed(1));
}

export function uniqueValues(data: DataRow[], selector: (row: DataRow) => string): string[] {
  return [...new Set(data.map(selector))].filter(Boolean).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function buildFunnelSteps(metrics: AggregateMetrics): FunnelStep[] {
  return [
    { key: 'enviados', label: 'Enviados', value: metrics.enviados, rateFromPrevious: 100, rateFromStart: 100 },
    { key: 'entregues', label: 'Entregues', value: metrics.entregues, rateFromPrevious: percentage(metrics.entregues, metrics.enviados), rateFromStart: percentage(metrics.entregues, metrics.enviados) },
    { key: 'abertos', label: 'Abertos', value: metrics.abertos, rateFromPrevious: percentage(metrics.abertos, metrics.entregues), rateFromStart: percentage(metrics.abertos, metrics.enviados) },
    { key: 'cliques', label: 'Cliques', value: metrics.cliques, rateFromPrevious: percentage(metrics.cliques, metrics.abertos), rateFromStart: percentage(metrics.cliques, metrics.enviados) },
  ];
}

export function buildReguaSeries(data: DataRow[]): ReguaPoint[] {
  const grouped = new Map<number, { enviados: number; abertos: number; etapas: Set<string> }>();

  for (const row of data) {
    if (row.diaRegua === null) continue;

    const entry = grouped.get(row.diaRegua) ?? { enviados: 0, abertos: 0, etapas: new Set<string>() };
    entry.enviados += row.enviados;
    entry.abertos += row.abertos;
    entry.etapas.add(row.etapaRegua);
    grouped.set(row.diaRegua, entry);
  }

  return [...grouped.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([day, values]) => ({
      day,
      label: `D${day}`,
      enviados: values.enviados,
      abertos: values.abertos,
      openRate: percentage(values.abertos, values.enviados),
      etapas: [...values.etapas].slice(0, 3),
    }));
}

export function buildGroupPerformance(data: DataRow[]): GroupPerformance[] {
  const grouped = new Map<string, { enviados: number; abertos: number; cliques: number }>();

  for (const row of data) {
    const entry = grouped.get(row.grupo) ?? { enviados: 0, abertos: 0, cliques: 0 };
    entry.enviados += row.enviados;
    entry.abertos += row.abertos;
    entry.cliques += row.cliques;
    grouped.set(row.grupo, entry);
  }

  return [...grouped.entries()]
    .map(([grupo, values]) => ({
      grupo,
      enviados: values.enviados,
      abertos: values.abertos,
      cliques: values.cliques,
      openRate: percentage(values.abertos, values.enviados),
      ctor: percentage(values.cliques, values.abertos),
    }))
    .sort((a, b) => b.enviados - a.enviados);
}

export function buildPhasePerformance(data: DataRow[]): PhasePerformance[] {
  const grouped = new Map<string, { enviados: number; abertos: number }>();

  for (const row of data) {
    const entry = grouped.get(row.faseCrm) ?? { enviados: 0, abertos: 0 };
    entry.enviados += row.enviados;
    entry.abertos += row.abertos;
    grouped.set(row.faseCrm, entry);
  }

  return [...grouped.entries()]
    .map(([faseCrm, values]) => ({
      faseCrm,
      enviados: values.enviados,
      abertos: values.abertos,
      openRate: percentage(values.abertos, values.enviados),
    }))
    .sort((a, b) => b.openRate - a.openRate);
}

export function buildCampaignPerformance(data: DataRow[]): CampaignPerformance[] {
  const grouped = new Map<string, { campanha: string; grupo: string; enviados: number; abertos: number; cliques: number }>();

  for (const row of data) {
    const key = `${row.campanha}|||${row.grupo}`;
    const entry = grouped.get(key) ?? { campanha: row.campanha, grupo: row.grupo, enviados: 0, abertos: 0, cliques: 0 };
    entry.enviados += row.enviados;
    entry.abertos += row.abertos;
    entry.cliques += row.cliques;
    grouped.set(key, entry);
  }

  return [...grouped.values()]
    .map((entry) => ({
      ...entry,
      openRate: percentage(entry.abertos, entry.enviados),
      ctor: percentage(entry.cliques, entry.abertos),
    }))
    .sort((a, b) => b.enviados - a.enviados);
}

export function buildReguaPerformance(data: DataRow[]): ReguaPerformance[] {
  const grouped = new Map<string, { etapaRegua: string; faseCrm: string; enviados: number; abertos: number }>();

  for (const row of data) {
    const key = `${row.etapaRegua}|||${row.faseCrm}`;
    const entry = grouped.get(key) ?? { etapaRegua: row.etapaRegua, faseCrm: row.faseCrm, enviados: 0, abertos: 0 };
    entry.enviados += row.enviados;
    entry.abertos += row.abertos;
    grouped.set(key, entry);
  }

  return [...grouped.values()]
    .map((entry) => ({
      ...entry,
      openRate: percentage(entry.abertos, entry.enviados),
    }))
    .sort((a, b) => b.openRate - a.openRate);
}
