import { NextResponse, NextRequest } from "next/server";
import { db } from "@/config/db";
import { courses } from "@/config/schema";
import { v4 as uuidv4 } from "uuid";

// Simulating the structural JSON payload returned by your AI engine
async function generateCourseLayoutWithAI(prompt: string, level: string) {
  return {
    chapters: [
      {
        chapterId: "chap-1-" + uuidv4().substring(0, 8),
        title: "The Power of Semantic HTML5",
        summary: `Understand what semantic HTML is and why it's crucial for modern web development at a ${level} level.`,
        subContent: [
          "Understand what semantic HTML is and why it's crucial.",
          "Explore the benefits: improved readability, better SEO, and enhanced accessibility.",
          "Differentiate between semantic and non-semantic elements.",
        ],
      },
      {
        chapterId: "chap-2-" + uuidv4().substring(0, 8),
        title: "Key Semantic HTML5 Elements",
        summary:
          "Identify common structural elements like header, nav, main, and footer.",
        subContent: [
          "Identify common structural elements like <header>, <nav>, <main>, and <footer>.",
          "Learn to use content grouping elements: <section>, <article>, and <aside>.",
          "Discover specialized elements such as <figure>, <figcaption>, and <time>.",
        ],
      },
    ],
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userInput, level, courseName, type, userId } = body;

    // Strict validation mapping against your notNull constraints
    if (!userInput) {
      return NextResponse.json(
        { success: false, message: "Missing required field: userInput" },
        { status: 400 },
      );
    }

    const uniqueCourseId = uuidv4();
    const simulatedAIOutput = await generateCourseLayoutWithAI(
      userInput,
      level || "Beginner",
    );

    // Exact structural mapping to your schema variables
    await db.insert(courses).values({
      courseId: uniqueCourseId,
      courseName: courseName || "Semantic HTML5: Structure & Accessibility",
      userId: userId || "guest_user_fallback@clerk.dev", // Matches your Clerk string userId expectation
      userInput: userInput,
      type: type || "full", // Matches your 'full' or 'quick' constraint type
      courseLayout: simulatedAIOutput,
    });

    return NextResponse.json(
      {
        success: true,
        courseId: uniqueCourseId,
        message: "Course blueprint successfully committed to database.",
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("CRITICAL SQL INSERTION FAULT:", error);
    return NextResponse.json(
      {
        error: "Generation Pipeline Database Write Failure",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
