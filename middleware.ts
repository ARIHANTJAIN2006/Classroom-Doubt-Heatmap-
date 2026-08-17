import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

const secret = new TextEncoder().encode(JWT_SECRET);

export async function middleware(req: NextRequest) {
  try {
    // Get JWT from cookie
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify JWT and extract payload
    const { payload } = await jwtVerify(token, secret);

    const teacherId = payload.id;
    const email = payload.email;

    if (
      typeof teacherId !== "string" ||
      typeof email !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid token payload" },
        { status: 401 }
      );
    }

    // Copy existing request headers
    const requestHeaders = new Headers(req.headers);

    // Attach authenticated information
    requestHeaders.set("x-teacher-id", teacherId);
    requestHeaders.set("x-teacher-email", email);

    // Continue request with modified headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error("Middleware authentication error:", error);

    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: [
    "/api/upload/:path*",
    "/api/teacher/:path*",
  ],
};