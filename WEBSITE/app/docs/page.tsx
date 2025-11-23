import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Clock } from "lucide-react"

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold">Developer Docs</h1>
            <p className="text-lg text-foreground/70">Integrate CallerID into your application</p>
          </div>

          <Card className="p-12 text-center">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="w-8 h-8 text-primary" />
              </div>
            <div>
                <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
                <p className="text-foreground/70">
                  Documentation is currently being prepared. Check back soon for integration guides, API references, and examples.
                </p>
              </div>
            </div>
                </Card>
        </div>
      </section>

      <Footer />
    </main>
  )
}
