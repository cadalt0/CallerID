"use client"

import { useState } from "react"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Phone, Loader2, CheckCircle, XCircle, ExternalLink, Copy } from "lucide-react"
import { lookupContact, hashPhoneNumber, bytesToHex } from "@/lib/lookup-contact"
import { NETWORK } from "@/lib/publish-contacts"

export default function DemoPage() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [phoneHash, setPhoneHash] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleLookup = async (phone?: string) => {
    // Ensure we always have a string - handle event objects or undefined
    const numberToLookup = (typeof phone === 'string' ? phone : phoneNumber) || ''
    if (!numberToLookup.trim()) {
      setError("Please enter a phone number")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setPhoneHash(null)

    try {
      console.log("🔍 Starting contact lookup...")
      console.log(`Phone Number: ${numberToLookup}`)

      // Hash the phone number (same method as upload)
      const phoneHashBytes = hashPhoneNumber(numberToLookup)
      const phoneHashHex = bytesToHex(phoneHashBytes)
      setPhoneHash(phoneHashHex)

      console.log(`Phone Hash: ${phoneHashHex}`)
      console.log("Querying Sui contract...")

      // Lookup contact in contract
      const contact = await lookupContact(numberToLookup)

      if (contact) {
        setResult({
          found: true,
          contact,
          phoneNumber: numberToLookup,
          phoneHash: phoneHashHex,
        })
      } else {
    setResult({
          found: false,
          phoneNumber: numberToLookup,
          phoneHash: phoneHashHex,
        })
      }
    } catch (err) {
      console.error("❌ Lookup error:", err)
      setError(err instanceof Error ? err.message : "Failed to lookup contact")
      setResult(null)
    } finally {
    setLoading(false)
  }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getExplorerUrl = (objectId: string) => {
    return `https://suiexplorer.com/object/${objectId}?network=${NETWORK || 'testnet'}`
  }

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center space-y-4 mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">Try CallerID</h1>
            <p className="text-base sm:text-lg text-foreground/70">Test our caller identification in action</p>
          </div>

          <Card className="p-4 sm:p-6 lg:p-8 bg-background border border-border/50 mb-6 sm:mb-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-3">Enter a phone number</label>
                <div className="flex gap-3">
                  <Input
                    type="tel"
                    placeholder="+1 555 123 4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && phoneNumber && !loading) {
                        handleLookup()
                      }
                    }}
                    className="flex-1"
                    disabled={loading}
                  />
                  <Button onClick={() => handleLookup()} disabled={!phoneNumber.trim() || loading} className="rounded-full">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Looking up...
                      </>
                    ) : (
                      <>
                        <Phone className="w-4 h-4 mr-2" />
                        Lookup
                      </>
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <p className="text-xs text-foreground/60">
                    Phone number will be hashed using BLAKE2b256 and queried on Sui blockchain
                  </p>
              </div>
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const demoNumber = "+0134587"
                      setPhoneNumber(demoNumber)
                      handleLookup(demoNumber)
                    }}
                    disabled={loading}
                    className="text-xs"
                  >
                    Quick search for demo: +0134587
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {error && (
            <Card className="p-6 bg-destructive/5 border border-destructive/20 mb-8">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-destructive mb-1">Lookup Failed</h3>
                  <p className="text-sm text-foreground/70">{error}</p>
                </div>
              </div>
            </Card>
          )}

          {result && (
            <Card className="p-8 bg-accent/5 border border-accent/20">
              {result.found ? (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <h2 className="text-2xl font-bold">Contact Found</h2>
                  </div>

                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid sm:grid-cols-2 gap-4">
                <div>
                        <p className="text-xs text-foreground/60 mb-1">Phone Number</p>
                  <p className="text-lg font-semibold">{result.phoneNumber}</p>
                </div>
                <div>
                        <p className="text-xs text-foreground/60 mb-1">Caller Name</p>
                        <p className="text-lg font-semibold">{result.contact.name}</p>
                      </div>
                    </div>

                    {/* Phone Hash */}
                    <div className="p-4 bg-background border border-border/50 rounded">
                      <p className="text-xs text-foreground/60 mb-1">Phone Hash (BLAKE2b256)</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-mono text-sm break-all">{result.phoneHash}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(result.phoneHash)}
                          className="rounded"
                          title="Copy phone hash"
                        >
                          <Copy className={`w-4 h-4 ${copied ? 'text-green-500' : ''}`} />
                        </Button>
                      </div>
                    </div>

                    {/* Spam Information */}
                    <div className="grid sm:grid-cols-2 gap-4 p-4 bg-secondary/30 rounded">
                      <div>
                        <p className="text-xs text-foreground/60 mb-1">Spam Reports</p>
                        <p className="text-lg font-semibold">{result.contact.spam_count.toString()}</p>
                </div>
                <div>
                        <p className="text-xs text-foreground/60 mb-1">Not Spam Reports</p>
                        <p className="text-lg font-semibold">{result.contact.not_spam_count.toString()}</p>
                      </div>
                      {result.contact.spam_type && (
                        <div className="sm:col-span-2">
                          <p className="text-xs text-foreground/60 mb-1">Spam Type</p>
                          <p className="text-sm font-medium">{result.contact.spam_type}</p>
                        </div>
                      )}
                    </div>

                    {/* Storage Info */}
                    <div className="space-y-3">
                      <div className="p-4 bg-background border border-border/50 rounded">
                        <p className="text-xs text-foreground/60 mb-1">Walrus Blob ID</p>
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-mono text-sm break-all">{result.contact.blob_id}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(result.contact.blob_id)}
                            className="rounded"
                            title="Copy blob ID"
                          >
                            <Copy className={`w-4 h-4 ${copied ? 'text-green-500' : ''}`} />
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 bg-background border border-border/50 rounded">
                        <p className="text-xs text-foreground/60 mb-1">Sui Object ID</p>
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-mono text-sm break-all">{result.contact.sui_object_id}</p>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(result.contact.sui_object_id)}
                              className="rounded"
                              title="Copy Sui object ID"
                            >
                              <Copy className={`w-4 h-4 ${copied ? 'text-green-500' : ''}`} />
                            </Button>
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="rounded"
                              title="View on Sui Explorer"
                            >
                              <a
                                href={getExplorerUrl(result.contact.sui_object_id)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Wallet Info */}
                    <div className="p-4 bg-background border border-border/50 rounded">
                      <p className="text-xs text-foreground/60 mb-1">Wallet Public Key</p>
                      <p className="font-mono text-sm break-all">
                        0x{bytesToHex(result.contact.wallet_pubkey)}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <XCircle className="w-6 h-6 text-foreground/40" />
                    <h2 className="text-2xl font-bold">Contact Not Found</h2>
                </div>

                  <div className="space-y-4">
                <div>
                      <p className="text-sm text-foreground/60 mb-2">Phone Number</p>
                      <p className="font-semibold">{result.phoneNumber}</p>
                    </div>

                    <div className="p-4 bg-background border border-border/50 rounded">
                      <p className="text-xs text-foreground/60 mb-1">Phone Hash (BLAKE2b256)</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-mono text-sm break-all">{result.phoneHash}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(result.phoneHash)}
                          className="rounded"
                          title="Copy phone hash"
                        >
                          <Copy className={`w-4 h-4 ${copied ? 'text-green-500' : ''}`} />
                        </Button>
                </div>
              </div>

                    <div className="bg-secondary/30 border border-border/50 rounded-lg p-4">
                      <p className="text-sm text-foreground/70">
                        No contact found with this phone hash on the Sui blockchain. This phone number may not have been uploaded yet, or it was uploaded with a different hash.
                </p>
              </div>
                  </div>
                </>
              )}
            </Card>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
