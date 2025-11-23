import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    q: "Do you store my contacts?",
    a: "No. Your contacts are encrypted using Seal threshold encryption before leaving your browser. Only encrypted data is stored on Walrus decentralized storage. We never see or store plaintext contact information.",
  },
  {
    q: "How does encryption work?",
    a: "Your contacts are processed inside a Trusted Execution Environment (TEE): (1) Phone numbers are hashed using BLAKE2b256 (32-byte hash) inside the TEE, (2) Email and other fields are encrypted using Seal threshold encryption inside the TEE, (3) Names remain plaintext for caller identification. All hashing and encryption happens securely inside the TEE before the encrypted data is uploaded to Walrus decentralized storage.",
  },
  {
    q: "What is Seal encryption?",
    a: "Seal is a threshold encryption system that distributes encryption keys across multiple key servers. Your data is encrypted such that no single party can decrypt it alone - multiple key servers must cooperate. This provides strong security guarantees and prevents any single point of failure or compromise.",
  },
  {
    q: "What is Walrus storage?",
    a: "Walrus is a decentralized storage network built on Sui blockchain. We upload your encrypted contacts to Walrus, which stores them as immutable blobs. On testnet, storage is sponsored by the Walrus Foundation (free!). Each upload receives a unique Blob ID that can be referenced on-chain.",
  },
  {
    q: "How do you identify callers without seeing my data?",
    a: "Phone numbers are hashed using BLAKE2b256 before processing. We only work with hashes, never plaintext numbers. The system matches hashed phone numbers across the network to identify callers, while your actual contact data (emails, notes) remains encrypted with Seal and stored on Walrus.",
  },
  {
    q: "Why do I need a Sui wallet?",
    a: "A Sui wallet is required to publish your encrypted contacts on-chain. After encryption and Walrus upload, you sign a transaction that records your contacts on the Sui blockchain. This creates an immutable, verifiable record. The wallet is only used for signing the publish transaction - we never access your wallet or funds.",
  },
  {
    q: "What happens during the upload process?",
    a: "The process has 5 steps: (1) Hashing - phone numbers are hashed using BLAKE2b256, (2) Seal Encryption - email and other fields are encrypted with Seal threshold encryption, (3) Walrus Upload - encrypted data is uploaded to Walrus decentralized storage, (4) Publish - you sign a transaction to publish contacts on Sui blockchain, (5) Complete - you receive transaction digest and blob IDs for verification.",
  },
  {
    q: "What is a TEE and Nautilus?",
    a: "TEE (Trusted Execution Environment) is a secure processor that runs code in isolation. Nautilus is a TEE-based service that processes your data securely. When using Nautilus mode, phone hashing happens inside the TEE with cryptographic attestations proving the code ran correctly. We cannot see what happens inside the TEE.",
  },
  {
    q: "Can you decrypt my contacts?",
    a: "No. Your contacts are encrypted with Seal threshold encryption, which requires multiple key servers to cooperate. We don't have access to the decryption keys. Even if we wanted to, we cannot decrypt your data without the cooperation of multiple independent key servers.",
  },
  {
    q: "How do I verify my data was processed correctly?",
    a: "Everything is verifiable: (1) Check the transaction digest on Sui Explorer to see your on-chain record, (2) Verify the Walrus Blob ID to confirm storage, (3) Review the enclave signature from the processing API, (4) All encryption and hashing happens client-side with detailed console logs. You can audit every step.",
  },
  {
    q: "What data is stored on-chain?",
    a: "On-chain records include: phone number hash (BLAKE2b256), wallet public key, contact name (plaintext for caller ID), Walrus Blob ID (reference to encrypted data), and Sui Object ID. Your encrypted email and other fields remain off-chain in Walrus storage, only referenced by the Blob ID.",
  },
  {
    q: "Is my data permanently stored?",
    a: "Encrypted data on Walrus can be stored as deletable (default) or permanent. Deletable blobs can be removed after the storage epoch expires. On-chain records are permanent and immutable. You control the storage duration when uploading.",
  },
]

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold">Frequently Asked Questions</h1>
            <p className="text-lg text-foreground/70">Everything you need to know about CallerID</p>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, idx) => (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className="bg-background border border-border/50 rounded-lg px-6"
              >
                <AccordionTrigger className="text-left font-semibold py-4">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-foreground/70">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <Footer />
    </main>
  )
}
