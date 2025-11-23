/**
 * Client-side script to encrypt contact data using Seal SDK
 * 
 * This script takes the response from the Nautilus enclave server
 * and encrypts the names and emails using Seal threshold encryption.
 * 
 * Flow:
 * 1. Nautilus server processes CSV → returns hashed phones + plaintext names/emails
 * 2. This script encrypts names/emails using Seal SDK
 * 3. Store encrypted contacts on-chain or off-chain
 * 
 * Seal SDK Documentation: https://seal-docs.wal.app/UsingSeal/
 * 
 * Usage:
 *   npm install @mysten/seal @mysten/sui
 *   ts-node encrypt-contacts.ts
 * 
 * Configuration:
 * - Update PACKAGE_ID with your Move package containing seal_approve functions
 * - Update KEY_SERVER_OBJECT_IDS with your Seal key server object IDs
 * - For Permissioned mode servers, contact operator to register your package ID
 */

import { SealClient, EncryptedObject } from '@mysten/seal';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

/**
 * Convert hex string to Uint8Array
 * Seal SDK expects bytes for packageId and id parameters
 */
function hexToBytes(hex: string): Uint8Array {
  // Remove '0x' prefix if present
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  return bytes;
}

// Configuration - replace with your values
const NETWORK = 'testnet'; // or 'mainnet'
const PACKAGE_ID = '0x...'; // Your Move package ID containing seal_approve functions
const THRESHOLD = 2; // Number of key servers needed for decryption

// Seal key server object IDs (replace with your key servers)
const KEY_SERVER_OBJECT_IDS = [
  '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
  '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8',
];

/**
 * Response structure from Nautilus enclave server
 */
interface EnclaveResponse {
  response: {
    intent: number;
    timestamp_ms: number;
    data: {
      contacts: Array<{
        name: string;
        phone_hash: number[]; // byte array
        email: string;
      }>;
    };
  };
  signature: string;
}

/**
 * Encrypted contact structure
 */
interface EncryptedContact {
  phone_hash: string; // hex-encoded
  encrypted_name: string; // hex-encoded BCS serialized EncryptedObject
  encrypted_email: string; // hex-encoded BCS serialized EncryptedObject
  enclave_signature: string; // original signature from enclave
  timestamp_ms: number;
  // Optional: backup symmetric keys for disaster recovery
  backup_keys?: {
    name_key_hex: string;
    email_key_hex: string;
  };
}

/**
 * Parse an encrypted object to inspect metadata
 * Useful for debugging or extracting ID, threshold, etc.
 */
export function parseEncryptedObject(encryptedHex: string) {
  const encryptedBytes = hexToBytes(encryptedHex);
  return EncryptedObject.parse(encryptedBytes);
}

/**
 * Encrypt a single contact's name and email
 * 
 * Note: Encryption does not conceal message size. If size is sensitive,
 * pad the message with zeros until length no longer reveals information.
 */
async function encryptContact(
  client: SealClient,
  contact: { name: string; phone_hash: number[]; email: string },
  packageId: string
): Promise<{ encryptedName: string; encryptedEmail: string; backupKeys?: { nameKey: Uint8Array; emailKey: Uint8Array } }> {
  // Convert phone_hash byte array to hex string for use as Seal ID
  const phoneHashHex = Array.from(contact.phone_hash)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Prepare data as Uint8Array
  const nameData = new TextEncoder().encode(contact.name);
  const emailData = new TextEncoder().encode(contact.email);

  // Encrypt name - returns encryptedObject and backup symmetric key
  // Note: Seal SDK may expect packageId and id in a specific format
  // Check SDK documentation for exact parameter types
  const { encryptedObject: encryptedNameBytes, key: nameBackupKey } = await client.encrypt({
    threshold: THRESHOLD,
    packageId: hexToBytes(packageId) as any, // SDK may accept Uint8Array or hex string
    id: hexToBytes(phoneHashHex) as any,
    data: nameData,
  });

  // Encrypt email - returns encryptedObject and backup symmetric key
  const { encryptedObject: encryptedEmailBytes, key: emailBackupKey } = await client.encrypt({
    threshold: THRESHOLD,
    packageId: hexToBytes(packageId) as any,
    id: hexToBytes(phoneHashHex) as any,
    data: emailData,
  });

  // Convert Uint8Array to hex string for storage
  const toHex = (bytes: Uint8Array) => 
    Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return {
    encryptedName: toHex(encryptedNameBytes),
    encryptedEmail: toHex(encryptedEmailBytes),
    // Optional: Return backup keys for disaster recovery
    // Users can decrypt manually using CLI's symmetric-decrypt command
    backupKeys: {
      nameKey: nameBackupKey,
      emailKey: emailBackupKey,
    },
  };
}

/**
 * Main function to encrypt all contacts from enclave response
 * 
 * This function:
 * 1. Initializes SealClient with configured key servers
 * 2. Encrypts each contact's name and email using Seal threshold encryption
 * 3. Uses phone_hash as the Seal ID for access control policy
 * 4. Returns encrypted contacts ready for storage (on-chain or off-chain)
 * 
 * @param enclaveResponse - Response from Nautilus server with processed contacts
 * @param packageId - Move package ID containing seal_approve functions
 * @param includeBackupKeys - If true, includes symmetric backup keys for disaster recovery
 * @returns Array of encrypted contacts with all metadata
 */
export async function encryptContactsFromEnclave(
  enclaveResponse: EnclaveResponse,
  packageId: string = PACKAGE_ID,
  includeBackupKeys: boolean = false
): Promise<EncryptedContact[]> {
  // Initialize Sui client
  const suiClient = new SuiClient({ url: getFullnodeUrl(NETWORK) });

  // Initialize Seal client
  // serverConfigs: list of key server object IDs with weights
  // weight: how many times a key server can contribute towards decryption threshold
  // verifyKeyServers: set to true to verify key server URLs (adds round-trip latency)
  const sealClient = new SealClient({
    suiClient,
    serverConfigs: KEY_SERVER_OBJECT_IDS.map((id) => ({
      objectId: id,
      weight: 1, // Equal weight for all servers
      // Optional: apiKeyName and apiKey if key server requires API key
      // apiKeyName: 'X-API-Key',
      // apiKey: 'your-api-key',
    })),
    verifyKeyServers: false, // Set to true at app startup for verification, false otherwise
  });

  const encryptedContacts: EncryptedContact[] = [];

  // Helper to convert byte array to hex
  const toHex = (bytes: number[]) => 
    bytes.map(b => b.toString(16).padStart(2, '0')).join('');

  // Encrypt each contact
  for (const contact of enclaveResponse.response.data.contacts) {
    const phoneHashHex = toHex(contact.phone_hash);
    
    const { encryptedName, encryptedEmail, backupKeys } = await encryptContact(
      sealClient,
      contact,
      packageId
    );

    const encryptedContact: EncryptedContact = {
      phone_hash: phoneHashHex,
      encrypted_name: encryptedName,
      encrypted_email: encryptedEmail,
      enclave_signature: enclaveResponse.signature,
      timestamp_ms: enclaveResponse.response.timestamp_ms,
    };

    // Optionally include backup keys for disaster recovery
    // Users can decrypt manually using CLI: seal-cli symmetric-decrypt
    if (includeBackupKeys && backupKeys) {
      encryptedContact.backup_keys = {
        name_key_hex: Array.from(backupKeys.nameKey).map(b => b.toString(16).padStart(2, '0')).join(''),
        email_key_hex: Array.from(backupKeys.emailKey).map(b => b.toString(16).padStart(2, '0')).join(''),
      };
    }

    encryptedContacts.push(encryptedContact);
  }

  return encryptedContacts;
}

/**
 * Example usage: Process enclave response and encrypt contacts
 */
async function main() {
  // Example: Replace this with actual response from your Nautilus server
  const enclaveResponse: EnclaveResponse = {
    response: {
      intent: 0,
      timestamp_ms: Date.now(),
      data: {
        contacts: [
          {
            name: 'Alice',
            phone_hash: [236, 33, 159, 165, 86, 242, 0, 205, 80, 45, 14, 122, 184, 114, 253, 143, 59, 67, 114, 166, 126, 98, 50, 128, 20, 18, 157, 129, 156, 99, 60, 150],
            email: 'alice@example.com',
          },
        ],
      },
    },
    signature: '26898d1492ca316d543636c3eb356a332546c99d5cc7b8a5419fdaf648fe9764...',
  };

  try {
    console.log('Encrypting contacts...');
    const encryptedContacts = await encryptContactsFromEnclave(
      enclaveResponse,
      PACKAGE_ID
    );

    console.log('Encrypted contacts:');
    console.log(JSON.stringify(encryptedContacts, null, 2));

    // Now you can store encryptedContacts on-chain or off-chain
    // Example: Call your Move contract to store them
    // await storeEncryptedContactsOnChain(encryptedContacts);
  } catch (error) {
    console.error('Error encrypting contacts:', error);
    throw error;
  }
}

// Run if executed directly
// For Node.js: ts-node encrypt-contacts.ts
// For browser/ES modules: import and call main() directly
// Uncomment the line below to run as a script:
// main().catch(console.error);

