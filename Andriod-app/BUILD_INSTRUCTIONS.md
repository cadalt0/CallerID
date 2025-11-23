# Build & Test Instructions

## Quick Start

1. **Open in Android Studio**
   - File → Open → Select this folder
   - Wait for Gradle sync to complete

2. **Connect Device**
   - Physical device: Enable USB debugging, connect via USB
   - Emulator: Tools → Device Manager → Create/Start emulator

3. **Build & Run**
   - Click green ▶ Run button (or Shift+F10)
   - App will install and launch

4. **Grant Permissions**
   - Tap "Request Permissions" in app
   - Grant Phone permission
   - Grant Overlay permission (via Settings)
   - Tap "Start Detection"

5. **Test**
   - Have someone call your device
   - Popup should appear with caller info

## Important Notes

- **Physical device recommended** for call testing (emulators may not detect calls)
- **Android 10+ required** (API 29+)
- **Both permissions required** for full functionality

## Configure API Endpoint

Edit: `app/src/main/java/com/calldetector/app/utils/PhoneNumberQueryService.kt`

Replace the placeholder URL with your actual API endpoint.

