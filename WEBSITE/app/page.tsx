import Navigation from "@/components/navigation"
import Hero from "@/components/hero"
import WhyItMatters from "@/components/why-it-matters"
import HowItWorks from "@/components/how-it-works"
import Features from "@/components/features"
import Proof from "@/components/proof"
import Footer from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <WhyItMatters />
      <HowItWorks />
      <Features />
      <Proof />
      <Footer />
    </main>
  )
}
