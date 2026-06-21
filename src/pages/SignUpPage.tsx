import { useNavigate, Link } from "react-router-dom"
import {
  Boxes,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignUpPage() {
    const navigate = useNavigate();
  return (
    <div>
        <div className="w-[1200px] mx-auto px-4 py-6">
            <div className="flex items-center gap-2">
                <Link to='/'>
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
            <CardTitle>Create a new account</CardTitle>
            <CardDescription>
                Enter your credentials below to create a new account
            </CardDescription>
            <CardAction>
                <Button variant="link" onClick={() => navigate('/login')}>Login</Button>
            </CardAction>
            </CardHeader>
            <CardContent>
            <form>
                <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password1">Password</Label>
                    <Input id="password1" type="password" required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password2">Confirm Password</Label>
                    <Input id="password2" type="password" required />
                </div>
                </div>
            </form>
            </CardContent>
            <CardFooter className="flex-col gap-2">
            <Button type="submit" className="w-full">
                Sign Up
            </Button>
            <Button variant="outline" className="w-full">
                Sign Up with Google
            </Button>
            </CardFooter>
        </Card>
        </div>
    </div>
  )
}
