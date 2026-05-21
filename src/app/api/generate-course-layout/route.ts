// src/app/api/generate-course-layout/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { aiEngine } from "@/config/gemini";
import { COURSE_ARCHITECT_PROMPT } from "@/data/prompt";
import { db } from "@/config/db";
import { courses } from "@/config/schema";

export async function POST(req: Request) {
  try {
    // 1. Authenticate user session with Clerk
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized profile" },
        { status: 401 },
      );
    }
    const userEmail = user.emailAddresses[0]?.emailAddress;

    // 2. Grab incoming frontend request payload parameters
    const { userInput, courseId, type } = await req.json();
    if (!userInput || !courseId || !type) {
      return NextResponse.json(
        { error: "Missing critical parameters" },
        { status: 400 },
      );
    }

    // 3. Dispatch the compilation payload parameters to Google Gemini
    const response = await aiEngine.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a course outline for the topic: "${userInput}". Layout depth selection: "${type}".`,
      config: {
        systemInstruction: COURSE_ARCHITECT_PROMPT,
        // Enforces strict JSON structure generation at the core model layer
        responseMimeType: "application/json",
      },
    });

    const rawContent = response.text;
    if (!rawContent) {
      return NextResponse.json(
        { error: "AI generation layer returned empty string" },
        { status: 500 },
      );
    }

    // 4. Parse the verified JSON string output into an object
    const structuredLayout = JSON.parse(rawContent);

    // 5. Insert data records directly into Neon Postgres with Drizzle ORM
    const [insertedCourse] = await db
      .insert(courses)
      .values({
        courseId,
        courseName:
          structuredLayout.courseName || "Untitled AI Generated Course",
        userId: userEmail,
        userInput,
        type,
        courseLayout: structuredLayout,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: "Course compiled and written down safely.",
        course: insertedCourse,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Generation pipeline failure:", error);
    return NextResponse.json(
      { error: "Internal system fault", details: error.message },
      { status: 500 },
    );
  }
}
