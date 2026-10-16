import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const MIDDLEWARE_COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'lax' as const,
  httpOnly: false,
  maxAge: 400 * 24 * 60 * 60, // 400 days persistent cookie
};

export const updateSupabaseSession = async (request: NextRequest) => {
  const pathname = request.nextUrl.pathname;

  // Let API routes and static/PWA assets handle their own lifecycle without
  // running a duplicate `auth.getUser()` token refresh in middleware.
  const isPublicAssetOrApi =
    pathname.startsWith('/api') ||
    pathname.startsWith('/landing') ||
    pathname.startsWith('/manifest') ||
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/icons');

  if (isPublicAssetOrApi || !supabaseUrl || !supabaseKey) {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookieOptions: MIDDLEWARE_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Only write refreshed/updated session cookies; never wipe cookies in middleware
        // due to a concurrent refresh race from another tab or background request.
        const validCookies = cookiesToSet.filter(
          ({ value, options }) => Boolean(value) && options?.maxAge !== 0
        );
        if (validCookies.length === 0) return;

        validCookies.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        validCookies.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, {
            ...MIDDLEWARE_COOKIE_OPTIONS,
            ...options,
            maxAge: options?.maxAge ?? MIDDLEWARE_COOKIE_OPTIONS.maxAge,
          })
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/auth');

  if (!user && !isAuthPage) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    if (pathname !== '/') {
      loginUrl.searchParams.set('next', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (user && pathname.startsWith('/login')) {
    const nextPath = request.nextUrl.searchParams.get('next') || '/';
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = nextPath.startsWith('/') ? nextPath : '/';
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
};

