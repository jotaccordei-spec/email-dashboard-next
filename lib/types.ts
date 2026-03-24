export type DataRow = {
  grupo: string;
  remetente: string;
  dominio: string;
  campanha: string;
  etapaRegua: string;
  faseCrm: string;
  sentAt: string;
  sentMonth: string;
  diaRegua: number | null;
  enviados: number;
  entregues: number;
  abertos: number;
  cliques: number;
  descadastros: number;
};

export type DashboardState = {
  fileName: string;
  uploadedAt: string;
  rowCount: number;
  data: DataRow[];
};

export type Filters = {
  grupo?: string;
  campanha?: string;
  faseCrm?: string;
  emailType?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type AggregateMetrics = {
  enviados: number;
  entregues: number;
  abertos: number;
  cliques: number;
  descadastros: number;
};

export type FunnelStep = {
  key: keyof AggregateMetrics;
  label: string;
  value: number;
  rateFromPrevious: number;
  rateFromStart: number;
};

export type ReguaPoint = {
  day: number;
  label: string;
  enviados: number;
  abertos: number;
  openRate: number;
  etapas: string[];
};

export type GroupPerformance = {
  grupo: string;
  enviados: number;
  abertos: number;
  cliques: number;
  openRate: number;
  ctor: number;
};

export type PhasePerformance = {
  faseCrm: string;
  enviados: number;
  abertos: number;
  openRate: number;
};

export type CampaignPerformance = {
  campanha: string;
  grupo: string;
  enviados: number;
  abertos: number;
  cliques: number;
  openRate: number;
  ctor: number;
};

export type ReguaPerformance = {
  etapaRegua: string;
  faseCrm: string;
  enviados: number;
  abertos: number;
  openRate: number;
};
