"use client"

import { ConnectButton } from '@mysten/dapp-kit'
import { Wallet } from 'lucide-react'

/**
 * Sui Wallet Connect Button Component
 * 
 * Supports multiple popular Sui wallets:
 * - Sui Wallet (Official)
 * - Suiet
 * - Ethos Wallet
 * - Martian Wallet
 * - Nightly Wallet
 * - And more via @mysten/dapp-kit
 * 
 * The ConnectButton from @mysten/dapp-kit automatically detects
 * and supports all installed Sui wallets in the user's browser.
 */
export function WalletConnect() {
  return (
    <div className="flex items-center [&_button]:!bg-white [&_button]:!text-gray-900 [&_button]:!border [&_button]:!border-gray-200 [&_button]:!rounded-full [&_button]:!px-4 [&_button]:!py-2 [&_button]:!font-medium [&_button]:!text-sm [&_button]:!transition-all [&_button]:!hover:bg-gray-50 [&_button]:!hover:shadow-md [&_button]:!active:scale-95 [&_button]:!flex [&_button]:!items-center [&_button]:!gap-2 dark:[&_button]:!bg-gray-100 dark:[&_button]:!text-gray-900 dark:[&_button]:!border-gray-300 dark:[&_button]:!hover:bg-gray-200">
      <ConnectButton
        connectText={
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            <span className="hidden sm:inline">Connect Wallet</span>
            <span className="sm:hidden">Connect</span>
          </div>
        }
      />
    </div>
  )
}

