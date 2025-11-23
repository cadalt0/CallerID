import { Card } from "@/components/ui/card"
import { Lock, LinkIcon, FileCheck, Shield } from "lucide-react"

export default function Proof() {
  return (
    <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold">Proof of Privacy</h2>
          <p className="text-foreground/70 text-lg">
            We can't see your data — and here's why the system is built to guarantee it
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="p-8 bg-accent/5 border border-accent/20">
            <h3 className="text-lg font-semibold mb-6">Trust Model</h3>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Client-side encryption</p>
                  <p className="text-sm text-foreground/70">Your data is encrypted before leaving your device</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">TEEs we cannot access</p>
                  <p className="text-sm text-foreground/70">Processing happens in secure enclaves we don't control</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <FileCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Attested workflows</p>
                  <p className="text-sm text-foreground/70">Cryptographic proofs confirm the system worked correctly</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <LinkIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Zero plaintext storage</p>
                  <p className="text-sm text-foreground/70">Your numbers are never stored unencrypted anywhere</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-background border border-border/50">
            <h3 className="text-lg font-semibold mb-6">Public Verification</h3>
            <p className="text-foreground/70 mb-6">Anyone can independently verify our claims:</p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Check attestation hash</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Verify CID digest</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Audit Merkle root</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Review contract history</span>
              </div>
            </div>
            <div className="mt-8 p-4 bg-primary/5 rounded border border-primary/20">
              <p className="text-sm font-semibold text-primary mb-2">Our Guarantee</p>
              <p className="text-xs text-foreground/70">
                Your data is never stored, shared, or sold — not because we promise, but because the system is built so
                we can't.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
