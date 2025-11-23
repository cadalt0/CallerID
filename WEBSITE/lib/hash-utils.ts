/**
 * Server-side hashing utilities
 * 
 * These functions can be used in API routes and server components.
 * They use the same BLAKE2b256 hashing as the client-side functions.
 */

import { blake2b } from 'blakejs'

/**
 * Hash phone number using BLAKE2b256 (server-side version)
 * Same implementation as client-side hashPhoneNumber
 */
export function hashPhoneNumberServer(phone: string): Uint8Array {
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
 * Convert byte array to hex string (server-side version)
 */
export function bytesToHexServer(bytes: Uint8Array | number[]): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}


