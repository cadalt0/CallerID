# CallerID Android App

**Beta Version - Lightweight Testing App**

This is a beta, very lightweight Android application built to test CallerID functionality on Android devices. The app provides real-time caller identification by querying the Sui blockchain through **Nautilus** Trusted Execution Environments (TEEs) for secure contact information retrieval when incoming calls are detected. Contact data is fetched from **Walrus** decentralized storage, and all queries and Seal decryption operations happen securely inside Nautilus enclaves.

## 📱 Features

- Real-time incoming call detection
- Automatic caller information lookup via Sui blockchain
- Incoming call popup with caller details
- Spam status display
- Phone number hash-based querying
- Minimal permissions required

## 🧪 Testing the App

### Option 1: Download Pre-built APK (Quick Start)

1. **Download the APK**:
   - Direct download: [app-debug.apk](https://github.com/cadalt0/CallerID/blob/main/Andriod-app/app-debug.apk)
   - Or visit: https://github.com/cadalt0/CallerID/blob/main/Andriod-app/app-debug.apk

2. **Install on Android Device**:
   - Enable "Install from Unknown Sources" in Android settings
   - Transfer APK to device and install

### Option 2: Build from Source (Recommended)

**Recommended**: Building from source ensures you have the latest code and can customize settings.

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/cadalt0/CallerID.git
   cd CallerID/Andriod-app
   ```

2. **Open in Android Studio**:
   - Launch Android Studio
   - File → Open → Select the `Andriod-app` folder
   - Wait for Gradle sync to complete

3. **Build the App**:
   - Connect your Android device (USB debugging enabled) or start an emulator
   - Click the green ▶ Run button (or press Shift+F10)
   - The app will build and install on your device

## 🚀 Testing Workflow

### Step 1: Set Up the App

1. **Launch the CallerID app** on your Android device
2. **Grant Required Permissions**:
   - Tap "Request Permissions" in the app
   - Grant **Phone** permission (for call detection)
   - Grant **Overlay** permission (via Android Settings → Apps → CallerID → Display over other apps)
3. **Enable CallerID Mode**:
   - Toggle on "CallerID Mode" in the app settings
   - The app is now ready to detect incoming calls

### Step 2: Add Test Contact

1. **Open the Website**:
   - Navigate to: https://callerid-psi.vercel.app/upload
   

2. **Add a Test Number**:
   - Enter any phone number you want to test
   - Add contact details (name, email, etc.)
   - Upload or submit the contact
   - The contact will be processed, encrypted, and published on-chain

### Step 3: Test Call Detection

1. **Simulate a Call**:
   - Use another phone to call your Android device
   - Or use Android's call simulation feature (if available)
   - The number should match the one you added in Step 2

2. **Observe CallerID in Action**:
   - When the call comes in, a popup will appear
   - The popup displays:
     - Caller name (if available)
     - Phone number
     - Spam status (if reported)
     - Additional contact information
   - The app queries the Sui blockchain using the phone number hash to retrieve this information

## 📋 Requirements

- **Android Version**: Android 10+ (API 29+)
- **Permissions**:
  - Phone permission (for call detection)
  - Overlay permission (for call popup display)
- **Network**: Internet connection required for blockchain queries
- **Device**: Physical device recommended (emulators may not detect calls properly)

## 🔧 Configuration

The app connects to the Sui testnet by default. To change network settings:

1. Open the app settings
2. Navigate to Network Configuration
3. Update the Sui network endpoint if needed
4. Update Package ID and Master Object ID if using custom deployment

## 🐛 Troubleshooting

### App Not Detecting Calls
- Ensure Phone permission is granted
- Check that CallerID Mode is enabled
- Verify overlay permission is enabled
- Try restarting the app

### No Caller Information Displayed
- Verify the phone number was added to the blockchain via the website
- Check internet connection
- Ensure the app can reach Sui testnet RPC endpoint
- Verify Package ID and Master Object ID are correct

### Popup Not Appearing
- Grant overlay permission in Android Settings
- Check app is running in background
- Verify CallerID Mode is toggled on

## 📝 Notes

- This is a **beta version** for testing purposes
- The app is lightweight and optimized for testing CallerID functionality
- For production use, additional features and optimizations may be required
- All contact data is queried from the Sui blockchain using phone number hashes

## 🔗 Related Links

- **Main Repository**: https://github.com/cadalt0/CallerID
- **Website Upload**: https://callerid-psi.vercel.app/upload
- **Contract Documentation**: [Contract README](../Contract/README.md)
- **Build Instructions**: [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md)


**Built for testing CallerID on Android** 🚀

