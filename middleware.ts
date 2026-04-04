/**
 * middleware.ts — Edge middleware for route protection
 */
import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value;

  const publicPaths = ['/login', '/register', '/invite'];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  if (pathname.startsWith('/auth/callback')) return NextResponse.next();

  if (!token && !isPublic) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token && isPublic) {
    return NextResponse.redirect(new URL('/workspaces', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
