"use client"

/**
 * Walrus Upload Service
 * 
 * Uploads encrypted contact data to Walrus storage using HTTP API (Testnet Only)
 * Based on walrusexample - follows exact same method
 * 
 * Cost Sponsorship: On testnet, storage costs are sponsored by the Walrus Foundation,
 * allowing free testing and development. No payment required!
 * 
 * Based on: https://docs.wal.app/usage/web-api.html
 */

// Default testnet publisher URL (sponsored by Walrus Foundation - free!)
const DEFAULT_PUBLISHER = process.env.NEXT_PUBLIC_WALRUS_PUBLISHER_URL || 
  'https://publisher.walrus-testnet.walrus.space';

interface EncryptedContact {
  phone_hash: string; // Hex string
  name: string; // Plaintext
  encrypted_email: string; // Hex string of encrypted email
  encrypted_other: string; // Hex string of encrypted other field
  enclave_signature: string;
  timestamp_ms: number;
  backup_keys?: {
    email_key_hex: string;
    other_key_hex: string;
  };
}

interface WalrusUploadResult {
  blobId: string;
  blobObjectId?: string;
  result: any;
}

interface WalrusUploadOptions {
  epochs?: number; // Number of epochs to store (default: 1)
  permanent?: boolean; // Store as permanent blob (default: false, deletable)
  deletable?: boolean; // Store as deletable blob (default: true)
  publisherUrl?: string; // Custom publisher URL
}

/**
 * Upload encrypted contacts to Walrus storage
 * 
 * @param encryptedContacts - Array of Seal-encrypted contacts
 * @param options - Upload options (epochs, permanent, deletable, publisherUrl)
 * @returns Promise with blob ID and upload result
 */
export async function uploadEncryptedContactsToWalrus(
  encryptedContacts: EncryptedContact[],
  options: WalrusUploadOptions = {}
): Promise<WalrusUploadResult> {
  const {
    epochs = 1,
    permanent = false,
    deletable = true,
    publisherUrl = DEFAULT_PUBLISHER,
  } = options;

  console.log("=".repeat(80));
  console.log("WALRUS UPLOAD - STARTING");
  console.log("=".repeat(80));
  console.log(`Publisher: ${publisherUrl}`);
  console.log(`Network: Testnet (sponsored by Walrus Foundation - FREE!)`);
  console.log(`Epochs: ${epochs}`);
  console.log(`Persistence: ${permanent ? 'permanent' : deletable ? 'deletable' : 'default'}`);
  console.log(`Contacts to upload: ${encryptedContacts.length}`);
  console.log("\n");

  try {
    // Convert encrypted contacts to JSON string
    const jsonData = JSON.stringify(encryptedContacts, null, 2);
    // Calculate size (browser-compatible)
    const dataSize = new TextEncoder().encode(jsonData).length;
    
    console.log(`📦 Preparing data for upload:`);
    console.log(`  Data size: ${dataSize} bytes (${(dataSize / 1024).toFixed(2)} KB)`);
    console.log(`  Format: JSON`);
    console.log(`  Contacts: ${encryptedContacts.length}`);
    console.log("\n");

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

    const url = `${publisherUrl}/v1/blobs${params.toString() ? '?' + params.toString() : ''}`;
    
    console.log(`🚀 Uploading to Walrus...`);
    console.log(`  Method: PUT`);
    console.log(`  URL: ${url}`);
    console.log(`  Content-Type: application/octet-stream`);
    console.log(`  Content-Length: ${dataSize} bytes`);
    console.log("\n");

    // Convert string to Uint8Array (browser-compatible)
    const body = new TextEncoder().encode(jsonData);

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
      console.error(`❌ Upload failed: HTTP ${response.status}`);
      console.error(`Error: ${errorText}`);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    console.log("=".repeat(80));
    console.log("WALRUS UPLOAD - SUCCESS");
    console.log("=".repeat(80));
    console.log("\n✅ Upload successful!\n");
    console.log("Response:");
    console.log(JSON.stringify(result, null, 2));
    console.log("\n");
    
    // Extract blob information
    // Blob ID is nested in newlyCreated.blobObject.blobId
    let blobId: string | null = null;
    let blobObjectId: string | null = null;
    
    if (result.newlyCreated) {
      // Try nested structure first: newlyCreated.blobObject.blobId (actual API response)
      const blobObject = result.newlyCreated.blobObject;
      if (blobObject) {
        blobId = blobObject.blobId || null;
        blobObjectId = blobObject.id || null;
      }
      
      // Fallback: try direct access (as per walrusexample)
      if (!blobId && result.newlyCreated.blobId) {
        blobId = result.newlyCreated.blobId;
      }
      
      console.log(`📦 Extracted Blob Information:`);
      console.log(`  Checking: result.newlyCreated.blobObject?.blobId = ${blobObject?.blobId || 'undefined'}`);
      console.log(`  Checking: result.newlyCreated.blobId = ${result.newlyCreated.blobId || 'undefined'}`);
      if (blobId) {
        console.log(`  ✅ Blob ID: ${blobId}`);
      } else {
        console.warn(`  ⚠️  Blob ID: NOT FOUND`);
      }
      if (blobObjectId) {
        console.log(`  ✅ Blob Object ID: ${blobObjectId}`);
      } else {
        console.warn(`  ⚠️  Blob Object ID: NOT FOUND`);
      }
      
      if (blobId) {
        console.log(`\n💡 You can use this Blob ID in your ContactRecord's blob_id field.`);
      }
    } else {
      console.log('\n⚠️  Blob already exists (not newly created).');
      // Try alternative locations for existing blobs
      if (result.blobId) {
        blobId = result.blobId;
        console.log(`📦 Existing Blob ID: ${blobId}`);
      } else if (result.blobObject?.blobId) {
        blobId = result.blobObject.blobId;
        blobObjectId = result.blobObject.id;
        console.log(`📦 Existing Blob ID: ${blobId}`);
      }
    }
    
    console.log("\n" + "=".repeat(80) + "\n");

    if (!blobId) {
      console.error('❌ Could not extract blob ID from response');
      console.error('Response structure:', JSON.stringify(result, null, 2));
      console.error('Attempted extraction paths:');
      console.error('  - result.newlyCreated?.blobObject?.blobId:', result.newlyCreated?.blobObject?.blobId);
      console.error('  - result.newlyCreated?.blobId:', result.newlyCreated?.blobId);
      console.error('  - result.blobId:', result.blobId);
      console.error('  - result.blobObject?.blobId:', result.blobObject?.blobId);
      throw new Error('No blob ID returned from Walrus upload');
    }

    return { 
      blobId, 
      blobObjectId: blobObjectId || undefined, 
      result 
    };
    
  } catch (error) {
    console.error("=".repeat(80));
    console.error("WALRUS UPLOAD - ERROR");
    console.error("=".repeat(80));
    console.error('❌ Error uploading to Walrus:');
    if (error instanceof Error) {
      console.error(`  Message: ${error.message}`);
      if (error.stack) {
        console.error(`  Stack: ${error.stack}`);
      }
    } else {
      console.error(`  Error: ${error}`);
    }
    console.error("\n");
    throw error;
  }
}

