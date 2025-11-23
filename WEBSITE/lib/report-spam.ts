"use client"

/**
 * Report Spam Service
 * 
 * Reports spam contacts to the on-chain Sui smart contract.
 * Requires user to have staked SUI first.
 */

import { Transaction } from '@mysten/sui/transactions'
import { useCurrentWallet, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { fromB64 } from '@mysten/sui/utils'
import { blake2b } from 'blakejs'
import { NETWORK, PACKAGE_ID, MASTER_OBJECT_ID } from './publish-contacts'

/**
 * Hash phone number using BLAKE2b256 (same method as upload process)
 */
function hashPhoneNumber(phone: string): Uint8Array {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '')
  
  if (!digitsOnly) {
    throw new Error('Phone number must contain digits')
  }
  
  // Use blake2b256 (32 bytes = 256 bits) - same as upload process
  const phoneHashBytes = blake2b(digitsOnly, undefined, 32)
  return phoneHashBytes
}

/**
 * Convert byte array to hex string
 */
function bytesToHex(bytes: Uint8Array | number[]): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Convert hex string to byte array
 */
function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex
  const bytes = new Uint8Array(cleanHex.length / 2)
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16)
  }
  return bytes
}

/**
 * Hook for reporting spam
 */
export function useReportSpam() {
  const currentWallet = useCurrentWallet()
  const { mutate: signAndExecute, isPending, isSuccess, data, error } = useSignAndExecuteTransaction()

  const reportSpam = async (
    phoneNumber: string,
    spamType: string,
    name?: string,
    other?: string // email and details combined
  ) => {
    // Use same wallet check as publish-contacts
    if (!currentWallet.isConnected || !currentWallet.currentWallet) {
      throw new Error('Wallet not connected. Please connect your wallet first.')
    }

    if (!phoneNumber || !spamType) {
      throw new Error('Phone number and spam type are required')
    }

    if (spamType.trim().length === 0) {
      throw new Error('Spam type cannot be empty')
    }

    const walletAddress = currentWallet.currentWallet.accounts[0].address
    
    // Get wallet public key (same as publish-contacts)
    const account = currentWallet.currentWallet.accounts[0]
    let walletPublicKey: Uint8Array
    
    try {
      if (account.publicKey) {
        if (typeof account.publicKey === 'string') {
          walletPublicKey = fromB64(account.publicKey)
        } else if (account.publicKey instanceof Uint8Array) {
          walletPublicKey = account.publicKey
        } else {
          walletPublicKey = (account.publicKey as any).toRawBytes?.() || new Uint8Array(32)
        }
      } else {
        const addressBytes = new TextEncoder().encode(walletAddress)
        walletPublicKey = addressBytes.slice(0, 32)
      }
    } catch (err) {
      console.warn('Could not extract public key, using address fallback:', err)
      const addressBytes = new TextEncoder().encode(walletAddress)
      walletPublicKey = addressBytes.slice(0, 32)
    }

    // Hash phone number (same method as upload)
    const phoneHashBytes = hashPhoneNumber(phoneNumber)
    const phoneHashHex = bytesToHex(phoneHashBytes)

    console.log("=".repeat(80))
    console.log("REPORT SPAM - STARTING")
    console.log("=".repeat(80))
    console.log(`Network: ${NETWORK}`)
    console.log(`Package ID: ${PACKAGE_ID}`)
    console.log(`Master Object ID: ${MASTER_OBJECT_ID}`)
    console.log(`Wallet Address: ${walletAddress}`)
    console.log(`Phone Number: ${phoneNumber}`)
    console.log(`Phone Hash (hex): ${phoneHashHex}`)
    console.log(`Phone Hash (bytes): [${Array.from(phoneHashBytes).join(', ')}]`)
    // Combine email and details into "other" data (will be passed in name field)
    const otherData = other || ""
    
    console.log(`Spam Type: ${spamType}`)
    if (name) console.log(`Name: ${name}`)
    if (otherData) console.log(`Other Data (email + details): ${otherData}`)
    console.log("\n")

    // Build transaction
    const tx = new Transaction()

    // Combine email and details into name field (contract doesn't have separate "other" field)
    const combinedName = otherData || name || undefined
    
    // Use report_spam_with_data if we have optional parameters
    if (combinedName || walletPublicKey) {
      tx.moveCall({
        target: `${PACKAGE_ID}::spam::report_spam_with_data`,
        arguments: [
          tx.object(MASTER_OBJECT_ID), // master: &mut CallerIDMaster
          tx.pure.vector('u8', Array.from(phoneHashBytes)), // phone_hash: vector<u8>
          tx.pure.string(spamType), // spam_type: String
          combinedName ? tx.pure.option('string', combinedName) : tx.pure.option('string', null), // name: Option<String> (contains email + details)
          tx.pure.option('string', null), // blob_id: Option<String> (not used for now)
          tx.pure.option('vector<u8>', Array.from(walletPublicKey)), // wallet_pubkey: Option<vector<u8>>
          tx.pure.option('address', null), // sui_object_id: Option<ID> (not used for now)
        ],
      })
    } else {
      // Use simple report_spam (no optional params)
      tx.moveCall({
        target: `${PACKAGE_ID}::spam::report_spam`,
        arguments: [
          tx.object(MASTER_OBJECT_ID), // master: &mut CallerIDMaster
          tx.pure.vector('u8', Array.from(phoneHashBytes)), // phone_hash: vector<u8>
          tx.pure.string(spamType), // spam_type: String
        ],
      })
    }

    console.log("📝 Transaction built successfully!")
    console.log(`  Phone Hash: ${phoneHashHex}`)
    console.log(`  Spam Type: ${spamType}`)
    if (name) console.log(`  Name: ${name}`)
    if (other) console.log(`  Other Data: ${other}`)
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
            console.log("REPORT SPAM - SUCCESS")
            console.log("=".repeat(80))
            console.log("\n✅ Spam report submitted successfully!")
            console.log(`Transaction Digest: ${result.digest}`)
            console.log("\n📋 Report Details:")
            console.log(`  Phone Number: ${phoneNumber}`)
            console.log(`  Phone Hash: ${phoneHashHex}`)
            console.log(`  Spam Type: ${spamType}`)
            if (name) console.log(`  Name: ${name}`)
            if (other) console.log(`  Other Data: ${other}`)
            console.log(`  Wallet: ${walletAddress}`)
            console.log(`  Transaction: ${result.digest}`)
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
            console.error("REPORT SPAM - ERROR")
            console.error("=".repeat(80))
            console.error("\n❌ Failed to report spam!")
            console.error("Error:", error)
            console.error("\n" + "=".repeat(80) + "\n")
            reject(error)
          },
        }
      )
    })
  }

  return {
    reportSpam,
    isPending,
    isSuccess,
    transactionDigest: data?.digest,
    error,
    isWalletConnected: currentWallet.isConnected,
  }
}

