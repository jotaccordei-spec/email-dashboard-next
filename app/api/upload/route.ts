import { NextRequest } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { parseSpreadsheet, processRows, validateColumns } from '@/lib/data';
import { redirectTo } from '@/lib/redirect';
import { saveDashboardState, saveUploadedFile } from '@/lib/store';

export async function POST(request: NextRequest) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return redirectTo('/admin/upload', { error: 'Sessão inválida' });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return redirectTo('/admin/upload', { error: 'Arquivo não enviado' });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    const rows = parseSpreadsheet(file.name, bytes);
    validateColumns(rows);
    const data = processRows(rows);

    if (data.length === 0) {
      return redirectTo('/admin/upload', { error: 'Nenhum dado válido foi processado' });
    }

    saveUploadedFile(file.name, bytes);
    saveDashboardState({
      fileName: file.name,
      uploadedAt: new Date().toISOString(),
      rowCount: data.length,
      data,
    });

    return redirectTo('/admin/upload', { success: `Base salva com ${data.length.toLocaleString('pt-BR')} linhas` });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao processar arquivo';
    return redirectTo('/admin/upload', { error: message });
  }
}
