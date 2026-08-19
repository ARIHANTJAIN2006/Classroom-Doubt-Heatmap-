import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }
    

    const normalizedEmail = email.toLowerCase().trim();
    const hashedPassword = await bcrypt.hash(password, 10);
console.log("password hashed");
console.log("signup started")
console.log(
  "NEON ENV EXISTS:",
  !!process.env.NEON_DB_CONNECTION_STRING
);
    const teacher = await prisma.teacher.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
      },
    });
    console.log("signup completed")

    return NextResponse.json(
      {
        message: "Account created successfully",
        teacher: {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
        },
      },
      {
        status: 201,
      }
    );

  } catch (error: any) {
 console.error("========== SIGNUP ERROR ==========");
  console.dir(error, { depth: null });

  if (error instanceof Error) {
    console.error("NAME:", error.name);
    console.error("MESSAGE:", error.message);
    console.error("STACK:", error.stack);
  }
    if (error.code === "P2002") {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}