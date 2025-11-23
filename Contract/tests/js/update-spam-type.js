/**
 * Test script for contacts::update_spam_type
 * 
 * Usage: node update-spam-type.js <phone_hash_hex> <spam_type>
 */

import { Transaction } from '@mysten/sui/transactions';
import { getSuiClient, loadSigner, PACKAGE_ID, MASTER_OBJECT_ID, hexToBytes } from './common.js';

async function updateSpamType(phoneHashHex, spamType) {
  const suiClient = getSuiClient();
  const signer = loadSigner();

  if (!phoneHashHex || !spamType) {
    console.error('Usage: node update-spam-type.js <phone_hash_hex> <spam_type>');
    console.error('Example: node update-spam-type.js ec219fa556f200cd502d0e7ab872fd8f3b4372a67e62328014129d819c633c96 "scam"');
    process.exit(1);
  }

  console.log('Updating spam type...');
  console.log('Phone Hash:', phoneHashHex);
  console.log('Spam Type:', spamType);
  console.log('');

  const phoneHash = hexToBytes(phoneHashHex);

  // Build transaction
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::contacts::update_spam_type`,
    arguments: [
      tx.object(MASTER_OBJECT_ID), // master: &mut CallerIDMaster
      tx.pure.vector('u8', phoneHash), // phone_hash: vector<u8>
      tx.pure.string(spamType), // new_type: String
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
const spamType = process.argv[3];
updateSpamType(phoneHashHex, spamType).catch(console.error);


