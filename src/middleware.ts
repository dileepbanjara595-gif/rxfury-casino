import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Allow public static assets and files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/icons') ||
    pathname === '/favicon.ico' ||
    pathname === '/logo.png' ||
    pathname === '/plane.png' ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.ico')
  ) {
    return NextResponse.next();
  }

  // 2. Allow public unauthenticated routes: /login, /register, and legal compliance pages
  const isAuthOrLegalPage = 
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/kyc-aml') ||
    pathname.startsWith('/responsible-gaming');

  // Check for active NextAuth JWT session token
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_development" 
  });

  // If user is logged in and tries to access /login or /register, redirect them to homepage
  if (token && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // If page is public auth/legal page, allow access
  if (isAuthOrLegalPage) {
    return NextResponse.next();
  }

  
  // 3. Admin Panel Auth Wall
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!token) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if ((token as any).role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  // 4. Strict Auth Wall for User Pages
  if (!token && pathname !== '/') {
    // If it's the admin login page, allow it
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }
    
    const loginUrl = new URL('/login', req.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('callbackUrl', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }


  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth routes
     * - _next/static, _next/image
     * - favicon.ico
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
