"use client"

import * as React from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Share2, Clock, User, Loader2, Check } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { doc, getDoc, collection, addDoc, query, where, getDocs, deleteDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { useParams, useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import dynamic from "next/dynamic"
import { v4 as uuidv4 } from "uuid"

const MapView = dynamic(() => import("@/components/ui/map-view"), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-muted animate-pulse flex items-center justify-center">Loading Map...</div>
})

export default function EventDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [event, setEvent] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(true)
    const [user, setUser] = React.useState<any>(null)
    const [rsvpStatus, setRsvpStatus] = React.useState<string | null>(null) // null, 'going'
    const [rsvpLoading, setRsvpLoading] = React.useState(false)

    React.useEffect(() => {
        // Check Auth
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser)
        })
        return () => unsubscribe()
    }, [])

    React.useEffect(() => {
        async function fetchEventData() {
            if (!id) return;
            try {
                const docRef = doc(db, "events", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setEvent({ id: docSnap.id, ...data });
                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.error("Error fetching event:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchEventData();
    }, [id])

    React.useEffect(() => {
        async function checkRSVP() {
            if (!user || !id) return;
            try {
                // Check in root 'rsvps' collection
                const q = query(
                    collection(db, "rsvps"),
                    where("userId", "==", user.uid),
                    where("eventId", "==", id)
                )
                const snapshot = await getDocs(q)
                if (!snapshot.empty) {
                    setRsvpStatus("going")
                } else {
                    setRsvpStatus(null)
                }
            } catch (err) {
                console.error("Error checking RSVP", err)
            }
        }
        checkRSVP()
    }, [user, id])

    const makePayment = async () => {
        const res = await initializeRazorpay();

        if (!res) {
            alert("Razorpay SDK Failed to load");
            return;
        }

        // Create Order
        const data = await fetch("/api/razorpay", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: event.price,
                currency: "INR"
            })
        }).then((t) => t.json());

        var options = {
            key: "rzp_test_SAMSrwBkHAr3ZE",
            name: "EventHorizon",
            currency: data.currency,
            amount: data.amount,
            order_id: data.id,
            description: `Ticket for ${event.title}`,
            image: "https://eventhorizon.com/logo.png", // specific logo if needed
            handler: function (response: any) {
                // Validate payment at server - using webhooks is a better practice.
                // For this demo, we assume success and save RSVP.
                saveRSVP(response.razorpay_payment_id);
            },
            prefill: {
                name: user.displayName || "",
                email: user.email || "",
                contact: ""
            },
        };

        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.open();
    };

    const initializeRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            // document.body.appendChild(script);

            script.onload = () => {
                resolve(true);
            };
            script.onerror = () => {
                resolve(false);
            };

            document.body.appendChild(script);
        });
    };

    const saveRSVP = async (paymentId?: string) => {
        try {
            const requiresApproval = event.requiresApproval && !paymentId; // If paid, auto-approve usually, or keep approval? Let's say Paid = Confirmed.
            const status = requiresApproval ? "pending" : "confirmed";

            await addDoc(collection(db, "rsvps"), {
                userId: user.uid,
                eventId: id,
                eventTitle: event.title,
                eventDate: event.date,
                rsvpDate: new Date(),
                ticketToken: requiresApproval ? null : uuidv4(),
                checkedIn: false,
                checkInTime: null,
                status: status,
                paymentId: paymentId || null,
                price: event.price || "0"
            })

            setRsvpStatus(status === "pending" ? "pending" : "going")

            const title = requiresApproval ? "Request Sent" : "You're In!";
            const msg = requiresApproval
                ? `Your request to join ${event.title} has been sent to the host.`
                : `You have successfully RSVP'd to ${event.title}. We've sent the details to your dashboard.`;

            router.push(
                `/status?type=success&title=${title}&message=${msg}&next=/dashboard&nextLabel=Go to My RSVPs`
            )
        } catch (err) {
            console.error("Error saving RSVP", err)
        }
    }

    const handleRSVP = async () => {
        if (!user) {
            router.push("/login")
            return
        }

        setRsvpLoading(true)
        try {
            if (rsvpStatus === "going") {
                // Un-RSVP (Refunds not handled in this demo)
                const q = query(
                    collection(db, "rsvps"),
                    where("userId", "==", user.uid),
                    where("eventId", "==", id)
                )
                const snapshot = await getDocs(q)
                snapshot.forEach(async (d) => {
                    await deleteDoc(doc(db, "rsvps", d.id))
                })
                setRsvpStatus(null)
            } else {
                // Check if Paid Event
                if (event.price && event.price !== "0") {
                    await makePayment();
                } else {
                    await saveRSVP();
                }
            }
        } catch (err) {
            console.error("Error toggling RSVP", err)
            router.push(
                `/status?type=error&title=RSVP Failed&message=We could not reserve your spot at this time.&next=/events/${id}&nextLabel=Try Again`
            )
        } finally {
            setRsvpLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!event) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-4">
                <p>Event not found.</p>
                <Button onClick={() => router.push("/events")}>Browse Events</Button>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">
                {/* Hero / Banner */}
                <div className="relative h-[400px] w-full bg-slate-900 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
                    {event.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={event.image} alt={event.title} className="w-full h-full object-cover opacity-80" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-700 opacity-80" />
                    )}

                    <div className="absolute bottom-0 left-0 container z-20 py-8">
                        <Badge className="mb-4 text-lg px-4 py-1" variant="secondary">{event.category}</Badge>
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-4">{event.title}</h1>
                        <div className="flex flex-wrap items-center gap-6 text-white/90">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                <span className="text-lg">{event.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                <span className="text-lg">{event.location}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold">About this Event</h2>
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {event.description || "No description provided."}
                            </p>
                        </div>

                        <Separator />
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="rounded-xl border bg-card p-6 shadow-sm">
                            <h3 className="font-semibold text-lg mb-4">Event Details</h3>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium">Date & Time</p>
                                        <p className="text-sm text-muted-foreground">{event.date}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <User className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium">Organizer</p>
                                        <p className="text-sm text-muted-foreground">{event.organizer || "Unknown"}</p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-muted-foreground">Price</span>
                                        <span className="text-2xl font-bold">{event.price === "0" ? "Free" : `₹${event.price}`}</span>
                                    </div>
                                    <Button
                                        className="w-full text-lg h-12 shadow-lg shadow-primary/25"
                                        onClick={handleRSVP}
                                        disabled={rsvpLoading}
                                        variant={rsvpStatus === "going" ? "outline" : "default"}
                                    >
                                        {rsvpLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : rsvpStatus === "going" ? (
                                            <>
                                                <Check className="mr-2 h-4 w-4" /> RSVP'd
                                            </>
                                        ) : (
                                            event.price && event.price !== "0" ? `Buy Ticket - ₹${event.price}` : "Get Tickets / RSVP"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border bg-card p-6 shadow-sm">
                            <h3 className="font-semibold text-lg mb-4">Location</h3>
                            <div className="aspect-video w-full bg-muted rounded-md relative overflow-hidden text-muted-foreground mb-4 border">
                                <MapView
                                    center={[19.0760, 72.8777]} // Defaulting to Mumbai for demo, ideally geo-coded from event.location
                                    zoom={12}
                                    markers={[{ position: [19.0760, 72.8777], title: event.location }]}
                                />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {event.location}
                            </p>
                        </div>

                        {/* Organizer Controls */}
                        {user?.uid === event.creatorId && (
                            <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 shadow-sm">
                                <h3 className="font-semibold text-lg mb-4 text-primary">Organizer Tools</h3>
                                <div className="space-y-3">
                                    <Button
                                        className="w-full"
                                        variant="outline"
                                        onClick={() => router.push(`/organizer/dashboard?eventId=${event.id}`)}
                                    >
                                        Manage Approvals & List
                                    </Button>
                                    <Button
                                        className="w-full"
                                        variant="secondary"
                                        onClick={() => router.push("/organizer/scan")}
                                    >
                                        Scan Tickets
                                    </Button>
                                    <Button
                                        className="w-full"
                                        variant="ghost"
                                        onClick={() => router.push(`/create-event?edit=${event.id}`)} // Edit not fully impl yet but good placeholder
                                    >
                                        Edit Event Details
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
