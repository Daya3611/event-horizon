"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    updateProfile
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
    type?: "login" | "register"
}

export function UserAuthForm({ className, type = "login", ...props }: UserAuthFormProps) {
    const [isLoading, setIsLoading] = React.useState<boolean>(false)
    const [error, setError] = React.useState<string | null>(null)
    const router = useRouter()

    async function onSubmit(event: React.SyntheticEvent) {
        event.preventDefault()
        setIsLoading(true)
        setError(null)

        // Type casting for form elements
        const target = event.target as typeof event.target & {
            email: { value: string };
            password: { value: string };
            name?: { value: string };
        };

        const email = target.email.value
        const password = target.password.value

        try {
            if (type === "register") {
                const name = target.name?.value
                const userCredential = await createUserWithEmailAndPassword(auth, email, password)
                // Update profile with name if provided
                if (name && userCredential.user) {
                    await updateProfile(userCredential.user, {
                        displayName: name
                    })
                }
            } else {
                await signInWithEmailAndPassword(auth, email, password)
            }
            // Redirect to dashboard on success
            router.push("/dashboard")
        } catch (err: any) {
            console.error(err)
            let message = "Something went wrong. Please try again."
            if (err.code === "auth/invalid-credential") {
                message = "Invalid email or password."
            } else if (err.code === "auth/email-already-in-use") {
                message = "Email is already in use."
            } else if (err.code === "auth/weak-password") {
                message = "Password should be at least 6 characters."
            }
            setError(message)
        } finally {
            setIsLoading(false)
        }
    }

    async function onGoogleSignIn() {
        setIsLoading(true)
        setError(null)
        try {
            const provider = new GoogleAuthProvider()
            await signInWithPopup(auth, provider)
            router.push("/dashboard")
        } catch (err: any) {
            console.error(err)
            setError("Failed to sign in with Google.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className={cn("grid gap-6", className)} {...props}>
            <form onSubmit={onSubmit}>
                <div className="grid gap-4">
                    {error && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                            {error}
                        </div>
                    )}

                    {type === "register" && (
                        <div className="grid gap-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="John Doe"
                                type="text"
                                autoCapitalize="words"
                                autoCorrect="off"
                                disabled={isLoading}
                                required
                            />
                        </div>
                    )}
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            placeholder="name@example.com"
                            type="email"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect="off"
                            disabled={isLoading}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            name="password"
                            placeholder="••••••••"
                            type="password"
                            autoCapitalize="none"
                            autoCorrect="off"
                            disabled={isLoading}
                            required
                        />
                    </div>
                    <Button disabled={isLoading}>
                        {isLoading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {type === "login" ? "Sign In" : "Sign Up"}
                    </Button>
                </div>
            </form>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                    </span>
                </div>
            </div>
            <Button variant="outline" type="button" disabled={isLoading} onClick={onGoogleSignIn}>
                {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                        <path
                            fill="currentColor"
                            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                        />
                    </svg>
                )}{" "}
                Google
            </Button>
        </div>
    )
}
