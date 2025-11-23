/**
 * Test script for contacts::get_contact
 * 
 * Usage: node get-contact.js <phone_hash_hex>
 */

import { Transaction } from '@mysten/sui/transactions';
import { getSuiClient, PACKAGE_ID, MASTER_OBJECT_ID, hexToBytes, getSignerAddress } from './common.js';

async function getContact(phoneHashHex) {
  const suiClient = getSuiClient();

  if (!phoneHashHex) {
    console.error('Usage: node get-contact.js <phone_hash_hex>');
    console.error('Example: node get-contact.js ec219fa556f200cd502d0e7ab872fd8f3b4372a67e62328014129d819c633c96');
    process.exit(1);
  }

  console.log('Getting contact...');
  console.log('Phone Hash:', phoneHashHex);
  console.log('');

  const phoneHash = hexToBytes(phoneHashHex);

  // Build transaction using Transaction builder
  const tx = new Transaction();
  const sender = getSignerAddress();
  
  // Set sender on transaction
  tx.setSender(sender);
  
  tx.moveCall({
    target: `${PACKAGE_ID}::contacts::get_contact`,
    arguments: [
      tx.object(MASTER_OBJECT_ID), // master: &CallerIDMaster
      tx.pure.vector('u8', Array.from(phoneHash)), // phone_hash: vector<u8>
    ],
  });

  // Use devInspectTransactionBlock to call view function
  // Build only the transaction kind (not full transaction)
  const txBytes = await tx.build({ 
    client: suiClient,
    onlyTransactionKind: true,
  });
  
  const result = await suiClient.devInspectTransactionBlock({
    sender: sender,
    transactionBlock: txBytes,
  });

  // Parse the result
  if (result.results && result.results.length > 0) {
    const returnValue = result.results[0].returnValues;
    
    if (returnValue && returnValue.length > 0) {
      // The function returns Option<ContactRecord>
      // returnValue format: [bcs_bytes, bcs_type]
      const [bcsBytes, bcsType] = returnValue[0];
      
      // Decode the BCS data manually
      // Option<ContactRecord> format: u8 tag (0=None, 1=Some) + ContactRecord bytes if Some
      const optionBytes = Buffer.from(bcsBytes, 'base64');
      const optionTag = optionBytes[0];
      
      if (optionTag === 0) {
        console.log('❌ Contact not found');
        console.log('No contact exists with this phone hash.');
      } else if (optionTag === 1) {
        console.log('✅ Contact found!\n');
        
        // Extract the ContactRecord bytes (skip the option tag)
        const contactBytes = optionBytes.slice(1);
        
        // Manually parse ContactRecord struct
        // Format: phone_hash (vector<u8>), wallet_pubkey (vector<u8>), name (string), 
        //         blob_id (ID/string), sui_object_id (ID/string), spam_count (u64),
        //         not_spam_count (u64), spam_type (string)
        
        let offset = 0;
        
        // Helper to read ULEB128 length-prefixed vector
        const readVector = () => {
          // Read ULEB128 length
          let length = 0;
          let shift = 0;
          while (true) {
            const byte = contactBytes[offset++];
            length |= (byte & 0x7f) << shift;
            if ((byte & 0x80) === 0) break;
            shift += 7;
          }
          const vec = contactBytes.slice(offset, offset + length);
          offset += length;
          return Array.from(vec);
        };
        
        // Helper to read string (same as vector<u8>)
        const readString = () => {
          const bytes = readVector();
          return Buffer.from(bytes).toString('utf-8');
        };
        
        // Helper to read u64 (8 bytes, little-endian)
        const readU64 = () => {
          let value = 0n;
          for (let i = 0; i < 8; i++) {
            value |= BigInt(contactBytes[offset++]) << (BigInt(i) * 8n);
          }
          return value;
        };
        
        // Helper to read ID (32 bytes as hex string)
        const readID = () => {
          const idBytes = contactBytes.slice(offset, offset + 32);
          offset += 32;
          return '0x' + Buffer.from(idBytes).toString('hex');
        };
        
        // Parse ContactRecord fields in order
        const phone_hash = readVector();
        const wallet_pubkey = readVector();
        const name = readString();
        const blob_id = readID();
        const sui_object_id = readID();
        const spam_count = readU64();
        const not_spam_count = readU64();
        const spam_type = readString();
        
        // Convert byte arrays to hex
        const phoneHashHex = '0x' + Buffer.from(phone_hash).toString('hex');
        const walletPubkeyHex = '0x' + Buffer.from(wallet_pubkey).toString('hex');
        
        console.log('Contact Details:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Phone Hash:     ${phoneHashHex}`);
        console.log(`Wallet Pubkey:  ${walletPubkeyHex}`);
        console.log(`Name:           ${name}`);
        console.log(`Blob ID:        ${blob_id}`);
        console.log(`Sui Object ID:  ${sui_object_id}`);
        console.log(`Spam Count:     ${spam_count}`);
        console.log(`Not Spam Count: ${not_spam_count}`);
        console.log(`Spam Type:      ${spam_type || '(empty)'}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      } else {
        console.log('⚠️  Unexpected option tag:', optionTag);
        console.log('Raw result:', JSON.stringify(result, null, 2));
      }
    } else {
      console.log('⚠️  No return value found');
      console.log(JSON.stringify(result, null, 2));
    }
  } else {
    console.log('⚠️  Unexpected result format:');
    console.log(JSON.stringify(result, null, 2));
  }
}

const phoneHashHex = process.argv[2];
getContact(phoneHashHex).catch(console.error);

