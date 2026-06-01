import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/config/db";
import { courses } from "@/config/schema";



export async function GET(request: Request) {

  console.log("[API user-courses] GET request received.");

  try {
    const clerkUser =  await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required." },
        { status: 401 },
      );
    }

    const currentEmail = clerkUser.emailAddresses[0]?.emailAddress;
    if (!currentEmail) {
      return NextResponse.json(
        { error: "Missing email", message: "No primary email found." },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedEmail = searchParams.get("email")?.trim();
    const email = requestedEmail || currentEmail;

    if (email !== currentEmail) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "You can only load courses for the signed-in account.",
        },
        { status: 403 },
      );
    }

    const records = await db
      .select()
      .from(courses)
      .where(eq(courses.userId, email))
      .orderBy(desc(courses.createdAt));

    const payload = records.map((course) => ({
      id: course.id,
      courseId: course.courseId,
      courseName: course.courseName,
      userInput: course.userInput,
      type: course.type,
      createdAt: course.createdAt,
      chapterCount: Array.isArray((course.courseLayout as any)?.chapters)
        ? (course.courseLayout as any).chapters.length
        : 0,
    }));

    return NextResponse.json(
      {
        email,
        count: payload.length,
        courses: payload,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("[API user-courses] Failed to load courses:", error);
    return NextResponse.json(
      {
        error: "Internal Error",
        message: error.message || "Failed to retrieve courses.",
      },
      { status: 500 },
    );
  }
}
