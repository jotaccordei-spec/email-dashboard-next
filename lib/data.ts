import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { GMAP } from '@/lib/gmap';
import { DataRow, Filters } from '@/lib/types';

const REQUIRED_COLUMNS = ['Remetente', 'Enviados', 'Entregues', 'Abertos', 'Cliques'] as const;

type RawRow = Record<string, unknown>;

function parseNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value !== 'string') return 0;
  const normalized = value.trim().replace(/\./g, '').replace(',', '.');
  const numeric = Number.parseFloat(normalized);
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeMonth(rawDate: unknown): string {
  if (!rawDate) return '';
  if (typeof rawDate === 'number') {
    const d = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  if (rawDate instanceof Date && !Number.isNaN(rawDate.getTime())) {
    return `${rawDate.getFullYear()}-${String(rawDate.getMonth() + 1).padStart(2, '0')}`;
  }

  const str = String(rawDate).trim();
  if (!str) return '';

  const direct = new Date(str);
  if (!Number.isNaN(direct.getTime())) {
    return `${direct.getFullYear()}-${String(direct.getMonth() + 1).padStart(2, '0')}`;
  }

  const brMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) {
    return `${brMatch[3]}-${brMatch[2]}`;
  }

  const ymMatch = str.match(/^(\d{4})-(\d{2})/);
  if (ymMatch) {
    return `${ymMatch[1]}-${ymMatch[2]}`;
  }

  return '';
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

    const entregues = parseNumber(row.Entregues);
    const abertos = parseNumber(row.Abertos);
    const cliques = parseNumber(row.Cliques);
    const descadastros = parseNumber(row.Descadastros);

    const remetente = String(row.Remetente ?? '').trim();
    const campanha = String(row.Campanha ?? '').trim() || '(sem nome)';
    const fase = String(row.Fase_CRM ?? 'Outros').trim() || 'Outros';
    const grupo = GMAP[remetente] || 'Outros';
    const mes = normalizeMonth(row['Ano_Mês'] ?? row.Ano_Mes ?? row.ano_mes ?? row.mes ?? '');

    if (!mes) continue;

    processed.push([grupo, remetente, campanha, fase, mes, enviados, entregues, abertos, cliques, descadastros]);
  }

  return processed;
}

export function applyFilters(data: DataRow[], filters: Filters): DataRow[] {
  return data.filter((row) => {
    if (filters.grupo && row[0] !== filters.grupo) return false;
    if (filters.campanha && row[2] !== filters.campanha) return false;
    if (filters.fase && row[3] !== filters.fase) return false;
    if (filters.dateFrom && row[4] < filters.dateFrom.slice(0, 7)) return false;
    if (filters.dateTo && row[4] > filters.dateTo.slice(0, 7)) return false;
    return true;
  });
}

export function aggregate(data: DataRow[]) {
  return data.reduce(
    (acc, row) => {
      acc.enviados += row[5];
      acc.entregues += row[6];
      acc.abertos += row[7];
      acc.cliques += row[8];
      acc.descadastros += row[9];
      return acc;
    },
    { enviados: 0, entregues: 0, abertos: 0, cliques: 0, descadastros: 0 },
  );
}

export function percentage(part: number, total: number): number {
  if (total <= 0) return 0;
  return Number(((part / total) * 100).toFixed(1));
}

export function uniqueValues(data: DataRow[], index: 0 | 2 | 3): string[] {
  return [...new Set(data.map((row) => row[index]))].filter(Boolean).sort((a, b) => a.localeCompare(b));
}
