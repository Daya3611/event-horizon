"use client"

import * as React from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth"
import { collection, query, where, getDocs } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { EventCard, Event } from "@/components/event-card"
import Link from "next/link"
import { Loader2, Settings } from "lucide-react"
import { TicketQR } from "@/components/ticket-qr"

export default function DashboardPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = React.useState("events")
    const [user, setUser] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(true)

    // Data
    const [myEvents, setMyEvents] = React.useState<Event[]>([])
    const [myRsvps, setMyRsvps] = React.useState<any[]>([])

    const [name, setName] = React.useState("")
    const [isSaving, setIsSaving] = React.useState(false)

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.push("/login")
            } else {
                setUser(currentUser)
                setName(currentUser.displayName || "")
                fetchMyEvents(currentUser.uid)
                fetchMyRsvps(currentUser.uid)
            }
            setLoading(false)
        })
        return () => unsubscribe()
    }, [router])

    async function fetchMyEvents(uid: string) {
        try {
            const q = query(collection(db, "events"), where("creatorId", "==", uid));
            const querySnapshot = await getDocs(q);
            const events: Event[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                events.push({
                    id: doc.id,
                    title: data.title,
                    date: data.date,
                    location: data.location,
                    category: data.category,
                    price: data.price,
                    image: data.image
                });
            });
            setMyEvents(events);
        } catch (err) {
            console.error(err)
        }
    }

    async function fetchMyRsvps(uid: string) {
        try {
            const q = query(collection(db, "rsvps"), where("userId", "==", uid));
            const querySnapshot = await getDocs(q);
            const rsvps: any[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                rsvps.push({
                    id: doc.id,
                    ...data
                });
            });
            setMyRsvps(rsvps);
        } catch (err) {
            console.error(err)
        }
    }

    const handleLogout = async () => {
        await signOut(auth)
        router.push("/")
    }

    const handleSaveProfile = async () => {
        if (!auth.currentUser) return;
        setIsSaving(true);
        try {
            await updateProfile(auth.currentUser, {
                displayName: name
            });
            // Force refresh user state locally if needed, though onAuthStateChanged might pick it up strictly speaking, but local state update is faster feedback
            setUser({ ...user, displayName: name });
            router.push(
                `/status?type=success&title=Profile Updated&message=Your profile information has been successfully saved.&next=/dashboard&nextLabel=Back to Dashboard`
            )
        } catch (error) {
            console.error("Error updating profile:", error);
            router.push(
                `/status?type=error&title=Update Failed&message=We could not update your profile. Please try again.&next=/dashboard&nextLabel=Back to Dashboard`
            )
        } finally {
            setIsSaving(false);
        }
    }

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

    if (!user) return null

    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 container py-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Dashboard</h1>
                        <p className="text-muted-foreground">Welcome back, {user.displayName || "User"}</p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <Button variant="outline" onClick={handleLogout} className="flex-1 md:flex-none">Log out</Button>
                        <Button asChild className="flex-1 md:flex-none">
                            <Link href="/create-event">Create New Event</Link>
                        </Button>
                    </div>
                </div>

                {/* Custom Tabs */}
                <div className="flex border-b mb-8">
                    {["events", "rsvps", "settings"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                                activeTab === tab
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {tab === "rsvps" ? "My RSVPs" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {activeTab === "events" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Hosted Events</h2>
                            <Button onClick={() => router.push("/organizer/dashboard")} variant="outline" className="gap-2">
                                <Settings className="h-4 w-4" /> Organizer Dashboard
                            </Button>
                        </div>
                        {myEvents.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myEvents.map((event) => (
                                    <div key={event.id} className="group relative flex flex-col gap-2">
                                        <EventCard event={event} />
                                        <Button
                                            variant="secondary"
                                            className="w-full"
                                            onClick={() => router.push(`/organizer/dashboard?eventId=${event.id}`)}
                                        >
                                            Manage Approvals & Entry
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Card className="flex flex-col items-center justify-center p-8 border-dashed min-h-[300px] text-center bg-muted/20">
                                <div className="rounded-full bg-muted p-4 mb-4">
                                    <Loader2 className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold">No events hosted</h3>
                                <p className="text-muted-foreground mb-4">You haven't hosted any events yet.</p>
                                <Button asChild>
                                    <Link href="/create-event">Create your first event</Link>
                                </Button>
                            </Card>
                        )}
                    </div>
                )}

                {activeTab === "rsvps" && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold">Attending</h2>
                        {myRsvps.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {myRsvps.map((rsvp) => (
                                    <Card key={rsvp.id} className="p-4 flex flex-col justify-between gap-4">
                                        <div>
                                            <h3 className="font-bold">{rsvp.eventTitle}</h3>
                                            <p className="text-sm text-muted-foreground">{rsvp.eventDate}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button asChild variant="link" className="px-0">
                                                <Link href={`/events/${rsvp.eventId}`}>View Event</Link>
                                            </Button>
                                            <div className="ml-auto flex items-center gap-2">
                                                <TicketQR
                                                    eventName={rsvp.eventTitle}
                                                    eventId={rsvp.eventId}
                                                    userId={user.uid}
                                                    ticketToken={rsvp.ticketToken}
                                                    userName={user.displayName || "User"}
                                                    status={rsvp.status}
                                                />
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-muted-foreground">You are not attending any upcoming events.</div>
                        )}
                    </div>
                )}

                {activeTab === "settings" && (
                    <div className="max-w-xl">
                        <Card>
                            <CardHeader>
                                <CardTitle>Profile Settings</CardTitle>
                                <CardDescription>Manage your account settings.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Display Name</Label>
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your Name"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Email</Label>
                                    <Input defaultValue={user.email || ""} disabled className="bg-muted" />
                                </div>
                                <Button onClick={handleSaveProfile} disabled={isSaving}>
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}

            </main>
            <Footer />
        </div>
    )
}
