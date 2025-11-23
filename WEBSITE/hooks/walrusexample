/**
 * Script to upload files or data to Walrus storage using HTTP API (Testnet Only)
 * 
 * This script uses the Walrus HTTP API to upload files/data and store them as blobs.
 * Private key is optional - only needed for --send-to or if publisher requires auth.
 * 
 * Cost Sponsorship: On testnet, storage costs are sponsored by the Walrus Foundation,
 * allowing free testing and development. No payment required!
 * 
 * Based on: https://docs.wal.app/usage/web-api.html
 * 
 * Usage:
 *   node upload-to-walrus-api.js <file_path> [options]
 *   node upload-to-walrus-api.js --data "your data here" [options]
 *   echo "data" | node upload-to-walrus-api.js --stdin [options]
 * 
 * Options:
 *   --epochs <number>        Number of epochs to store (default: 1)
 *   --data <string>         Upload data directly as string
 *   --stdin                 Read data from stdin
 *   --output <file>         Save output blob ID to file
 *   --publisher <url>       Custom publisher URL (default: testnet publisher)
 *   --permanent              Store as permanent blob (default: deletable)
 *   --deletable              Store as deletable blob (default)
 *   --send-to <address>     Send blob object to Sui address
 * 
 * Examples:
 *   node upload-to-walrus-api.js data.csv --epochs 2
 *   node upload-to-walrus-api.js --data "Hello World" --epochs 5
 *   echo "CSV data" | node upload-to-walrus-api.js --stdin
 *   node upload-to-walrus-api.js file.txt --permanent --send-to 0x...
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromHEX } from '@mysten/sui/utils';

// Private key is optional - only needed for --send-to or publisher authentication
// If not provided, basic uploads will work without it
const PRIVATE_KEY =
  process.env.SUI_PRIVATE_KEY ??
  process.env.PRIVATE_KEY ??
  null;

// Default testnet publisher URL (sponsored by Walrus Foundation - free!)
const DEFAULT_PUBLISHER = 'https://publisher.walrus-testnet.walrus.space';

/**
 * Load signer from private key (optional - only needed for --send-to)
 * Returns null if no private key is provided
 */
function loadSigner() {
  if (!PRIVATE_KEY) {
    return null;
  }
  
  const secret = PRIVATE_KEY.trim();
  const secretBytes = fromHEX(secret);
  
  if (secretBytes.length === 0) {
    throw new Error('Invalid PRIVATE_KEY: empty bytes');
  }
  
  if (secretBytes.length === 33) {
    // Expect ed25519 flag 0x00 + 32-byte secret
    const scheme = secretBytes[0];
    if (scheme !== 0) {
      throw new Error('Only Ed25519 secret keys are supported');
    }
    return Ed25519Keypair.fromSecretKey(secretBytes.slice(1));
  }
  
  if (secretBytes.length === 32) {
    return Ed25519Keypair.fromSecretKey(secretBytes);
  }
  
  throw new Error('Invalid PRIVATE_KEY length; expected 32 or 33 bytes');
}

/**
 * Read data from stdin
 */
async function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      resolve(data.trim());
    });
    process.stdin.on('error', reject);
  });
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Usage: 
  node upload-to-walrus-api.js <file_path> [options]
  node upload-to-walrus-api.js --data "your data" [options]
  node upload-to-walrus-api.js --stdin [options]

Options:
  --epochs <number>        Number of epochs to store (default: 1)
  --data <string>         Upload data directly as string
  --stdin                 Read data from stdin
  --output <file>         Save blob ID to file
  --publisher <url>       Custom publisher URL (default: testnet publisher)
  --permanent             Store as permanent blob (default: deletable)
  --deletable             Store as deletable blob (default)
  --send-to <address>     Send blob object to Sui address

Examples:
  node upload-to-walrus-api.js data.csv --epochs 2
  node upload-to-walrus-api.js --data "Hello World" --epochs 5
  echo "CSV data" | node upload-to-walrus-api.js --stdin
  node upload-to-walrus-api.js file.txt --permanent --send-to 0x...

Note: 
  - TESTNET ONLY - Storage costs are sponsored by Walrus Foundation (FREE!)
  - Private key is OPTIONAL - only needed for --send-to parameter
  - Set SUI_PRIVATE_KEY or PRIVATE_KEY env var if needed
  - Basic uploads work without private key (public testnet publisher)
  - Uses Walrus HTTP API (no CLI required)
  - API docs: https://docs.wal.app/usage/web-api.html
  `);
  process.exit(0);
}

// Parse arguments
let filePath = null;
let dataString = null;
let useStdin = false;
let epochs = 1;
let outputFile = null;
let publisherUrl = null;
let permanent = false;
let deletable = true; // Default is deletable in v1.33+
let sendToAddress = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--epochs' && i + 1 < args.length) {
    epochs = parseInt(args[i + 1]);
    i++;
  } else if (args[i] === '--data' && i + 1 < args.length) {
    dataString = args[i + 1];
    i++;
  } else if (args[i] === '--stdin') {
    useStdin = true;
  } else if (args[i] === '--output' && i + 1 < args.length) {
    outputFile = args[i + 1];
    i++;
  } else if (args[i] === '--publisher' && i + 1 < args.length) {
    publisherUrl = args[i + 1];
    i++;
  } else if (args[i] === '--permanent') {
    permanent = true;
    deletable = false;
  } else if (args[i] === '--deletable') {
    deletable = true;
    permanent = false;
  } else if (args[i] === '--send-to' && i + 1 < args.length) {
    sendToAddress = args[i + 1];
    i++;
  } else if (!filePath && !dataString && !useStdin) {
    filePath = args[i];
  }
}

// Validate epochs
if (isNaN(epochs) || epochs < 1) {
  console.error('❌ Error: --epochs must be a positive number');
  process.exit(1);
}

// Set publisher URL (default to testnet)
if (!publisherUrl) {
  publisherUrl = DEFAULT_PUBLISHER;
}

async function main() {
  // Determine input source
  let inputData = null;

  if (useStdin) {
    // Read from stdin
    inputData = await readStdin();
    if (!inputData) {
      console.error('❌ Error: No data received from stdin');
      process.exit(1);
    }
  } else if (dataString) {
    // Use provided data string
    inputData = dataString;
  } else if (filePath) {
    // Use file path
    const resolvedPath = resolve(filePath);
    if (!existsSync(resolvedPath)) {
      console.error(`❌ Error: File not found: ${resolvedPath}`);
      process.exit(1);
    }
    // Read file as binary for proper handling
    inputData = readFileSync(resolvedPath);
  } else {
    console.error('❌ Error: Must provide file path, --data, or --stdin');
    console.error('Usage: node upload-to-walrus-api.js <file_path> [options]');
    console.error('       node upload-to-walrus-api.js --data "data" [options]');
    console.error('       node upload-to-walrus-api.js --stdin [options]');
    process.exit(1);
  }

  await uploadToWalrusAPI(inputData, epochs, publisherUrl, permanent, deletable, sendToAddress, outputFile, filePath);
}

async function uploadToWalrusAPI(inputData, epochs, publisherUrl, permanent, deletable, sendToAddress, outputFile, inputFilePath) {
  // Load signer (optional - only needed for --send-to)
  const signer = loadSigner();
  const senderAddress = signer ? signer.getPublicKey().toSuiAddress() : null;
  
  // Check if private key is needed
  if (sendToAddress && !signer) {
    console.error('❌ Error: --send-to requires a private key (set SUI_PRIVATE_KEY or PRIVATE_KEY env var)');
    process.exit(1);
  }
  
  console.log('Uploading to Walrus via HTTP API (Testnet - FREE!)');
  console.log('💰 Cost: Sponsored by Walrus Foundation (no payment required)');
  if (inputFilePath) {
    console.log(`File: ${inputFilePath}`);
  } else {
    const preview = typeof inputData === 'string' 
      ? inputData.substring(0, 50) 
      : `<binary data, ${inputData.length} bytes>`;
    console.log(`Data: ${preview}${(typeof inputData === 'string' && inputData.length > 50) ? '...' : ''}`);
  }
  console.log(`Publisher: ${publisherUrl}`);
  console.log(`Network: Testnet (sponsored)`);
  if (senderAddress) {
    console.log(`Sender: ${senderAddress}`);
  } else {
    console.log(`Sender: (no private key - using public API)`);
  }
  console.log(`Epochs: ${epochs}`);
  console.log(`Persistence: ${permanent ? 'permanent' : deletable ? 'deletable' : 'default'}`);
  if (sendToAddress) {
    console.log(`Send to: ${sendToAddress}`);
  }
  console.log('');

  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (epochs > 1) {
      params.append('epochs', epochs.toString());
    }
    if (permanent) {
      params.append('permanent', 'true');
    } else if (deletable) {
      params.append('deletable', 'true');
    }
    if (sendToAddress) {
      params.append('send-object-to', sendToAddress);
    }

    const url = `${publisherUrl}/v1/blobs${params.toString() ? '?' + params.toString() : ''}`;
    
    console.log(`PUT ${url}`);
    console.log(`Content-Length: ${typeof inputData === 'string' ? Buffer.byteLength(inputData, 'utf8') : inputData.length} bytes\n`);

    // Convert string to Buffer if needed
    const body = typeof inputData === 'string' ? Buffer.from(inputData, 'utf8') : inputData;

    // Make PUT request to Walrus HTTP API
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': body.length.toString(),
      },
      body: body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    console.log('✅ Upload successful!\n');
    console.log('Response:');
    console.log(JSON.stringify(result, null, 2));
    
    // Extract blob information
    let blobId = null;
    let blobObjectId = null;
    
    if (result.newlyCreated) {
      blobId = result.newlyCreated.blobId;
      blobObjectId = result.newlyCreated.blobObject?.id;
      
      if (blobId) {
        console.log(`\n📦 Blob ID: ${blobId}`);
      }
      if (blobObjectId) {
        console.log(`📦 Blob Object ID: ${blobObjectId}`);
      }
      console.log(`\nYou can use this Blob ID in your ContactRecord's blob_id field.`);
      
      // Save blob ID to output file if specified
      if (outputFile && blobId) {
        writeFileSync(outputFile, blobId, 'utf8');
        console.log(`\n💾 Blob ID saved to: ${outputFile}`);
      }
    } else {
      console.log('\n⚠️  Blob already exists (not newly created).');
      if (result.blobId) {
        blobId = result.blobId;
        console.log(`📦 Existing Blob ID: ${blobId}`);
      }
    }
    
    return { blobId, blobObjectId, result };
    
  } catch (error) {
    console.error('❌ Error uploading to Walrus:');
    console.error(error.message);
    
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    
    process.exit(1);
  }
}

main().catch(console.error);

