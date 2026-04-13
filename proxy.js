import { NextResponse } from 'next/server';

export function proxy(request) {
    const response = NextResponse.next();
    // Pass the pathname to server components via header
    response.headers.set('x-pathname', request.nextUrl.pathname);
    return response;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|icon-192.png|icon-512.png).*)'],
};