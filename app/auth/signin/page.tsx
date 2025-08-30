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