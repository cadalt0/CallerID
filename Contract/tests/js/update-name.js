/**
 * Test script for contacts::update_name
 * 
 * Usage: node update-name.js <phone_hash_hex> <new_name>
 */

import { Transaction } from '@mysten/sui/transactions';
import { getSuiClient, loadSigner, PACKAGE_ID, MASTER_OBJECT_ID, hexToBytes } from './common.js';

async function updateName(phoneHashHex, newName) {
  const suiClient = getSuiClient();
  const signer = loadSigner();

  if (!phoneHashHex || !newName) {
    console.error('Usage: node update-name.js <phone_hash_hex> <new_name>');
    console.error('Example: node update-name.js ec219fa556f200cd502d0e7ab872fd8f3b4372a67e62328014129d819c633c96 "Alice Updated"');
    process.exit(1);
  }

  console.log('Updating contact name...');
  console.log('Phone Hash:', phoneHashHex);
  console.log('New Name:', newName);
  console.log('');

  const phoneHash = hexToBytes(phoneHashHex);

  // Build transaction
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::contacts::update_name`,
    arguments: [
      tx.object(MASTER_OBJECT_ID), // master: &mut CallerIDMaster
      tx.pure.vector('u8', phoneHash), // phone_hash: vector<u8>
      tx.pure.string(newName), // new_name: String
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
const newName = process.argv[3];
updateName(phoneHashHex, newName).catch(console.error);


