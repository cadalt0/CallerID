import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Upload } from "lucide-react"
import Link from "next/link"

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold">How It Works</h1>
            <p className="text-lg text-foreground/70">Step-by-step breakdown of our privacy-preserving architecture</p>
            <div className="pt-4">
              <Button asChild size="lg" className="rounded-full">
                <Link href="/upload">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Contacts
                </Link>
              </Button>
            </div>
          </div>

          <div className="space-y-12">
            <div>
              <h2 className="text-2xl font-bold mb-8">End-to-End Flow</h2>
              <div className="space-y-6">
                {[
                  { num: "1", title: "Upload VCF", desc: "You securely upload your contact file" },
                  {
                    num: "2",
                    title: "Client-side hashing + encryption",
                    desc: "Your browser encrypts everything locally",
                  },
                  {
                    num: "3",
                    title: "Blob stored off-chain",
                    desc: "Encrypted data goes to distributed storage (Walrus)",
                  },
                  { num: "4", title: "Nautilus TEE processes", desc: "Secure enclave processes your data privately" },
                  { num: "5", title: "Attestation + Merkle proof", desc: "Cryptographic proof of correct processing" },
                  { num: "6", title: "Caller ID lookup", desc: "Query results with verified signals" },
                  { num: "7", title: "On-chain verification", desc: "Results verifiable on blockchain" },
                  { num: "8", title: "Auto-block signals", desc: "Optionally auto-block spam with confidence" },
                ].map((step, idx) => (
                  <Card key={idx} className="p-6 bg-background border border-border/50">
                    <div className="flex gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 flex-shrink-0">
                        <span className="font-bold text-primary">{step.num}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{step.title}</h3>
                        <p className="text-foreground/70 text-sm">{step.desc}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="bg-accent/5 border border-accent/20 rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-8">Privacy Guarantees</h2>
              <div className="space-y-4">
                {[
                  "No plaintext data ever leaves your device",
                  "No central database to compromise",
                  "No ads or data resale",
                  "Code is open-source and auditable",
                  "Verified by attestation + blockchain",
                ].map((guarantee, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>{guarantee}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
