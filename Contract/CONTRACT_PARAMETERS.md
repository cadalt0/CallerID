# CallerID Contract Parameters

This document explains what parameters can be passed to the CallerID contract functions.

## `contacts::add_contact` Function

The `add_contact` function accepts the following parameters:

```move
public entry fun add_contact(
    master: &mut CallerIDMaster,
    phone_hash: vector<u8>,        // Blake2b256 hash of phone number (32 bytes)
    wallet_pubkey: vector<u8>,    // Wallet public key
    name: string::String,         // Contact name
    blob_id: sui::object::ID,     // Walrus Blob Object ID (Sui Object ID)
    sui_object_id: sui::object::ID, // Related Sui object ID
)
```

### Parameter Details

#### 1. `phone_hash: vector<u8>`
- **Type**: Byte array (vector<u8>)
- **Size**: 32 bytes (Blake2b256 hash)
- **Description**: Hash of the phone number for privacy
- **Example**: `[236, 33, 159, 165, 86, 242, 0, 205, 80, 45, 14, 122, 184, 114, 253, 143, 59, 67, 114, 166, 126, 98, 50, 128, 20, 18, 157, 129, 156, 99, 60, 150]`
- **Hex**: `0xec219fa556f200cd502d0e7ab872fd8f3b4372a67e62328014129d819c633c96`

#### 2. `wallet_pubkey: vector<u8>`
- **Type**: Byte array (vector<u8>)
- **Description**: Wallet public key associated with the contact
- **Example**: `[1, 35, 69, 103, 137, 171, 205, 239, 1, 35, 69, 103, 137, 171, 205, 239, ...]`

#### 3. `name: string::String`
- **Type**: String
- **Description**: Contact name (can be updated by anyone later)
- **Example**: `"Alice"` or `"John Doe"`

#### 4. `blob_id: string::String` ⚠️ **IMPORTANT**
- **Type**: String
- **Description**: Walrus Blob ID string identifier
- **Format**: Base64-like string (e.g., "1hwYC_D_65WyvwEmBLM2yxBRKjrtmxnH-qH6dd4jBVs")
- **From Walrus**: Use the **Blob ID string**, NOT the Sui Object ID
  - ✅ **Correct**: `1hwYC_D_65WyvwEmBLM2yxBRKjrtmxnH-qH6dd4jBVs` (Blob ID string)
  - ❌ **Wrong**: `0xd6ef4b232185fd34517bd9f1d6a0f4da1a9d718cf348b42e4c63dd9c4e40d540` (Sui Object ID - use for sui_object_id instead)
- **How to get**: 
  1. Upload to Walrus using `upload-to-walrus-api.js`
  2. Get the **Blob ID** from the response (the `blobId` field or `newlyCreated.blobId`)
  3. Use that Blob ID string as `blob_id`

#### 5. `sui_object_id: sui::object::ID`
- **Type**: Sui Object ID
- **Description**: Related Sui object ID (can be used for additional references)
- **Example**: `0x0000000000000000000000000000000000000000000000000000000000000000` (if not used)

## Example: Using Walrus Blob IDs

### Step 1: Upload to Walrus

```bash
# Upload your contact data to Walrus
node upload-to-walrus-api.js contacts.csv --epochs 2

# Response will include:
# {
#   "newlyCreated": {
#     "blobObject": {
#       "id": "0x152d41a179034d112d5f4a166dcfc8d287760f2a68d4b55efe636aa3caa36e7c",  ← Use this!
#       "blobId": "IXe5aT9NebjcaYXGiKTaFxyZkl3t7ZZxo8bnTB8bU0c"  ← Don't use this
#     }
#   }
# }
```

### Step 2: Add Contact to Contract

```javascript
// Use the Blob ID string (not the Sui Object ID)
const blobId = '1hwYC_D_65WyvwEmBLM2yxBRKjrtmxnH-qH6dd4jBVs';
const suiObjectId = '0xd6ef4b232185fd34517bd9f1d6a0f4da1a9d718cf348b42e4c63dd9c4e40d540';

tx.moveCall({
  target: `${PACKAGE_ID}::contacts::add_contact`,
  arguments: [
    tx.object(MASTER_OBJECT_ID),
    tx.pure.vector('u8', phoneHashBytes),
    tx.pure.vector('u8', walletPubkeyBytes),
    tx.pure.string('Alice'),
    tx.pure.string(blobId),  // ← Use Blob ID string here
    tx.pure.id(suiObjectId),  // ← Use Sui Object ID here
  ],
});
```

## Other Functions

### `contacts::update_name`
```move
public entry fun update_name(
    master: &mut CallerIDMaster,
    phone_hash: vector<u8>,
    new_name: string::String,
)
```

### `contacts::update_spam_type`
```move
public entry fun update_spam_type(
    master: &mut CallerIDMaster,
    phone_hash: vector<u8>,
    new_type: string::String,
)
```

### `contacts::get_contact`
```move
public fun get_contact(
    master: &CallerIDMaster,
    phone_hash: vector<u8>
): std::option::Option<ContactRecord>
```

### `stake::stake`
```move
public entry fun stake(
    master: &mut CallerIDMaster,
    payment: coin::Coin<SUI>,
)
```

### `spam::report_spam`
```move
public entry fun report_spam(
    master: &mut CallerIDMaster,
    phone_hash: vector<u8>,
    spam_type: string::String,
)
```

## Data Types Reference

### `ContactRecord` Structure
```move
struct ContactRecord {
    phone_hash: vector<u8>,        // Blake2b256 hash (32 bytes)
    wallet_pubkey: vector<u8>,     // Wallet public key
    name: string::String,          // Contact name
    blob_id: string::String,       // Walrus Blob ID string
    sui_object_id: sui::object::ID, // Sui Object ID from Walrus
    spam_count: u64,              // Auto-incremented
    not_spam_count: u64,           // Auto-incremented
    spam_type: string::String,     // Spam type
}
```

## Important Notes

1. **Blob ID vs Sui Object ID**: 
   - The contract expects `string::String` type for `blob_id`
   - This must be the **Blob ID string** from Walrus (e.g., "1hwYC_D_65WyvwEmBLM2yxBRKjrtmxnH-qH6dd4jBVs")
   - The **Sui Object ID** (0x... hex string) should be used for `sui_object_id` field

2. **Phone Hash**: 
   - Must be exactly 32 bytes (Blake2b256)
   - Use `blake2b256(phone_number)` to generate

3. **Validation**:
   - `phone_hash` cannot be empty
   - `name` cannot be empty
   - Duplicate `phone_hash` will be skipped (not overwritten)

4. **Updatable Fields**:
   - `name` - Anyone can update via `update_name`
   - `spam_type` - Anyone can update via `update_spam_type`
   - `spam_count` and `not_spam_count` - Auto-incremented, read-only

