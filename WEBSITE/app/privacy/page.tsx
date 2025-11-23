import Navigation from "@/components/navigation"
import Footer from "@/components/footer"

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto prose prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-12">Privacy Policy</h1>

          <div className="space-y-8 text-foreground/80 leading-relaxed">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">No Data Selling</h2>
              <p>
                CallerID does not sell, trade, or share your personal data with third parties. We cannot access your
                plaintext contact information - the system is architecturally designed to prevent it.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Plaintext Storage</h2>
              <p>
                We do not store plaintext phone numbers, names, or contact details. All contact information is converted
                to encrypted hashes before any processing.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">End-to-End Encryption</h2>
              <p>
                Your data is encrypted on your device using strong encryption standards. Only you control the decryption
                keys. Processing happens inside secure enclaves that we cannot access.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Attestation Verification</h2>
              <p>
                All processing is cryptographically attested. Independent auditors can verify that your data was
                processed correctly and never accessed inappropriately.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">On-Chain Commitments</h2>
              <p>
                Key commitments are stored on-chain, creating an immutable record of system behavior. Anyone can audit
                these commitments at any time.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">User Control</h2>
              <p>
                You control what data you share, who you share it with, and when. You can delete your data at any time,
                and the system will remove all traces.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Transparency</h2>
              <p>
                Our code is open-source. Our architecture is documented. Our commitments are verifiable. We believe
                privacy through transparency is stronger than privacy through obscurity.
              </p>
            </div>

            <div className="pt-8 border-t border-border">
              <p className="text-sm text-foreground/60">
                Last updated: 2025. For questions about our privacy practices, contact privacy@trustcall.io
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
