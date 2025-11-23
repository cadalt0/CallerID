/**
 * Test script for spam::report_not_spam
 * 
 * Usage: node report-not-spam.js <phone_hash_hex>
 * 
 * Note: 
 * - Requires user to have staked SUI first (use stake.js)
 * - Auto-creates contact if it doesn't exist (with minimal data)
 */

import { Transaction } from '@mysten/sui/transactions';
import { getSuiClient, loadSigner, PACKAGE_ID, MASTER_OBJECT_ID, hexToBytes } from './common.js';

async function reportNotSpam(phoneHashHex) {
  const suiClient = getSuiClient();
  const signer = loadSigner();
  const sender = signer.getPublicKey().toSuiAddress();

  if (!phoneHashHex) {
    console.error('Usage: node report-not-spam.js <phone_hash_hex>');
    console.error('Example: node report-not-spam.js ec219fa556f200cd502d0e7ab872fd8f3b4372a67e62328014129d819c633c96');
    console.error('\nNote: Requires user to have staked SUI first (use stake.js)');
    process.exit(1);
  }

  console.log('Reporting NOT spam...');
  console.log('Sender:', sender);
  console.log('Phone Hash:', phoneHashHex);
  console.log('');

  const phoneHash = hexToBytes(phoneHashHex);

  // Build transaction
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::spam::report_not_spam`,
    arguments: [
      tx.object(MASTER_OBJECT_ID), // master: &mut CallerIDMaster
      tx.pure.vector('u8', phoneHash), // phone_hash: vector<u8>
    ],
  });

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

const phoneHashHex = process.argv[2];
reportNotSpam(phoneHashHex).catch(console.error);

