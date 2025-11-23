"use client"

/**
 * Get Stake Service
 * 
 * Queries the Sui smart contract to get stake information for a user address.
 */

import { Transaction } from '@mysten/sui/transactions'
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client'
import { fromB64 } from '@mysten/sui/utils'
import { NETWORK, PACKAGE_ID, MASTER_OBJECT_ID } from './publish-contacts'

export interface StakeInfo {
  amount: bigint // Amount in MIST
  timestamp: bigint // Timestamp in milliseconds
  locked: boolean
}

/**
 * Get stake information for a user address
 * 
 * @param userAddress - Sui address to query stake for
 * @returns Stake info if found, null otherwise
 */
export async function getStake(userAddress: string): Promise<StakeInfo | null> {
  console.log("=".repeat(80))
  console.log("GET STAKE - STARTING")
  console.log("=".repeat(80))
  console.log(`User Address: ${userAddress}`)
  console.log(`Network: ${NETWORK}`)
  console.log(`Package ID: ${PACKAGE_ID}`)
  console.log(`Master Object ID: ${MASTER_OBJECT_ID}`)
  console.log("\n")

  // Initialize Sui client
  const suiClient = new SuiClient({ url: getFullnodeUrl(NETWORK) })

  // Build transaction
  const tx = new Transaction()
  
  // Use a dummy sender address (devInspect doesn't require real sender)
  const dummySender = '0x0000000000000000000000000000000000000000000000000000000000000000'
  tx.setSender(dummySender)

  tx.moveCall({
    target: `${PACKAGE_ID}::stake::get_stake`,
    arguments: [
      tx.object(MASTER_OBJECT_ID), // master: &CallerIDMaster
      tx.pure.address(userAddress), // user: address
    ],
  })

  console.log("📝 Building transaction...")
  
  // Build only the transaction kind (not full transaction)
  const txBytes = await tx.build({ 
    client: suiClient,
    onlyTransactionKind: true,
  })

  console.log("🔍 Querying contract...")
  
  // Use devInspectTransactionBlock to call view function
  const result = await suiClient.devInspectTransactionBlock({
    sender: dummySender,
    transactionBlock: txBytes,
  })

  console.log("✅ Query complete!")
  console.log("\n")

  // Parse the result
  if (!result.results || result.results.length === 0 || !result.results[0].returnValues || result.results[0].returnValues.length === 0) {
    console.log("❌ No stake found (no return values)")
    return null
  }

  // returnValue format: [[bcs_bytes, bcs_type]]
  const returnValueTuple = result.results[0].returnValues[0]
  
  if (!Array.isArray(returnValueTuple) || returnValueTuple.length < 2) {
    console.error("❌ Invalid return value format:", returnValueTuple)
    return null
  }
  
  const bcsBytes = returnValueTuple[0]
  
  // Handle both base64 string and Uint8Array formats
  let optionBytes: Uint8Array
  if (typeof bcsBytes === 'string') {
    // Base64 string - decode it
    optionBytes = fromB64(bcsBytes)
  } else if (bcsBytes instanceof Uint8Array) {
    // Already bytes - use directly
    optionBytes = bcsBytes
  } else if (Array.isArray(bcsBytes)) {
    // Array of numbers - convert to Uint8Array
    optionBytes = new Uint8Array(bcsBytes)
  } else {
    console.error("❌ bcsBytes must be string, Uint8Array, or number array, got:", typeof bcsBytes)
    return null
  }
  
  const optionTag = optionBytes[0] // 0 = None, 1 = Some
  
  if (optionTag === 0) {
    console.log("❌ No stake found")
    console.log("This address has not staked any SUI.")
    console.log("\n" + "=".repeat(80) + "\n")
    return null
  } else if (optionTag === 1) {
    console.log("✅ Stake found!\n")
    
    // Extract the StakeInfo bytes (skip the option tag)
    const stakeBytes = optionBytes.slice(1)
    
    // Helper to read u64 (8 bytes, little-endian)
    const readU64 = (bytes: Uint8Array, offset: { value: number }) => {
      let value = BigInt(0)
      for (let i = 0; i < 8; i++) {
        const shift = BigInt(i) * BigInt(8)
        value |= BigInt(bytes[offset.value++]) << shift
      }
      return value
    }
    
    // Helper to read bool (1 byte)
    const readBool = (bytes: Uint8Array, offset: { value: number }) => {
      return bytes[offset.value++] !== 0
    }
    
    // Parse StakeInfo fields in order
    const offset = { value: 0 }
    
    const amount = readU64(stakeBytes, offset)
    const timestamp = readU64(stakeBytes, offset)
    const locked = readBool(stakeBytes, offset)
    
    // Convert MIST to SUI (1 SUI = 1,000,000,000 MIST)
    const amountInSui = Number(amount) / 1_000_000_000
    const date = new Date(Number(timestamp))
    
    const stakeInfo: StakeInfo = {
      amount,
      timestamp,
      locked,
    }
    
    console.log("Stake Details:")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log(`Amount:         ${amountInSui} SUI (${amount} MIST)`)
    console.log(`Timestamp:      ${timestamp} (${date.toISOString()})`)
    console.log(`Locked:         ${locked ? 'Yes' : 'No'}`)
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("\n" + "=".repeat(80) + "\n")
    
    return stakeInfo
  } else {
    console.log("⚠️  Unexpected option tag:", optionTag)
    return null
  }
}

