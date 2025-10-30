import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith('/elleapi') || request.nextUrl.pathname.startsWith('/_next')) {
        return NextResponse.next();
    }

    const currentUser = request.cookies.get('currentUser')?.value;
    

    if (['/login', '/signup'].includes(request.nextUrl.pathname)) {
        if (currentUser) {
            const url = request.nextUrl.clone();
            url.pathname = '/profile';
            return NextResponse.redirect(url);
        }
        return NextResponse.next();
    }

    if (!currentUser || Date.now() > JSON.parse(currentUser).expiredAt) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        request.cookies.delete('currentUser');
        const response = NextResponse.redirect(url);
        response.cookies.delete('currentUser');

        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/games/:path+', '/login', '/signup', '/profile', '/prof/:path*']
};
