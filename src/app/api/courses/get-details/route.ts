import { NextResponse, NextRequest } from "next/server";
import { db } from "@/config/db";
import { courses, chapterContentSlides } from "@/config/schema";

export async function GET(request: NextRequest) {
  try {
    // 1. EXTRACT QUERY METADATA PARAMETERS SAFELY
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json(
        {
          exists: false,
          error: "Bad Request Payload",
          message: "Missing required courseId search parameter string.",
        },
        { status: 400 },
      );
    }

    console.log(
      `[API Get Details] In-Memory scan running for courseId: ${courseId}`,
    );

    // 2. FETCH ALL ENTRIES AND FILTER NATIVELY IN JAVASCRIPT
    // This stops Postgres from executing ANY conditional matching logic on course_id,
    // completely eliminating the database type-casting crash.
    const allCourses = await db.select().from(courses);

    const courseRecord = allCourses.find(
      (course: any) =>
        String(course.courseId).toLowerCase() === courseId.toLowerCase(),
    );

    if (!courseRecord) {
      console.warn(
        `[DATABASE MISS] No course entry blueprint verified for courseId: ${courseId}`,
      );
      return NextResponse.json(
        {
          exists: false,
          message:
            "Requested course entry layout blueprint does not exist inside database arrays.",
        },
        { status: 200 }, // Retaining 200 so the frontend handles it gracefully
      );
    }

    // 3. FETCH AND FILTER THE SLIDES ARRAY NATIVELY
    const allSlides = await db.select().from(chapterContentSlides);

    const associatedSlides = allSlides
      .filter(
        (slide: any) =>
          String(slide.courseId).toLowerCase() === courseId.toLowerCase(),
      )
      .sort((a: any, b: any) => (a.slideIndex || 0) - (b.slideIndex || 0));

    console.log(
      `[DATABASE HIT] Successfully matched course record with ${associatedSlides.length} slides via runtime memory filter.`,
    );

    // 4. PACK AND EXPORT LOGISTICAL BLUEPRINT TO FRONTEND WORKSPACE
    return NextResponse.json(
      {
        exists: true,
        course: courseRecord,
        slides: associatedSlides,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("[DEV CRITICAL EXCEPTION - GET DETAILS ROUTE]:", error);
    return NextResponse.json(
      {
        error: "Server Exception",
        details:
          error.message ||
          "An unhandled execution error crashed your database driver matrix query pipeline.",
      },
      { status: 500 },
    );
  }
}
