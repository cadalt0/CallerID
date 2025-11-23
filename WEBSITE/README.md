# CallerID Website



## 🚀 Quick Start

### Installation

```bash
npm i --force
```

### Development

```bash
npm run dev
```


## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file in the `WEBSITE` directory with the following variables:

```env
# Sui Network Configuration
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_SUI_PACKAGE_ID=0x122b45c984dac0464f8cce8a1bd1f2e40327f4407b22ed332231b41d6fb24872
NEXT_PUBLIC_SUI_MASTER_OBJECT_ID=0x642c8d1b1d85232f51cf12920d67c2ed0ab540fac04ae86c32fb486863070a14

# Walrus Storage
NEXT_PUBLIC_WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space

# Nautilus Configuration
NEXT_PUBLIC_NAUTILUS_MODE=off
NEXT_PUBLIC_NAUTILUS_API=
```

### Nautilus Mode Configuration

The `NEXT_PUBLIC_NAUTILUS_MODE` environment variable controls whether the website uses a real Nautilus server or a mock server for processing.

#### Option 1: Use Real Nautilus Server 

1. **Set Nautilus Mode to ON**:
   ```env
   NEXT_PUBLIC_NAUTILUS_MODE=on
   ```

2. **Run Nautilus Contact Example Server**:
   - Navigate to the nautilus-server folder:
     ```bash
     cd ../nautilus-server
     ```
   - Run the contacts-example server:
     ```bash
     cargo run --features contacts-example --bin nautilus-server
     # Follow instructions in nautilus-server/README.md
     # This will start the Nautilus TEE server
     ```
   - Get the server URL (typically `http://localhost:3000` or your deployed URL)

3. **Set Nautilus API URL**:
   ```env
   NEXT_PUBLIC_NAUTILUS_API=http://localhost:3000
   # Or use your deployed Nautilus server URL
   ```

4. ** OR - Deploy AWS Nitro Enclave**:
   - For attestation deploy Nautilus server on AWS Nitro Enclaves
   - Follow the guide in `nautilus-server/UsingNautilus.md`
   - Use the deployed enclave URL in `NEXT_PUBLIC_NAUTILUS_API`

#### Option 2: Use Mock Nautilus Server (Development/Testing)

1. **Set Nautilus Mode to OFF**:
   ```env
   NEXT_PUBLIC_NAUTILUS_MODE=off
   ```

2. **Mock Server**:
   - The website will use the mock server located in `../nautilus-mock-server`
   - No additional setup required
   - Perfect for local development and testing

## 📋 Features

- **Contact Upload**: Upload VCF files or manually add contacts
- **Phone Lookup**: Query caller information by phone number
- **Spam Reporting**: Report phone numbers as spam/not spam (requires staking)
- **Contact Management**: View and manage your encrypted contacts
- **Wallet Integration**: Connect Sui wallet for on-chain operations
- **Seal Encryption**: Automatic encryption of contact data using Seal threshold encryption
- **Walrus Storage**: Encrypted blob storage for contact data



## 🔐 Security & Privacy

- All contact data is encrypted using **Seal threshold encryption**
- Phone numbers are hashed using **Blake2b256** before processing
- Encrypted blobs stored in **Walrus** decentralized storage
- When Nautilus mode is ON, all processing happens inside **Trusted Execution Environments (TEEs)**
- No plaintext data is stored or transmitted

## 📝 Usage

### Uploading Contacts

1. Navigate to `/upload`
2. Either:
   - Upload a VCF file, or
   - Manually enter contact details
3. Contacts are processed:
   - If Nautilus mode is ON: Processed through Nautilus TEE server
   - If Nautilus mode is OFF: Processed through mock server
4. Data is encrypted and stored in Walrus
5. Publish contacts to Sui blockchain

### Looking Up Phone Numbers

1. Navigate to the lookup page
2. Enter a phone number
3. The system queries the Sui blockchain using phone hash
4. Retrieves and decrypts contact information from Walrus
5. Displays caller information

### Reporting Spam

1. Navigate to `/spam`
2. Connect your Sui wallet
3. Ensure you have staked SUI tokens
4. Enter phone number and spam type
5. Submit spam report (requires stake)

