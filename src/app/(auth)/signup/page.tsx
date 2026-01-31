import Link from "next/link"
import { UserAuthForm } from "@/components/user-auth-form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignupPage() {
    return (
        <Card className="border-none shadow-2xl bg-background/60 backdrop-blur-xl">
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
                <CardDescription>
                    Enter your email below to create your account
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <UserAuthForm type="register" />
            </CardContent>
            <CardFooter>
                <div className="text-center text-sm text-muted-foreground w-full">
                    Already have an account?{" "}
                    <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                        Log in
                    </Link>
                </div>
            </CardFooter>
        </Card>
    )
}
