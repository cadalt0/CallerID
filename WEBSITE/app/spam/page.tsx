"use client"

import { useState, useEffect } from "react"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { AlertTriangle, Coins, Loader2 } from "lucide-react"
import { SpamReportForm } from "@/components/spam-report-form"
import { ReportsHistory } from "@/components/reports-history"
import { SpamReportSuccess } from "@/components/spam-report-success"
import { getStake } from "@/lib/get-stake"
import { useStakeSui } from "@/lib/stake-sui"
import { usePublishContacts } from "@/lib/publish-contacts"
import { useCurrentWallet } from "@mysten/dapp-kit"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle, ExternalLink } from "lucide-react"

interface Report {
  id: string
  number: string
  category: string[]
  bond: number
  status: "pending" | "verified" | "challenged"
  timestamp: Date
  reports: number
}

export default function SpamPage() {
  // Use same wallet connection method as upload page - use isWalletConnected from usePublishContacts
  const { isWalletConnected } = usePublishContacts()
  const { stake, isPending: isStaking, isSuccess: isStaked, transactionDigest: stakeDigest } = useStakeSui()
  const { currentWallet } = useCurrentWallet()
  
  // Get wallet address using same pattern as publish-contacts
  const walletAddress = currentWallet?.currentWallet?.accounts?.[0]?.address
  
  // Check wallet connection - use actual wallet state (if we can stake, wallet IS connected)
  const walletIsConnected = currentWallet?.isConnected || isWalletConnected || !!walletAddress
  const [stakeInfo, setStakeInfo] = useState<{ amount: bigint; timestamp: bigint; locked: boolean } | null>(null)
  const [loadingStake, setLoadingStake] = useState(false)
  const [stakeAmount, setStakeAmount] = useState("0.000000001") // Default: 1 MIST (lowest possible)
  const [showStakeForm, setShowStakeForm] = useState(false)
  const [reportSuccess, setReportSuccess] = useState<{ transactionDigest: string; phoneNumber: string; spamType: string } | null>(null)
  const [reports, setReports] = useState<Report[]>([
    {
      id: "1",
      number: "+1 (555) 123-4567",
      category: ["scam"],
      bond: 0.5,
      status: "verified",
      timestamp: new Date(Date.now() - 86400000),
      reports: 5,
    },
    {
      id: "2",
      number: "+1 (555) 234-5678",
      category: ["robocall", "telemarketer"],
      bond: 0.3,
      status: "pending",
      timestamp: new Date(Date.now() - 3600000),
      reports: 2,
    },
  ])

  // Auto-fetch stake info when wallet is connected - check immediately on page load
  // Poll every 3 seconds if stake not found
  useEffect(() => {
    // Use isWalletConnected from hook as primary check (same as upload page)
    if (!isWalletConnected) {
      console.log("📊 No wallet connected (isWalletConnected=false)")
      setStakeInfo(null)
      setLoadingStake(false)
      return
    }
    
    // Get address - try both patterns
    const address = currentWallet?.currentWallet?.accounts?.[0]?.address || 
                   currentWallet?.accounts?.[0]?.address
    
    if (!address) {
      console.log("📊 Wallet connected but address not available yet, waiting...")
      console.log("  currentWallet?.currentWallet:", currentWallet?.currentWallet)
      console.log("  currentWallet?.accounts:", currentWallet?.accounts)
      // Don't clear stake info, just wait for address
      setLoadingStake(false)
      return
    }
    
    console.log("📊 Wallet connected, checking stake for:", address)

    let intervalId: NodeJS.Timeout | null = null
    let shouldStop = false

    const fetchStake = async () => {
      if (shouldStop) return
      
      console.log("📊 Fetching stake for:", address)
      setLoadingStake(true)
      
      try {
        const stake = await getStake(address)
        if (shouldStop) return
        
        setStakeInfo(stake)
        if (stake) {
          console.log("✅ Stake info loaded:", Number(stake.amount) / 1_000_000_000, "SUI")
          // Stop polling if stake found
          shouldStop = true
          if (intervalId) {
            clearInterval(intervalId)
            intervalId = null
          }
        } else {
          console.log("ℹ️  No stake found for this address - will check again in 3 seconds")
        }
      } catch (error) {
        if (shouldStop) return
        console.error("❌ Failed to fetch stake:", error)
        setStakeInfo(null)
      } finally {
        setLoadingStake(false)
      }
    }

    // Fetch immediately when page loads and wallet is connected
    console.log("📊 Starting stake check for connected wallet")
    fetchStake()

    // Start polling every 3 seconds (will stop automatically when stake is found)
    intervalId = setInterval(() => {
      if (!shouldStop) {
        fetchStake()
      } else if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    }, 3000) // Poll every 3 seconds

    // Cleanup function
    return () => {
      shouldStop = true
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [currentWallet?.isConnected, currentWallet?.currentWallet?.accounts?.[0]?.address, isWalletConnected])

  const handleNewReport = (report: Omit<Report, "id" | "timestamp" | "reports">) => {
    const newReport: Report = {
      ...report,
      id: Math.random().toString(),
      timestamp: new Date(),
      reports: 1,
    }
    setReports([newReport, ...reports])
    
    // Show success card if transaction digest is available
    if (report.transactionDigest) {
      setReportSuccess({
        transactionDigest: report.transactionDigest,
        phoneNumber: report.number,
        spamType: Array.isArray(report.category) ? report.category[0] : report.category || 'other',
      })
    }
  }

  const handleNewReportClick = () => {
    setReportSuccess(null)
  }

  // Calculate stake amount in SUI
  const stakeAmountInSui = stakeInfo ? Number(stakeInfo.amount) / 1_000_000_000 : 0

  // Refresh stake info after successful stake
  useEffect(() => {
    if (isStaked && walletAddress) {
      // Wait a bit for the transaction to be processed
      setTimeout(async () => {
        setLoadingStake(true)
        try {
          const stake = await getStake(walletAddress)
          setStakeInfo(stake)
          setShowStakeForm(false)
        } catch (error) {
          console.error("Failed to refresh stake:", error)
        } finally {
          setLoadingStake(false)
        }
      }, 2000)
    }
  }, [isStaked, walletAddress])

  const handleStake = async () => {
    const amount = parseFloat(stakeAmount)
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid stake amount greater than 0")
      return
    }

    // Minimum is 1 MIST (0.000000001 SUI)
    if (amount < 0.000000001) {
      alert("Minimum stake amount is 1 MIST (0.000000001 SUI)")
      return
    }

    try {
      await stake(amount)
    } catch (error) {
      console.error("Stake failed:", error)
      alert(error instanceof Error ? error.message : "Failed to stake SUI")
    }
  }

  const getExplorerUrl = (digest: string) => {
    const network = process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet'
    return `https://suiexplorer.com/txblock/${digest}?network=${network}`
  }

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-destructive flex-shrink-0" />
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Report Spam</h1>
              </div>
              {walletIsConnected && stakeInfo && (
                <span className="text-xs sm:text-sm text-foreground/60 font-normal">
                  ({stakeAmountInSui.toFixed(4)} SUI staked)
                </span>
              )}
            </div>
            <p className="text-lg text-foreground/70">Reports help the community. False reports can be challenged.</p>
          </div>

          {/* Show stake form if wallet connected but no stake found */}
          {walletIsConnected && !stakeInfo && (
            <Card className="p-6 mb-8 bg-secondary/30 border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">Stake Required</h3>
                    {loadingStake && (
                      <Loader2 className="w-4 h-4 animate-spin text-foreground/60" />
                    )}
                  </div>
                  <p className="text-sm text-foreground/60">
                    You need to stake SUI before reporting spam. This helps prevent false reports.
                  </p>
                </div>
              </div>

              {!showStakeForm ? (
                <Button
                  onClick={() => setShowStakeForm(true)}
                  className="w-full sm:w-auto"
                  disabled={loadingStake}
                >
                  <Coins className="w-4 h-4 mr-2" />
                  Stake SUI
                </Button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Stake Amount (SUI)</label>
                    <Input
                      type="number"
                      min="0.000000001"
                      step="0.000000001"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="0.000000001"
                      disabled={isStaking}
                    />
                    <p className="text-xs text-foreground/60 mt-1">
                      Minimum: 1 MIST (0.000000001 SUI)
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleStake}
                      disabled={isStaking}
                      className="flex-1"
                    >
                      {isStaking ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Staking...
                        </>
                      ) : (
                        <>
                          <Coins className="w-4 h-4 mr-2" />
                          Stake
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowStakeForm(false)}
                      disabled={isStaking}
                    >
                      Cancel
                    </Button>
                  </div>

                  {stakeDigest && (
                    <div className="p-3 bg-accent/10 border border-accent/20 rounded flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-accent font-medium">Stake successful!</p>
                        <a
                          href={getExplorerUrl(stakeDigest)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-foreground/60 hover:text-foreground/80 flex items-center gap-1 mt-1"
                        >
                          View transaction
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form or Success Card */}
            <div className="lg:col-span-2">
              {reportSuccess ? (
                <SpamReportSuccess
                  transactionDigest={reportSuccess.transactionDigest}
                  phoneNumber={reportSuccess.phoneNumber}
                  spamType={reportSuccess.spamType}
                  onNewReport={handleNewReportClick}
                />
              ) : (
                <SpamReportForm 
                  onSubmit={handleNewReport} 
                  hasStake={!!stakeInfo}
                  isWalletConnected={walletIsConnected}
                />
              )}
            </div>

            {/* History */}
            <div className="lg:col-span-1">
              <ReportsHistory reports={reports} />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}


