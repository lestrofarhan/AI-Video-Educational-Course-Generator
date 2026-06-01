// src/app/api/slides/route.ts
import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { chapterContentSlides } from "@/config/schema";
import { and, eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const chapterId = searchParams.get("chapterId"); // Maps directly to your chapterSlug

    // --- STRUCTURAL INPUT VALIDATION ENGINE ---
    if (!courseId || !chapterId) {
      return NextResponse.json(
        {
          error: "Developer Parameter Mismatch",
          message:
            "Both 'courseId' and 'chapterId' are explicitly required query strings for this endpoint.",
          received: { courseId, chapterId },
        },
        { status: 400 },
      );
    }

    console.log(
      `[API slides Check] Querying slides for Course: ${courseId}, Chapter: ${chapterId}`,
    );

    // Query DB for matching assets ordered sequentially
    const existingSlides = await db
      .select()
      .from(chapterContentSlides)
      .where(
        and(
          eq(chapterContentSlides.courseId, courseId),
          eq(chapterContentSlides.chapterId, chapterId),
        ),
      )
      .orderBy(chapterContentSlides.slideIndex);

    return NextResponse.json(
      {
        courseId,
        chapterId,
        count: existingSlides.length,
        slides: existingSlides,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("[DEV EXCEPTION ERROR - SLIDES GET ROUTE]:", error);
    return NextResponse.json(
      {
        error: "Internal Query Processing Failure",
        message:
          error.message || "Could not retrieve records from database tables.",
        stack: error.stack,
      },
      { status: 500 },
    );
  }
}
