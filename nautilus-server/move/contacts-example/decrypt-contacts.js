/**
 * Client-side script to decrypt contact emails using Seal SDK
 * 
 * This script decrypts encrypted emails from contacts that were encrypted
 * using the Seal threshold encryption system.
 * 
 * Flow:
 * 1. Takes encrypted contact data (from encrypt-contacts.js output)
 * 2. Builds a transaction calling seal_approve to verify access
 * 3. Uses Seal SDK to decrypt the email using threshold decryption
 * 
 * NOTE: Provide SEAL_SESSION_PRIVATE_KEY (0x-prefixed Ed25519 key) so the script
 * can create a Seal session key and sign requests to the key servers.
 * 
 * Seal SDK Documentation: https://seal-docs.wal.app/UsingSeal/
 * 
 * Usage:
 *   node decrypt-contacts.js
 * 
 * Configuration:
 * - Update PACKAGE_ID with your Move package containing seal_approve functions
 * - Update KEY_SERVER_OBJECT_IDS with your Seal key server object IDs
 */

import { SealClient, EncryptedObject, SessionKey } from '@mysten/seal';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromHEX } from '@mysten/sui/utils';

// Configuration - replace with your values
const NETWORK = 'testnet'; // or 'mainnet'
const PACKAGE_ID = '0x7653ba5cca57222d675bdc522a145e226199bba2a789feb79c204d6038f1a276'; // Published contacts package ID
const MODULE_NAME = 'contacts'; // Move module name
const SESSION_TTL_MIN = Number(process.env.SEAL_SESSION_TTL_MIN ?? 10);
const SESSION_PRIVATE_KEY =
  process.env.SEAL_SESSION_PRIVATE_KEY ??
  process.env.SUI_PRIVATE_KEY ??
  '';
// Seal key server object IDs (replace with your key servers)
const KEY_SERVER_OBJECT_IDS = (
  process.env.KEY_SERVER_IDS?.split(',').map((s) => s.trim()).filter(Boolean) ?? [
    '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
    '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8',
  ]
);

function ensureConfig(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function loadSignerFromSecret(secret) {
  ensureConfig(secret, 'Set SEAL_SESSION_PRIVATE_KEY (0x-prefixed Ed25519 secret key)');
  const cleaned = secret.trim();
  const secretBytes = fromHEX(cleaned);
  if (secretBytes.length === 0) {
    throw new Error('Invalid SEAL_SESSION_PRIVATE_KEY: empty bytes');
  }
  if (secretBytes.length === 33) {
    // Expect ed25519 flag 0x00 + 32-byte secret
    const scheme = secretBytes[0];
    ensureConfig(scheme === 0, 'Only Ed25519 secret keys are supported');
    return Ed25519Keypair.fromSecretKey(secretBytes.slice(1));
  }
  if (secretBytes.length === 32) {
    return Ed25519Keypair.fromSecretKey(secretBytes);
  }
  throw new Error('Invalid SEAL_SESSION_PRIVATE_KEY length; expected 32 or 33 bytes');
}

/**
 * Convert hex string to Uint8Array
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

/**
 * Decrypt a single contact's email
 * 
 * @param {SealClient} client - Initialized SealClient
 * @param {SuiClient} suiClient - Initialized SuiClient
 * @param {Object} encryptedContact - Encrypted contact object (we only decrypt encrypted_email)
 * @returns {Promise<Object>} Decrypted contact with email
 */
async function decryptContact(client, suiClient, sessionKey, encryptedContact, packageId = PACKAGE_ID) {
  const encryptedEmailHex = encryptedContact.encrypted_email;
  
  // Convert ciphertext to bytes and parse the Seal metadata
  const encryptedEmailBytes = hexToBytes(encryptedEmailHex);
  const encryptedObject = EncryptedObject.parse(encryptedEmailBytes);
  const policyIdBytes =
    typeof encryptedObject.id === 'string'
      ? hexToBytes(encryptedObject.id)
      : encryptedObject.id;

  // Build transaction for seal_approve function
  // This transaction is used by Seal key servers to verify access control
  // They will dry-run this transaction to evaluate the seal_approve function
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${packageId}::${MODULE_NAME}::seal_approve`,
    arguments: [
      tx.pure.vector('u8', policyIdBytes), // ID embedded in ciphertext
    ],
  });

  // Build transaction bytes (only transaction kind, not a full transaction)
  // Seal key servers will dry-run this to evaluate access control
  const txBytes = await tx.build({
    client: suiClient,
    onlyTransactionKind: true,
  });

  // Decrypt using Seal SDK
  // The SDK will:
  // 1. Send the transaction to Seal key servers
  // 2. Key servers evaluate seal_approve to verify access
  // 3. If approved, key servers provide decryption keys
  // 4. SDK combines keys to meet threshold and decrypts
  const decryptedBytes = await client.decrypt({
    data: encryptedEmailBytes,
    txBytes,
    sessionKey,
  });

  // Convert decrypted bytes to string
  const decryptedEmail = new TextDecoder().decode(decryptedBytes);

  return {
    phone_hash: encryptedContact.phone_hash,
    name: encryptedContact.name, // Name stayed plaintext
    other: encryptedContact.other ?? '',
    email: decryptedEmail, // Decrypted email
  };
}

/**
 * Decrypt all contacts from encrypted contact array
 * 
 * @param {Array} encryptedContacts - Array of encrypted contact objects
 * @returns {Promise<Array>} Array of decrypted contacts
 */
export async function decryptContacts(
  encryptedContacts,
  packageId = PACKAGE_ID
) {
  // Initialize Sui client
  const suiClient = new SuiClient({
    url: getFullnodeUrl(NETWORK),
  });

  ensureConfig(
    KEY_SERVER_OBJECT_IDS.length > 0,
    'KEY_SERVER_OBJECT_IDS is empty. Provide Seal key server object IDs via KEY_SERVER_IDS env var or edit decrypt-contacts.js.'
  );

  // Initialize Seal client with key servers (same pattern as encrypt-contacts.js)
  const sealClient = new SealClient({
    suiClient,
    serverConfigs: KEY_SERVER_OBJECT_IDS.map((id) => ({
      objectId: id,
      weight: 1,
    })),
    verifyKeyServers: false,
  });

  // Load signer + session key for Seal requests
  const signer = loadSignerFromSecret(SESSION_PRIVATE_KEY);
  const signerAddress = signer.getPublicKey().toSuiAddress();
  const sessionKey = await SessionKey.create({
    address: signerAddress,
    packageId,
    ttlMin: SESSION_TTL_MIN,
    signer,
    suiClient,
  });

  const decryptedContacts = [];

  // Decrypt each contact
  for (const encryptedContact of encryptedContacts) {
    try {
      const decrypted = await decryptContact(
        sealClient,
        suiClient,
        sessionKey,
        encryptedContact,
        packageId
      );
      decryptedContacts.push(decrypted);
    } catch (error) {
      console.error(`Failed to decrypt contact with phone_hash ${encryptedContact.phone_hash}:`, error);
      // Continue with other contacts even if one fails
    }
  }

  return decryptedContacts;
}

/**
 * Example usage: Decrypt contacts from encrypted data
 */
async function main() {
  // Example encrypted contact data (from encrypt-contacts.js output)
  const exampleEncryptedContacts = [
    {
      phone_hash: 'ec219fa556f200cd502d0e7ab872fd8f3b4372a67e62328014129d819c633c96',
      name: 'Alice',
      encrypted_email:
        '007653ba5cca57222d675bdc522a145e226199bba2a789feb79c204d6038f1a27620ec219fa556f200cd502d0e7ab872fd8f3b4372a67e62328014129d819c633c960273d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db7501f5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c80202008bb62ea517e4a3bb37e3036e497ff9b75fcaddebf9bcfe909dcfefbe2c96d21eb7e8c45095393e8245b0a7409bf24ed10214e81f8ebcce25026251e9579408ab858bec0cf4f12e9da0ff365b25236e1bc144589ed57587f27979df81f491d5340297408dcb6f09cce1460143519ddbb81e0a59077da0c4cbfb951ea5cc3b8e25d166db6096dea06c1e135f6d322ae6cabd3b7c6cc5d24391ac3b08b745cec8c853f615509a620b68d5c9cef600b7d85d4092d741175848025fe6999cf10ef91b720021afbee78bcbeff0b69e78f858e726059bbe1ad17adae0b201154479f753a1156b550100',
      other: 'Friend from school',
      enclave_signature: '26898d1492ca316d543636c3eb356a332546c99d5cc7b8a5419fdaf648fe9764...',
      timestamp_ms: 1763715638328,
    },
  ];

  console.log('Decrypting contacts...\n');

  try {
    const decryptedContacts = await decryptContacts(exampleEncryptedContacts);

    console.log('Decrypted contacts:\n');
    console.log(JSON.stringify(decryptedContacts, null, 2));
  } catch (error) {
    console.error('Error decrypting contacts:', error);
    process.exit(1);
  }
}

// Always run main when this script is executed with `node decrypt-contacts.js`
// Note: Node.js may URL-encode spaces in import.meta.url, so a strict equality
// check against process.argv[1] can fail. For this simple script, just run main().
main().catch(console.error);

