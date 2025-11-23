"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Copy, ExternalLink } from "lucide-react"
import { useState } from "react"
import { NETWORK } from "@/lib/publish-contacts"

interface SpamReportSuccessProps {
  transactionDigest: string
  phoneNumber: string
  spamType: string
  onNewReport: () => void
}

export function SpamReportSuccess({ 
  transactionDigest, 
  phoneNumber, 
  spamType,
  onNewReport 
}: SpamReportSuccessProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
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

  return (
    <Card className="p-4 sm:p-6 lg:p-8 bg-accent/5 border border-accent/20">
      <div className="flex items-start gap-3 sm:gap-4 mb-6 sm:mb-8">
        <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-accent flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Report Submitted Successfully</h2>
          <p className="text-sm sm:text-base text-foreground/70">
            Your spam report has been submitted to the blockchain and will be processed.
          </p>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Report Details */}
        <div className="space-y-3">
          <div className="p-3 sm:p-4 bg-background border border-border/50 rounded">
            <p className="text-xs text-foreground/60 mb-1">Phone Number</p>
            <p className="font-medium text-sm sm:text-base">{phoneNumber}</p>
          </div>
          
          <div className="p-3 sm:p-4 bg-background border border-border/50 rounded">
            <p className="text-xs text-foreground/60 mb-1">Spam Type</p>
            <p className="font-medium text-sm sm:text-base capitalize">{spamType}</p>
          </div>
        </div>

        {/* Transaction Digest */}
        {transactionDigest && (
          <div className="p-3 sm:p-4 bg-background border border-border/50 rounded">
            <p className="text-xs text-foreground/60 mb-1">Transaction Digest</p>
            <div className="flex items-start sm:items-center justify-between gap-2 flex-col sm:flex-row">
              <p className="font-mono text-xs sm:text-sm break-all flex-1">{transactionDigest}</p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleCopy(transactionDigest)} 
                  className="rounded"
                  title="Copy transaction digest"
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
                    href={getExplorerUrl(transactionDigest)}
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

        {/* Action Button */}
        <div className="pt-4">
          <Button 
            onClick={onNewReport} 
            className="w-full sm:w-auto rounded-full"
            variant="default"
          >
            Report Another Number
          </Button>
        </div>
      </div>
    </Card>
  )
}

