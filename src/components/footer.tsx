import Link from "next/link"

export function Footer() {
    return (
        <footer className="w-full border-t bg-background">
            <div className="container py-8 md:py-12">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                    <div className="flex flex-col gap-2">
                        <h3 className="text-lg font-bold text-foreground">EventHorizon</h3>
                        <p className="text-sm text-muted-foreground">
                            Discover and host local events in your community.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <h4 className="text-sm font-semibold text-foreground">Platform</h4>
                        <Link href="/events" className="text-sm text-muted-foreground hover:text-foreground">
                            Browse Events
                        </Link>
                        <Link href="/create-event" className="text-sm text-muted-foreground hover:text-foreground">
                            Create Event
                        </Link>
                        <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
                            Pricing
                        </Link>
                    </div>
                    <div className="flex flex-col gap-2">
                        <h4 className="text-sm font-semibold text-foreground">Support</h4>
                        <Link href="/help" className="text-sm text-muted-foreground hover:text-foreground">
                            Help Center
                        </Link>
                        <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                            Terms of Service
                        </Link>
                        <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                            Privacy Policy
                        </Link>
                    </div>
                    <div className="flex flex-col gap-2">
                        <h4 className="text-sm font-semibold text-foreground">Social</h4>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                            Twitter
                        </Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                            Instagram
                        </Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                            LinkedIn
                        </Link>
                    </div>
                </div>
                <div className="mt-8 border-t pt-8 text-center text-xs text-muted-foreground">
                    © {new Date().getFullYear()} EventHorizon Inc. All rights reserved.
                </div>
            </div>
        </footer>
    )
}
