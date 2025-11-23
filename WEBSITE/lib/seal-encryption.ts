"use client"

/**
 * Seal Encryption Service
 * 
 * Encrypts contact data (email and other fields) using Seal SDK threshold encryption.
 * Follows the exact method from encrypt-example.
 * 
 * Flow:
 * 1. Receive API response with hashed phones + plaintext names/emails/other
 * 2. Encrypt email and other fields using Seal SDK (name stays plaintext)
 * 3. Return encrypted contacts ready for storage
 * 
 * Seal SDK Documentation: https://seal-docs.wal.app/UsingSeal/
 */

import { SealClient, EncryptedObject } from '@mysten/seal';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

// Configuration - from environment variables or defaults
const NETWORK = (process.env.NEXT_PUBLIC_SEAL_NETWORK as 'testnet' | 'mainnet') || 'testnet';
const PACKAGE_ID = process.env.NEXT_PUBLIC_SEAL_PACKAGE_ID || '0x7653ba5cca57222d675bdc522a145e226199bba2a789feb79c204d6038f1a276';
const THRESHOLD = Number(process.env.NEXT_PUBLIC_SEAL_THRESHOLD) || 2;

// Seal key server object IDs (from environment or defaults)
const getKeyServerObjectIds = (): string[] => {
  const envIds = process.env.NEXT_PUBLIC_SEAL_KEY_SERVER_IDS;
  if (envIds) {
    return envIds.split(',').map(id => id.trim());
  }
  // Default key servers
  return [
    '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
    '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8',
  ];
};

/**
 * Convert byte array to hex string
 */
function toHex(bytes: number[] | Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Parse an encrypted object to inspect metadata
 */
export function parseEncryptedObject(encryptedHex: string) {
  const encryptedBytes = hexToBytes(encryptedHex);
  return EncryptedObject.parse(encryptedBytes);
}

interface ContactFromAPI {
  name: string;
  phone_hash: number[]; // Byte array
  email: string;
  other: string;
}

interface EncryptedContact {
  phone_hash: string; // Hex string
  name: string; // Plaintext
  encrypted_email: string; // Hex string of encrypted email
  encrypted_other: string; // Hex string of encrypted other field
  enclave_signature: string;
  timestamp_ms: number;
  backup_keys?: {
    email_key_hex: string;
    other_key_hex: string;
  };
}

/**
 * Encrypt a single contact's email and other fields (name stays plaintext)
 */
async function encryptContact(
  client: SealClient,
  contact: ContactFromAPI,
  packageId: string
): Promise<{
  name: string;
  encryptedEmail: string;
  encryptedOther: string;
  backupKeys: {
    emailKey: Uint8Array;
    otherKey: Uint8Array;
  };
}> {
  // Convert phone_hash byte array to hex string for use as Seal ID
  const phoneHashHex = toHex(contact.phone_hash);

  // Prepare email data as Uint8Array (name stays plaintext)
  const emailData = new TextEncoder().encode(contact.email || '');
  
  // Prepare other data as Uint8Array
  const otherData = new TextEncoder().encode(contact.other || '');

  console.log(`  Encrypting contact: ${contact.name}`);
  console.log(`    Phone hash (Seal ID): ${phoneHashHex}`);

  // Encrypt email - returns encryptedObject and backup symmetric key
  const { encryptedObject: encryptedEmailBytes, key: emailBackupKey } = await client.encrypt({
    threshold: THRESHOLD,
    packageId: packageId,
    id: phoneHashHex,
    data: emailData,
  });

  // Encrypt other field - returns encryptedObject and backup symmetric key
  const { encryptedObject: encryptedOtherBytes, key: otherBackupKey } = await client.encrypt({
    threshold: THRESHOLD,
    packageId: packageId,
    id: phoneHashHex,
    data: otherData,
  });

  // Convert Uint8Array to hex string for storage
  return {
    name: contact.name, // Keep name as plaintext
    encryptedEmail: toHex(encryptedEmailBytes),
    encryptedOther: toHex(encryptedOtherBytes),
    backupKeys: {
      emailKey: emailBackupKey,
      otherKey: otherBackupKey,
    },
  };
}

interface ProcessDataResponse {
  response: {
    intent: number;
    timestamp_ms: number;
    data: {
      contacts: ContactFromAPI[];
    };
  };
  signature: string;
}

/**
 * Main function to encrypt all contacts from API response
 * 
 * This function:
 * 1. Initializes SealClient with configured key servers
 * 2. Encrypts each contact's email and other fields using Seal threshold encryption (name stays plaintext)
 * 3. Uses phone_hash as the Seal ID for access control policy
 * 4. Returns encrypted contacts ready for storage (on-chain or off-chain)
 * 
 * @param apiResponse - Response from API with processed contacts
 * @param packageId - Move package ID containing seal_approve functions (optional, uses env var if not provided)
 * @param includeBackupKeys - If true, includes symmetric backup keys for disaster recovery
 * @returns Promise<Array> Array of encrypted contacts with all metadata
 */
export async function encryptContactsFromAPI(
  apiResponse: ProcessDataResponse,
  packageId?: string,
  includeBackupKeys: boolean = false
): Promise<EncryptedContact[]> {
  console.log("=".repeat(80));
  console.log("SEAL ENCRYPTION - STARTING");
  console.log("=".repeat(80));
  console.log(`Network: ${NETWORK}`);
  console.log(`Package ID: ${packageId || PACKAGE_ID}`);
  console.log(`Threshold: ${THRESHOLD}`);
  console.log(`Contacts to encrypt: ${apiResponse.response.data.contacts.length}`);
  console.log("\n");

  // Initialize Sui client
  const suiClient = new SuiClient({ url: getFullnodeUrl(NETWORK) });

  // Initialize Seal client
  const keyServerObjectIds = getKeyServerObjectIds();
  console.log(`Key Servers: ${keyServerObjectIds.length}`);
  keyServerObjectIds.forEach((id, i) => {
    console.log(`  ${i + 1}. ${id}`);
  });
  console.log("\n");

  const sealClient = new SealClient({
    suiClient,
    serverConfigs: keyServerObjectIds.map((id) => ({
      objectId: id,
      weight: 1, // Equal weight for all servers
      // Optional: apiKeyName and apiKey if key server requires API key
      // apiKeyName: 'X-API-Key',
      // apiKey: process.env.NEXT_PUBLIC_SEAL_API_KEY,
    })),
    verifyKeyServers: false, // Set to true at app startup for verification, false otherwise
  });

  const encryptedContacts: EncryptedContact[] = [];
  const finalPackageId = packageId || PACKAGE_ID;

  // Encrypt each contact
  for (let i = 0; i < apiResponse.response.data.contacts.length; i++) {
    const contact = apiResponse.response.data.contacts[i];
    console.log(`\n[${i + 1}/${apiResponse.response.data.contacts.length}] Processing: ${contact.name}`);
    console.log(`  Name: ${contact.name}`);
    console.log(`  Phone Hash (byte array): [${contact.phone_hash.join(', ')}]`);
    console.log(`  Phone Hash (length): ${contact.phone_hash.length} bytes`);
    console.log(`  Email (before encryption): ${contact.email || '(empty)'}`);
    console.log(`  Other (before encryption): ${contact.other || '(empty)'}`);

    try {
      const phoneHashHex = toHex(contact.phone_hash);
      
      const { name, encryptedEmail, encryptedOther, backupKeys } = await encryptContact(
        sealClient,
        contact,
        finalPackageId
      );

      const encryptedContact: EncryptedContact = {
        phone_hash: phoneHashHex,
        name: name, // Keep name as plaintext
        encrypted_email: encryptedEmail,
        encrypted_other: encryptedOther,
        enclave_signature: apiResponse.signature,
        timestamp_ms: apiResponse.response.timestamp_ms,
      };

      // Optionally include backup keys for disaster recovery
      if (includeBackupKeys && backupKeys) {
        encryptedContact.backup_keys = {
          email_key_hex: toHex(backupKeys.emailKey),
          other_key_hex: toHex(backupKeys.otherKey),
        };
      }

      encryptedContacts.push(encryptedContact);
      
      // Log encrypted data
      console.log(`  ✅ Seal Encryption Complete:`);
      console.log(`    Name: ${name} (plaintext)`);
      console.log(`    Phone Hash (byte array): [${contact.phone_hash.join(', ')}]`);
      console.log(`    Encrypted Email: ${encryptedEmail}`);
      console.log(`    Encrypted Other: ${encryptedOther}`);
      console.log(`    Enclave Signature: ${apiResponse.signature.substring(0, 32)}...`);
    } catch (error) {
      console.error(`  ❌ Error encrypting contact ${contact.name}:`, error);
      throw error;
    }
  }

  console.log("=".repeat(80));
  console.log("SEAL ENCRYPTION - COMPLETE");
  console.log("=".repeat(80));
  console.log(`Total contacts encrypted: ${encryptedContacts.length}`);
  console.log("\n");

  return encryptedContacts;
}

