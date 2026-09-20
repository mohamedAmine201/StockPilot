import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Boxes } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/AuthContext"

export default function LoginPage() {
  const { login }  = useAuth()
  const navigate   = useNavigate()

  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [error, setError]       = useState("")
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(email, password)
      navigate("/dashboard")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="w-[1200px] mx-auto px-4 py-6">
        <div className="flex items-center gap-2">
          <Link to="/">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#1E3A5F]">
                <Boxes className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-lg font-semibold tracking-tight">
                Stock<span className="text-[#22A06B]">Pilot</span>
              </span>
            </div>
          </Link>
        </div>
      </div>

      <div className="flex justify-center items-center min-h-screen">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Login to your account</CardTitle>
            <CardDescription>
              Enter your email below to login to your account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form id="login-form" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">

                {error && (
                  <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">
                    {error}
                  </p>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <a
                      href="#"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>

              </div>
            </form>
          </CardContent>

          <CardFooter className="flex-col gap-2">
            <Button
              type="submit"
              form="login-form"
              className="w-full"
              disabled={loading}
            >
              {loading ? <Spinner /> : "Login"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}