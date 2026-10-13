# Progress Diary

A React Native progress tracking application built with TypeScript.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI

### Installation

```bash
npm install
```

### Running the App

#### On Expo (Web)
```bash
npm start
```

Then press `w` in the terminal to open in web browser, or `i` for iOS, `a` for Android.

#### On iOS
```bash
npm run ios
```

#### On Android (emulator)

Requires Android Studio with the Android SDK and at least one virtual device (AVD) created in Device Manager.

1. Add the SDK tools to your `PATH` (one-time; add to `~/.zshrc`, then `source ~/.zshrc`):
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH
   ```

2. Start the emulator yourself and wait for the Android home screen. (If Expo has to boot one, it can time out with "It took too long to start the Android emulator".)
   ```bash
   emulator -list-avds        # list available devices
   emulator -avd <AVD_NAME>   # e.g. emulator -avd Pixel_9
   ```
   You can also start it from Android Studio → Device Manager.

3. In a second terminal, from the project folder:
   ```bash
   npm run android
   ```
   This starts Metro, installs Expo Go on the emulator if needed, and opens the app. Press `r` to reload, `a` to reopen on Android, `Ctrl+C` to stop.

**Troubleshooting**
- *Emulator hangs or won't boot:* cold boot it with `emulator -avd <AVD_NAME> -no-snapshot-load`.
- *Port 8081 already in use:* stop the old Metro server with `lsof -ti :8081 | xargs kill`.
- *Check the emulator is connected:* `adb devices` should list `emulator-5554  device`.

## Project Structure

```
├── src/
│   └── App.tsx          # Main app component
├── app.json             # Expo app configuration
├── babel.config.js      # Babel configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Project dependencies
```

## Technologies

- **React Native** - Mobile app framework
- **TypeScript** - Type-safe JavaScript
- **Expo** - Development platform
- **React Navigation** - Navigation library

## Contributing

Please maintain TypeScript type safety and follow React Native best practices when contributing to this project.
