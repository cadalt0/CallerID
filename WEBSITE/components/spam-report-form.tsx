"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Send, Loader2, AlertTriangle, Phone, CheckCircle, XCircle } from "lucide-react"
import { useReportSpam } from "@/lib/report-spam"
import { lookupContact } from "@/lib/lookup-contact"

interface SpamReportFormProps {
  onSubmit: (report: any) => void
  hasStake: boolean
  isWalletConnected: boolean
}

const categories = [
  { id: "scam", label: "Scam" },
  { id: "robocall", label: "Robocall" },
  { id: "telemarketer", label: "Telemarketer" },
  { id: "fraud", label: "Fraud" },
  { id: "other", label: "Other" },
]

export function SpamReportForm({ onSubmit, hasStake, isWalletConnected }: SpamReportFormProps) {
  const { reportSpam, isPending: isReporting, isSuccess: isReported, transactionDigest: reportDigest, error: reportError } = useReportSpam()
  const [number, setNumber] = useState("")
  const [email, setEmail] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [details, setDetails] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [lookupResult, setLookupResult] = useState<any>(null)
  const [isLookingUp, setIsLookingUp] = useState(false)

  const handleCategoryToggle = (id: string) => {
    setSelectedCategories((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  const handleLookup = async () => {
    if (!number.trim()) {
      alert("Please enter a phone number to lookup")
      return
    }

    setIsLookingUp(true)
    setLookupResult(null)

    try {
      const contact = await lookupContact(number)
      if (contact) {
        setLookupResult({
          found: true,
          contact,
          phoneNumber: number,
        })
      } else {
        setLookupResult({
          found: false,
          phoneNumber: number,
        })
      }
    } catch (error) {
      console.error("❌ Lookup error:", error)
      setLookupResult({
        found: false,
        error: error instanceof Error ? error.message : "Failed to lookup contact",
        phoneNumber: number,
      })
    } finally {
      setIsLookingUp(false)
    }
  }

  const handleSubmit = async () => {
    if (!number || selectedCategories.length === 0) {
      setShowWarning(true)
      return
    }

    // Check if wallet is connected
    if (!isWalletConnected) {
      alert("Please connect your wallet to report spam")
      return
    }

    // Check if user has staked
    if (!hasStake) {
      alert("You need to stake SUI before reporting spam. Please stake first.")
      return
    }

    setIsSubmitting(true)
    setShowWarning(false)

    try {
      // Use first selected category as spam type
      const spamType = selectedCategories[0] || "other"
      
      // Combine email and details into "other" field
      const otherData = [email, details].filter(Boolean).join(" | ")

      console.log("📝 Submitting spam report...")
      console.log(`  Phone Number: ${number}`)
      console.log(`  Spam Type: ${spamType}`)
      console.log(`  Categories: ${selectedCategories.join(", ")}`)
      if (email) console.log(`  Email: ${email}`)
      if (details) console.log(`  Details: ${details}`)
      console.log(`  Other Data: ${otherData || "(empty)"}`)

      // Report spam on-chain
      const result = await reportSpam(
        number,
        spamType,
        undefined, // name (not used for now)
        otherData || undefined // other (email + details)
      )

      console.log("✅ Spam report submitted successfully!")
      console.log(`  Transaction Digest: ${result.digest}`)

      onSubmit({
        number,
        category: selectedCategories,
        status: "pending",
        transactionDigest: result.digest,
      })

      // Reset form immediately (success card will be shown by parent)
      setNumber("")
      setEmail("")
      setSelectedCategories([])
      setDetails("")

    } catch (error) {
      console.error("❌ Failed to report spam:", error)
      alert(error instanceof Error ? error.message : "Failed to report spam")
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = isWalletConnected && hasStake && number && selectedCategories.length > 0

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-6 lg:p-8 bg-background border border-border/50">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Report a Number</h2>

        {!isWalletConnected && (
          <div className="mb-6 p-4 bg-warning/10 border border-warning/20 rounded flex gap-3">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-sm text-warning">Please connect your wallet to report spam.</p>
          </div>
        )}

        {isWalletConnected && !hasStake && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded flex gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">You need to stake SUI before reporting spam. Please stake first.</p>
          </div>
        )}


        {reportError && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded flex gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">
              {reportError instanceof Error ? reportError.message : "Failed to report spam"}
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Phone number */}
          <div>
            <label className="block text-sm font-semibold mb-3">Phone Number *</label>
            <div className="flex gap-2">
              <Input
                placeholder="+1 (555) 123-4567"
                value={number}
                onChange={(e) => {
                  setNumber(e.target.value)
                  setLookupResult(null) // Clear lookup result when number changes
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && number.trim() && !isLookingUp) {
                    handleLookup()
                  }
                }}
                disabled={isSubmitting || isLookingUp}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleLookup}
                disabled={!number.trim() || isSubmitting || isLookingUp}
                variant="outline"
                className="rounded-full"
              >
                {isLookingUp ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Phone className="w-4 h-4" />
                )}
              </Button>
            </div>
            {lookupResult && (
              <div className={`mt-3 p-3 rounded border ${
                lookupResult.found 
                  ? 'bg-accent/10 border-accent/20' 
                  : 'bg-secondary/30 border-border/50'
              }`}>
                {lookupResult.found ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-semibold">Contact Found</span>
                    </div>
                    <div className="text-xs space-y-1 text-foreground/70">
                      <p><span className="font-medium">Name:</span> {lookupResult.contact.name}</p>
                      <p><span className="font-medium">Spam Reports:</span> {lookupResult.contact.spam_count.toString()}</p>
                      <p><span className="font-medium">Not Spam Reports:</span> {lookupResult.contact.not_spam_count.toString()}</p>
                      {lookupResult.contact.spam_type && (
                        <p><span className="font-medium">Spam Type:</span> {lookupResult.contact.spam_type}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-foreground/40" />
                    <span className="text-sm text-foreground/70">
                      {lookupResult.error || "No contact found for this number"}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold mb-3">Contact Email (Optional)</label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-semibold mb-3">Category *</label>
            <div className="space-y-2">
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={selectedCategories.includes(cat.id)}
                    onCheckedChange={() => handleCategoryToggle(cat.id)}
                    disabled={isSubmitting}
                  />
                  <span className="text-sm">{cat.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Details */}
          <div>
            <label className="block text-sm font-semibold mb-3">Details</label>
            <Textarea
              placeholder="Describe what happened (optional but recommended)"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              disabled={isSubmitting}
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isReporting || !canSubmit}
            className="w-full rounded-full"
          >
            {(isSubmitting || isReporting) ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Reporting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Report Spam
              </>
            )}
          </Button>
        </div>
      </Card>

      <Card className="p-4 bg-secondary/30 border border-border/50">
        <p className="text-xs text-foreground/60 leading-relaxed">
          By staking, you confirm the report is accurate. Staked tokens are locked in the challenge window. False
          reports can be challenged and you may lose your stake.
        </p>
      </Card>
    </div>
  )
}
