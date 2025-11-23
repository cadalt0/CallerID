import { Card } from "@/components/ui/card"
import { Shield, Eye, Users, Zap } from "lucide-react"
import { ScrollFade } from "./scroll-fade"
import { HoverLift } from "./hover-lift"

const cards = [
  {
    icon: Eye,
    title: "Caller ID without spying",
    description: "We never see or store your contacts. Everything stays encrypted end-to-end.",
  },
  {
    icon: Shield,
    title: "Verified privacy",
    description:
      "Processing happens inside attested environments (TEEs). On-chain proofs confirm your data was never accessed.",
  },
  {
    icon: Users,
    title: "Community-powered safety",
    description: "Shared signals help identify spam callers. Never exposes your personal phonebook.",
  },
  {
    icon: Zap,
    title: "Transparent by design",
    description: "No tracking. No selling data. No hidden collection.",
  },
]

export default function WhyItMatters() {
  return (
    <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-secondary/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <ScrollFade>
            <h2 className="text-3xl sm:text-4xl font-bold">Why It Matters</h2>
          </ScrollFade>
          <ScrollFade delay={100}>
            <p className="text-foreground/70 text-lg max-w-2xl mx-auto">
              Privacy-first caller identification without compromising your security
            </p>
          </ScrollFade>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {cards.map((card, idx) => {
            const Icon = card.icon
            return (
              <ScrollFade key={idx} delay={idx * 120} direction="up">
                <HoverLift>
                  <Card className="p-8 bg-background hover:bg-card/50 transition border border-border/50 h-full">
                    <Icon className="w-10 h-10 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-3">{card.title}</h3>
                    <p className="text-foreground/70">{card.description}</p>
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
