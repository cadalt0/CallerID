import { Upload, Lock, Server, CheckCircle } from "lucide-react"

const steps = [
  {
    icon: Upload,
    number: "1",
    title: "Upload your contacts file",
    description: "Users upload a VCF file. Everything is encrypted locally in browser.",
  },
  {
    icon: Lock,
    number: "2",
    title: "Encrypted data stored off-chain",
    description: "Only encrypted blobs go to storage. No plaintext numbers, ever.",
  },
  {
    icon: Server,
    number: "3",
    title: "Processing inside a TEE",
    description: "Nautilus enclave decrypts & processes securely. Attestation proves everything happened correctly.",
  },
  {
    icon: CheckCircle,
    number: "4",
    title: "Verified signals help identify callers",
    description: "Spam score, commonly used names, reputation signals — all verifiable on-chain.",
  },
]

export default function HowItWorks() {
  return (
    <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold">How It Works</h2>
          <p className="text-foreground/70 text-lg">
            Your contacts stay encrypted. Our system processes them inside a secure enclave. The results are verifiable
            on-chain.
          </p>
        </div>

        <div className="space-y-6">
          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <div key={idx} className="flex gap-6 md:gap-8 items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-14 w-14 rounded-lg bg-primary/10">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-foreground/70">{step.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-16 p-8 bg-accent/5 border border-accent/20 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Privacy Guarantees</h3>
          <ul className="space-y-3 text-foreground/70">
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold mt-0.5">✓</span>
              <span>No plaintext data ever leaves your device</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold mt-0.5">✓</span>
              <span>No central database of contacts</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold mt-0.5">✓</span>
              <span>No ads or data resale</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold mt-0.5">✓</span>
              <span>Code is auditable and open-source</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold mt-0.5">✓</span>
              <span>Verified by attestation + blockchain</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}
