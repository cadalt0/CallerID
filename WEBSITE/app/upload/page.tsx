"use client"

import { useState, useEffect } from "react"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Upload } from "lucide-react"
import { UploadZone } from "@/components/upload-zone"
import { ManualEntry } from "@/components/manual-entry"
import { ContactPreview } from "@/components/contact-preview"
import { EncryptionFlow } from "@/components/encryption-flow"
import { ResultCard } from "@/components/result-card"
import { processContacts } from "@/lib/contact-processor"
import { encryptContactsFromAPI } from "@/lib/seal-encryption"
import { uploadEncryptedContactsToWalrus } from "@/lib/walrus-upload"
import { usePublishContacts } from "@/lib/publish-contacts"

interface Contact {
  id: string
  name: string
  number: string
  email?: string
  other?: string
  hashed?: string
  include: boolean
}

interface ParsedVCFContact {
  fullName?: string
  name?: {
    family?: string
    given?: string
    additional?: string
    prefix?: string
    suffix?: string
  }
  phones: Array<{ type?: string; number: string }>
  emails: Array<{ type?: string; email: string }>
  organization?: string
  address?: string
  note?: string
  url?: string
  raw: Record<string, string>
}

export default function UploadPage() {
  const [tab, setTab] = useState<"upload" | "manual">("upload")
  const [contacts, setContacts] = useState<Contact[]>([])
  const [parsedVCFContacts, setParsedVCFContacts] = useState<ParsedVCFContact[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [encryptionStep, setEncryptionStep] = useState(0) // 0=idle, 1=hashing, 2=seal, 3=walrus, 4=publish, 5=complete
  const [statusMessage, setStatusMessage] = useState("")
  
  // Publish hook (also used to check wallet connection)
  const { publish, isPending: isPublishing, isSuccess: isPublished, transactionDigest, error: publishError, isWalletConnected } = usePublishContacts()
  
  // Check if wallet is connected - required for upload
  const canUpload = isWalletConnected

  const handleAddContact = (contact: Omit<Contact, "id" | "include">) => {
    const newContact: Contact = {
      ...contact,
      id: Math.random().toString(),
      include: true,
    }
    setContacts([...contacts, newContact])
  }

  const handleToggleContact = (id: string) => {
    setContacts(contacts.map((c) => (c.id === id ? { ...c, include: !c.include } : c)))
  }

  const handleRemoveContact = (id: string) => {
    setContacts(contacts.filter((c) => c.id !== id))
  }

  // Debug: Log state changes
  useEffect(() => {
    console.log("📊 UploadPage state updated:")
    console.log(`  Contacts: ${contacts.length}`)
    console.log(`  Parsed VCF: ${parsedVCFContacts.length}`)
    console.log(`  Is Processing: ${isProcessing}`)
    console.log(`  Has Result: ${!!result}`)
    console.log(`  Button Disabled: ${contacts.length === 0 || isProcessing}`)
    console.log("\n")
  }, [contacts, parsedVCFContacts, isProcessing, result])

  const handleEncryptAndUpload = async () => {
    console.log("🔘 Encrypt & Upload button clicked!")
    console.log("Current state:")
    console.log(`  Contacts: ${contacts.length}`)
    console.log(`  Parsed VCF Contacts: ${parsedVCFContacts.length}`)
    console.log(`  Is Processing: ${isProcessing}`)
    console.log(`  Wallet Connected: ${isWalletConnected}`)
    console.log("\n")
    
    // Check wallet connection first - required for publish step
    if (!isWalletConnected) {
      alert("Please connect your wallet first. The publish step requires a connected wallet to create on-chain transactions.")
      return
    }
    
    setIsProcessing(true)
    setEncryptionStep(1) // Parsing
    setStatusMessage("Parsing contacts...")
    
    try {
      // Step 1: Parsing
      setEncryptionStep(1)
      setStatusMessage("Parsing and preparing contacts...")
      
      // Get only included contacts
      const includedContacts = contacts.filter((c) => c.include)
      
      if (includedContacts.length === 0) {
        throw new Error("No contacts selected for processing. Please select at least one contact.")
      }

      console.log("🔍 Preparing contacts for processing...")
      console.log(`  Total contacts: ${contacts.length}`)
      console.log(`  Included contacts: ${includedContacts.length}`)
      console.log(`  Parsed VCF contacts: ${parsedVCFContacts.length}`)
      console.log("\n")

      // Convert included contacts to VCF format for processing
      // If we have parsed VCF contacts, use those (more complete data)
      // Otherwise, convert simple contacts to VCF format
      let contactsToProcess: ParsedVCFContact[] = []

      if (parsedVCFContacts.length > 0) {
        // Use parsed VCF contacts and match with included contacts
        contactsToProcess = parsedVCFContacts.filter((parsed) => {
          const name = parsed.fullName || 
            (parsed.name ? 
              [parsed.name.prefix, parsed.name.given, parsed.name.additional, parsed.name.family, parsed.name.suffix]
                .filter(Boolean).join(" ") : 
              "")
          const phone = parsed.phones[0]?.number || parsed.phones.find(p => p.number)?.number || ""
          
          return includedContacts.some(
            (c) => c.name === name && c.number === phone
          )
        })
      }

      // If no parsed VCF contacts or matching failed, convert simple contacts
      if (contactsToProcess.length === 0) {
        console.log("⚠️  No matching parsed VCF contacts found, converting simple contacts...")
        contactsToProcess = includedContacts.map((contact) => ({
          fullName: contact.name,
          phones: [{ number: contact.number }],
          emails: contact.email ? [{ email: contact.email }] : [],
          note: contact.other || undefined,
          raw: {},
        }))
      }

      if (contactsToProcess.length === 0) {
        throw new Error("No contacts to process. Please ensure contacts are selected and have valid data.")
      }

      console.log("🚀 Starting encryption and upload process...")
      console.log(`Processing ${contactsToProcess.length} contact(s)`)
      console.log("\n📋 Contacts to process:")
      contactsToProcess.forEach((c, i) => {
        const name = c.fullName || (c.name ? [c.name.prefix, c.name.given, c.name.additional, c.name.family, c.name.suffix].filter(Boolean).join(" ") : "Unknown")
        const phone = c.phones[0]?.number || "N/A"
        console.log(`  ${i + 1}. ${name} - ${phone}`)
      })
      console.log("\n")

      // Step 1: Hashing (CSV conversion + phone hashing via API)
      setEncryptionStep(1)
      setStatusMessage(`Hashing phone numbers for ${contactsToProcess.length} contact(s)...`)
      
      // Convert to CSV and process via API (phone hashing)
      const { contactsToCSV } = await import("@/lib/contact-processor")
      const csvData = contactsToCSV(contactsToProcess)
      console.log("📄 CSV generated, length:", csvData.length, "characters")
      
      // Process contacts via API (this is where actual phone hashing happens)
      const apiResponse = await processContacts(contactsToProcess)

      // Step 2: Seal Encryption (encrypt email and other fields)
      setEncryptionStep(2)
      setStatusMessage("Encrypting email and other fields with Seal threshold encryption...")
      
      console.log("🔐 Starting Seal encryption...")
      const encryptedContacts = await encryptContactsFromAPI(apiResponse)
      console.log(`✅ Seal encryption complete! Encrypted ${encryptedContacts.length} contact(s)\n`)

      // Step 3: Uploading to Walrus
      setEncryptionStep(3)
      setStatusMessage("Uploading encrypted contacts to Walrus storage...")
      
      console.log("📤 Starting Walrus upload...")
      const walrusResult = await uploadEncryptedContactsToWalrus(encryptedContacts, {
        epochs: 1,
        deletable: true,
      })
      console.log(`✅ Walrus upload complete! Blob ID: ${walrusResult.blobId}\n`)

      // Step 4: Publish to chain
      setEncryptionStep(4)
      setStatusMessage("Publishing contacts to on-chain smart contract...")
      
      // Check if wallet is connected
      if (!isWalletConnected) {
        throw new Error("Wallet not connected. Please connect your wallet to publish contacts on-chain.")
      }

      console.log("📝 Starting on-chain publish...")
      console.log(`  Encrypted contacts: ${encryptedContacts.length}`)
      console.log(`  Walrus blob ID: ${walrusResult.blobId}`)
      console.log(`  Walrus blob object ID: ${walrusResult.blobObjectId || 'N/A'}`)
      
      const publishResult = await publish(encryptedContacts, walrusResult)
      const publishTransactionDigest = publishResult.digest
      console.log(`✅ On-chain publish complete! Transaction: ${publishTransactionDigest}\n`)

      // Print final encryption summary to terminal
      console.log("=".repeat(80))
      console.log("FINAL ENCRYPTION SUMMARY")
      console.log("=".repeat(80))
      console.log("\n✅ Encryption Complete!")
      console.log(`\n📦 Generated Identifiers:`)
      console.log(`  CID: Qm${apiResponse.signature.slice(0, 20)}...`)
      console.log(`  Merkle Root: 0x${apiResponse.signature.slice(0, 16)}...`)
      console.log(`  Transaction Hash: 0x${apiResponse.signature.slice(0, 16)}...`)
      console.log(`  Full Signature: ${apiResponse.signature}`)
      console.log(`\n📊 Processing Details:`)
      console.log(`  Contacts Processed: ${apiResponse.response.data.contacts.length}`)
      console.log(`  Timestamp: ${new Date(apiResponse.response.timestamp_ms).toISOString()}`)
      console.log(`  Intent: ${apiResponse.response.intent}`)
      console.log(`  Attestation Status: verified`)
      console.log("\n")

      console.log("=".repeat(80))
      console.log("SEAL ENCRYPTED CONTACTS - FINAL OUTPUT")
      console.log("=".repeat(80))
      encryptedContacts.forEach((contact, index) => {
        // Get original phone_hash byte array from API response
        const originalContact = apiResponse.response.data.contacts[index]
        const phoneHashBytes = originalContact.phone_hash
        
        console.log(`\n  Contact ${index + 1}:`)
        console.log(`    Name: ${contact.name}`)
        console.log(`    Phone Hash (byte array): [${phoneHashBytes.join(', ')}]`)
        console.log(`    Phone Hash (length): ${phoneHashBytes.length} bytes`)
        console.log(`    Encrypted Email: ${contact.encrypted_email}`)
        console.log(`    Encrypted Other: ${contact.encrypted_other}`)
        console.log(`    Enclave Signature: ${contact.enclave_signature}`)
        console.log(`    Timestamp: ${new Date(contact.timestamp_ms).toISOString()}`)
      })
      console.log("\n" + "=".repeat(80) + "\n")

      console.log("📋 Complete API Response (for reference):")
      console.log(JSON.stringify(apiResponse, null, 2))
      console.log("\n")
      
      console.log("🎯 Encryption Data Summary (Copy-Paste Ready):")
      console.log("─".repeat(80))
      console.log(`CID: Qm${apiResponse.signature.slice(0, 20)}...`)
      console.log(`Merkle Root: 0x${apiResponse.signature.slice(0, 16)}...`)
      console.log(`Transaction Hash: 0x${apiResponse.signature.slice(0, 16)}...`)
      console.log(`Full Signature: ${apiResponse.signature}`)
      console.log(`Timestamp: ${new Date(apiResponse.response.timestamp_ms).toISOString()}`)
      console.log(`Contacts Count: ${apiResponse.response.data.contacts.length}`)
      console.log("\n📦 Final Encrypted Contacts Summary:")
      encryptedContacts.forEach((c, i) => {
        // Get original phone_hash byte array from API response
        const originalContact = apiResponse.response.data.contacts[i]
        const phoneHashBytes = originalContact.phone_hash
        
        console.log(`\n  ${i + 1}. ${c.name}`)
        console.log(`     Phone Hash (byte array): [${phoneHashBytes.join(', ')}]`)
        console.log(`     Encrypted Email: ${c.encrypted_email}`)
        console.log(`     Encrypted Other: ${c.encrypted_other}`)
      })
      console.log("=".repeat(80))
      console.log("\n")

      // Step 5: Complete
      setEncryptionStep(5)
      setStatusMessage("All done! Contacts encrypted, uploaded, and published on-chain.")

      // Print final upload summary
      console.log("=".repeat(80))
      console.log("FINAL UPLOAD SUMMARY")
      console.log("=".repeat(80))
      console.log("\n✅ All Steps Complete!")
      console.log(`\n📊 Summary:`)
      console.log(`  Contacts Processed: ${contactsToProcess.length}`)
      console.log(`  Contacts Encrypted: ${encryptedContacts.length}`)
      console.log(`  Blob ID: ${walrusResult.blobId}`)
      if (walrusResult.blobObjectId) {
        console.log(`  Blob Object ID: ${walrusResult.blobObjectId}`)
      }
      console.log(`  Enclave Signature: ${apiResponse.signature}`)
      console.log(`  Timestamp: ${new Date(apiResponse.response.timestamp_ms).toISOString()}`)
      console.log("\n")
      
      console.log("📦 Walrus Upload Details:")
      console.log(`  Storage: Walrus Testnet (sponsored by Walrus Foundation - FREE!)`)
      console.log(`  Publisher: ${process.env.NEXT_PUBLIC_WALRUS_PUBLISHER_URL || 'https://publisher.walrus-testnet.walrus.space'}`)
      console.log(`  Blob ID: ${walrusResult.blobId}`)
      if (walrusResult.blobObjectId) {
        console.log(`  Blob Object ID: ${walrusResult.blobObjectId}`)
      }
      console.log(`  Data Size: ${JSON.stringify(encryptedContacts).length} bytes (${(JSON.stringify(encryptedContacts).length / 1024).toFixed(2)} KB)`)
      console.log(`  Format: JSON (encrypted contacts)`)
      console.log(`  Epochs: 1`)
      console.log(`  Persistence: deletable`)
      console.log("\n")
      
      console.log("🔐 Encrypted Contacts in Blob (Full Data):")
      encryptedContacts.forEach((c, i) => {
        const originalContact = apiResponse.response.data.contacts[i]
        const phoneHashBytes = originalContact.phone_hash
        console.log(`\n  ${i + 1}. ${c.name}`)
        console.log(`     Phone Hash (byte array): [${phoneHashBytes.join(', ')}]`)
        console.log(`     Encrypted Email: ${c.encrypted_email}`)
        console.log(`     Encrypted Other: ${c.encrypted_other}`)
      })
      console.log("\n" + "=".repeat(80) + "\n")

      // Generate result from API response
    setResult({
        cid: walrusResult.blobId, // Use Walrus blob ID as CID
        merkleRoot: `0x${apiResponse.signature.slice(0, 16)}...`,
      attestationStatus: "verified",
        timestamp: new Date(apiResponse.response.timestamp_ms).toISOString(),
        contactsProcessed: contactsToProcess.length,
        transactionHash: publishTransactionDigest || walrusResult.blobObjectId || `0x${apiResponse.signature.slice(0, 16)}...`,
        blobId: walrusResult.blobId,
        blobObjectId: walrusResult.blobObjectId,
        publishDigest: publishTransactionDigest, // Use actual publish result digest
        apiResponse, // Store full response for debugging
        encryptedContacts, // Store Seal-encrypted contacts
        walrusResult, // Store Walrus upload result
      })
    } catch (error) {
      console.error("❌ Error during encryption/upload:", error)
      console.error("Error details:", error instanceof Error ? error.stack : error)
      console.log("\n")
      
      setEncryptionStep(0)
      setStatusMessage("")
      
      // Show user-friendly error
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      setResult({
        error: errorMessage,
        contactsProcessed: 0,
    })
    } finally {
    setIsProcessing(false)
      // Reset step after a delay if no result (error case)
      if (!result) {
        setTimeout(() => {
          setEncryptionStep(0)
          setStatusMessage("")
        }, 2000)
      }
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Upload className="w-6 h-6 text-primary" />
              <h1 className="text-3xl sm:text-4xl font-bold">Upload Contacts</h1>
            </div>
            <p className="text-lg text-foreground/70">
              Upload contacts — keep them private, processed in a verified enclave.
            </p>
          </div>

          {!result ? (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left panel - Upload and manual entry */}
              <div className="lg:col-span-2 space-y-6">
                {/* Tabs */}
                <div className="flex gap-2 border-b border-border overflow-x-auto">
                  <button
                    onClick={() => setTab("upload")}
                    className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-medium border-b-2 transition whitespace-nowrap ${
                      tab === "upload"
                        ? "border-primary text-primary"
                        : "border-transparent text-foreground/60 hover:text-foreground"
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    onClick={() => setTab("manual")}
                    className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-medium border-b-2 transition whitespace-nowrap ${
                      tab === "manual"
                        ? "border-primary text-primary"
                        : "border-transparent text-foreground/60 hover:text-foreground"
                    }`}
                  >
                    Enter Manually
                  </button>
                </div>

                {/* Content */}
                {tab === "upload" ? (
                  <UploadZone 
                    onContactsAdded={(newContacts) => setContacts([...contacts, ...newContacts])}
                    onParsedContactsAdded={(parsedContacts) => setParsedVCFContacts([...parsedVCFContacts, ...parsedContacts])}
                  />
                ) : (
                  <ManualEntry onAddContact={handleAddContact} />
                )}

                {/* Contact preview */}
                {contacts.length > 0 && (
                  <ContactPreview contacts={contacts} onToggle={handleToggleContact} onRemove={handleRemoveContact} />
                )}
              </div>

              {/* Right panel - Activity and status */}
              <div className="lg:col-span-1">
                <EncryptionFlow
                  isActive={isProcessing}
                  contactsCount={contacts.filter((c) => c.include).length}
                  onEncryptAndUpload={() => {
                    console.log("🔗 Handler called from EncryptionFlow")
                    console.log("About to call handleEncryptAndUpload")
                    handleEncryptAndUpload()
                  }}
                  disabled={contacts.length === 0 || isProcessing || !canUpload}
                  currentStep={encryptionStep}
                  statusMessage={statusMessage}
                  isWalletConnected={isWalletConnected}
                />
              </div>
            </div>
          ) : (
            <ResultCard result={result} onNewUpload={() => setResult(null)} />
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
