import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 🔹 تجاهل أي طلب API / Axios
  const isApiRequest =
    request.headers.get('accept')?.includes('application/json');

  if (isApiRequest) {
    return NextResponse.next();
  }

  const publicPaths = ['/login'];
  const isPublicPath = publicPaths.some((path) =>
    pathname.startsWith(path)
  );

  const token = request.cookies.get('access_token')?.value;

  if (!isPublicPath && !token && pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
