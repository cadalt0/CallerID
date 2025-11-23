"use client"

/**
 * Stake SUI Service
 * 
 * Allows users to stake SUI tokens for spam reporting.
 */

import { Transaction } from '@mysten/sui/transactions'
import { useCurrentWallet, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { NETWORK, PACKAGE_ID, MASTER_OBJECT_ID } from './publish-contacts'

/**
 * Hook for staking SUI
 */
export function useStakeSui() {
  const currentWallet = useCurrentWallet()
  const { mutate: signAndExecute, isPending, isSuccess, data, error } = useSignAndExecuteTransaction()

  const stake = async (amountInSui: number) => {
    // Use same wallet check as publish-contacts
    if (!currentWallet.isConnected || !currentWallet.currentWallet) {
      throw new Error('Wallet not connected. Please connect your wallet first.')
    }

    const walletAddress = currentWallet.currentWallet.accounts[0].address

    // Convert SUI to MIST (1 SUI = 1,000,000,000 MIST)
    const amountMist = BigInt(Math.floor(amountInSui * 1_000_000_000))

    if (amountMist <= 0n) {
      throw new Error('Stake amount must be greater than 0')
    }

    console.log("=".repeat(80))
    console.log("STAKE SUI - STARTING")
    console.log("=".repeat(80))
    console.log(`Network: ${NETWORK}`)
    console.log(`Package ID: ${PACKAGE_ID}`)
    console.log(`Master Object ID: ${MASTER_OBJECT_ID}`)
    console.log(`Wallet Address: ${walletAddress}`)
    console.log(`Amount: ${amountInSui} SUI (${amountMist} MIST)`)
    console.log("\n")

    // Build transaction
    const tx = new Transaction()

    // Split coin for staking
    const [coin] = tx.splitCoins(tx.gas, [amountMist])

    tx.moveCall({
      target: `${PACKAGE_ID}::stake::stake`,
      arguments: [
        tx.object(MASTER_OBJECT_ID), // master: &mut CallerIDMaster
        coin, // coin: Coin<SUI>
      ],
    })

    console.log("📝 Transaction built successfully!")
    console.log(`  Amount: ${amountInSui} SUI (${amountMist} MIST)`)
    console.log("\n")

    // Sign and execute transaction using wallet
    console.log("🔐 Signing and executing transaction with wallet...")
    
    return new Promise<{ digest: string; result: any }>((resolve, reject) => {
      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log("=".repeat(80))
            console.log("STAKE SUI - SUCCESS")
            console.log("=".repeat(80))
            console.log("\n✅ Transaction executed successfully!")
            console.log(`Transaction Digest: ${result.digest}`)
            if (result.effects) {
              console.log("\nTransaction Effects:")
              console.log(JSON.stringify(result.effects, null, 2))
            }
            console.log("\n" + "=".repeat(80) + "\n")
            resolve({
              digest: result.digest,
              result,
            })
          },
          onError: (error) => {
            console.error("=".repeat(80))
            console.error("STAKE SUI - ERROR")
            console.error("=".repeat(80))
            console.error("\n❌ Transaction failed!")
            console.error("Error:", error)
            console.error("\n" + "=".repeat(80) + "\n")
            reject(error)
          },
        }
      )
    })
  }

  return {
    stake,
    isPending,
    isSuccess,
    transactionDigest: data?.digest,
    error,
    isWalletConnected: currentWallet.isConnected,
  }
}

