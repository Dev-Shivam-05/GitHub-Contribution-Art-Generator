"use client"

import { useSession, signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      const username = session?.user?.username || session?.user?.name
      if (username === "Dev-Shivam-05") {
        router.push("/admin")
      } else {
        router.push("/dashboard")
      }
    }
  }, [status, session, router])

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-linear-to-b from-background to-muted">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-4">
          <CardTitle className="text-4xl font-bold bg-clip-text text-transparent bg-linear-to-r from-primary to-purple-600">
            GitHub Art
          </CardTitle>
          <CardDescription className="text-lg">
            Create beautiful contribution patterns for your profile
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 pt-8">
          <div className="grid gap-4">
            <Button 
              size="lg" 
              className="w-full relative overflow-hidden group"
              onClick={() => signIn("github")}
            >
              <Github className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
              Sign in with GitHub
            </Button>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>By signing in, you can:</p>
            <ul className="mt-2 space-y-1">
              <li>✨ Generate custom commit patterns</li>
              <li>🎨 Adjust intensity and start dates</li>
              <li>🚀 Automate repository creation</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
