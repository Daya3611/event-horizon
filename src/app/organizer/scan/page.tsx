"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Html5Qrcode } from "html5-qrcode"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from "firebase/firestore"
import { v4 as uuidv4 } from "uuid"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, XCircle, Loader2, CheckCircle2 } from "lucide-react"

export default function OrganizerScanPage() {
    const router = useRouter()
    const [scannerRef, setScannerRef] = React.useState<Html5Qrcode | null>(null)
    const [cameraError, setCameraError] = React.useState<string | null>(null)
    const [verificationStatus, setVerificationStatus] = React.useState<"idle" | "loading" | "valid" | "invalid" | "pending_approval" | "error">("idle")
    const [message, setMessage] = React.useState<string>("")
    const [attendeeData, setAttendeeData] = React.useState<any>(null)
    const [scanResult, setScanResult] = React.useState<string | null>(null)
    const [scanString, setScanString] = React.useState<string | null>(null)

    // Ref to track status inside the scanner callback (which is a closure)
    const statusRef = React.useRef("idle")

    React.useEffect(() => {
        statusRef.current = verificationStatus
    }, [verificationStatus])

    React.useEffect(() => {
        // Auth check
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.push("/login")
            }
        })

        // Initialize Scanner manually for better control
        const html5QrCode = new Html5Qrcode("reader");
        setScannerRef(html5QrCode)

        // Define onScanSuccess inside useEffect or use a stable reference wrapper
        // Since we need it to access methods/state, but scanner callback is bound once
        // We use the Ref pattern for 'statusRef' check.
        // For 'set...' functions, they are stable so it's fine.

        const onScanSuccess = async (decodedText: string, decodedResult: any) => {
            if (statusRef.current !== "idle") return;

            console.log(`Code matched = ${decodedText}`, decodedResult)
            setScanResult(decodedText)
            setScanString(decodedText)
            setVerificationStatus("loading")
            setMessage("Verifying...")

            try {
                // Expected format: {"eventId":"...","userId":"...","token":"..."}
                let data;
                try {
                    data = JSON.parse(decodedText)
                } catch (e) {
                    throw new Error("Invalid QR format")
                }

                if (!data.eventId || !data.userId) {
                    if (!data.token) throw new Error("Invalid QR: Missing token")
                }

                // Verify in DB
                const q = query(
                    collection(db, "rsvps"),
                    where("eventId", "==", data.eventId),
                    where("userId", "==", data.userId)
                )

                const querySnapshot = await getDocs(q)

                if (querySnapshot.empty) {
                    setVerificationStatus("invalid")
                    setMessage("Invalid Ticket: No matching record found.")
                } else {
                    const docRef = querySnapshot.docs[0].ref
                    const docData = querySnapshot.docs[0].data()
                    setAttendeeData({ id: querySnapshot.docs[0].id, ...docData })

                    // Check for Approval Status
                    if (docData.status === "pending") {
                        setVerificationStatus("pending_approval")
                        setMessage("This attendee is pending approval.")
                        return;
                    }

                    // Verify Token match for security (only if not pending)
                    if (docData.ticketToken !== data.token) {
                        setVerificationStatus("invalid")
                        setMessage("Invalid Ticket: Token mismatch.")
                        return;
                    }

                    if (docData.checkedIn) {
                        setVerificationStatus("invalid") // Or 'warning'
                        setMessage(`Already Checked In at ${docData.checkInTime ? new Date(docData.checkInTime.seconds * 1000).toLocaleTimeString() : 'Unknown Time'}`)
                    } else {
                        // Mark as checked in
                        await updateDoc(docRef, {
                            checkedIn: true,
                            checkInTime: serverTimestamp()
                        })
                        setVerificationStatus("valid")
                        setMessage("Access Granted! Welcome.")
                    }
                }

            } catch (err: any) {
                console.error(err)
                setVerificationStatus("error")
                setMessage("Error reading QR code. " + (err.message || "Please try again."))
            }
        }

        const onScanFailure = (error: any) => {
            // handle scan failure
            // console.warn(`Code scan error = ${error}`);
        }

        const startScanner = async () => {
            try {
                // Check if element exists
                if (!document.getElementById("reader")) return;

                await html5QrCode.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 }
                    },
                    onScanSuccess,
                    onScanFailure
                );
                setCameraError(null);
            } catch (err: any) {
                console.error("Error starting scanner:", err);
                if (err?.name === "NotAllowedError") {
                    setCameraError("Camera permission denied. Please allow camera access.");
                } else if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
                    setCameraError("Camera requires HTTPS or localhost. If testing on mobile via IP, browser security blocks the camera.");
                } else {
                    setCameraError("Failed to start camera. " + (err?.message || ""));
                }
            }
        };

        // Small delay to ensure DOM is ready
        const timer = setTimeout(startScanner, 100);

        return () => {
            clearTimeout(timer)
            unsubscribeAuth()
            if (html5QrCode.isScanning) {
                html5QrCode.stop().catch(err => console.error("Failed to stop scanner", err));
            }
            try {
                html5QrCode.clear();
            } catch (err) {
                console.error("Failed to clear scanner", err);
            }
        }
    }, [router]) // Dependencies: router. Others are stable or internal.

    const handleQuickApprove = async () => {
        if (!attendeeData || !attendeeData.id) return;
        setVerificationStatus("loading")
        try {
            // 1. Generate Token
            // 2. Set Status = confirmed
            // 3. Set CheckedIn = true
            const newToken = uuidv4();

            await updateDoc(doc(db, "rsvps", attendeeData.id), {
                status: "confirmed",
                ticketToken: newToken,
                checkedIn: true,
                checkInTime: serverTimestamp()
            })

            setAttendeeData({ ...attendeeData, status: 'confirmed', ticketToken: newToken })
            setVerificationStatus("valid")
            setMessage("Approved & Checked In Successfully!")

        } catch (err) {
            console.error(err)
            setVerificationStatus("error")
            setMessage("Failed to approve.")
        }
    }

    const resetScanner = () => {
        setScanResult(null)
        setVerificationStatus("idle")
        setMessage("")
        setAttendeeData(null)
        setScanString(null)
        // statusRef will update via useEffect
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
            <Navbar />
            <main className="flex-1 container py-8 max-w-md mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Entry Scanner</h1>
                    <Button variant="ghost" className="text-slate-300" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                </div>

                {cameraError && (
                    <Card className="border-red-600 bg-red-950/30 p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
                        <XCircle className="h-20 w-20 text-red-500 mb-4" />
                        <h2 className="text-xl font-bold text-red-400 mb-2">Camera Error</h2>
                        <p className="text-red-200 mb-6">{cameraError}</p>
                        <Button
                            onClick={() => window.location.reload()}
                            size="lg"
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Retry
                        </Button>
                    </Card>
                )}

                {!cameraError && verificationStatus === "idle" && (
                    <Card className="border-slate-800 bg-black/50 overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-center text-slate-300">Scan QR Code</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div id="reader" className="w-full rounded-lg overflow-hidden border-2 border-slate-700 h-[300px] bg-black"></div>
                        </CardContent>
                    </Card>
                )}

                {verificationStatus === "loading" && (
                    <Card className="border-slate-800 bg-slate-900 p-8 flex flex-col items-center justify-center min-h-[300px]">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                        <p>Processing...</p>
                    </Card>
                )}

                {verificationStatus === "pending_approval" && (
                    <Card className="border-amber-500 bg-amber-950/30 p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
                        <Loader2 className="h-16 w-16 text-amber-500 mb-4" />
                        <h2 className="text-2xl font-bold text-amber-400 mb-2">APPROVAL REQUIRED</h2>
                        <div className="bg-black/40 p-4 rounded-lg w-full mb-6 text-left">
                            <p className="text-sm text-slate-400">Attendee</p>
                            <p className="text-xl font-semibold mb-2">{attendeeData?.userName || "Unknown"}</p>
                            <p className="text-sm text-slate-400">Event</p>
                            <p className="font-medium">{attendeeData?.eventTitle}</p>
                        </div>
                        <div className="flex flex-col gap-3 w-full">
                            <Button onClick={handleQuickApprove} size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white">
                                Approve & Admit
                            </Button>
                            <Button onClick={resetScanner} variant="outline" className="w-full border-slate-700 text-slate-300">
                                Cancel / Scan Next
                            </Button>
                        </div>
                    </Card>
                )}

                {verificationStatus === "valid" && (
                    <Card className="border-green-600 bg-green-950/30 p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
                        <CheckCircle2 className="h-20 w-20 text-green-500 mb-4" />
                        <h2 className="text-3xl font-bold text-green-400 mb-2">VALID TICKET</h2>
                        <div className="bg-black/40 p-4 rounded-lg w-full mb-6">
                            <p className="text-lg font-semibold">{attendeeData?.eventTitle}</p>
                            <p className="text-muted-foreground">Attendee: {attendeeData?.userName || "Guest"}</p>
                            <p className="text-xs text-slate-500 font-mono mt-2">{attendeeData?.ticketToken?.slice(0, 12)}...</p>
                        </div>
                        <Button onClick={resetScanner} size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white">
                            Scan Next
                        </Button>
                    </Card>
                )}

                {(verificationStatus === "invalid" || verificationStatus === "error") && (
                    <Card className="border-red-600 bg-red-950/30 p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
                        <XCircle className="h-20 w-20 text-red-500 mb-4" />
                        <h2 className="text-3xl font-bold text-red-400 mb-2">
                            {verificationStatus === 'error' ? 'ERROR' : 'INVALID / USED'}
                        </h2>
                        <p className="text-lg text-red-200 mb-6">{message}</p>
                        <Button onClick={resetScanner} size="lg" className="w-full bg-red-600 hover:bg-red-700 text-white">
                            Scan Next
                        </Button>
                    </Card>
                )}

            </main>
        </div>
    )
}
