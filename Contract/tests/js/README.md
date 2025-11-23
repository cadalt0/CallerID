# CallerID Contract Test Scripts

Test scripts for all CallerID contract functions.

## Setup

1. Install dependencies:
```bash
cd tests/js
npm install
```

2. Configure (optional):
   - Set `SUI_PRIVATE_KEY` or `PRIVATE_KEY` environment variable
   - Update `PACKAGE_ID` and `MASTER_OBJECT_ID` in `common.js` if needed

## Available Scripts

### Contacts Functions

#### Add Contacts
```bash
node add-contacts.js
```
Adds example contacts to the contract.

#### Get Contact
```bash
node get-contact.js <phone_hash_hex>
```
Example:
```bash
node get-contact.js ec219fa556f200cd502d0e7ab872fd8f3b4372a67e62328014129d819c633c96
```

#### Update Name
```bash
node update-name.js <phone_hash_hex> <new_name>
```
Example:
```bash
node update-name.js ec219fa556f200cd502d0e7ab872fd8f3b4372a67e62328014129d819c633c96 "Alice Updated"
```

#### Update Spam Type
```bash
node update-spam-type.js <phone_hash_hex> <spam_type>
```
Example:
```bash
node update-spam-type.js ec219fa556f200cd502d0e7ab872fd8f3b4372a67e62328014129d819c633c96 "scam"
```

### Stake Functions

#### Stake SUI
```bash
node stake.js <amount_mist>
```
Note: 1 SUI = 1,000,000,000 MIST

Example (stake 1 SUI):
```bash
node stake.js 1000000000
```

#### Unstake SUI
```bash
node unstake.js <amount_mist>
```
Example (unstake 1 SUI):
```bash
node unstake.js 1000000000
```

#### Get Stake Info
```bash
node get-stake.js [address]
```
If address not provided, uses signer address.

### Spam Functions

#### Report Spam
```bash
node report-spam.js <phone_hash_hex> <spam_type>
```
**Note:** Requires user to have staked SUI first.

Example:
```bash
node report-spam.js ec219fa556f200cd502d0e7ab872fd8f3b4372a67e62328014129d819c633c96 "scam"
```

#### Report NOT Spam
```bash
node report-not-spam.js <phone_hash_hex>
```
**Note:** Requires user to have staked SUI first.

Example:
```bash
node report-not-spam.js ec219fa556f200cd502d0e7ab872fd8f3b4372a67e62328014129d819c633c96
```

## Configuration

All scripts use the same private key pattern from `decrypt-contacts.js`:
- Default key: ``
- Override with `SUI_PRIVATE_KEY` or `PRIVATE_KEY` environment variable

## Package IDs

- **Package ID**: `0x549c509c5c029a822f87973eec7062dc5a2cf458db6813a85d491352ccadf366`
- **Master Object ID**: `0x6206b873722641968f93aeede57f6bf5291de2d893b8c1e4848115f131dbb9b9`

Update these in `common.js` if you redeploy the contract.

