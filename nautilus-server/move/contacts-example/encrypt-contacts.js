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
 *   node encrypt-contacts.js
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
function hexToBytes(hex) {
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
const PACKAGE_ID = '0x7653ba5cca57222d675bdc522a145e226199bba2a789feb79c204d6038f1a276'; // Published contacts package ID
const THRESHOLD = 2; // Number of key servers needed for decryption

// Seal key server object IDs (replace with your key servers)
const KEY_SERVER_OBJECT_IDS = [
  '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
  '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8',
];

/**
 * Parse an encrypted object to inspect metadata
 * Useful for debugging or extracting ID, threshold, etc.
 */
export function parseEncryptedObject(encryptedHex) {
  const encryptedBytes = hexToBytes(encryptedHex);
  return EncryptedObject.parse(encryptedBytes);
}

/**
 * Encrypt a single contact's email (name stays plaintext)
 * 
 * Note: Encryption does not conceal message size. If size is sensitive,
 * pad the message with zeros until length no longer reveals information.
 */
async function encryptContact(client, contact, packageId) {
  // Convert phone_hash byte array to hex string for use as Seal ID
  const phoneHashHex = Array.from(contact.phone_hash)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Prepare email data as Uint8Array (name stays plaintext)
  const emailData = new TextEncoder().encode(contact.email);

  // Encrypt email only - returns encryptedObject and backup symmetric key
  // Seal SDK expects hex strings for packageId and id (it converts internally)
  const { encryptedObject: encryptedEmailBytes, key: emailBackupKey } = await client.encrypt({
    threshold: THRESHOLD,
    packageId: packageId, // Already a hex string
    id: phoneHashHex, // Already a hex string
    data: emailData,
  });

  // Convert Uint8Array to hex string for storage
  const toHex = (bytes) => 
    Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return {
    name: contact.name, // Keep name as plaintext
    other: contact.other ?? '',
    encryptedEmail: toHex(encryptedEmailBytes),
    // Optional: Return backup keys for disaster recovery
    // Users can decrypt manually using CLI's symmetric-decrypt command
    backupKeys: {
      emailKey: emailBackupKey,
    },
  };
}

/**
 * Main function to encrypt all contacts from enclave response
 * 
 * This function:
 * 1. Initializes SealClient with configured key servers
 * 2. Encrypts each contact's email using Seal threshold encryption (name stays plaintext)
 * 3. Uses phone_hash as the Seal ID for access control policy
 * 4. Returns encrypted contacts ready for storage (on-chain or off-chain)
 * 
 * @param {Object} enclaveResponse - Response from Nautilus server with processed contacts
 * @param {string} packageId - Move package ID containing seal_approve functions
 * @param {boolean} includeBackupKeys - If true, includes symmetric backup keys for disaster recovery
 * @returns {Promise<Array>} Array of encrypted contacts with all metadata
 */
export async function encryptContactsFromEnclave(
  enclaveResponse,
  packageId = PACKAGE_ID,
  includeBackupKeys = false
) {
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

  const encryptedContacts = [];

  // Helper to convert byte array to hex
  const toHex = (bytes) => 
    bytes.map(b => b.toString(16).padStart(2, '0')).join('');

  // Encrypt each contact
  for (const contact of enclaveResponse.response.data.contacts) {
    const phoneHashHex = toHex(contact.phone_hash);
    
    const { name, other, encryptedEmail, backupKeys } = await encryptContact(
      sealClient,
      contact,
      packageId
    );

    const encryptedContact = {
      phone_hash: phoneHashHex,
      name: name, // Keep name as plaintext
      other: other,
      encrypted_email: encryptedEmail,
      enclave_signature: enclaveResponse.signature,
      timestamp_ms: enclaveResponse.response.timestamp_ms,
    };

    // Optionally include backup keys for disaster recovery
    // Users can decrypt manually using CLI: seal-cli symmetric-decrypt
    if (includeBackupKeys && backupKeys) {
      encryptedContact.backup_keys = {
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
  const enclaveResponse = {
    response: {
      intent: 0,
      timestamp_ms: Date.now(),
      data: {
        contacts: [
          {
            name: 'Alice',
            phone_hash: [236, 33, 159, 165, 86, 242, 0, 205, 80, 45, 14, 122, 184, 114, 253, 143, 59, 67, 114, 166, 126, 98, 50, 128, 20, 18, 157, 129, 156, 99, 60, 150],
            email: 'alice@example.com',
            other: 'Friend from school',
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
// For Node.js: node encrypt-contacts.js
// For browser: import and call main() directly
main().catch(console.error);

