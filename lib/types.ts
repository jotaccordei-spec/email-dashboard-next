export type DataRow = [
  grupo: string,
  remetente: string,
  campanha: string,
  fase: string,
  mes: string,
  enviados: number,
  entregues: number,
  abertos: number,
  cliques: number,
  descadastros: number,
];

export type DashboardState = {
  fileName: string;
  uploadedAt: string;
  rowCount: number;
  data: DataRow[];
};

export type Filters = {
  grupo?: string;
  campanha?: string;
  fase?: string;
  dateFrom?: string;
  dateTo?: string;
};
