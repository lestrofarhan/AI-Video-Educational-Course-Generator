import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import { users } from "@/config/schema";

/**
 * POST /api/user
 * Synchronizes authenticated Clerk session state with the Neon PostgreSQL instance.
 * Completely optimized with an atomic upsert to skip the fragile SELECT statement completely.
 */
export async function POST() {
  try {
    // 1. Fetch authenticated user details from Clerk secure session
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        { error: "Unauthorized profile reference: No active session found." },
        { status: 401 },
      );
    }

    // 2. Extract profile payloads safely
    const email = clerkUser.emailAddresses[0]?.emailAddress;
    const name =
      `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
      "Anonymous User";

    if (!email) {
      return NextResponse.json(
        {
          error:
            "Bad Request: Missing primary communication profile email address.",
        },
        { status: 400 },
      );
    }

    console.log(
      `[API User Sync] Executing database sync sequence for: ${email}`,
    );

    // 3. Bypass the SELECT query entirely!
    // By using an upsert directly, we prevent the driver crash and safely handle StrictMode.
    const [synchronizedUser] = await db
      .insert(users)
      .values({
        name: name,
        email: email,
        credits: 2, // Assigned ONLY on brand-new insert
      })
      .onConflictDoUpdate({
        target: users.email, // This matches your .unique() constraint in schema.ts
        set: {
          name: name, // Keep the name synchronized if it changed in Clerk
        },
      })
      .returning();

    // 4. Return the synchronized database row context to the client
    return NextResponse.json(
      {
        message: "User record context synchronized successfully",
        user: synchronizedUser,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("FATAL: Error synchronizing database schema context:", error);

    return NextResponse.json(
      {
        error: "Internal system connection issue",
        details:
          error?.message ||
          "An unhandled exception occurred during transaction commit loops.",
      },
      { status: 500 },
    );
  }
}
