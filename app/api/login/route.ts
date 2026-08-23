import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

// Compared against when no teacher matches, so the unknown-email branch costs
// roughly the same time as a real bcrypt check.
const DUMMY_HASH = "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Signup stores the address lowercased and trimmed, so match it the same way.
    const teacher = await prisma.teacher.findUnique({
      where: {
        email: email.toLowerCase().trim(),
      },
    });

    // An unknown email and a wrong password must be indistinguishable, or the
    // response reveals which addresses are registered.
    if (!teacher) {
      await bcrypt.compare(password, DUMMY_HASH);
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      teacher.password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      {
        id: teacher.id,
        email: teacher.email,
      },
      JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    const response = NextResponse.json(
      {
        message: "Login successful",
        teacher: {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
        },
      },
      {
        status: 200,
      }
    );

    response.cookies.set(
      "token",
      token,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60,
        sameSite: "strict",
        path: "/",
      }
    );

    return response;
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}