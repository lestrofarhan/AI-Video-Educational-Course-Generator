// app/actions/users.ts
"use server";

import { db } from "@/config/db";
import { users } from "@/config/schema";
import { eq } from "drizzle-orm";

export async function getUserCredits(email: string) {
  const result = await db
    .select({ credits: users.credits })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result[0]?.credits ?? 0;
}
