import Link from "next/link"
import { Calendar, MapPin } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export interface Event {
    id: string
    title: string
    date: string
    location: string
    category: string
    image?: string
    price: string
}

export function EventCard({ event }: { event: Event }) {
    return (
        <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20">
            <div className="relative h-48 w-full bg-muted overflow-hidden">
                {event.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={event.image} alt={event.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-90 group-hover:opacity-100 transition-opacity" />
                )}
                <div className="absolute top-4 left-4">
                    <Badge variant="secondary" className="backdrop-blur-md bg-white/10 text-white border-white/20 hover:bg-white/20">{event.category}</Badge>
                </div>
            </div>
            <CardContent className="p-5">
                <h3 className="text-xl font-bold line-clamp-1 mb-2 group-hover:text-primary transition-colors">{event.title}</h3>
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{event.location}</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="p-5 pt-0 flex items-center justify-between">
                <span className="font-bold text-lg text-primary">{event.price === "0" ? "Free" : `₹${event.price}`}</span>
                <Button asChild size="sm" className="rounded-full px-6">
                    <Link href={`/events/${event.id}`}>View Details</Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
