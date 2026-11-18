# Verbalis Mobile Client

The React Native (Expo) client application for **Verbalis** — an AI-powered technical voice interview rehearsal platform.

---

## Overview

The mobile client enables candidates to:
- Practice answering realistic technical interview prompts via voice.
- Receive dynamic speech-to-text transcription and instant feedback (Grammar, Clarity, Technical Accuracy, Interview Readiness).
- Select adaptive difficulty levels and targeted coaching focus areas (e.g., Reducing Filler Words, Answer Structure).
- View weekly progress, historical session analytics, and export comprehensive evaluation reports.

---

## Tech Stack

- **Framework**: [Expo SDK 57](https://expo.dev) with React Native & React 19
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (file-based navigation)
- **Audio & Speech**: `expo-audio` (high-quality recording), `expo-speech` (TTS for question prompts)
- **Networking**: Axios with JWT-authenticated sessions
- **Storage**: `expo-secure-store` (secure mobile token storage) & Web LocalStorage fallback
- **Exporting**: `expo-print` & `expo-sharing` (PDF evaluation reports)

---

## Getting Started

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `mobile` directory based on the template below:

```env
# Backend API Base URL
# For local physical device testing, use your machine's local IP (e.g., http://192.168.1.X:3000)
# For production or preview APK builds, use your HTTPS production endpoint
EXPO_PUBLIC_BACKEND_URL=https://your-production-backend.example.com
```

> **Security Note**: Never commit actual API keys or personal network configuration files to source control. `.env` is ignored in `.gitignore`.

### 3. Run the Development Server

```bash
# Start Expo bundler
npx expo start

# Open directly on Android emulator / connected device
npx expo start --android

# Open in Web preview
npx expo start --web
```

---

## Building the Android APK

The project is preconfigured with EAS Build for creating standalone Android APKs:

```bash
# 1. Install EAS CLI globally if not already installed
npm install -g eas-cli

# 2. Login to your Expo account
eas login

# 3. Build standalone APK
eas build -p android --profile preview
```

---

## Permissions & Device Access

- **Microphone (`RECORD_AUDIO`)**: Required to capture your spoken technical explanations during interview rehearsal turns.
- **Internet (`INTERNET`)**: Required to communicate with the backend API for speech transcription, evaluation, and account synchronization.

Audio recordings are processed transiently and deleted immediately after transcription. No raw audio files are stored permanently.

---

## License

All rights reserved.
