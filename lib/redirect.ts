import { NextRequest, NextResponse } from 'next/server';

type RedirectParams = Record<string, string | undefined>;

export function redirectTo(request: NextRequest, pathname: string, params?: RedirectParams) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (!value) continue;
      url.searchParams.set(key, value);
    }
  }

  return NextResponse.redirect(url, 303);
}
