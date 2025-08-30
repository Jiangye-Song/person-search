import { auth } from "@/auth"
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Github, Linkedin, Twitter } from 'lucide-react'
import LoginButton from "../components/auth/login-button"

function ProjectOverview() {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Project Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          Person Search is a demonstration project showcasing the power of Next.js, React, and modern web technologies.
          It provides a simple yet effective interface for searching and displaying user information.
        </p>
        <p className="mb-4">
          This project utilizes Next.js 15 with the App Router, React 19, TypeScript, Auth.js v5 with Google OAuth,
          Prisma with PostgreSQL, and a variety of cutting-edge libraries to create a secure, responsive and accessible user experience.
        </p>
        <p>
          Key features include secure Google authentication, asynchronous search functionality, server-side filtering,
          persistent data storage, and a dark mode toggle for user comfort.
        </p>
      </CardContent>
    </Card>
  )
}

function SocialLinks() {
  return (
    <div className="flex flex-wrap gap-4">
      <Button asChild>
        <Link href="https://www.linkedin.com/in/callumbir/" target="_blank" rel="noopener noreferrer">
          <Linkedin className="mr-2 h-4 w-4" /> LinkedIn
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="https://github.com/gocallum" target="_blank" rel="noopener noreferrer">
          <Github className="mr-2 h-4 w-4" /> GitHub
        </Link>
      </Button>
      <Button asChild variant="secondary">
        <Link href="https://x.com/callumbir">
          <Twitter className="mr-2 h-4 w-4" /> Contact Me
        </Link>
      </Button>
    </div>
  )
}

function DeveloperInfo() {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>About the Developer</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          Hi, I&apos;m <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">Callum Bir</code>, the developer behind Person Search. I&apos;m passionate about creating
          efficient, user-friendly web applications using the latest technologies.
        </p>
        <p className="mb-4">
          This project serves as a demonstration of my skills in Next.js, React, Auth.js, Prisma, and modern full-stack development.
          I&apos;m always looking to learn and improve, so feel free to reach out with any questions or feedback!
        </p>
        <SocialLinks />
      </CardContent>
    </Card>
  )
}

export default async function AboutPage() {
  const session = await auth()

  // If user is not authenticated, show login required message
  if (!session?.user) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Authentication Required</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="mb-4 text-muted-foreground">
                  Please sign in to view the about page.
                </p>
                <LoginButton />
                <Button asChild variant="link" className="mt-4 w-full">
                  <Link href="/">
                    Back to Home
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">About Person Search</h1>
        <ProjectOverview />
        <DeveloperInfo />
        <Button asChild variant="link" className="mt-4">
          <Link href="/">
            Back to Home
          </Link>
        </Button>
      </main>
    </div>
  )
}

