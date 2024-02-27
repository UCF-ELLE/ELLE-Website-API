import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith('/elleapi') || request.nextUrl.pathname.startsWith('/_next')) {
        return NextResponse.next();
    }
    const currentUser = request.cookies.get('currentUser')?.value;

    if (['/login', '/signup'].includes(request.nextUrl.pathname)) {
        if (currentUser) {
            return NextResponse.redirect(new URL('/profile', request.url));
        }
        return NextResponse.next();
    }
    if (!currentUser || Date.now() > JSON.parse(currentUser).expiredAt) {
        request.cookies.delete('currentUser');
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('currentUser');

        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/games/:path+', '/login', '/signup', '/profile']
};
