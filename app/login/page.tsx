'use client'

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FcGoogle } from "react-icons/fc"

export default function Login() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signInWithGoogle } = useAuth()

  const handleGoogleLogin = async () => {
    setError(null)
    setLoading(true)

    await signInWithGoogle()

    if (error) {
      setError(error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Sign in with your Google account to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2"
            disabled={loading}
            variant="outline"
          >
            <FcGoogle size={20} />
            {loading ? "Redirecting..." : "Sign in with Google"}
          </Button>
        </CardContent>
        {/* <CardFooter className="flex flex-col">
          <div className="text-center text-sm mt-2">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardFooter> */}
      </Card>
    </div>
  )
}
