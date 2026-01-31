import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function MapPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 flex items-center justify-center bg-muted/30">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold text-muted-foreground/50">Map View</h1>
                    <p className="text-muted-foreground">Interactive map coming soon.</p>
                </div>
            </main>
            <Footer />
        </div>
    )
}
