/**
 * Server-side contact lookup
 * 
 * This is a server-compatible version of lookupContact that can be used in API routes.
 */

import { Transaction } from '@mysten/sui/transactions'
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client'
import { fromB64 } from '@mysten/sui/utils'
import { hashPhoneNumberServer, bytesToHexServer } from './hash-utils'

// Import config from publish-contacts (these are just strings, should work)
const NETWORK = (process.env.NEXT_PUBLIC_SUI_NETWORK as 'testnet' | 'mainnet' | 'devnet' | 'localnet') || 'testnet'
const PACKAGE_ID = process.env.NEXT_PUBLIC_SUI_PACKAGE_ID || ''
const MASTER_OBJECT_ID = process.env.NEXT_PUBLIC_SUI_MASTER_OBJECT_ID || ''

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
 * Decode base64 string to Uint8Array (server-compatible)
 */
function decodeBase64(base64: string): Uint8Array {
  try {
    return fromB64(base64)
  } catch (err) {
    // Fallback: manual base64 decoding using Buffer (Node.js)
    const cleanBase64 = base64.trim().replace(/\s/g, '')
    return new Uint8Array(Buffer.from(cleanBase64, 'base64'))
  }
}

/**
 * Look up a contact by phone number (server-side version)
 */
export async function lookupContactServer(phoneNumber: string): Promise<ContactRecord | null> {
  // Hash the phone number using BLAKE2b256
  const phoneHashBytes = hashPhoneNumberServer(phoneNumber)
  const phoneHashArray = Array.from(phoneHashBytes)

  // Initialize Sui client
  const suiClient = new SuiClient({ url: getFullnodeUrl(NETWORK) })

  // Build transaction
  const tx = new Transaction()
  const dummySender = '0x0000000000000000000000000000000000000000000000000000000000000000'
  tx.setSender(dummySender)

  tx.moveCall({
    target: `${PACKAGE_ID}::contacts::get_contact`,
    arguments: [
      tx.object(MASTER_OBJECT_ID),
      tx.pure.vector('u8', phoneHashArray),
    ],
  })

  // Build only the transaction kind
  const txBytes = await tx.build({ 
    client: suiClient,
    onlyTransactionKind: true,
  })

  // Use devInspectTransactionBlock to call view function
  const result = await suiClient.devInspectTransactionBlock({
    sender: dummySender,
    transactionBlock: txBytes,
  })

  // Parse the result
  if (!result.results || result.results.length === 0 || !result.results[0].returnValues || result.results[0].returnValues.length === 0) {
    return null
  }

  const returnValueTuple = result.results[0].returnValues[0]
  
  if (!Array.isArray(returnValueTuple) || returnValueTuple.length < 2) {
    return null
  }
  
  const bcsBytes = returnValueTuple[0]
  
  // Handle both base64 string and Uint8Array formats
  let optionBytes: Uint8Array
  if (typeof bcsBytes === 'string') {
    optionBytes = decodeBase64(bcsBytes)
  } else if (bcsBytes instanceof Uint8Array) {
    optionBytes = bcsBytes
  } else if (Array.isArray(bcsBytes)) {
    optionBytes = new Uint8Array(bcsBytes)
  } else {
    return null
  }
  
  const optionTag = optionBytes[0]
  
  if (optionTag === 0) {
    return null
  } else if (optionTag === 1) {
    const contactBytes = optionBytes.slice(1)
    
    // Helper functions to read BCS data
    const readVector = (bytes: Uint8Array, offset: { value: number }) => {
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
    
    const readString = (bytes: Uint8Array, offset: { value: number }) => {
      const byteArray = readVector(bytes, offset)
      return new TextDecoder().decode(new Uint8Array(byteArray))
    }
    
    const readU64 = (bytes: Uint8Array, offset: { value: number }) => {
      let value = BigInt(0)
      for (let i = 0; i < 8; i++) {
        const shift = BigInt(i) * BigInt(8)
        value |= BigInt(bytes[offset.value++]) << shift
      }
      return value
    }
    
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
    const blob_id = readString(contactBytes, offset)
    const sui_object_id = readID(contactBytes, offset)
    const spam_count = readU64(contactBytes, offset)
    const not_spam_count = readU64(contactBytes, offset)
    const spam_type = readString(contactBytes, offset)
    
    return {
      phone_hash,
      wallet_pubkey,
      name,
      blob_id,
      sui_object_id,
      spam_count,
      not_spam_count,
      spam_type,
    }
  } else {
    return null
  }
}


