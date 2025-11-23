/**
 * Script to upload files or data to Walrus storage
 * 
 * This script uses the Walrus CLI to upload files/data and store them as blobs.
 * Uses private key for authentication (from common.js pattern).
 * 
 * Usage:
 *   node upload-to-walrus.js <file_path> [options]
 *   node upload-to-walrus.js --data "your data here" [options]
 *   echo "data" | node upload-to-walrus.js --stdin [options]
 * 
 * Options:
 *   --epochs <number>    Number of epochs to store (default: 2)
 *   --context <network>  Network context: testnet or mainnet (default: testnet)
 *   --data <string>      Upload data directly as string
 *   --stdin              Read data from stdin
 *   --output <file>      Save output blob ID to file
 * 
 * Examples:
 *   node upload-to-walrus.js data.csv --epochs 2 --context testnet
 *   node upload-to-walrus.js --data "Hello World" --epochs 5
 *   echo "CSV data" | node upload-to-walrus.js --stdin
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, writeFileSync, unlinkSync } from 'fs';
import { resolve, join } from 'path';
import { tmpdir } from 'os';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromHEX } from '@mysten/sui/utils';

const execAsync = promisify(exec);

// Private key from common.js pattern
const PRIVATE_KEY =
  process.env.SUI_PRIVATE_KEY ??
  process.env.PRIVATE_KEY ??
  '';

/**
 * Load signer from private key (same pattern as decrypt-contacts.js)
 */
function loadSigner() {
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
  node upload-to-walrus.js <file_path> [options]
  node upload-to-walrus.js --data "your data" [options]
  node upload-to-walrus.js --stdin [options]

Options:
  --epochs <number>    Number of epochs to store the blob (default: 2)
  --context <network>  Network context: testnet or mainnet (default: testnet)
  --data <string>      Upload data directly as string
  --stdin              Read data from stdin
  --output <file>      Save blob ID to file

Examples:
  node upload-to-walrus.js data.csv --epochs 2 --context testnet
  node upload-to-walrus.js --data "Hello World" --epochs 5
  echo "CSV data" | node upload-to-walrus.js --stdin
  node upload-to-walrus.js file.txt --output blob-id.txt

Note: 
  - Uses private key from SUI_PRIVATE_KEY or PRIVATE_KEY env var
  - Default key: 
  - Make sure 'walrus' CLI is installed and in your PATH
  - Install: https://docs.sui.io/concepts/walrus
  `);
  process.exit(0);
}

// Parse arguments
let filePath = null;
let dataString = null;
let useStdin = false;
let epochs = 2;
let context = 'testnet';
let outputFile = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--epochs' && i + 1 < args.length) {
    epochs = parseInt(args[i + 1]);
    i++;
  } else if (args[i] === '--context' && i + 1 < args.length) {
    context = args[i + 1];
    i++;
  } else if (args[i] === '--data' && i + 1 < args.length) {
    dataString = args[i + 1];
    i++;
  } else if (args[i] === '--stdin') {
    useStdin = true;
  } else if (args[i] === '--output' && i + 1 < args.length) {
    outputFile = args[i + 1];
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

// Validate context
if (context !== 'testnet' && context !== 'mainnet') {
  console.error('❌ Error: --context must be either "testnet" or "mainnet"');
  process.exit(1);
}

async function main() {
  // Determine input source
  let inputFile = null;
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
    inputFile = resolvedPath;
  } else {
    console.error('❌ Error: Must provide file path, --data, or --stdin');
    console.error('Usage: node upload-to-walrus.js <file_path> [options]');
    console.error('       node upload-to-walrus.js --data "data" [options]');
    console.error('       node upload-to-walrus.js --stdin [options]');
    process.exit(1);
  }

  await uploadToWalrus(inputFile, inputData, epochs, context, outputFile);
}

async function uploadToWalrus(inputFile, inputData, epochs, context, outputFile) {
  // Load signer for authentication
  const signer = loadSigner();
  const senderAddress = signer.getPublicKey().toSuiAddress();
  
  console.log('Uploading to Walrus...');
  if (inputFile) {
    console.log(`File: ${inputFile}`);
  } else {
    console.log(`Data: ${inputData.substring(0, 50)}${inputData.length > 50 ? '...' : ''}`);
  }
  console.log(`Sender: ${senderAddress}`);
  console.log(`Epochs: ${epochs}`);
  console.log(`Context: ${context}`);
  console.log('');

  try {
    let command;
    let tempFile = null;
    
    if (inputFile) {
      // Use file directly
      command = `walrus store "${inputFile}" --epochs ${epochs} --context ${context}`;
    } else {
      // Create temporary file for data
      tempFile = join(tmpdir(), `walrus-upload-${Date.now()}.tmp`);
      writeFileSync(tempFile, inputData, 'utf8');
      command = `walrus store "${tempFile}" --epochs ${epochs} --context ${context}`;
    }
    
    // Set environment variable for private key if Walrus CLI needs it
    // Walrus CLI might use SUI_PRIVATE_KEY or similar
    const env = {
      ...process.env,
      SUI_PRIVATE_KEY: PRIVATE_KEY,
      PRIVATE_KEY: PRIVATE_KEY,
    };
    
    console.log(`Executing: ${command}\n`);
    
    // Execute walrus CLI with environment variables
    const { stdout, stderr } = await execAsync(command, { env });
    
    // Clean up temp file if created
    if (tempFile && existsSync(tempFile)) {
      try {
        unlinkSync(tempFile);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    if (stderr && !stderr.includes('warning')) {
      console.error('⚠️  Warnings:', stderr);
    }
    
    console.log('✅ Upload successful!\n');
    console.log('Output:');
    console.log(stdout);
    
    // Try to extract blob ID from output
    const blobIdMatch = stdout.match(/Blob ID:\s*([a-fA-F0-9x]+)/i) || 
                        stdout.match(/0x[a-fA-F0-9]{64}/) ||
                        stdout.match(/blob[_-]?id[:\s]+([a-fA-F0-9x]+)/i);
    
    if (blobIdMatch) {
      const blobId = blobIdMatch[1] || blobIdMatch[0];
      console.log(`\n📦 Blob ID: ${blobId}`);
      console.log(`\nYou can use this Blob ID in your ContactRecord's blob_id field.`);
      
      // Save blob ID to output file if specified
      if (outputFile) {
        writeFileSync(outputFile, blobId, 'utf8');
        console.log(`\n💾 Blob ID saved to: ${outputFile}`);
      }
      
      return blobId;
    } else {
      console.log('\n⚠️  Could not extract Blob ID from output.');
      console.log('Please check the output above for the Blob ID.');
    }
    
  } catch (error) {
    console.error('❌ Error uploading to Walrus:');
    
    if (error.code === 'ENOENT') {
      console.error('Walrus CLI not found. Please install it:');
      console.error('  https://docs.sui.io/concepts/walrus');
      console.error('\nMake sure "walrus" is in your PATH.');
    } else {
      console.error(error.message);
      if (error.stdout) {
        console.error('\nOutput:', error.stdout);
      }
      if (error.stderr) {
        console.error('\nError:', error.stderr);
      }
    }
    
    process.exit(1);
  }
}

main().catch(console.error);

