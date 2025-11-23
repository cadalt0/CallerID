import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card } from "@/components/ui/card"
import { ShieldCheck, Share2, Lock, Layers, Search, Zap } from "lucide-react"

const features = [
  {
    icon: ShieldCheck,
    title: "Privacy-first Caller ID",
    description:
      "Receives only verified signals from our private network, never your actual contact data. Identify unknown callers instantly without exposing your phonebook.",
    details: ["Signal-based identification", "Zero contact exposure", "Instant lookup", "Confidence scores"],
  },
  {
    icon: Share2,
    title: "Encrypted Contact Sharing",
    description:
      "Contacts are converted into secure hashes and encrypted blobs. You control what gets shared and with whom.",
    details: ["VCF format support", "Secure hashing", "Encrypted storage", "Selective sharing"],
  },
  {
    icon: Lock,
    title: "Attested Processing",
    description:
      "All operations happen inside Nautilus TEEs. Cryptographic attestations prove your data was never accessed.",
    details: ["Nautilus attestation", "Verifiable execution", "Secure enclaves", "Tamper-proof logs"],
  },
  {
    icon: Layers,
    title: "On-chain Proofs",
    description: "CID digest and Merkle root stored on-chain for transparent verification. Anyone can audit.",
    details: ["Blockchain storage", "CID commitment", "Merkle proofs", "Public auditability"],
  },
  {
    icon: Search,
    title: "Spam Detection",
    description:
      "Community-driven reporting aggregated securely inside enclaves. Identify patterns without exposing individuals.",
    details: ["Aggregate signals", "Pattern detection", "Community reports", "Private analysis"],
  },
  {
    icon: Zap,
    title: "Developer APIs",
    description:
      "Simple, secure APIs for integrating caller ID verification into your apps. Lookup and proof verification.",
    details: ["Lookup API", "Proof API", "On-chain explorer", "Integration guides"],
  },
]

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold">Features</h1>
            <p className="text-lg text-foreground/70">Everything built for privacy and security</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <Card
                  key={idx}
                  className="p-8 bg-background border border-border/50 hover:border-primary/30 transition"
                >
                  <Icon className="w-10 h-10 text-primary mb-6" />
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-foreground/70 mb-6">{feature.description}</p>
                  <div className="space-y-2">
                    {feature.details.map((detail, didx) => (
                      <div key={didx} className="flex items-center gap-2 text-sm">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                        {detail}
                      </div>
                    ))}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
