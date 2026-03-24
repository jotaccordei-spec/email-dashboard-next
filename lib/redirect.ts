import { NextResponse } from 'next/server';

type RedirectParams = Record<string, string | undefined>;

function buildLocation(pathname: string, params?: RedirectParams): string {
  const search = new URLSearchParams();

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (!value) continue;
      search.set(key, value);
    }
  }

  const query = search.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function redirectTo(pathname: string, params?: RedirectParams) {
  return new NextResponse(null, {
    status: 303,
    headers: {
      Location: buildLocation(pathname, params),
    },
  });
}
