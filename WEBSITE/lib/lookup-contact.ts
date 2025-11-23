"use client"

/**
 * Contact Lookup Service
 * 
 * Queries the Sui smart contract to look up contact information by phone number hash.
 * Uses the same hashing method (BLAKE2b256) as the upload process.
 */

import { Transaction } from '@mysten/sui/transactions'
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client'
import { fromB64 } from '@mysten/sui/utils'
import { blake2b } from 'blakejs'
import { NETWORK, PACKAGE_ID, MASTER_OBJECT_ID } from './publish-contacts'

/**
 * Decode base64 string to Uint8Array (browser-compatible)
 */
function decodeBase64(base64: string): Uint8Array {
  try {
    // Try using Sui SDK's fromB64 first
    return fromB64(base64)
  } catch (err) {
    // Fallback: manual base64 decoding
    // Remove any whitespace and padding issues
    const cleanBase64 = base64.trim().replace(/\s/g, '')
    
    // Use browser's atob with proper error handling
    try {
      const binaryString = atob(cleanBase64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      return bytes
    } catch (atobErr) {
      throw new Error(`Failed to decode base64: ${err instanceof Error ? err.message : String(err)}. Fallback also failed: ${atobErr instanceof Error ? atobErr.message : String(atobErr)}`)
    }
  }
}

/**
 * Hash phone number using BLAKE2b256 (same method as upload process)
 */
export function hashPhoneNumber(phone: string): Uint8Array {
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
export function bytesToHex(bytes: Uint8Array | number[]): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Convert hex string to byte array
 */
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex
  const bytes = new Uint8Array(cleanHex.length / 2)
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16)
  }
  return bytes
}

export interface ContactRecord {
  phone_hash: number[]
  wallet_pubkey: number[]
  name: string
  blob_id: string
  sui_object_id: string
  spam_count: bigint
  not_spam_count: bigint
  spam_type: string
}

/**
 * Look up a contact by phone number
 * 
 * @param phoneNumber - Phone number to look up
 * @returns Contact record if found, null otherwise
 */
export async function lookupContact(phoneNumber: string): Promise<ContactRecord | null> {
  console.log("=".repeat(80))
  console.log("CONTACT LOOKUP - STARTING")
  console.log("=".repeat(80))
  console.log(`Phone Number: ${phoneNumber}`)
  console.log(`Network: ${NETWORK}`)
  console.log(`Package ID: ${PACKAGE_ID}`)
  console.log(`Master Object ID: ${MASTER_OBJECT_ID}`)
  console.log("\n")

  // Step 1: Hash the phone number using BLAKE2b256 (same as upload process)
  const phoneHashBytes = hashPhoneNumber(phoneNumber)
  
  // Step 2: Convert byte array to number array for query (contract expects vector<u8>)
  const phoneHashArray = Array.from(phoneHashBytes)
  
  // For display/logging: convert to hex string
  const phoneHashHex = bytesToHex(phoneHashBytes)
  
  console.log("📝 Hashing Process:")
  console.log(`  Input: ${phoneNumber}`)
  console.log(`  Digits Only: ${phoneNumber.replace(/\D/g, '')}`)
  console.log(`  Hash Method: BLAKE2b256 (32 bytes)`)
  console.log(`  Hash (bytes): [${phoneHashArray.join(', ')}]`)
  console.log(`  Hash (hex): ${phoneHashHex}`)
  console.log(`  Hash (length): ${phoneHashBytes.length} bytes`)
  console.log(`  Using for query: vector<u8> with ${phoneHashArray.length} elements`)
  console.log("\n")

  // Initialize Sui client
  const suiClient = new SuiClient({ url: getFullnodeUrl(NETWORK) })

  // Build transaction
  const tx = new Transaction()
  
  // Use a dummy sender address (devInspect doesn't require real sender)
  const dummySender = '0x0000000000000000000000000000000000000000000000000000000000000000'
  tx.setSender(dummySender)

  tx.moveCall({
    target: `${PACKAGE_ID}::contacts::get_contact`,
    arguments: [
      tx.object(MASTER_OBJECT_ID), // master: &CallerIDMaster
      tx.pure.vector('u8', phoneHashArray), // phone_hash: vector<u8> (converted from Uint8Array to number[])
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

  // Parse the result - simplified
  if (!result.results || result.results.length === 0 || !result.results[0].returnValues || result.results[0].returnValues.length === 0) {
    console.log("❌ Contact not found (no return values)")
    return null
  }

  // returnValue format: [[bcs_bytes, bcs_type]]
  // bcs_bytes can be either a base64 string OR already a Uint8Array
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
    optionBytes = decodeBase64(bcsBytes)
  } else if (bcsBytes instanceof Uint8Array) {
    // Already bytes - use directly
    optionBytes = bcsBytes
  } else if (Array.isArray(bcsBytes)) {
    // Array of numbers - convert to Uint8Array
    optionBytes = new Uint8Array(bcsBytes)
  } else {
    console.error("❌ bcsBytes must be string, Uint8Array, or number array, got:", typeof bcsBytes, bcsBytes)
    return null
  }
  
  const optionTag = optionBytes[0] // 0 = None, 1 = Some
  
  if (optionTag === 0) {
    console.log("❌ Contact not found")
    console.log("No contact exists with this phone hash.")
    console.log("\n" + "=".repeat(80) + "\n")
    return null
  } else if (optionTag === 1) {
    console.log("✅ Contact found!\n")
    
    // Extract the ContactRecord bytes (skip the option tag)
    const contactBytes = optionBytes.slice(1)
    
    // Helper to read ULEB128 length-prefixed vector
    const readVector = (bytes: Uint8Array, offset: { value: number }) => {
      // Read ULEB128 length
      let length = 0
      let shift = 0
      while (true) {
        const byte = bytes[offset.value++]
        length |= (byte & 0x7f) << shift
        if ((byte & 0x80) === 0) break
        shift += 7
      }
      const vec = Array.from(bytes.slice(offset.value, offset.value + length))
      offset.value += length
      return vec
    }
    
    // Helper to read string (same as vector<u8>)
    const readString = (bytes: Uint8Array, offset: { value: number }) => {
      const byteArray = readVector(bytes, offset)
      return new TextDecoder().decode(new Uint8Array(byteArray))
    }
    
    // Helper to read u64 (8 bytes, little-endian)
    const readU64 = (bytes: Uint8Array, offset: { value: number }) => {
      let value = BigInt(0)
      for (let i = 0; i < 8; i++) {
        const shift = BigInt(i) * BigInt(8)
        value |= BigInt(bytes[offset.value++]) << shift
      }
      return value
    }
    
    // Helper to read ID (32 bytes as hex string)
    const readID = (bytes: Uint8Array, offset: { value: number }) => {
      const idBytes = Array.from(bytes.slice(offset.value, offset.value + 32))
      offset.value += 32
      return '0x' + idBytes.map(b => b.toString(16).padStart(2, '0')).join('')
    }
    
    // Parse ContactRecord fields in order
    const offset = { value: 0 }
    
    const phone_hash = readVector(contactBytes, offset)
    const wallet_pubkey = readVector(contactBytes, offset)
    const name = readString(contactBytes, offset)
    const blob_id = readString(contactBytes, offset) // blob_id is a String (Walrus Blob ID)
    const sui_object_id = readID(contactBytes, offset)
    const spam_count = readU64(contactBytes, offset)
    const not_spam_count = readU64(contactBytes, offset)
    const spam_type = readString(contactBytes, offset)
    
    // Convert byte arrays to hex
    const phoneHashHex = '0x' + bytesToHex(phone_hash)
    const walletPubkeyHex = '0x' + bytesToHex(wallet_pubkey)
    
    const contact: ContactRecord = {
      phone_hash,
      wallet_pubkey,
      name,
      blob_id,
      sui_object_id,
      spam_count,
      not_spam_count,
      spam_type,
    }
    
    console.log("Contact Details:")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log(`Phone Hash:     ${phoneHashHex}`)
    console.log(`Wallet Pubkey:  ${walletPubkeyHex}`)
    console.log(`Name:           ${name}`)
    console.log(`Blob ID:        ${blob_id}`)
    console.log(`Sui Object ID:  ${sui_object_id}`)
    console.log(`Spam Count:     ${spam_count}`)
    console.log(`Not Spam Count: ${not_spam_count}`)
    console.log(`Spam Type:      ${spam_type || '(empty)'}`)
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("\n" + "=".repeat(80) + "\n")
    
    return contact
  } else {
    console.log("⚠️  Unexpected option tag:", optionTag)
    return null
  }
}

