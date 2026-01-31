import Link from "next/link"
import { UserAuthForm } from "@/components/user-auth-form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
    return (
        <Card className="border-none shadow-2xl bg-background/60 backdrop-blur-xl">
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                <CardDescription>
                    Enter your email to sign in to your account
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <UserAuthForm type="login" />
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
                <div className="text-center text-sm text-muted-foreground w-full">
                    Dont have an account?{" "}
                    <Link href="/signup" className="underline underline-offset-4 hover:text-primary">
                        Sign up
                    </Link>
                </div>
                <Link href="#" className="text-center text-xs text-muted-foreground hover:text-primary">
                    Forgot your password?
                </Link>
            </CardFooter>
        </Card>
    )
}
