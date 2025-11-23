/**
 * Test script for stake::get_stake (view function)
 * 
 * Usage: node get-stake.js [address]
 * If address not provided, uses signer address
 */

import { Transaction } from '@mysten/sui/transactions';
import { getSuiClient, PACKAGE_ID, MASTER_OBJECT_ID, getSignerAddress } from './common.js';

async function getStake(address) {
  const suiClient = getSuiClient();
  const userAddress = address || getSignerAddress();
  const sender = getSignerAddress();

  console.log('Getting stake info...');
  console.log('User Address:', userAddress);
  console.log('');

  // Build transaction using Transaction builder
  const tx = new Transaction();
  tx.setSender(sender);
  
  tx.moveCall({
    target: `${PACKAGE_ID}::stake::get_stake`,
    arguments: [
      tx.object(MASTER_OBJECT_ID), // master: &CallerIDMaster
      tx.pure.address(userAddress), // user: address
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
      // The function returns Option<StakeInfo>
      // returnValue format: [bcs_bytes, bcs_type]
      const [bcsBytes, bcsType] = returnValue[0];
      
      // Decode the BCS data manually
      // Option<StakeInfo> format: u8 tag (0=None, 1=Some) + StakeInfo bytes if Some
      const optionBytes = Buffer.from(bcsBytes, 'base64');
      const optionTag = optionBytes[0];
      
      if (optionTag === 0) {
        console.log('❌ No stake found');
        console.log('This address has not staked any SUI.');
      } else if (optionTag === 1) {
        console.log('✅ Stake found!\n');
        
        // Extract the StakeInfo bytes (skip the option tag)
        const stakeBytes = optionBytes.slice(1);
        
        // Manually parse StakeInfo struct
        // Format: amount (u64), timestamp (u64), locked (bool)
        
        let offset = 0;
        
        // Helper to read u64 (8 bytes, little-endian)
        const readU64 = () => {
          let value = 0n;
          for (let i = 0; i < 8; i++) {
            value |= BigInt(stakeBytes[offset++]) << (BigInt(i) * 8n);
          }
          return value;
        };
        
        // Helper to read bool (1 byte)
        const readBool = () => {
          return stakeBytes[offset++] !== 0;
        };
        
        // Parse StakeInfo fields in order
        const amount = readU64();
        const timestamp = readU64();
        const locked = readBool();
        
        // Convert MIST to SUI (1 SUI = 1,000,000,000 MIST)
        const amountInSui = Number(amount) / 1_000_000_000;
        const date = new Date(Number(timestamp));
        
        console.log('Stake Details:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Amount:         ${amountInSui} SUI (${amount} MIST)`);
        console.log(`Timestamp:      ${timestamp} (${date.toISOString()})`);
        console.log(`Locked:         ${locked ? 'Yes' : 'No'}`);
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

const address = process.argv[2];
getStake(address).catch(console.error);

