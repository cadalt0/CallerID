/**
 * Test script for spam::report_spam
 * 
 * Usage: 
 *   node report-spam.js <phone_hash_hex> <spam_type> [options]
 * 
 * Options:
 *   --name <string>           Optional contact name (default: "Reported Spam")
 *   --blob-id <string>        Optional Walrus Blob ID for storing email/extra data
 *   --wallet-pubkey <hex>     Optional wallet public key (hex string)
 *   --sui-object-id <id>     Optional Sui Object ID
 * 
 * Examples:
 *   node report-spam.js <phone_hash> "scam"
 *   node report-spam.js <phone_hash> "scam" --name "Suspicious Caller"
 *   node report-spam.js <phone_hash> "scam" --blob-id "1hwYC_D_65WyvwEmBLM2yxBRKjrtmxnH-qH6dd4jBVs"
 *   node report-spam.js <phone_hash> "scam" --name "John" --blob-id "..." --wallet-pubkey "0x..."
 * 
 * Note: 
 * - Requires user to have staked SUI first (use stake.js)
 * - spam_type is REQUIRED (cannot be empty)
 * - Auto-creates contact if it doesn't exist
 * - Use blob_id to store email/extra data (upload to Walrus first, then pass blob_id)
 */

import { Transaction } from '@mysten/sui/transactions';
import { getSuiClient, loadSigner, PACKAGE_ID, MASTER_OBJECT_ID, hexToBytes } from './common.js';

// Parse command line arguments
const args = process.argv.slice(2);

let phoneHashHex = null;
let spamType = null;
let name = null;
let blobId = null;
let walletPubkeyHex = null;
let suiObjectId = null;

// Parse arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--name' && i + 1 < args.length) {
    name = args[i + 1];
    i++;
  } else if (args[i] === '--blob-id' && i + 1 < args.length) {
    blobId = args[i + 1];
    i++;
  } else if (args[i] === '--wallet-pubkey' && i + 1 < args.length) {
    walletPubkeyHex = args[i + 1];
    i++;
  } else if (args[i] === '--sui-object-id' && i + 1 < args.length) {
    suiObjectId = args[i + 1];
    i++;
  } else if (!phoneHashHex) {
    phoneHashHex = args[i];
  } else if (!spamType) {
    spamType = args[i];
  }
}

async function reportSpam(phoneHashHex, spamType, name, blobId, walletPubkeyHex, suiObjectId) {
  const suiClient = getSuiClient();
  const signer = loadSigner();
  const sender = signer.getPublicKey().toSuiAddress();

  if (!phoneHashHex || !spamType) {
    console.error('Usage: node report-spam.js <phone_hash_hex> <spam_type> [options]');
    console.error('\nOptions:');
    console.error('  --name <string>           Optional contact name');
    console.error('  --blob-id <string>        Optional Walrus Blob ID for email/extra data');
    console.error('  --wallet-pubkey <hex>     Optional wallet public key');
    console.error('  --sui-object-id <id>     Optional Sui Object ID');
    console.error('\nExamples:');
    console.error('  node report-spam.js <phone_hash> "scam"');
    console.error('  node report-spam.js <phone_hash> "scam" --name "Suspicious" --blob-id "1hwYC_D_..."');
    console.error('\nNote:');
    console.error('  - Requires user to have staked SUI first (use stake.js)');
    console.error('  - spam_type is REQUIRED and cannot be empty');
    console.error('  - Contact will be auto-created if it doesn\'t exist');
    console.error('  - Use blob_id to store email/extra data (upload to Walrus first)');
    process.exit(1);
  }

  // Validate spam_type is not empty
  if (spamType.trim().length === 0) {
    console.error('❌ Error: spam_type cannot be empty');
    console.error('Please provide a valid spam type (e.g., "scam", "phishing", "fraud")');
    process.exit(1);
  }

  // Validate phone_hash format (should be hex string, 64 chars for 32 bytes)
  const cleanPhoneHash = phoneHashHex.startsWith('0x') ? phoneHashHex.slice(2) : phoneHashHex;
  if (cleanPhoneHash.length !== 64) {
    console.error('❌ Error: phone_hash should be 32 bytes (64 hex characters)');
    console.error(`Received: ${cleanPhoneHash.length} characters`);
    process.exit(1);
  }

  console.log('Reporting spam...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Sender:     ${sender}`);
  console.log(`Phone Hash: ${phoneHashHex}`);
  console.log(`Spam Type:  ${spamType}`);
  if (name) console.log(`Name:       ${name}`);
  if (blobId) console.log(`Blob ID:    ${blobId} (contains email/extra data)`);
  if (walletPubkeyHex) console.log(`Wallet:     ${walletPubkeyHex}`);
  if (suiObjectId) console.log(`Object ID:  ${suiObjectId}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nNote: Contact will be auto-created if it doesn\'t exist\n');

  const phoneHash = hexToBytes(phoneHashHex);

  // Build transaction - use report_spam_with_data if optional params provided
  const tx = new Transaction();
  
  if (name || blobId || walletPubkeyHex || suiObjectId) {
    // Use report_spam_with_data for optional parameters
    tx.moveCall({
      target: `${PACKAGE_ID}::spam::report_spam_with_data`,
      arguments: [
        tx.object(MASTER_OBJECT_ID), // master: &mut CallerIDMaster
        tx.pure.vector('u8', phoneHash), // phone_hash: vector<u8>
        tx.pure.string(spamType), // spam_type: String
        name ? tx.pure.option('string', name) : tx.pure.option('string', null), // name: Option<String>
        blobId ? tx.pure.option('string', blobId) : tx.pure.option('string', null), // blob_id: Option<String>
        walletPubkeyHex ? tx.pure.option('vector<u8>', Array.from(hexToBytes(walletPubkeyHex))) : tx.pure.option('vector<u8>', null), // wallet_pubkey: Option<vector<u8>>
        suiObjectId ? tx.pure.option('address', suiObjectId) : tx.pure.option('address', null), // sui_object_id: Option<ID>
      ],
    });
  } else {
    // Use simple report_spam (no optional params)
    tx.moveCall({
      target: `${PACKAGE_ID}::spam::report_spam`,
      arguments: [
        tx.object(MASTER_OBJECT_ID), // master: &mut CallerIDMaster
        tx.pure.vector('u8', phoneHash), // phone_hash: vector<u8>
        tx.pure.string(spamType), // spam_type: String
      ],
    });
  }

  try {
    // Execute transaction
    const result = await suiClient.signAndExecuteTransaction({
      signer,
      transaction: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    console.log('✅ Transaction executed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Transaction Digest: ${result.digest}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Check if contact was created
    if (result.objectChanges) {
      const createdObjects = result.objectChanges.filter(
        change => change.type === 'created' && change.objectType?.includes('ContactRecord')
      );
      if (createdObjects.length > 0) {
        console.log('\n📝 Note: Contact was auto-created for this spam report');
      }
    }
    
    console.log('\nEffects:');
    console.log(JSON.stringify(result.effects, null, 2));
    
  } catch (error) {
    console.error('❌ Error reporting spam:');
    console.error(error.message);
    
    // Provide helpful error messages
    if (error.message?.includes('ENoStake') || error.message?.includes('No stake')) {
      console.error('\n💡 Tip: You need to stake SUI first. Run: node stake.js');
    } else if (error.message?.includes('EEmptySpamType') || error.message?.includes('empty')) {
      console.error('\n💡 Tip: spam_type cannot be empty. Provide a valid spam type.');
    }
    
    process.exit(1);
  }
}

reportSpam(phoneHashHex, spamType, name, blobId, walletPubkeyHex, suiObjectId).catch(console.error);

