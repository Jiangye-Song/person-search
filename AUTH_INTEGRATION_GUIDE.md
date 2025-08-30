# Auth.js Integration with Google Login - Step-by-Step Guide

This guide will walk you through integrating Auth.js (NextAuth.js) with Google OAuth into your person-search application.

## Overview

We'll be adding:
- Auth.js for authentication management
- Google OAuth provider for login
- Session management across the app
- Protected routes and user context
- Database integration for user sessions

## Prerequisites

- Existing Next.js 15 project with Prisma
- Google Cloud Console account
- PostgreSQL database (already configured)

---

## Step 1: Install Auth.js Dependencies

```bash
pnpm add next-auth @auth/prisma-adapter
pnpm add -D @types/next-auth
```

## Step 2: Configure Google OAuth in Google Cloud Console

### 2.1 Create Google Cloud Project (if not exists)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API

### 2.2 Create OAuth 2.0 Credentials
1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Configure OAuth consent screen:
   - Application type: **Web application**
   - Name: **Person Search App**
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
4. Save the **Client ID** and **Client Secret**

## Step 3: Update Environment Variables

Add to your `.env` file:

```env
# Existing database URLs...
POSTGRES_URL="your_existing_postgres_url"
PRISMA_DATABASE_URL="your_existing_prisma_url"

# Auth.js Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here" # Generate: openssl rand -base64 32

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Step 4: Update Prisma Schema

Add Auth.js tables to `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("PRISMA_DATABASE_URL")
}

// Existing User model (updated)
model User {
  id          String   @id @default(cuid())
  name        String?
  email       String   @unique
  phoneNumber String?
  image       String?
  emailVerified DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Auth.js relations
  accounts Account[]
  sessions Session[]

  @@map("users")
}

// Auth.js required models
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verificationtokens")
}
```

## Step 5: Run Prisma Migration

```bash
npx prisma db push
npx prisma generate
```

## Step 6: Create Auth.js Configuration

Create `lib/auth.ts`:

```typescript
import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user) {
        session.user.id = token.sub!
      }
      return session
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
}
```

## Step 7: Create Auth API Route

Create `app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

## Step 8: Create Session Provider

Create `app/providers/session-provider.tsx`:

```typescript
'use client'

import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react"

interface Props {
  children: ReactNode
}

export default function AuthSessionProvider({ children }: Props) {
  return <SessionProvider>{children}</SessionProvider>
}
```

## Step 9: Update Root Layout

Update `app/layout.tsx`:

```typescript
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import AuthSessionProvider from "./providers/session-provider"
import Navbar from "./components/navbar"
import Footer from "./components/footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Person Search",
  description: "Search and manage people",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthSessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1 container mx-auto px-4 py-8">
                {children}
              </main>
              <Footer />
            </div>
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  )
}
```

## Step 10: Create Authentication Components

### 10.1 Login Button Component
Create `app/components/auth/login-button.tsx`:

```typescript
'use client'

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Chrome } from "lucide-react"

export default function LoginButton() {
  return (
    <Button
      onClick={() => signIn("google", { callbackUrl: "/" })}
      variant="outline"
      className="w-full"
    >
      <Chrome className="mr-2 h-4 w-4" />
      Sign in with Google
    </Button>
  )
}
```

### 10.2 Logout Button Component
Create `app/components/auth/logout-button.tsx`:

```typescript
'use client'

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export default function LogoutButton() {
  return (
    <Button
      onClick={() => signOut({ callbackUrl: "/" })}
      variant="outline"
      size="sm"
    >
      <LogOut className="mr-2 h-4 w-4" />
      Sign Out
    </Button>
  )
}
```

### 10.3 User Avatar Component
Create `app/components/auth/user-avatar.tsx`:

```typescript
'use client'

import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function UserAvatar() {
  const { data: session } = useSession()

  if (!session?.user) return null

  return (
    <Avatar>
      <AvatarImage src={session.user.image || ""} />
      <AvatarFallback>
        {session.user.name?.charAt(0) || session.user.email?.charAt(0) || "U"}
      </AvatarFallback>
    </Avatar>
  )
}
```

## Step 11: Update Navbar Component

Update `app/components/navbar.tsx`:

```typescript
'use client'

import Link from "next/link"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import UserAvatar from "./auth/user-avatar"
import LoginButton from "./auth/login-button"
import LogoutButton from "./auth/logout-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Navbar() {
  const { data: session, status } = useSession()

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          Person Search
        </Link>

        <div className="flex items-center gap-4">
          {status === "loading" ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <UserAvatar />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuItem className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session.user.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <LogoutButton />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <LoginButton />
          )}
        </div>
      </div>
    </nav>
  )
}
```

## Step 12: Create Authentication Pages

### 12.1 Sign In Page
Create `app/auth/signin/page.tsx`:

```typescript
import { Metadata } from "next"
import LoginButton from "@/app/components/auth/login-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Sign In | Person Search",
  description: "Sign in to your account",
}

export default function SignInPage() {
  return (
    <div className="container mx-auto max-w-md py-16">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>
            Sign in to access the person search application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginButton />
        </CardContent>
      </Card>
    </div>
  )
}
```

### 12.2 Error Page
Create `app/auth/error/page.tsx`:

```typescript
'use client'

import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertCircle } from "lucide-react"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  return (
    <div className="container mx-auto max-w-md py-16">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle>Authentication Error</CardTitle>
          <CardDescription>
            {error === "OAuthAccountNotLinked"
              ? "This email is already associated with another account."
              : "There was an error signing you in."}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild>
            <Link href="/auth/signin">Try Again</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

## Step 13: Create Protected Route Middleware

Create `middleware.ts` in your project root:

```typescript
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
```

## Step 14: Update User Schema and Actions

### 14.1 Update User Schema
Update `app/actions/schemas.ts`:

```typescript
import { z } from 'zod'

export const userSchema = z.object({
  id: z.string(),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).nullable(),
  email: z.string().email({ message: "Invalid email address." }),
  phoneNumber: z.string().regex(/^04\d{8}$/, { message: "Phone number must be a valid Australian mobile number (e.g., 0422018632)." }).nullable(),
  image: z.string().url().nullable().optional(),
})

export type User = z.infer<typeof userSchema>

export const userFormSchema = userSchema.omit({ id: true, image: true })
export type UserFormData = z.infer<typeof userFormSchema>
```

### 14.2 Update Actions for Auth
Update `app/actions/actions.ts` to include auth checks:

```typescript
'use server'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from 'next/cache'
import { User, userSchema } from './schemas'
import { cache } from 'react'
import { prisma } from '@/lib/prisma'

async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error("Authentication required")
  }
  return session
}

export async function searchUsers(query: string): Promise<User[]> {
    await requireAuth() // Require authentication
    
    console.log('Searching users with query:', query)
    
    const results = await prisma.user.findMany({
        where: {
            name: {
                startsWith: query,
                mode: 'insensitive',
            },
        },
        orderBy: {
            name: 'asc',
        },
    })
    
    console.log('Search results:', results)
    return results
}

// ... rest of your existing actions with requireAuth() added
```

## Step 15: Test the Integration

### 15.1 Generate Prisma Client
```bash
npx prisma generate
```

### 15.2 Start Development Server
```bash
pnpm dev
```

### 15.3 Test Authentication Flow
1. Visit `http://localhost:3000`
2. You should be redirected to sign-in page
3. Click "Sign in with Google"
4. Complete Google OAuth flow
5. Should redirect back to app with authenticated session

## Step 16: Optional Enhancements

### 16.1 Role-Based Access Control
Add user roles to control access to different features.

### 16.2 Session Persistence
Configure session duration and refresh tokens.

### 16.3 Custom Sign-In Page Styling
Enhance the sign-in page with your brand styling.

---

## Verification Checklist

- [ ] Auth.js dependencies installed
- [ ] Google OAuth configured in Google Cloud Console
- [ ] Environment variables set
- [ ] Prisma schema updated and migrated
- [ ] Auth.js configuration created
- [ ] API routes created
- [ ] Session provider added to layout
- [ ] Authentication components created
- [ ] Navbar updated with auth UI
- [ ] Authentication pages created
- [ ] Middleware configured for protected routes
- [ ] Actions updated with auth checks
- [ ] Application tested with Google login

## Troubleshooting

### Common Issues:

1. **OAuth Redirect URI Mismatch**: Ensure redirect URI in Google Console matches exactly
2. **Environment Variables**: Double-check all required env vars are set
3. **Prisma Connection**: Ensure database connection works with new schema
4. **Session Issues**: Check NEXTAUTH_SECRET is properly set

### Debug Commands:

```bash
# Check database schema
npx prisma studio

# View environment variables
echo $NEXTAUTH_URL

# Test database connection
npx prisma db execute --stdin <<< "SELECT 1"
```

## Security Considerations

1. **Environment Variables**: Never commit real credentials to version control
2. **NEXTAUTH_SECRET**: Use a strong, randomly generated secret
3. **HTTPS in Production**: Always use HTTPS for OAuth in production
4. **Session Security**: Configure appropriate session timeouts
5. **CORS**: Properly configure allowed origins

This completes the Auth.js integration with Google login for your person-search application!