// src/app/api/user/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import { users } from "@/config/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    // 1. Fetch authenticated user details from Clerk secure session
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        { error: "Unauthorized profile reference" },
        { status: 401 },
      );
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    const name =
      `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
      "Anonymous User";

    if (!email) {
      return NextResponse.json(
        { error: "Missing primary communication profile" },
        { status: 400 },
      );
    }

    // 2. Query Neon database via Drizzle to see if account row exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // 3. If missing, insert user record with default credit balance of 2
    if (existingUser.length === 0) {
      const [newUser] = await db
        .insert(users)
        .values({
          name: name,
          email: email,
          credits: 2, // Default free trial credits allocation
        })
        .returning();

      return NextResponse.json(
        { message: "User record instantiated successfully", user: newUser },
        { status: 201 },
      );
    }

    // 4. Return existing account data if already present
    return NextResponse.json(
      { message: "User record fetched successfully", user: existingUser[0] },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error synchronizing database schema context:", error);
    return NextResponse.json(
      { error: "Internal system connection issue", details: error.message },
      { status: 500 },
    );
  }
}
