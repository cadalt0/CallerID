import { Card } from "@/components/ui/card"
import { ShieldCheck, Share2, Lock, Layers, Search, Zap } from "lucide-react"
import { ScrollFade } from "./scroll-fade"
import { HoverLift } from "./hover-lift"

const features = [
  {
    icon: ShieldCheck,
    title: "Privacy-first Caller ID",
    description: "Receives only verified signals, not your data.",
  },
  {
    icon: Share2,
    title: "Encrypted Contact Sharing",
    description: "Contacts are converted into secure hashes + encrypted blobs.",
  },
  {
    icon: Lock,
    title: "Attested Processing",
    description: "All operations happen inside Nautilus TEEs.",
  },
  {
    icon: Layers,
    title: "On-chain Proofs",
    description: "CID digest + Merkle root stored on-chain for transparency.",
  },
  {
    icon: Search,
    title: "Spam Detection",
    description: "Community-driven reporting aggregated inside enclaves.",
  },
  {
    icon: Zap,
    title: "Name Confidence",
    description: "Identifies likely caller names using secure aggregated signals.",
  },
]

export default function Features() {
  return (
    <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-secondary/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <ScrollFade>
            <h2 className="text-3xl sm:text-4xl font-bold">Key Features</h2>
          </ScrollFade>
          <ScrollFade delay={100}>
            <p className="text-foreground/70 text-lg">Everything you need for secure, private caller identification</p>
          </ScrollFade>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <ScrollFade key={idx} delay={idx * 100} direction="up">
                <HoverLift>
                  <Card className="p-6 bg-background border border-border/50 hover:border-primary/30 transition h-full">
                    <Icon className="w-8 h-8 text-primary mb-4" />
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-foreground/70 text-sm">{feature.description}</p>
                  </Card>
                </HoverLift>
              </ScrollFade>
            )
          })}
        </div>
      </div>
    </section>
  )
}
