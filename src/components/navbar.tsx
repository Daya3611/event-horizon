"use client"

import * as React from "react"
import Link from "next/link"
import { ModeToggle } from "./mode-toggle"
import { Button } from "./ui/button"
import { Search, User, LogOut, LayoutDashboard, Settings, Menu, X } from "lucide-react"
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
    const [user, setUser] = React.useState<FirebaseUser | null>(null)
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
    const router = useRouter()

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser)
        })
        return () => unsubscribe()
    }, [])

    const handleLogout = async () => {
        await signOut(auth)
        setMobileMenuOpen(false)
        router.push("/")
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <span className="text-xl font-bold bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                            EventHorizon
                        </span>
                    </Link>
                    <nav className="flex items-center gap-6 text-sm font-medium hidden md:flex">
                        <Link href="/events" className="transition-colors hover:text-foreground/80 text-foreground/60">
                            Browse Events
                        </Link>
                        <Link href="/map" className="transition-colors hover:text-foreground/80 text-foreground/60">
                            Map View
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hidden md:flex">
                        <Search className="h-5 w-5" />
                    </Button>

                    <div className="hidden md:flex gap-2">
                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                        <div className="flex h-full w-full items-center justify-center rounded-full bg-muted border overflow-hidden">
                                            {user.photoURL ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={user.photoURL} alt={user.displayName || "User"} className="h-full w-full object-cover" />
                                            ) : (
                                                <User className="h-4 w-4" />
                                            )}
                                        </div>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{user.displayName || "User"}</p>
                                            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="cursor-pointer" asChild>
                                        <Link href="/dashboard">
                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                            Dashboard
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer" asChild>
                                        <Link href="/dashboard?tab=settings">
                                            <Settings className="mr-2 h-4 w-4" />
                                            Settings
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20 cursor-pointer">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Log out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button variant="ghost" className="text-muted-foreground" size="sm" asChild>
                                <Link href="/login">Log in</Link>
                            </Button>
                        )}

                        <Button variant="default" size="sm" asChild className="ml-2">
                            <Link href="/create-event">Create Event</Link>
                        </Button>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>

                    <div className="hidden md:flex">
                        <ModeToggle />
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t p-4 space-y-4 bg-background">
                    <nav className="flex flex-col space-y-3">
                        <Link href="/events" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium transition-colors hover:text-primary">
                            Browse Events
                        </Link>
                        <Link href="/map" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium transition-colors hover:text-primary">
                            Map View
                        </Link>
                    </nav>
                    <div className="border-t pt-4 space-y-3">
                        {user ? (
                            <>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-8 w-8 rounded-full bg-muted overflow-hidden">
                                        {user.photoURL ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={user.photoURL} alt={user.displayName || "User"} className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="h-4 w-4 m-2" />
                                        )}
                                    </div>
                                    <div className="text-sm">
                                        <p className="font-medium">{user.displayName || "User"}</p>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" className="w-full justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
                                    <Link href="/dashboard">
                                        <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                                    </Link>
                                </Button>
                                <Button variant="ghost" className="w-full justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
                                    <Link href="/create-event">
                                        Create Event
                                    </Link>
                                </Button>
                                <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-500 hover:bg-red-50" onClick={handleLogout}>
                                    <LogOut className="mr-2 h-4 w-4" /> Log out
                                </Button>
                            </>
                        ) : (
                            <Button className="w-full" asChild onClick={() => setMobileMenuOpen(false)}>
                                <Link href="/login">Log in</Link>
                            </Button>
                        )}
                    </div>
                    <div className="border-t pt-4 flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Theme</span>
                        <ModeToggle />
                    </div>
                </div>
            )}
        </header>
    )
}
