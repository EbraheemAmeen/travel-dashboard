import { NextRequest, NextResponse } from "next/server";



const PUBLIC_PATHS = ['/login'];

export function middleware(req: NextRequest) {
  const token = req.cookies.get('accessToken')?.value;
  const isLoggedIn = !!token;
  const isLoginPage = req.nextUrl.pathname === '/login';

  if (!isLoggedIn && !PUBLIC_PATHS.includes(req.nextUrl.pathname)) {
    // If not logged in, redirect to login
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isLoggedIn && isLoginPage) {
    // If logged in and trying to access login page, redirect to home
    return NextResponse.redirect(new URL('/home', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|static|favicon.ico).*)'],
};
