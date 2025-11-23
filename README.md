<div align="center">

![CallerID Logo](WEBSITE/public/setting.png)

# CallerID

**A decentralized encrypted phonebook you can Trust**

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Sui](https://img.shields.io/badge/blockchain-Sui-6fbcf0)](https://sui.io)

</div>

---

## 📱 About

**CallerID** is a decentralized, privacy-first caller identification system built on the Sui blockchain. It enables users to identify unknown callers without exposing their contact data, leveraging **Nautilus** Trusted Execution Environments (TEEs) for secure processing, **Walrus** for encrypted blob storage, and **Seal** for threshold encryption. All operations are cryptographically attested and verified on-chain.

### How CallerID Works

**Contact Management:**
- Users can **manually add contact details** or **upload VCF files** through the web interface
- All **hashing** (Blake2b256) and **Seal encryption** operations happen securely inside the **Nautilus server** (Trusted Execution Environment)
- Encrypted contact blobs are stored in **Walrus** decentralized storage
- After processing, users can **publish contacts on-chain** to the Sui blockchain

**Spam Detection & Voting:**
- Users can **vote spam or not spam** on phone numbers
- Community votes determine if a number is spam/fraud/scam
- **Staking Required**: Before voting spam, users must **stake SUI tokens**
- **Slashing Mechanism**: False spam reports result in **slashing of staked SUI**, ensuring honest reporting and preventing abuse

This creates a decentralized, trustless system where the community collectively maintains a spam database while protecting user privacy through encryption and secure enclaves.

**Retrieving Caller Information:**
- **Website Lookup**: Contact details can be retrieved through the website's lookup feature by entering a phone number
- **Automatic Device Detection**: On incoming calls, the Android app automatically retrieves caller information
- **Secure Decryption**: The system hashes the phone number and decrypts contact data inside **Nautilus** TEEs to verify and retrieve caller details
- **Android Beta App**: A lightweight Android beta app is available for testing real-time caller identification

### Key Features

- 🔒 **Privacy-First**: Contacts are encrypted locally and stored as encrypted blobs - no plaintext data ever leaves your device
- 🛡️ **Nautilus TEEs**: All sensitive operations execute inside Nautilus Trusted Execution Environments with cryptographic attestations, ensuring verifiable secure processing
- 💾 **Walrus Storage**: Encrypted contact blobs stored in Walrus decentralized storage - cost-effective, permanent, and censorship-resistant
- 🔐 **Seal Encryption**: Threshold encryption using Seal protocol for secure key management and distributed decryption without single points of failure
- ⛓️ **On-Chain Verification**: CID digests and Merkle roots stored on-chain for transparent, auditable verification
- 🚫 **Spam Detection**: Community-driven spam reporting with stake-based voting system
- 📱 **Android App**: Native Android application for real-time caller identification
- 🌐 **Web Interface**: Modern Next.js web application for contact management and lookup

---

## 📦 Deployed Contracts (Sui Testnet)

### Package Details

- **Package ID**: `0x122b45c984dac0464f8cce8a1bd1f2e40327f4407b22ed332231b41d6fb24872`
  - [View on Sui Explorer](https://suiexplorer.com/object/0x122b45c984dac0464f8cce8a1bd1f2e40327f4407b22ed332231b41d6fb24872?network=testnet)

- **Master Object ID**: `0x642c8d1b1d85232f51cf12920d67c2ed0ab540fac04ae86c32fb486863070a14`
  - [View on Sui Explorer](https://suiexplorer.com/object/0x642c8d1b1d85232f51cf12920d67c2ed0ab540fac04ae86c32fb486863070a14?network=testnet)

- **Deployment Transaction**: `C22Y8mgtY9sN2fMqmrsV7B3WjkU22ANGq1dn4MmLSEQV`
  - [View on Sui Explorer](https://suiexplorer.com/txblock/C22Y8mgtY9sN2fMqmrsV7B3WjkU22ANGq1dn4MmLSEQV?network=testnet)

### Example Transactions

- **Add Contact**: [View Transaction](https://testnet.suivision.xyz/txblock/BSAum1YMWRgJkkyKk8FpAUQp49a6ZqgEqWY7ef3rnmEX)
- **Stake SUI**: [View Transaction](https://testnet.suivision.xyz/txblock/5wZtQ6auGW6BheuyojcnHPrYPxPRnx5QpmZZs782Aryk)
- **Report Spam**: [View Transaction](https://testnet.suivision.xyz/txblock/EHkFcT5LZ7zdQKKo5GkaVr5bLx7ceMgNsHfP9g9bYL5k)

### Example Data

#### Walrus Storage
Encrypted contact blobs are stored in Walrus decentralized storage:

- **Blob ID**: `IVYKtSBjj2ywdL2utk_-nHBjANqqnvy-5WZtAZNy2_M`
- **Blob Object ID**: `0x8b725a26dbd22886f337aaf1df4ecacb740f2d6fe4bd850588fd4db4c4123ef4`
  - [View on Sui Explorer](https://suiexplorer.com/object/0x8b725a26dbd22886f337aaf1df4ecacb740f2d6fe4bd850588fd4db4c4123ef4?network=testnet)

#### Nautilus TEE Processing
Example response from Nautilus enclave after processing contacts:

```json
{
  "response": {
    "intent": 0,
    "timestamp_ms": 1763923538401,
    "data": {
      "contacts": [
        {
          "name": "happy meal",
          "phone_hash": [
            222, 253, 200, 99, 45, 64, 162, 243, 198, 192, 248, 87, 129, 12, 106, 248,
            136, 223, 38, 223, 62, 54, 25, 76, 241, 108, 180, 167, 201, 64, 212, 19
          ],
          "email": "",
          "other": ""
        }
      ]
    }
  },
  "signature": "436614af5a2e068d7af745438669082f268b3dd23ac33bafee0b4ff182d1503d"
}
```

#### Seal Encryption
Contact data (email and other fields) is encrypted using Seal threshold encryption. The encryption process:

1. **Initialization**: SealClient connects to multiple key servers (threshold: 2 of N)
2. **Encryption**: Email and other fields are encrypted using Seal SDK with phone hash as the policy ID
3. **Output**: Encrypted blobs are stored while names remain plaintext for lookup

Example encrypted contact structure:
- `name`: Plaintext (for quick lookup)
- `encrypted_email`: Hex-encoded encrypted email using Seal threshold encryption
- `encrypted_other`: Hex-encoded encrypted other field using Seal threshold encryption
- `phone_hash`: Blake2b256 hash of phone number (used as Seal policy ID)

The encryption uses distributed key servers, ensuring no single point of failure and enabling threshold decryption when needed.

---

## 📚 Detailed Documentation & Testing

For detailed setup instructions, testing guides, and component-specific documentation, please refer to:

### 🤖 Android App
- **Documentation**: [Android App README](Andriod-app/README.md)
- Test the lightweight Android beta app for real-time caller identification

### 🛡️ Nautilus Server
- **Documentation**: [Nautilus Server README](nautilus-server/README.md)
- Learn how to set up and configure Nautilus Trusted Execution Environments

### 🌐 Website
- **Documentation**: [Website README](WEBSITE/README.md)
- Next.js web application for contact management, lookup, and spam reporting
- See component documentation in `WEBSITE/docs/` for detailed usage

### ⛓️ Smart Contracts
- **Documentation**: [Contract README](Contract/README.md)
- **Parameters Guide**: [Contract Parameters](Contract/CONTRACT_PARAMETERS.md)
- Detailed Move contract documentation and testing instructions

---

