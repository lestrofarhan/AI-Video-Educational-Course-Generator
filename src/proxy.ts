import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/public(.*)",
]);

const isApiRoute = createRouteMatcher(["/api/(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  if (isApiRoute(request)) {
    // Check if the request has a valid session token before letting it pass to the API
    const session = await auth();
    console.log(session)
    if (!session.userId) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Token missing or session expired." },
        { status: 401 },
      );
    }
  } else {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.[0-9a-z]+$).*)", "/(api|trpc)(.*)"],
};
