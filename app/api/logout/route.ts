import { NextResponse } from "next/server";

// Deliberately unguarded: logging out must succeed even when the token is
// already expired or malformed, and it only ever clears state.
export async function POST() {
  const response = NextResponse.json({ message: "Logged out" }, { status: 200 });

  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return response;
}
