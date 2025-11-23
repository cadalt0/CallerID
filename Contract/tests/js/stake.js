/**
 * Test script for stake::stake
 * 
 * Usage: node stake.js <amount_mist>
 * 
 * Note: 1 SUI = 1,000,000,000 MIST
 * Example: node stake.js 1000000000 (stakes 1 SUI)
 */

import { Transaction } from '@mysten/sui/transactions';
import { getSuiClient, loadSigner, PACKAGE_ID, MASTER_OBJECT_ID } from './common.js';

async function stake(amountMist) {
  const suiClient = getSuiClient();
  const signer = loadSigner();
  const sender = signer.getPublicKey().toSuiAddress();

  if (!amountMist) {
    console.error('Usage: node stake.js <amount_mist>');
    console.error('Note: 1 SUI = 1,000,000,000 MIST');
    console.error('Example: node stake.js 1000000000 (stakes 1 SUI)');
    process.exit(1);
  }

  const amount = BigInt(amountMist);

  console.log('Staking SUI...');
  console.log('Sender:', sender);
  console.log('Amount:', amountMist, 'MIST');
  console.log('Amount:', (Number(amount) / 1_000_000_000).toFixed(9), 'SUI');
  console.log('');

  // Build transaction
  const tx = new Transaction();

  // Split coin for staking
  const [coin] = tx.splitCoins(tx.gas, [amount]);

  tx.moveCall({
    target: `${PACKAGE_ID}::stake::stake`,
    arguments: [
      tx.object(MASTER_OBJECT_ID), // master: &mut CallerIDMaster
      coin, // coin: Coin<SUI>
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
stake(amountMist).catch(console.error);

