import { NextRequest, NextResponse } from 'next/server';
import { readGeneratedFile } from '@/lib/store';

export async function GET(_: NextRequest, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  const decoded = decodeURIComponent(name);
  const file = readGeneratedFile(decoded);

  if (!file) {
    return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.content), {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${file.name}"`,
    },
  });
}
