# Phone Number Lookup Flow - Step by Step

## Example: User enters "01" on Demo Page

### Step 1: User Input
- User types: `"01"` in the input field
- User clicks "Lookup" button or presses Enter

### Step 2: Phone Number Hashing 
```typescript
// Line 38-39 in demo/page.tsx
const phoneHashBytes = hashPhoneNumber(numberToLookup)  // "01"
const phoneHashHex = bytesToHex(phoneHashBytes)
```

**Inside `hashPhoneNumber()` function (lib/lookup-contact.ts:45-56):**

1. **Remove non-digits:**
   ```typescript
   const digitsOnly = phone.replace(/\D/g, '')
   // "01" → "01" (no change, already digits only)
   ```

2. **Hash with BLAKE2b256:**
   ```typescript
   const phoneHashBytes = blake2b(digitsOnly, undefined, 32)
   // Input: "01" (string)
   // Output: Uint8Array[32] = [69, 243, 211, 237, 151, 202, 73, 184, ...]
   //         (32 bytes = 256 bits)
   ```

3. **Convert to Hex String (for display):**
   ```typescript
   const phoneHashHex = bytesToHex(phoneHashBytes)
   // Output: "45f3d3ed97ca49b86f1ae514e55e69e0fba32124aa23eb4b70260f89f259271b"
   ```

**Result:**
- Input: `"01"`
- Digits Only: `"01"`
- Hash (bytes): `[69, 243, 211, 237, 151, 202, 73, 184, 111, 26, 229, 20, 229, 94, 105, 224, 251, 163, 33, 36, 170, 35, 235, 75, 112, 38, 15, 137, 242, 89, 39, 27]`
- Hash (hex): `"45f3d3ed97ca49b86f1ae514e55e69e0fba32124aa23eb4b70260f89f259271b"`

### Step 3: Convert to Array Format (for Sui Contract)

```typescript
// Line 110 in lookup-contact.ts
const phoneHashArray = Array.from(phoneHashBytes)
// Converts Uint8Array to number[]: [69, 243, 211, 237, ...]
```

### Step 4: Build Sui Transaction (lib/lookup-contact.ts:129-141)

```typescript
const tx = new Transaction()
tx.setSender('0x0000000000000000000000000000000000000000000000000000000000000000')

tx.moveCall({
  target: `${PACKAGE_ID}::contacts::get_contact`,
  arguments: [
    tx.object(MASTER_OBJECT_ID),           // master: &CallerIDMaster
    tx.pure.vector('u8', phoneHashArray),   // phone_hash: vector<u8>
  ],
})
```

**What's being sent:**
- SUI_PACKAGE_ID=0x122b45c984dac0464f8cce8a1bd1f2e40327f4407b22ed332231b41d6fb24872 
SUI_MASTER_OBJECT_ID=0x642c8d1b1d85232f51cf12920d67c2ed0ab540fac04ae86c32fb486863070a14 
- **Phone Hash**: `vector<u8>` = `[69, 243, 211, 237, 151, 202, 73, 184, ...]` (32 bytes)

### Step 5: Query Contract (lib/lookup-contact.ts:146-157)

```typescript
// Build transaction bytes (only transaction kind, not full transaction)
const txBytes = await tx.build({ 
  client: suiClient,
  onlyTransactionKind: true,
})

// Use devInspectTransactionBlock (no wallet signature needed - view function)
const result = await suiClient.devInspectTransactionBlock({
  sender: dummySender,
  transactionBlock: txBytes,
})
```

**What happens:**
- Calls `contacts::get_contact(phone_hash: vector<u8>)` on the Sui contract
- Contract looks up the phone hash in its storage
- Returns `Option<ContactRecord>` encoded in BCS format

### Step 6: Parse BCS Response (lib/lookup-contact.ts:163-291)

**BCS Format:**
```
Option<ContactRecord> = 
  - Tag (1 byte): 0 = None, 1 = Some
  - If Some: ContactRecord bytes
```

**ContactRecord Structure:**
```
ContactRecord {
  phone_hash: vector<u8>        // 32 bytes
  wallet_pubkey: vector<u8>     // 33 bytes
  name: String                   // UTF-8 string
  blob_id: String                // Walrus Blob ID
  sui_object_id: ID              // 32 bytes (Sui Object ID)
  spam_count: u64                // 8 bytes
  not_spam_count: u64            // 8 bytes
  spam_type: String              // UTF-8 string
}
```

**Parsing Process:**

1. **Check Option Tag:**
   ```typescript
   const optionTag = optionBytes[0]  // 0 = not found, 1 = found
   ```

2. **If found (tag = 1):**
   - Skip the tag byte
   - Read each field in order:
     - `phone_hash`: Read ULEB128 length + vector bytes
     - `wallet_pubkey`: Read ULEB128 length + vector bytes
     - `name`: Read ULEB128 length + UTF-8 string bytes
     - `blob_id`: Read ULEB128 length + UTF-8 string bytes
     - `sui_object_id`: Read 32 bytes, convert to hex
     - `spam_count`: Read 8 bytes (u64, little-endian)
     - `not_spam_count`: Read 8 bytes (u64, little-endian)
     - `spam_type`: Read ULEB128 length + UTF-8 string bytes

3. **Convert to JavaScript object:**
   ```typescript
   const contact: ContactRecord = {
     phone_hash: [69, 243, 211, ...],  // number[]
     wallet_pubkey: [0, 133, 42, ...],  // number[]
     name: "Test 1 Callerid",
     blob_id: "jqRBs-Ef4rBy3MIfcPNPd0o3CLIA5cW5RZ1ccI9dWgY",
     sui_object_id: "0x4b7a7f504c1173decd35d9c29eb13cd86a3c7ba00dcfcbe3bd26b8a1c60cd871",
     spam_count: 0n,
     not_spam_count: 0n,
     spam_type: ""
   }
   ```

### Step 7: Display Result (demo/page.tsx:160-316)

**If Contact Found:**
- Shows contact name
- Shows phone hash (hex)
- Shows spam counts
- Shows Walrus Blob ID (for encrypted data)
- Shows Sui Object ID (link to explorer)
- Shows wallet public key

**If Not Found:**
- Shows "Contact Not Found"
- Shows the phone hash that was queried
- Message: "No contact found with this phone hash on the Sui blockchain"

## Complete Flow Diagram

```
User Input: "01"
    ↓
hashPhoneNumber("01")
    ↓
Remove non-digits: "01"
    ↓
BLAKE2b256("01") → 32 bytes
    ↓
Convert to hex: "45f3d3ed..."
    ↓
Convert to number[]: [69, 243, 211, ...]
    ↓
Build Sui Transaction
    ↓
Call: contacts::get_contact(phone_hash)
    ↓
devInspectTransactionBlock (view function)
    ↓
Parse BCS Response: Option<ContactRecord>
    ↓
If Some: Parse ContactRecord fields
    ↓
Display Result in UI
```

## Key Points

1. **Hashing is deterministic**: Same input ("01") always produces same hash
2. **Privacy-preserving**: Only hash is stored on-chain, not the actual phone number
3. **No wallet needed**: Lookup uses `devInspectTransactionBlock` (read-only)
4. **BCS encoding**: Sui uses Binary Canonical Serialization for all data
5. **Same hash method**: Upload and lookup use identical BLAKE2b256 hashing

## Comparison: Upload vs Lookup

| Step | Upload (publish-contacts.ts) | Lookup (lookup-contact.ts) |
|------|------------------------------|----------------------------|
| Hash Input | Phone number from contact | Phone number from user input |
| Hash Method | BLAKE2b256 (32 bytes) | BLAKE2b256 (32 bytes) ✅ Same |
| Conversion | Uint8Array → number[] | Uint8Array → number[] ✅ Same |
| Contract Call | `contacts::add_contact` | `contacts::get_contact` |
| Transaction Type | Signed transaction (wallet) | View function (no signature) |
| Result | Transaction digest | ContactRecord or null |

