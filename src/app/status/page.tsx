"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import * as React from "react"

export default function StatusPage() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const type = searchParams.get("type") || "success" // success | error
    const title = searchParams.get("title") || (type === "success" ? "Success!" : "Error")
    const message = searchParams.get("message") || (type === "success" ? "Operation completed successfully." : "Something went wrong.")
    const nextPath = searchParams.get("next") || "/"
    const nextLabel = searchParams.get("nextLabel") || "Continue"

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md shadow-xl border-t-4 data-[type=success]:border-t-green-500 data-[type=error]:border-t-red-500" data-type={type}>
                <CardHeader className="text-center pb-2">
                    <div className="flex justify-center mb-4">
                        {type === "success" ? (
                            <div className="rounded-full bg-green-100 p-3 ring-8 ring-green-50 dark:bg-green-900/30 dark:ring-green-900/10">
                                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                            </div>
                        ) : (
                            <div className="rounded-full bg-red-100 p-3 ring-8 ring-red-50 dark:bg-red-900/30 dark:ring-red-900/10">
                                <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                            </div>
                        )}
                    </div>
                    <CardTitle className="text-2xl font-bold">{title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {message}
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 pt-2">
                    <Button className="w-full h-11 text-base" onClick={() => router.push(nextPath)}>
                        {nextLabel}
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={() => router.back()}>
                        Go Back
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
