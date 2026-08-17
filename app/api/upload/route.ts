import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";
import { customAlphabet } from "nanoid";

cloudinary.config({
  cloud_name: "dnz3igqb4",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("pdf") as File | null;
    const name = formData.get("name") as string | null;
    const topic = formData.get("topic") as string | null;
    const semester = Number(formData.get("semester"));
    const year = Number(formData.get("year"));
    const teacherId = req.headers.get("x-teacher-id");

    if (
      !file ||
      !name?.trim() ||
      !topic?.trim() ||
      !Number.isInteger(semester) ||
      !Number.isInteger(year)
    ) {
      return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
    }

    if (!teacherId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    const upload = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "image", folder: "lectures", format: "pdf" },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      stream.end(bytes);
    });

    let joinCode = nanoid();
    while (await prisma.lecture.findUnique({ where: { joinCode } })) {
      joinCode = nanoid();
    }

    const lecture = await prisma.lecture.create({
      data: {
        name,
        topic,
        semester,
        year,
        pdfUrl: upload.secure_url,
        pdfPublicId: upload.public_id,
        joinCode,
        teacherId,
      },
    });

    return NextResponse.json({ success: true, lecture });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}