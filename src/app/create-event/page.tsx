"use client"

import * as React from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Upload, MapPin, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { auth, db, storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"

export default function CreateEventPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)
    const [user, setUser] = React.useState<any>(null)

    // Form State
    const [title, setTitle] = React.useState("")
    const [category, setCategory] = React.useState("Music")
    const [price, setPrice] = React.useState("")
    const [date, setDate] = React.useState("")
    const [time, setTime] = React.useState("")
    const [location, setLocation] = React.useState("")
    const [description, setDescription] = React.useState("")
    const [requiresApproval, setRequiresApproval] = React.useState(false) // Default false
    const [imageFile, setImageFile] = React.useState<File | null>(null)
    const [imagePreview, setImagePreview] = React.useState<string | null>(null)

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.push("/login")
            } else {
                setUser(currentUser)
            }
        })
        return () => unsubscribe()
    }, [router])

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async () => {
        if (!title || !date || !location || !price) {
            alert("Please fill in all required fields")
            return
        }

        setIsLoading(true)
        try {
            let imageUrl = ""

            if (imageFile) {
                const storageRef = ref(storage, `events/${Date.now()}_${imageFile.name}`)
                const snapshot = await uploadBytes(storageRef, imageFile)
                imageUrl = await getDownloadURL(snapshot.ref)
            }

            await addDoc(collection(db, "events"), {
                title,
                category,
                price,
                date: `${date} ${time}`, // Simplified date string for now
                rawDate: date,
                rawTime: time,
                location,
                description,
                image: imageUrl,
                requiresApproval, // Added field
                creatorId: user.uid,
                organizer: user.displayName || "Anonymous",
                createdAt: serverTimestamp()
            })

            router.push(
                `/status?type=success&title=Event Published!&message=Your event "${title}" has been successfully created and is now live.&next=/events&nextLabel=View All Events`
            )
        } catch (error) {
            console.error("Error creating event:", error)
            router.push(
                `/status?type=error&title=Creation Failed&message=We could not create your event at this time. Please try again.&next=/create-event&nextLabel=Try Again`
            )
        } finally {
            setIsLoading(false)
        }
    }

    if (!user) return null // or a loading spinner

    return (
        <div className="flex min-h-screen flex-col bg-muted/10">
            <Navbar />
            <main className="flex-1 py-12 container max-w-3xl">
                <div className="mb-8 space-y-2 text-center">
                    <h1 className="text-3xl font-bold tracking-tight">Create an Event</h1>
                    <p className="text-muted-foreground">Fill out the details below to host your event.</p>
                </div>

                <Card className="border-muted bg-background shadow-lg">
                    <CardHeader>
                        <CardTitle>Event Details</CardTitle>
                        <CardDescription>Basic information about your event.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Event Title</Label>
                            <Input
                                id="title"
                                placeholder="e.g. Summer Music Festival"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="category">Category</Label>
                                <select
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    id="category"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                >
                                    <option>Music</option>
                                    <option>Business</option>
                                    <option>Technology</option>
                                    <option>Health</option>
                                    <option>Social</option>
                                    <option>Food</option>
                                    <option>Art</option>
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="price">Price (₹)</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    placeholder="0 for Free"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Date & Time</Label>
                            <div className="flex gap-4">
                                <div className="relative flex-1">
                                    <Input
                                        type="date"
                                        className="pl-10"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                    />
                                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="relative flex-1">
                                    <Input
                                        type="time"
                                        className="pl-10"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="location">Location</Label>
                            <div className="relative">
                                <Input
                                    id="location"
                                    placeholder="e.g. Indiranagar Club, Bangalore"
                                    className="pl-10"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                />
                                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Tell people what your event is about..."
                                className="min-h-[120px]"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center space-x-2 border p-4 rounded-lg bg-muted/50">
                            <input
                                type="checkbox"
                                id="approval"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={requiresApproval}
                                onChange={(e) => setRequiresApproval(e.target.checked)}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="approval" className="cursor-pointer">
                                    Require Approval for Attendees
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    If checked, you must manually approve each RSVP before they get a ticket.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Cover Image</Label>
                            <div className="flex items-center justify-center w-full">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors border-muted-foreground/25 relative overflow-hidden">
                                    {imagePreview ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                                        </div>
                                    )}
                                    <Input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                </label>
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter className="justify-end gap-2">
                        <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Event
                        </Button>
                    </CardFooter>
                </Card>
            </main>
            <Footer />
        </div>
    )
}
