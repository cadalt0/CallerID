/**
 * Script to retrieve blob details from Walrus storage using HTTP API (Testnet Only)
 * 
 * This script uses the Walrus HTTP API to fetch blob information by Blob ID or Object ID.
 * 
 * Based on: https://docs.wal.app/usage/web-api.html
 * 
 * Usage:
 *   node get-walrus-blob.js --blob-id <blob_id>
 *   node get-walrus-blob.js --object-id <object_id>
 *   node get-walrus-blob.js --blob-id IXe5aT9NebjcaYXGiKTaFxyZkl3t7ZZxo8bnTB8bU0c
 *   node get-walrus-blob.js --object-id 0x152d41a179034d112d5f4a166dcfc8d287760f2a68d4b55efe636aa3caa36e7c
 * 
 * Options:
 *   --blob-id <id>          Retrieve blob by Blob ID
 *   --object-id <id>        Retrieve blob by Sui Object ID
 *   --aggregator <url>     Custom aggregator URL (default: testnet aggregator)
 *   --download              Download blob content to file
 *   --output <file>         Save blob content to file (requires --download)
 * 
 * Examples:
 *   node get-walrus-blob.js --blob-id IXe5aT9NebjcaYXGiKTaFxyZkl3t7ZZxo8bnTB8bU0c
 *   node get-walrus-blob.js --object-id 0x152d41a179034d112d5f4a166dcfc8d287760f2a68d4b55efe636aa3caa36e7c
 *   node get-walrus-blob.js --blob-id IXe5aT9NebjcaYXGiKTaFxyZkl3t7ZZxo8bnTB8bU0c --download --output blob-content.txt
 */

import { writeFileSync } from 'fs';

// Default testnet aggregator URL (sponsored by Walrus Foundation - free!)
const DEFAULT_AGGREGATOR = 'https://aggregator.walrus-testnet.walrus.space';

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Usage: 
  node get-walrus-blob.js --blob-id <blob_id>
  node get-walrus-blob.js --object-id <object_id>

Options:
  --blob-id <id>          Retrieve blob by Blob ID
  --object-id <id>       Retrieve blob by Sui Object ID
  --aggregator <url>     Custom aggregator URL (default: testnet aggregator)
  --download             Download blob content to file
  --output <file>        Save blob content to file (requires --download)

Examples:
  node get-walrus-blob.js --blob-id IXe5aT9NebjcaYXGiKTaFxyZkl3t7ZZxo8bnTB8bU0c
  node get-walrus-blob.js --object-id 0x152d41a179034d112d5f4a166dcfc8d287760f2a68d4b55efe636aa3caa36e7c
  node get-walrus-blob.js --blob-id IXe5aT9NebjcaYXGiKTaFxyZkl3t7ZZxo8bnTB8bU0c --download --output blob.txt

Note: 
  - TESTNET ONLY - Uses testnet aggregator
  - No authentication required for reading blobs
  - API docs: https://docs.wal.app/usage/web-api.html
  `);
  process.exit(0);
}

// Parse arguments
let blobId = null;
let objectId = null;
let aggregatorUrl = null;
let download = false;
let outputFile = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--blob-id' && i + 1 < args.length) {
    blobId = args[i + 1];
    i++;
  } else if (args[i] === '--object-id' && i + 1 < args.length) {
    objectId = args[i + 1];
    i++;
  } else if (args[i] === '--aggregator' && i + 1 < args.length) {
    aggregatorUrl = args[i + 1];
    i++;
  } else if (args[i] === '--download') {
    download = true;
  } else if (args[i] === '--output' && i + 1 < args.length) {
    outputFile = args[i + 1];
    i++;
  }
}

// Validate that exactly one identifier is provided
if (!blobId && !objectId) {
  console.error('❌ Error: Must provide either --blob-id or --object-id');
  console.error('Usage: node get-walrus-blob.js --blob-id <id>');
  console.error('       node get-walrus-blob.js --object-id <id>');
  process.exit(1);
}

if (blobId && objectId) {
  console.error('❌ Error: Provide either --blob-id or --object-id, not both');
  process.exit(1);
}

// Validate download options
if (outputFile && !download) {
  console.error('❌ Error: --output requires --download flag');
  process.exit(1);
}

// Set aggregator URL (default to testnet)
if (!aggregatorUrl) {
  aggregatorUrl = DEFAULT_AGGREGATOR;
}

async function getBlobDetails() {
  console.log('Retrieving blob details from Walrus (Testnet)...');
  console.log(`Aggregator: ${aggregatorUrl}`);
  if (blobId) {
    console.log(`Blob ID: ${blobId}`);
  } else {
    console.log(`Object ID: ${objectId}`);
  }
  console.log('');

  try {
    let url;
    let identifier;
    
    if (blobId) {
      // Get blob by Blob ID
      url = `${aggregatorUrl}/v1/blobs/${blobId}`;
      identifier = blobId;
    } else {
      // Get blob by Object ID
      url = `${aggregatorUrl}/v1/blobs/by-object-id/${objectId}`;
      identifier = objectId;
    }

    console.log(`GET ${url}\n`);

    // Fetch blob metadata
    const metadataResponse = await fetch(url);
    
    if (!metadataResponse.ok) {
      const errorText = await metadataResponse.text();
      throw new Error(`HTTP ${metadataResponse.status}: ${errorText}`);
    }

    const blobMetadata = await metadataResponse.json();
    
    console.log('✅ Blob found!\n');
    console.log('Blob Details:');
    console.log(JSON.stringify(blobMetadata, null, 2));
    
    // Extract key information
    const extractedInfo = {
      blobId: blobMetadata.blobId || blobMetadata.id,
      objectId: blobMetadata.blobObject?.id || blobMetadata.objectId,
      size: blobMetadata.size,
      encodingType: blobMetadata.encodingType,
      registeredEpoch: blobMetadata.registeredEpoch || blobMetadata.blobObject?.registeredEpoch,
      certifiedEpoch: blobMetadata.certifiedEpoch || blobMetadata.blobObject?.certifiedEpoch,
      storage: blobMetadata.storage || blobMetadata.blobObject?.storage,
    };

    console.log('\n📦 Extracted Information:');
    if (extractedInfo.blobId) {
      console.log(`   Blob ID: ${extractedInfo.blobId}`);
    }
    if (extractedInfo.objectId) {
      console.log(`   Object ID: ${extractedInfo.objectId}`);
    }
    if (extractedInfo.size !== undefined) {
      console.log(`   Size: ${extractedInfo.size} bytes`);
    }
    if (extractedInfo.encodingType) {
      console.log(`   Encoding: ${extractedInfo.encodingType}`);
    }
    if (extractedInfo.registeredEpoch !== undefined) {
      console.log(`   Registered Epoch: ${extractedInfo.registeredEpoch}`);
    }
    if (extractedInfo.certifiedEpoch !== undefined) {
      console.log(`   Certified Epoch: ${extractedInfo.certifiedEpoch}`);
    }
    if (extractedInfo.storage) {
      console.log(`   Storage Epochs: ${extractedInfo.storage.startEpoch} - ${extractedInfo.storage.endEpoch}`);
    }

    // Download blob content if requested
    if (download) {
      console.log('\n📥 Downloading blob content...');
      
      // Use the blob ID for downloading (prefer from metadata, fallback to provided)
      const downloadBlobId = extractedInfo.blobId || blobId;
      if (!downloadBlobId) {
        console.error('❌ Error: Cannot download - Blob ID not found in metadata');
        process.exit(1);
      }

      const downloadUrl = `${aggregatorUrl}/v1/blobs/${downloadBlobId}/content`;
      console.log(`GET ${downloadUrl}\n`);

      const contentResponse = await fetch(downloadUrl);
      
      if (!contentResponse.ok) {
        const errorText = await contentResponse.text();
        throw new Error(`HTTP ${contentResponse.status}: ${errorText}`);
      }

      // Get content as buffer
      const contentBuffer = await contentResponse.arrayBuffer();
      const content = Buffer.from(contentBuffer);
      
      console.log(`✅ Downloaded ${content.length} bytes`);

      // Save to file if output specified, otherwise display
      if (outputFile) {
        writeFileSync(outputFile, content);
        console.log(`💾 Saved to: ${outputFile}`);
      } else {
        // Try to display as text if it's text, otherwise show hex preview
        try {
          const textContent = content.toString('utf8');
          console.log('\n📄 Content (as text):');
          console.log(textContent);
        } catch (e) {
          // Not valid UTF-8, show hex preview
          const hexPreview = content.slice(0, 100).toString('hex');
          console.log('\n📄 Content (binary, hex preview):');
          console.log(hexPreview + (content.length > 100 ? '...' : ''));
          console.log(`\n⚠️  Content is binary. Use --output to save to file.`);
        }
      }
    }

    return blobMetadata;
    
  } catch (error) {
    console.error('❌ Error retrieving blob:');
    console.error(error.message);
    
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    
    process.exit(1);
  }
}

getBlobDetails().catch(console.error);


