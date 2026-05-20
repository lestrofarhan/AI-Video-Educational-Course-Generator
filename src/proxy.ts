// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define which routes can be viewed without logging in
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/public(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Protect all routes except internal files, static assets, and system metadata
    "/((?!_next|[^?]*\\.[0-9a-z]+$).*)",
    "/(api|trpc)(.*)",
  ],
};
