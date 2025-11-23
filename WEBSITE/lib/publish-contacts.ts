"use client"

/**
 * Publish Contacts Service
 * 
 * Publishes encrypted contacts to on-chain Sui smart contract after Walrus upload.
 * Creates a transaction that calls add_contact for each contact.
 * 
 * Configuration:
 * - NETWORK: Sui network (testnet/mainnet)
 * - PACKAGE_ID: Move package ID containing contacts module
 * - MASTER_OBJECT_ID: Master object ID for the contacts registry
 */

import { Transaction } from '@mysten/sui/transactions'
import { useCurrentWallet, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { fromB64 } from '@mysten/sui/utils'

// Configuration
export const NETWORK = (process.env.NEXT_PUBLIC_SUI_NETWORK as 'testnet' | 'mainnet' | 'devnet' | 'localnet') || 'testnet'
export const PACKAGE_ID = process.env.NEXT_PUBLIC_SUI_PACKAGE_ID || ''
export const MASTER_OBJECT_ID = process.env.NEXT_PUBLIC_SUI_MASTER_OBJECT_ID || ''

interface EncryptedContact {
  phone_hash: string // Hex string
  name: string
  encrypted_email: string
  encrypted_other: string
  enclave_signature: string
  timestamp_ms: number
}

interface WalrusUploadResult {
  blobId: string
  blobObjectId?: string
}

/**
 * Convert hex string to Uint8Array (byte array)
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
 * Hook to publish contacts to on-chain Sui smart contract
 * 
 * @returns Function to publish contacts and transaction status
 */
export function usePublishContacts() {
  const currentWallet = useCurrentWallet()
  const { mutate: signAndExecute, isPending, isSuccess, data, error } = useSignAndExecuteTransaction()

  const publish = async (
    encryptedContacts: EncryptedContact[],
    walrusResult: WalrusUploadResult
  ): Promise<{ digest: string; result: any }> => {
    if (!currentWallet.isConnected || !currentWallet.currentWallet) {
      throw new Error('Wallet not connected. Please connect your wallet first.')
    }

    if (!walrusResult) {
      throw new Error('Walrus upload result not available. Please upload to Walrus first.')
    }

    if (encryptedContacts.length === 0) {
      throw new Error('No contacts to publish.')
    }

    const walletAddress = currentWallet.currentWallet.accounts[0].address
    
    // Get wallet public key
    const account = currentWallet.currentWallet.accounts[0]
    let walletPublicKey: Uint8Array
    
    try {
      // Try to get public key from account
      if (account.publicKey) {
        if (typeof account.publicKey === 'string') {
          walletPublicKey = fromB64(account.publicKey)
        } else if (account.publicKey instanceof Uint8Array) {
          walletPublicKey = account.publicKey
        } else {
          // Some wallets provide publicKey as an object with toRawBytes method
          walletPublicKey = (account.publicKey as any).toRawBytes?.() || new Uint8Array(32)
        }
      } else {
        // Fallback: use address bytes (not ideal but works)
        const addressBytes = new TextEncoder().encode(walletAddress)
        walletPublicKey = addressBytes.slice(0, 32) // Take first 32 bytes
      }
    } catch (err) {
      console.warn('Could not extract public key, using address fallback:', err)
      const addressBytes = new TextEncoder().encode(walletAddress)
      walletPublicKey = addressBytes.slice(0, 32)
    }

    console.log("=".repeat(80))
    console.log("PUBLISH CONTACTS - STARTING")
    console.log("=".repeat(80))
    console.log(`Network: ${NETWORK}`)
    console.log(`Package ID: ${PACKAGE_ID}`)
    console.log(`Master Object ID: ${MASTER_OBJECT_ID}`)
    console.log(`Wallet Address: ${walletAddress}`)
    console.log(`Contacts to publish: ${encryptedContacts.length}`)
    console.log(`Blob ID: ${walrusResult.blobId}`)
    if (walrusResult.blobObjectId) {
      console.log(`Blob Object ID: ${walrusResult.blobObjectId}`)
    }
    console.log("\n")

    // Build transaction
    const tx = new Transaction()

    // Add each contact using add_contact function
    for (let i = 0; i < encryptedContacts.length; i++) {
      const contact = encryptedContacts[i]
      
      // Convert phone_hash from hex string to byte array
      const phoneHashBytes = hexToBytes(contact.phone_hash)
      
      // Use blob_id from Walrus upload (string format, e.g., "1hwYC_D_65WyvwEmBLM2yxBRKjrtmxnH-qH6dd4jBVs")
      const blobId = walrusResult.blobId
      
      // Use sui_object_id from Walrus upload (blobObjectId) or default to zero
      const suiObjectId = walrusResult.blobObjectId || '0x0000000000000000000000000000000000000000000000000000000000000000'

      console.log(`[${i + 1}/${encryptedContacts.length}] Preparing contact: ${contact.name}`)
      console.log(`  Phone Hash (hex): ${contact.phone_hash}`)
      console.log(`  Phone Hash (bytes): [${Array.from(phoneHashBytes).join(', ')}]`)
      console.log(`  Wallet Pubkey (bytes): [${Array.from(walletPublicKey).join(', ')}]`)
      console.log(`  Blob ID (string): ${blobId}`)
      console.log(`  Sui Object ID: ${suiObjectId}`)

      // Call add_contact for each contact
      console.log(`\n📋 Contract Call Arguments for ${contact.name}:`)
      console.log(`  1. master (object): ${MASTER_OBJECT_ID}`)
      console.log(`  2. phone_hash (vector<u8>): [${Array.from(phoneHashBytes).join(', ')}] (${phoneHashBytes.length} bytes)`)
      console.log(`  3. wallet_pubkey (vector<u8>): [${Array.from(walletPublicKey).join(', ')}] (${walletPublicKey.length} bytes)`)
      console.log(`  4. name (String): "${contact.name}"`)
      console.log(`  5. blob_id (String): "${blobId}"`)
      console.log(`  6. sui_object_id (ID): ${suiObjectId}`)
      
      tx.moveCall({
        target: `${PACKAGE_ID}::contacts::add_contact`,
        arguments: [
          tx.object(MASTER_OBJECT_ID), // master: &mut CallerIDMaster
          tx.pure.vector('u8', Array.from(phoneHashBytes)), // phone_hash: vector<u8>
          tx.pure.vector('u8', Array.from(walletPublicKey)), // wallet_pubkey: vector<u8>
          tx.pure.string(contact.name), // name: String
          tx.pure.string(blobId), // blob_id: String (Walrus Blob ID)
          tx.pure.id(suiObjectId), // sui_object_id: ID
        ],
      })
      
      console.log(`  ✅ Move call added to transaction`)
    }

    console.log("\n📝 Transaction built successfully!")
    console.log(`  Total contacts: ${encryptedContacts.length}`)
    console.log(`  Total move calls: ${encryptedContacts.length}`)
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
            console.log("PUBLISH CONTACTS - SUCCESS")
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
            console.error("PUBLISH CONTACTS - ERROR")
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
    publish,
    isPending,
    isSuccess,
    transactionDigest: data?.digest,
    error,
    isWalletConnected: currentWallet.isConnected,
  }
}
