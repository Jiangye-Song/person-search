import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

// Protect these routes
export const config = {
  matcher: [
    // Protect all routes except auth pages and api/auth
    "/((?!api/auth|auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
}