/**
 * Common utilities for CallerID contract testing
 */

import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromHEX } from '@mysten/sui/utils';

// Configuration
export const NETWORK = 'testnet'; // or 'mainnet'
// Deployed: Transaction Digest: C22Y8mgtY9sN2fMqmrsV7B3WjkU22ANGq1dn4MmLSEQV
// Updated: Auto-create contact on spam report, spam_type required, optional data fields
export const PACKAGE_ID = '0x122b45c984dac0464f8cce8a1bd1f2e40327f4407b22ed332231b41d6fb24872';
export const MASTER_OBJECT_ID = '0x642c8d1b1d85232f51cf12920d67c2ed0ab540fac04ae86c32fb486863070a14';

// Private key from decrypt-contacts.js pattern
const PRIVATE_KEY =
  process.env.SUI_PRIVATE_KEY ??
  process.env.PRIVATE_KEY ??
  '';

/**
 * Convert hex string to Uint8Array
 */
export function hexToBytes(hex) {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to hex string
 */
export function bytesToHex(bytes) {
  return '0x' + Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Load signer from private key (same pattern as decrypt-contacts.js)
 */
export function loadSigner() {
  const secret = PRIVATE_KEY.trim();
  const secretBytes = fromHEX(secret);
  
  if (secretBytes.length === 0) {
    throw new Error('Invalid PRIVATE_KEY: empty bytes');
  }
  
  if (secretBytes.length === 33) {
    // Expect ed25519 flag 0x00 + 32-byte secret
    const scheme = secretBytes[0];
    if (scheme !== 0) {
      throw new Error('Only Ed25519 secret keys are supported');
    }
    return Ed25519Keypair.fromSecretKey(secretBytes.slice(1));
  }
  
  if (secretBytes.length === 32) {
    return Ed25519Keypair.fromSecretKey(secretBytes);
  }
  
  throw new Error('Invalid PRIVATE_KEY length; expected 32 or 33 bytes');
}

/**
 * Initialize Sui client
 */
export function getSuiClient() {
  return new SuiClient({
    url: getFullnodeUrl(NETWORK),
  });
}

/**
 * Get signer address
 */
export function getSignerAddress() {
  const signer = loadSigner();
  return signer.getPublicKey().toSuiAddress();
}

