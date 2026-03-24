import fs from 'node:fs';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { getPaths } from '@/lib/store';

export async function GET(_: NextRequest, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  const decoded = decodeURIComponent(name);
  const { generatedDir } = getPaths();
  const fullPath = path.join(generatedDir, decoded);

  if (!fullPath.startsWith(generatedDir) || !fs.existsSync(fullPath)) {
    return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 });
  }

  const content = fs.readFileSync(fullPath);
  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${decoded}"`,
    },
  });
}
