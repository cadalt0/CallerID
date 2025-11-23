/**
 * Test script for contacts::add_contacts
 * 
 * Usage: node add-contacts.js
 */

import { Transaction } from '@mysten/sui/transactions';
import { getSuiClient, loadSigner, PACKAGE_ID, MASTER_OBJECT_ID, hexToBytes } from './common.js';

async function addContacts() {
  const suiClient = getSuiClient();
  const signer = loadSigner();
  const sender = signer.getPublicKey().toSuiAddress();

  console.log('Adding contacts...');
  console.log('Sender:', sender);
  console.log('Master Object ID:', MASTER_OBJECT_ID);
  console.log('');

  // Example contacts to add
  // phone_hash should be Blake2b256 hash of phone number (32 bytes)
  // blob_id should be the Blob ID string from Walrus (e.g., "1hwYC_D_65WyvwEmBLM2yxBRKjrtmxnH-qH6dd4jBVs")
  // Example from Walrus:
  //   Blob ID: "1hwYC_D_65WyvwEmBLM2yxBRKjrtmxnH-qH6dd4jBVs" (use this!)
  //   Sui Object ID: "0xd6ef4b232185fd34517bd9f1d6a0f4da1a9d718cf348b42e4c63dd9c4e40d540" (for sui_object_id)
  const contacts = [
    {
      phone_hash: hexToBytes('45f3d3ed97ca49b86f1ae514e55e69e0fba32124aa23eb4b70260f89f259271b'),
      wallet_pubkey: hexToBytes('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
      name: 'Alice',
      // Use Blob ID string from Walrus upload response (blobId field)
      blob_id: '1hwYC_D_65WyvwEmBLM2yxBRKjrtmxnH-qH6dd4jBVs', // Example from Walrus
      sui_object_id: '0xd6ef4b232185fd34517bd9f1d6a0f4da1a9d718cf348b42e4c63dd9c4e40d540', // Sui Object ID from Walrus
      spam_count: 0,
      not_spam_count: 0,
      spam_type: '',
    },
    {
      phone_hash: hexToBytes('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'),
      wallet_pubkey: hexToBytes('fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210'),
      name: 'Bob',
      // Use Blob ID string from Walrus upload response (blobId field)
      blob_id: '', // Replace with actual Walrus Blob ID string
      sui_object_id: '0x0000000000000000000000000000000000000000000000000000000000000000',
      spam_count: 0,
      not_spam_count: 0,
      spam_type: '',
    },
  ];

  // Build transaction
  // Use the new add_contact helper function that accepts individual fields
  // This is much simpler than passing structs
  const tx = new Transaction();

  // Add each contact using the helper function
  // We'll call add_contact for each contact in a loop
  for (const contact of contacts) {
    tx.moveCall({
      target: `${PACKAGE_ID}::contacts::add_contact`,
      arguments: [
        tx.object(MASTER_OBJECT_ID), // master: &mut CallerIDMaster
        tx.pure.vector('u8', Array.from(contact.phone_hash)), // phone_hash: vector<u8>
        tx.pure.vector('u8', Array.from(contact.wallet_pubkey)), // wallet_pubkey: vector<u8>
        tx.pure.string(contact.name), // name: String
        tx.pure.string(contact.blob_id), // blob_id: String (Walrus Blob ID)
        tx.pure.id(contact.sui_object_id), // sui_object_id: ID
      ],
    });
  }

  // Execute transaction
  const result = await suiClient.signAndExecuteTransaction({
    signer,
    transaction: tx,
    options: {
      showEffects: true,
      showObjectChanges: true,
    },
  });

  console.log('Transaction executed successfully!');
  console.log('Transaction Digest:', result.digest);
  console.log('\nEffects:');
  console.log(JSON.stringify(result.effects, null, 2));
}

addContacts().catch(console.error);

