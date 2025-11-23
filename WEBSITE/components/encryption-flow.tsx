"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, Zap } from "lucide-react"
import { useState, useEffect } from "react"

const steps = ["Hashing", "Seal Encryption", "Uploading to Walrus", "Publish", "Complete"]

interface EncryptionFlowProps {
  isActive: boolean
  contactsCount: number
  onEncryptAndUpload: () => void
  disabled: boolean
  currentStep?: number // Real step from parent (0-4, where 4 = complete)
  statusMessage?: string // Real status message
  isWalletConnected?: boolean // Wallet connection status
}

export function EncryptionFlow({ 
  isActive, 
  contactsCount, 
  onEncryptAndUpload, 
  disabled,
  currentStep: externalStep,
  statusMessage,
  isWalletConnected = false
}: EncryptionFlowProps) {
  // Use external step if provided, otherwise use internal state (for backward compatibility)
  const [internalStep, setInternalStep] = useState(0)
  const currentStep = externalStep !== undefined ? externalStep : internalStep

  useEffect(() => {
    if (!isActive) {
      setInternalStep(0)
      return
    }

    // Only use internal step animation if external step is not provided
    if (externalStep === undefined) {
    const stepDuration = 800
    let stepIndex = 0

    const interval = setInterval(() => {
      stepIndex++
      if (stepIndex < steps.length + 1) {
          setInternalStep(stepIndex)
      } else {
        clearInterval(interval)
      }
    }, stepDuration)

    return () => clearInterval(interval)
    }
  }, [isActive, externalStep])

  return (
    <div className="space-y-6 sticky top-24">
      <Card className="p-6 bg-accent/5 border border-accent/20">
        <h3 className="font-semibold mb-6 flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary" />
          Encryption Status
        </h3>

        {isActive ? (
          <div className="space-y-4">
            {steps.map((step, idx) => {
              // Step is completed if currentStep is past this step (1-indexed)
              // When currentStep equals steps.length, all steps are completed
              const isCompleted = currentStep >= steps.length ? idx < steps.length : idx < currentStep - 1
              // Step is current if it's the active step and not all steps are done
              const isCurrent = currentStep < steps.length && idx === currentStep - 1
              const isActive = isCompleted || isCurrent

              return (
                <div key={idx} className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition ${
                      isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/40"
                    }`}
                    style={{
                      animation: isCurrent ? `pulse 1s infinite` : "none",
                    }}
                  >
                    {isCompleted ? "✓" : idx + 1}
                  </div>
                  <span className={isCurrent ? "text-primary font-medium" : ""}>{step}</span>
                </div>
              )
            })}
            <div className="mt-4 p-3 bg-primary/10 rounded border border-primary/20">
              <p className="text-sm text-primary">
                {statusMessage || (currentStep > steps.length ? "All done!" : "Processing your contacts...")}
              </p>
            </div>
          </div>
        ) : (
          <div>
            {!isWalletConnected ? (
              <div className="mb-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-sm font-medium text-warning mb-1">Wallet Not Connected</p>
                <p className="text-xs text-foreground/60">
                  Please connect your wallet to encrypt and upload contacts. The publish step requires a connected wallet.
                </p>
              </div>
            ) : (
            <p className="text-sm text-foreground/60 mb-4">
              Ready to encrypt {contactsCount} contact{contactsCount !== 1 ? "s" : ""}.
            </p>
            )}
            <Button 
              onClick={(e) => {
                // Force log to console
                console.log("=".repeat(80))
                console.log("🔘🔘🔘 BUTTON CLICKED - EncryptionFlow component 🔘🔘🔘")
                console.log("=".repeat(80))
                console.log("Button state:", { disabled, contactsCount, isActive })
                console.log("Handler function exists:", !!onEncryptAndUpload)
                console.log("Handler function:", onEncryptAndUpload)
                
                // Also try alert as fallback
                if (typeof window !== 'undefined') {
                  console.log("Window object available")
                }
                
                e.preventDefault()
                e.stopPropagation()
                
                if (disabled) {
                  console.error("❌ BUTTON IS DISABLED!")
                  console.error("Disabled reason:", {
                    contactsCount,
                    isActive,
                    disabled,
                    isWalletConnected
                  })
                  if (!isWalletConnected) {
                    alert("Please connect your wallet first. The publish step requires a connected wallet to create on-chain transactions.")
                  } else {
                    alert(`Button is disabled! Contacts: ${contactsCount}, Processing: ${isActive}`)
                  }
                  return
                }
                
                if (!onEncryptAndUpload) {
                  console.error("❌ NO HANDLER FUNCTION!")
                  alert("No handler function provided!")
                  return
                }
                
                console.log("✅ Calling onEncryptAndUpload handler NOW...")
                try {
                  onEncryptAndUpload()
                  console.log("✅ Handler called successfully")
                } catch (error) {
                  console.error("❌ Error calling handler:", error)
                  alert(`Error: ${error}`)
                }
              }} 
              disabled={disabled} 
              className="w-full rounded-full"
              type="button"
            >
              <Zap className="w-4 h-4 mr-2" />
              Encrypt & Upload
            </Button>
          </div>
        )}
      </Card>

      <Card className="p-4 bg-secondary/30 border border-border/50">
        <p className="text-xs text-foreground/60 leading-relaxed">
          ✓ Client-side encryption
          <br />✓ Zero plaintext storage
          <br />✓ TEE processing
          <br />✓ On-chain verification
        </p>
      </Card>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}
