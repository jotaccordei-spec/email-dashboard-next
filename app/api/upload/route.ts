import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { parseSpreadsheet, processRows, validateColumns } from '@/lib/data';
import { saveDashboardState, saveUploadedFile } from '@/lib/store';

export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.redirect(new URL('/admin/upload?error=Sess%C3%A3o%20inv%C3%A1lida', request.url));
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.redirect(new URL('/admin/upload?error=Arquivo%20n%C3%A3o%20enviado', request.url));
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    const rows = parseSpreadsheet(file.name, bytes);
    validateColumns(rows);
    const data = processRows(rows);

    if (data.length === 0) {
      return NextResponse.redirect(new URL('/admin/upload?error=Nenhum%20dado%20v%C3%A1lido%20foi%20processado', request.url));
    }

    saveUploadedFile(file.name, bytes);
    saveDashboardState({
      fileName: file.name,
      uploadedAt: new Date().toISOString(),
      rowCount: data.length,
      data,
    });

    return NextResponse.redirect(new URL(`/admin/upload?success=${encodeURIComponent(`Base salva com ${data.length.toLocaleString('pt-BR')} linhas`)}`, request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao processar arquivo';
    return NextResponse.redirect(new URL(`/admin/upload?error=${encodeURIComponent(message)}`, request.url));
  }
}
