import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname.startsWith("/api/admin/");

  const isPublicAdminPage = pathname === "/admin/login";
  const isPublicAdminApi = pathname === "/api/admin/auth/login";

  if ((isAdminPage && !isPublicAdminPage) || (isAdminApi && !isPublicAdminApi)) {
    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    if (!token) return reject(req);

    try {
      await verifyAdminToken(token);
    } catch {
      return reject(req);
    }
  }

  return NextResponse.next();
}

function reject(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};



