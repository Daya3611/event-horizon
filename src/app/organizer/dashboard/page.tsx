"use client"

export const dynamic = "force-dynamic";
export const revalidate = 0;

import * as React from "react"
import { Navbar } from "@/components/navbar"
import { db, auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { collection, query, where, getDocs, onSnapshot, orderBy, updateDoc, doc, deleteDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Users, CheckCircle, Clock } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { v4 as uuidv4 } from "uuid"

export default function OrganizerDashboardPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const paramEventId = searchParams.get("eventId")

    const [user, setUser] = React.useState<any>(null)
    const [myEvents, setMyEvents] = React.useState<any[]>([])
    const [selectedEventId, setSelectedEventId] = React.useState<string | null>(null)
    const [attendees, setAttendees] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)

    // Stats
    const totalRSVPs = attendees.length
    const checkedInCount = attendees.filter(a => a.checkedIn).length
    const pendingApprovalCount = attendees.filter(a => a.status === 'pending').length

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            if (!u) {
                router.push("/login")
            } else {
                setUser(u)
                fetchMyEvents(u.uid)
            }
        })
        return () => unsubscribe()
    }, [router])

    async function fetchMyEvents(uid: string) {
        try {
            const q = query(
                collection(db, "events"),
                where("creatorId", "==", uid),
                orderBy("createdAt", "desc")
            )
            const snapshot = await getDocs(q)
            const events = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
            setMyEvents(events)

            if (events.length > 0) {
                // If URL param exists and is in the list, use it. Otherwise use first.
                const found = paramEventId && events.find(e => e.id === paramEventId)
                if (found) {
                    setSelectedEventId(found.id)
                } else {
                    setSelectedEventId(events[0].id)
                }
            }
            setLoading(false)
        } catch (err) {
            console.error(err)
            setLoading(false)
        }
    }

    const handleApprove = async (rsvpId: string) => {
        try {
            await updateDoc(doc(db, "rsvps", rsvpId), {
                status: "confirmed",
                ticketToken: uuidv4()
            })
        } catch (error) {
            console.error("Error approving:", error)
        }
    }

    const handleReject = async (rsvpId: string) => {
        if (!confirm("Are you sure you want to reject this request?")) return;
        try {
            await deleteDoc(doc(db, "rsvps", rsvpId))
        } catch (error) {
            console.error("Error rejecting:", error)
        }
    }

    React.useEffect(() => {
        if (!selectedEventId) return;

        // Real-time listener for attendees
        const q = query(
            collection(db, "rsvps"),
            where("eventId", "==", selectedEventId)
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: any[] = []
            snapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() })
            })
            // Sort by checkInTime desc, then rsvpDate desc
            list.sort((a, b) => {
                const timeA = a.checkInTime ? a.checkInTime.seconds : 0
                const timeB = b.checkInTime ? b.checkInTime.seconds : 0
                return timeB - timeA
            })
            setAttendees(list)
        })

        return () => unsubscribe()
    }, [selectedEventId])

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
            <Navbar />
            <main className="flex-1 container py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Organizer Console</h1>
                        <p className="text-muted-foreground">Manage entry and monitor attendance live.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => router.push("/dashboard")}>Back to User Dashboard</Button>
                        <Button onClick={() => router.push("/organizer/scan")} className="bg-green-600 hover:bg-green-700">
                            Scan Tickets
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Sidebar Event Selector */}
                    <div className="col-span-1 space-y-4">
                        <h3 className="font-semibold text-lg">Your Events</h3>
                        {myEvents.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No events found.</p>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {myEvents.map(ev => (
                                    <button
                                        key={ev.id}
                                        onClick={() => setSelectedEventId(ev.id)}
                                        className={`text-left px-4 py-3 rounded-lg border transition-all ${selectedEventId === ev.id
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-card hover:bg-muted"
                                            }`}
                                    >
                                        <p className="font-medium line-clamp-1">{ev.title}</p>
                                        <p className="text-xs opacity-80">{ev.date?.split(" ")[0]}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Main Content */}
                    <div className="col-span-1 md:col-span-3 space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total RSVPs</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{totalRSVPs}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Checked In</CardTitle>
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{checkedInCount}</div>
                                    <p className="text-xs text-muted-foreground">
                                        {totalRSVPs > 0 ? Math.round((checkedInCount / totalRSVPs) * 100) : 0}% attendance
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className={pendingApprovalCount > 0 ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20" : ""}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                                    <Clock className="h-4 w-4 text-amber-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingApprovalCount}</div>
                                    <p className="text-xs text-muted-foreground">Action required</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Expected</CardTitle>
                                    <Users className="h-4 w-4 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{totalRSVPs - checkedInCount - pendingApprovalCount}</div>
                                    <p className="text-xs text-muted-foreground">Confirmed, not here</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Attendees Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Attendee List</CardTitle>
                                <CardDescription>Real-time updates as people check in.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nam/User ID</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Time / Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {attendees.length > 0 ? (
                                                attendees.map((attendee) => (
                                                    <TableRow key={attendee.id} className={attendee.status === "pending" ? "bg-amber-50/50 dark:bg-amber-900/10" : ""}>
                                                        <TableCell>
                                                            <div className="font-medium">{attendee.userName || "Anonymous User"}</div>
                                                            <div className="text-xs text-muted-foreground hidden sm:block">ID: {attendee.userId?.slice(0, 8)}...</div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {attendee.status === "pending" ? (
                                                                <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-100">Pending Approval</Badge>
                                                            ) : attendee.checkedIn ? (
                                                                <Badge className="bg-green-600 hover:bg-green-700">Checked In</Badge>
                                                            ) : (
                                                                <Badge variant="secondary">Confirmed</Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {attendee.status === "pending" ? (
                                                                <div className="flex justify-end gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                                        onClick={() => handleApprove(attendee.id)}
                                                                    >
                                                                        Approve
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() => handleReject(attendee.id)}
                                                                    >
                                                                        Reject
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <span className="font-mono text-xs">
                                                                    {attendee.checkedIn && attendee.checkInTime
                                                                        ? new Date(attendee.checkInTime.seconds * 1000).toLocaleTimeString()
                                                                        : "-"
                                                                    }
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="h-24 text-center">
                                                        No attendees found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}
