/**
 * Test script for stake::unstake
 * 
 * Usage: node unstake.js <amount_mist>
 * 
 * Note: 1 SUI = 1,000,000,000 MIST
 * Example: node unstake.js 1000000000 (unstakes 1 SUI)
 */

import { Transaction } from '@mysten/sui/transactions';
import { getSuiClient, loadSigner, PACKAGE_ID, MASTER_OBJECT_ID } from './common.js';

async function unstake(amountMist) {
  const suiClient = getSuiClient();
  const signer = loadSigner();
  const sender = signer.getPublicKey().toSuiAddress();

  if (!amountMist) {
    console.error('Usage: node unstake.js <amount_mist>');
    console.error('Note: 1 SUI = 1,000,000,000 MIST');
    console.error('Example: node unstake.js 1000000000 (unstakes 1 SUI)');
    process.exit(1);
  }

  const amount = BigInt(amountMist);

  console.log('Unstaking SUI...');
  console.log('Sender:', sender);
  console.log('Amount:', amountMist, 'MIST');
  console.log('Amount:', (Number(amount) / 1_000_000_000).toFixed(9), 'SUI');
  console.log('');

  // Build transaction
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::stake::unstake`,
    arguments: [
      tx.object(MASTER_OBJECT_ID), // master: &mut CallerIDMaster
      tx.pure.u64(amount), // amount: u64
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

const amountMist = process.argv[2];
unstake(amountMist).catch(console.error);


