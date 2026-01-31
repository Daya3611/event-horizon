
import Link from "next/link"

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-muted/20 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] -z-10"></div>

            <div className="w-full max-w-lg space-y-8 relative z-10">
                <div className="mb-4 text-center">
                    <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">EventHorizon</Link>
                </div>
                {children}
            </div>
        </div>
    )
}
