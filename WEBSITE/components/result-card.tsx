"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Copy, ExternalLink, AlertCircle, Shield } from "lucide-react"
import { useState } from "react"
import { NETWORK } from "@/lib/publish-contacts"

interface ResultCardProps {
  result: any
  onNewUpload: () => void
}

export function ResultCard({ result, onNewUpload }: ResultCardProps) {
  const [copied, setCopied] = useState<Record<string, boolean>>({})
  const [attestation, setAttestation] = useState<{ attestation: string; public_key: string } | null>(null)
  const [loadingAttestation, setLoadingAttestation] = useState(false)
  const [attestationError, setAttestationError] = useState<string | null>(null)

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied({ ...copied, [key]: true })
    setTimeout(() => {
      setCopied({ ...copied, [key]: false })
    }, 2000)
  }

  // Build Sui explorer URL
  const getExplorerUrl = (digest: string) => {
    const network = NETWORK || 'testnet'
    if (network === 'mainnet') {
      return `https://suiexplorer.com/txblock/${digest}?network=mainnet`
    } else if (network === 'testnet') {
      return `https://suiexplorer.com/txblock/${digest}?network=testnet`
    } else if (network === 'devnet') {
      return `https://suiexplorer.com/txblock/${digest}?network=devnet`
    }
    return `https://suiexplorer.com/txblock/${digest}?network=testnet`
  }

  const handleGetAttestation = async () => {
    setLoadingAttestation(true)
    setAttestationError(null)
    
    try {
      // Determine which API to use (same logic as processContacts)
      const nautilusMode = process.env.NEXT_PUBLIC_NAUTILUS_MODE || "off"
      const nautilusApi = process.env.NEXT_PUBLIC_NAUTILUS_API || ""
      const useNautilus = nautilusMode.toLowerCase() === "on" && nautilusApi
      
      const apiUrl = useNautilus
        ? `${nautilusApi}/get_attestation`
        : "/api/get-attestation"
      
      console.log("🔐 Fetching attestation from:", apiUrl)
      
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch attestation: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("✅ Attestation received:", data)
      setAttestation(data)
    } catch (error) {
      console.error("❌ Error fetching attestation:", error)
      setAttestationError(error instanceof Error ? error.message : "Failed to fetch attestation")
    } finally {
      setLoadingAttestation(false)
    }
  }

  const publishDigest = result?.publishDigest || result?.transactionDigest
  const blobId = result?.blobId
  const blobObjectId = result?.blobObjectId

  // Debug: Log what we're getting
  console.log("ResultCard - Result data:", {
    publishDigest: result?.publishDigest,
    transactionDigest: result?.transactionDigest,
    finalPublishDigest: publishDigest,
    blobId: result?.blobId,
    blobObjectId: result?.blobObjectId,
  })

  // Check if there's an error
  const hasError = result?.error

  if (hasError) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="p-8 bg-destructive/5 border border-destructive/20">
          <div className="flex items-start gap-4 mb-8">
            <AlertCircle className="w-8 h-8 text-destructive flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold mb-2 text-destructive">Upload Failed</h2>
              <p className="text-foreground/70">{result.error}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={onNewUpload} className="rounded-full" variant="default">
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="p-4 sm:p-6 lg:p-8 bg-accent/5 border border-accent/20">
        <div className="flex items-start gap-3 sm:gap-4 mb-6 sm:mb-8">
          <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-accent flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Upload Successful</h2>
            <p className="text-sm sm:text-base text-foreground/70">Your contacts have been encrypted and uploaded securely.</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Transaction Digest / Publish Digest */}
          {publishDigest ? (
            <div className="p-3 sm:p-4 bg-background border border-border/50 rounded">
              <p className="text-xs text-foreground/60 mb-1">Publish Transaction Digest</p>
              <div className="flex items-start sm:items-center justify-between gap-2 flex-col sm:flex-row">
                <p className="font-mono text-xs sm:text-sm break-all flex-1">{publishDigest}</p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleCopy(publishDigest, 'digest')} 
                    className="rounded"
                    title="Copy transaction digest"
                  >
                    <Copy className={`w-4 h-4 ${copied['digest'] ? 'text-green-500' : ''}`} />
                  </Button>
                  <Button 
                    asChild
                    variant="ghost" 
                    size="sm" 
                    className="rounded"
                    title="View on Sui Explorer"
                  >
                    <a
                      href={getExplorerUrl(publishDigest)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-background border border-border/50 rounded opacity-50">
              <p className="text-xs text-foreground/60 mb-1">Publish Transaction Digest</p>
              <p className="text-sm text-foreground/40">Not available (publish step may have been skipped)</p>
            </div>
          )}

          {/* Blob ID */}
          {blobId && (
          <div className="p-4 bg-background border border-border/50 rounded">
              <p className="text-xs text-foreground/60 mb-1">Blob ID</p>
            <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-sm break-all">{blobId}</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleCopy(blobId, 'blobId')} 
                  className="rounded"
                  title="Copy blob ID"
                >
                  <Copy className={`w-4 h-4 ${copied['blobId'] ? 'text-green-500' : ''}`} />
              </Button>
            </div>
          </div>
          )}

          {/* Blob Object ID (Sui Object ID) */}
          {blobObjectId && (
          <div className="p-4 bg-background border border-border/50 rounded">
              <p className="text-xs text-foreground/60 mb-1">Sui Object ID</p>
            <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-sm break-all">{blobObjectId}</p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleCopy(blobObjectId, 'blobObjectId')} 
                    className="rounded"
                    title="Copy Sui object ID"
                  >
                    <Copy className={`w-4 h-4 ${copied['blobObjectId'] ? 'text-green-500' : ''}`} />
                  </Button>
                  <Button 
                    asChild
                    variant="ghost" 
                    size="sm" 
                    className="rounded"
                    title="View on Sui Explorer"
                  >
                    <a
                      href={`https://suiexplorer.com/object/${blobObjectId}?network=${NETWORK || 'testnet'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
              </Button>
            </div>
          </div>
            </div>
          )}

          {/* Summary Info */}
          <div className="grid sm:grid-cols-2 gap-4 p-4 bg-secondary/30 rounded">
            <div>
              <p className="text-xs text-foreground/60 mb-1">Attestation Status</p>
              <p className="font-semibold text-accent">
                {result.attestationStatus === "verified" ? "Verified" : "Pending"}
              </p>
            </div>
            <div>
              <p className="text-xs text-foreground/60 mb-1">Contacts Processed</p>
              <p className="font-semibold">{result.contactsProcessed || 0}</p>
            </div>
          </div>

          {/* Attestation Section */}
          <div className="p-4 bg-background border border-border/50 rounded">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium">Attestation</p>
              </div>
              <Button
                onClick={handleGetAttestation}
                disabled={loadingAttestation}
                className="rounded-full"
                size="sm"
                variant="outline"
              >
                {loadingAttestation ? "Loading..." : "Get Attestation"}
              </Button>
            </div>
            
            {attestationError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                {attestationError}
              </div>
            )}
            
            {attestation && (
              <div className="space-y-3 mt-3">
                <div>
                  <p className="text-xs text-foreground/60 mb-1">Attestation</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-sm break-all">{attestation.attestation}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(attestation.attestation, 'attestation')}
                      className="rounded"
                      title="Copy attestation"
                    >
                      <Copy className={`w-4 h-4 ${copied['attestation'] ? 'text-green-500' : ''}`} />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-foreground/60 mb-1">Public Key</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-sm break-all">{attestation.public_key}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(attestation.public_key, 'publicKey')}
                      className="rounded"
                      title="Copy public key"
                    >
                      <Copy className={`w-4 h-4 ${copied['publicKey'] ? 'text-green-500' : ''}`} />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-4">
            {publishDigest && (
            <Button asChild className="rounded-full" variant="default">
              <a
                  href={getExplorerUrl(publishDigest)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                  View Transaction on Explorer
              </a>
            </Button>
            )}
            <Button onClick={onNewUpload} className="rounded-full" variant="ghost">
              Upload Another File
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
