import { auth } from "@/auth"
import UserSearch from './components/user-search';
import { TechnicalOverview } from './components/technical-overview';
import { UserDialog } from './components/user-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import LoginButton from "./components/auth/login-button"

export default async function Home({ searchParams }: { searchParams: Promise<{ userId?: string }> }) {
  const session = await auth()

  // If user is not authenticated, show login interface
  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome to Person Search</CardTitle>
              <CardDescription>
                Please sign in with your Google account to access the search functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginButton />
              <div className="mt-6 text-center text-sm text-muted-foreground">
                <p>🔒 Secure authentication required</p>
                <p>🔍 Search and manage people</p>
                <p>📱 Mobile-friendly interface</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // If user is authenticated, show the full application
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">User Search</h1>
        <div className="text-sm text-muted-foreground">
          Welcome back, {session.user.name}!
        </div>
      </div>
      <UserSearch searchParams={searchParams} />
      <UserDialog />
      <TechnicalOverview />
    </div>
  );
}
