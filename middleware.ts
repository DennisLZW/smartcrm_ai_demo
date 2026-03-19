import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedPrefixes = ["/dashboard", "/customers", "/activities", "/settings"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtectedPage = protectedPrefixes.some((p) => pathname.startsWith(p));
  const isProtectedApi =
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth/") &&
    !pathname.startsWith("/api/gmail/oauth/") &&
    !pathname.startsWith("/api/dev/");

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  const token = await getToken({ req });
  if (!token) {
    if (isProtectedApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/customers/:path*", "/activities/:path*", "/settings/:path*", "/api/:path*"],
};

