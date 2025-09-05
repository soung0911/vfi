import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const allowedRoutes = ["/login", "/main"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!allowedRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const username = request.cookies.get("user_name")?.value;

  if (!username && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (username && pathname === "/login") {
    return NextResponse.redirect(new URL("/main", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
