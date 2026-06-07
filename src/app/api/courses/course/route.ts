import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/config/db";
import { chapterContentSlides, courses } from "@/config/schema";

function getCourseChapters(courseLayout: unknown) {
  const chapters = (courseLayout as { chapters?: unknown } | null)?.chapters;
  return Array.isArray(chapters) ? chapters : [];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const courseId =
      typeof body?.courseId === "string" ? body.courseId.trim() : "";

    if (!courseId) {
      return NextResponse.json(
        {
          success: false,
          exists: false,
          message: "Missing required field: courseId.",
        },
        { status: 400 },
      );
    }

    const courseRecords = await db
      .select()
      .from(courses)
      .where(eq(courses.courseId, courseId))
      .limit(1);

    if (courseRecords.length === 0) {
      return NextResponse.json(
        {
          success: true,
          exists: false,
          message: "Course not found.",
        },
        { status: 200 },
      );
    }

    const course = courseRecords[0];
    const chapters = getCourseChapters(course.courseLayout);

    const slides = await db
      .select()
      .from(chapterContentSlides)
      .where(eq(chapterContentSlides.courseId, courseId))
      .orderBy(asc(chapterContentSlides.slideIndex));

    const chaptersWithSlides = chapters.map((chapter: any) => ({
      ...chapter,
      slides: slides.filter((slide) => slide.chapterId === chapter.chapterId),
    }));

    return NextResponse.json(
      {
        success: true,
        exists: true,
        message: "Course found successfully.",
        course,
        chapters,
        slides,
        chaptersWithSlides,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("[API courses/course] Failed to fetch course:", error);

    return NextResponse.json(
      {
        success: false,
        exists: false,
        error: "Internal Server Error",
        message: error?.message || "Failed to fetch course details.",
      },
      { status: 500 },
    );
  }
}
