"use client"

import * as React from "react"
import QRCode from "qrcode"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { QrCode } from "lucide-react"

interface TicketQRProps {
    eventName: string
    eventId: string
    userId: string
    ticketToken: string
    userName: string
    status?: string
}

export function TicketQR({ eventName, eventId, userId, ticketToken, userName, status }: TicketQRProps) {
    const [qrUrl, setQrUrl] = React.useState("")

    React.useEffect(() => {
        // ... (existing helper logic)
        // Format: eventId:userId:token (Simple format for easier parsing)
        const qrData = JSON.stringify({
            eventId,
            userId,
            token: ticketToken || ""
        })

        QRCode.toDataURL(qrData, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        }).then((url) => {
            setQrUrl(url)
        }).catch((err) => {
            console.error(err)
        })
    }, [eventId, userId, ticketToken])

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <QrCode className="h-4 w-4" /> {status === 'pending' ? 'Show QR' : 'View Ticket'}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{status === 'pending' ? 'Approval Request QR' : 'Entry Ticket'}</DialogTitle>
                    <DialogDescription>
                        {status === 'pending'
                            ? "Show this code to the event host to instantly approve your entry."
                            : "Present this QR code at the event entrance."}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center p-6 space-y-4">
                    <div className="text-center">
                        <h3 className="font-bold text-lg">{eventName}</h3>
                        <p className="text-sm text-muted-foreground">{userName}</p>
                        {status === 'pending' && <p className="text-xs font-semibold text-amber-500 mt-1">PENDING APPROVAL</p>}
                    </div>
                    {qrUrl ? (
                        <div className={`border-4 p-2 rounded-lg bg-white ${status === 'pending' ? 'border-amber-400' : 'border-black'}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={qrUrl} alt="Ticket QR Code" className="w-[200px] h-[200px]" />
                        </div>
                    ) : (
                        <div className="w-[200px] h-[200px] bg-muted animate-pulse rounded-lg" />
                    )}
                    <p className="text-xs text-muted-foreground text-center">
                        {status === 'pending' ? 'Reference Code' : 'Token'}: {ticketToken ? ticketToken.slice(0, 8) + '...' : 'N/A'}
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
