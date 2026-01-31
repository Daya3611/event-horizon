"use client"

import * as React from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { EventCard, Event } from "@/components/event-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Search, SlidersHorizontal, Loader2 } from "lucide-react"
import { collection, query, orderBy, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function EventsPage() {
    const [events, setEvents] = React.useState<Event[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [selectedCategories, setSelectedCategories] = React.useState<string[]>([])

    React.useEffect(() => {
        async function fetchEvents() {
            try {
                const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);
                const loadedEvents: Event[] = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    loadedEvents.push({
                        id: doc.id,
                        title: data.title,
                        date: data.date,
                        location: data.location,
                        category: data.category,
                        price: data.price,
                        image: data.image
                    });
                });
                setEvents(loadedEvents);
            } catch (error) {
                console.error("Error fetching events:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchEvents();
    }, [])

    const handleCategoryChange = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        )
    }

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.location.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(event.category);

        return matchesSearch && matchesCategory;
    })

    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 container py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <aside className="w-full md:w-64 space-y-6 hidden md:block shrink-0">
                        <div>
                            <h3 className="font-semibold mb-4">Search</h3>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search events..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="font-semibold mb-4">Categories</h3>
                            <div className="space-y-3">
                                {["Music", "Business", "Sports", "Health", "Food", "Art", "Technology", "Social"].map((cat) => (
                                    <div key={cat} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id={cat}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                                            checked={selectedCategories.includes(cat)}
                                            onChange={() => handleCategoryChange(cat)}
                                        />
                                        <Label htmlFor={cat} className="font-normal">{cat}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="font-semibold mb-4">Price</h3>
                            <div className="flex items-center gap-2">
                                <Input placeholder="Min" type="number" className="h-8" />
                                <span className="text-muted-foreground">-</span>
                                <Input placeholder="Max" type="number" className="h-8" />
                            </div>
                        </div>
                    </aside>

                    {/* Mobile Filter Toggle */}
                    <div className="md:hidden flex items-center justify-between w-full mb-4">
                        <h1 className="text-2xl font-bold">All Events</h1>
                        <Button variant="outline" size="sm" className="gap-2">
                            <SlidersHorizontal className="h-4 w-4" /> Filters
                        </Button>
                    </div>

                    {/* Event Grid */}
                    <div className="flex-1">
                        <div className="hidden md:block mb-6">
                            <h1 className="text-3xl font-bold">Explore Events</h1>
                            <p className="text-muted-foreground">Find the perfect event for you.</p>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : filteredEvents.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredEvents.map((event) => (
                                    <EventCard key={event.id} event={event} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <p className="text-muted-foreground">No events found matching your criteria.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
