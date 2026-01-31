"use client"

import * as React from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MapPin, Music, Briefcase, Dumbbell, Coffee, Loader2 } from "lucide-react"
import { EventCard, Event } from "@/components/event-card"
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

const MapView = dynamic(() => import("@/components/ui/map-view"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse flex items-center justify-center">Loading Map...</div>
})

const CATEGORIES = [
  { name: "Music", icon: Music },
  { name: "Business", icon: Briefcase },
  { name: "Sports", icon: Dumbbell },
  { name: "Social", icon: Coffee },
];

export default function Home() {
  const [featuredEvents, setFeaturedEvents] = React.useState<Event[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchEvents() {
      try {
        const q = query(
          collection(db, "events"),
          orderBy("createdAt", "desc"),
          limit(4)
        );
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
        setFeaturedEvents(events);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 px-4 md:py-32 overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-200/20 via-background to-background dark:from-indigo-900/20 dark:via-background dark:to-background"></div>

          <div className="container flex flex-col items-center text-center space-y-8">
            <div className="flex items-center gap-2 rounded-full bg-muted/50 px-4 py-1.5 text-sm font-medium text-foreground backdrop-blur-sm border">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Live events in India
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl max-w-4xl">
              Discover <span className="text-primary">Events</span> <br className="hidden sm:block" /> Near You
            </h1>

            <p className="max-w-[700px] text-lg text-muted-foreground md:text-xl">
              Explore local gatherings, workshops, concerts, and more based on your Indian city.
            </p>

            <div className="w-full max-w-md flex items-center space-x-2 p-2 bg-background/50 border rounded-full backdrop-blur-md shadow-lg">
              <div className="pl-3 text-muted-foreground">
                <Search className="h-5 w-5" />
              </div>
              <Input
                type="text"
                placeholder="Search events in Mumbai, Delhi, Bangalore..."
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent h-10"
              />
              <Button className="rounded-full px-6">Search</Button>
            </div>

            {/* Category Chips */}
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              {CATEGORIES.map((cat) => (
                <Button key={cat.name} variant="outline" size="sm" className="rounded-full gap-2 border-dashed">
                  <cat.icon className="h-4 w-4" />
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Events */}
        <section className="py-16 container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Upcoming Events</h2>
              <p className="text-muted-foreground mt-1">Trending events in India.</p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/events">View all &rarr;</Link>
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : featuredEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border rounded-lg bg-muted/20 border-dashed">
              <p className="text-muted-foreground">No upcoming events found. Be the first to host one!</p>
              <Button variant="link" asChild className="mt-2">
                <Link href="/create-event">Create Event</Link>
              </Button>
            </div>
          )}
        </section>

        {/* Location Section Mockup */}
        <section className="py-16 bg-muted/30">
          <div className="container grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold tracking-tight">Events in your City</h2>
              <p className="text-lg text-muted-foreground">
                Find unparalleled options for entertainment, learning, and networking right in your neighborhood.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-4 bg-background p-4 rounded-lg border shadow-sm">
                  <MapPin className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="font-medium">Bengaluru, Karnataka</p>
                    <p className="text-sm text-muted-foreground">450+ events this week</p>
                  </div>
                </li>
                <li className="flex items-center gap-4 bg-background p-4 rounded-lg border shadow-sm">
                  <MapPin className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="font-medium">Mumbai, Maharashtra</p>
                    <p className="text-sm text-muted-foreground">320+ events this week</p>
                  </div>
                </li>
                <li className="flex items-center gap-4 bg-background p-4 rounded-lg border shadow-sm">
                  <MapPin className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="font-medium">New Delhi</p>
                    <p className="text-sm text-muted-foreground">280+ events this week</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="relative h-[400px] w-full rounded-2xl overflow-hidden bg-muted border shadow-xl">
              <MapView
                center={[20.5937, 78.9629]}
                zoom={4}
                markers={[
                  { position: [12.9716, 77.5946], title: "Bangalore" },
                  { position: [19.0760, 72.8777], title: "Mumbai" },
                  { position: [28.6139, 77.2090], title: "New Delhi" }
                ]}
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 container">
          <div className="relative rounded-3xl bg-primary px-6 py-16 md:px-12 md:py-20 text-center text-primary-foreground overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>

            <h2 className="relative mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Host Your Own Event?
            </h2>
            <p className="relative mx-auto mt-6 max-w-lg text-lg text-primary-foreground/80">
              Create beautiful event pages, manage attendees, and sell tickets with ease.
            </p>
            <div className="relative mt-10 flex justify-center gap-4">
              <Button size="lg" variant="secondary" className="rounded-full px-8 font-semibold">
                <Link href="/create-event">Create Event</Link>
              </Button>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
