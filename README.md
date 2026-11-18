# Verbalis — AI Technical Voice Interview Coach

**Verbalis** is an end-to-end AI-powered conversational platform designed to help software engineers, computer science students, and tech professionals rehearse and master verbal technical explanations for coding interviews.

Through voice-driven sessions, Verbalis provides instant speech transcription, adaptive multi-tier questioning, actionable scoring across 4 core dimensions (Grammar, Clarity, Technical Accuracy, Interview Readiness), and consolidated PDF performance reports.

---

## Key Features

- **Voice-Driven Rehearsal**: Interactive speech-to-text using Groq Whisper models with real-time waveform visualization and text-to-speech question delivery.
- **Adaptive Questioning**: Automatically adjusts question difficulty (Beginner, Intermediate, Advanced) based on your past turn performance and scores.
- **Two Feedback Modes**:
  - `After Every Answer` (`per_answer`): Instant phrasing corrections, grammar upgrades, and coaching tips before the next question.
  - `At End of Session` (`end_of_session`): Simulates a continuous realistic interview with a comprehensive consolidated report at the end.
- **Targeted Coaching Focus**: Choose from 7 specific focus areas including *Technical Accuracy*, *Reducing Filler Words*, *Answer Structure & Conciseness*, and *Interview Readiness*.
- **Comprehensive Topics**: Includes Data Structures & Algorithms, Java OOP, Systems & Low-Level C, Databases & Indexing, Operating Systems, Computer Networks, AI/ML, and Behavioral Leadership — plus support for any Custom Topic.
- **Progress Tracking & Analytics**: Aggregated historical averages, weekly activity logs, recurring weakness identification, and printable PDF reports.
- **Zero Audio Persistence**: Strict ephemeral audio processing. Spoken audio is evaluated on-the-fly and deleted from servers immediately post-transcription.

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                   Mobile Client (Expo)                 │
│      React Native • Expo Router • Expo Audio • TTS     │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTPS / Multipart Form-Data
                           ▼
┌────────────────────────────────────────────────────────┐
│               Backend API (Node.js / Express)          │
│       TypeScript • JWT Auth • Helmet • Zod Validation  │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
               ▼                          ▼
┌─────────────────────────────┐ ┌────────────────────────┐
│     Groq Inference API      │ │     MongoDB Atlas      │
│ Whisper STT • Qwen/LLaMA    │ │ Aggregated Metrics &   │
│ (Transient Transcription)   │ │ Session Summaries      │
└─────────────────────────────┘ └────────────────────────┘
```

---

## Project Structure

```
Verba/
├── backend/                  # Node.js + Express TypeScript API
│   ├── src/
│   │   ├── middleware/       # JWT authentication & request validation
│   │   ├── models/           # Mongoose schemas (User, Session, Summary)
│   │   ├── routes/           # REST endpoints (auth, sessions, history, progress)
│   │   ├── services/         # Groq AI integration & ephemeral context store
│   │   └── types/            # Shared TypeScript interfaces & Zod schemas
│   ├── package.json
│   └── tsconfig.json
│
├── mobile/                   # React Native mobile client (Expo SDK 57)
│   ├── src/
│   │   ├── app/              # Expo Router file-based screens
│   │   │   ├── (auth)/       # Authentication (Login / Register)
│   │   │   ├── (tabs)/       # Dashboard, Topics, History, Profile
│   │   │   ├── session/      # Setup, Voice Practice Room, Feedback, Report
│   │   │   └── legal/        # Privacy Policy & Terms and Conditions
│   │   ├── components/       # UI components (MicOrb, Waveform, Card, Button)
│   │   ├── constants/        # Theme tokens, colors, topics catalog
│   │   └── context/          # AuthContext with secure token management
│   ├── app.json              # Expo application configuration
│   ├── eas.json              # EAS Build configuration for Android APK
│   └── package.json
│
├── DEPLOYMENT_AND_APK_GUIDE.md # Step-by-step free deployment & APK build guide
└── DESIGN.md                 # Design system tokens and styling specifications
```

---

## Security & Privacy Highlights

- **Zero Audio Storage**: Raw audio files sent for transcription are stored only in temporary system folders and unlinked/deleted immediately upon transcription. No audio recordings or voice biometrics are permanently stored.
- **Credential Protection**: Passwords are encrypted with `bcrypt` (salted rounds). JWT tokens use industry-standard HMAC SHA-256 signatures with expiry windows.
- **Security Headers & Sanitization**: The API utilizes `helmet` for secure HTTP headers, strictly enforces CORS origins, and validates incoming turn payloads with `zod`.
- **Stateless AI Processing**: Speech transcription and response evaluations are stateless requests through the Groq Cloud API; candidate responses are not utilized for training foundation models.
- **Legal Compliance**: Full Privacy Policy and Terms of Service included within the application at `/legal/privacy` and `/legal/terms`.

---

## Local Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (v9 or higher)
- Free [Groq Cloud API Key](https://console.groq.com/) (for speech transcription and LLM inference)
- Free [MongoDB Atlas Cluster](https://www.mongodb.com/cloud/atlas) or a local MongoDB instance

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment configuration from example template
cp .env.example .env
```

Configure your `backend/.env` file with appropriate values:

```env
PORT=3000
NODE_ENV=development

# Authentication
JWT_SECRET=your_strong_random_jwt_secret_here

# Groq Cloud API (STT & Evaluation)
GROQ_API_KEY=your_groq_api_key_here

# Database Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/verbalis?retryWrites=true&w=majority

# Ephemeral Session Context (auto-cleaned)
TEMP_SESSION_DIR=./temp_sessions
```

Build and run the server:

```bash
# Run in development mode (with hot-reload)
npm run dev

# Or build and start for production
npm run build
npm start
```

Health check verification:
```bash
curl http://localhost:3000/health
# Response: {"status":"OK","service":"Verbalis Backend"}
```

---

### 2. Mobile App Setup

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Create environment configuration
# In mobile/.env, specify your backend URL:
```

```env
# Point to your local network IP (e.g. http://192.168.1.X:3000) for physical devices
# Or your deployed production HTTPS backend for standalone APK builds:
EXPO_PUBLIC_BACKEND_URL=https://your-production-backend.example.com
```

Start the application:

```bash
# Start Expo development server
npx expo start

# Run on Android emulator / connected USB device
npx expo start --android

# Run on Web browser
npx expo start --web
```

---

## Building the Android APK

You can build a standalone release APK for free using Expo Application Services (EAS):

```bash
cd mobile

# Install EAS CLI globally if not already installed
npm install -g eas-cli

# Log in to your Expo account
eas login

# Start the Android APK cloud build
eas build -p android --profile preview
```

Upon completion, EAS provides a direct link and QR code to download the installable `.apk` file. Detailed deployment and APK instructions can be found in [DEPLOYMENT_AND_APK_GUIDE.md](file:///d:/Verba/DEPLOYMENT_AND_APK_GUIDE.md).

---

## API Reference Summary

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | No | Service health check |
| `POST` | `/api/auth/register` | No | Create user account |
| `POST` | `/api/auth/login` | No | Authenticate user and receive JWT |
| `POST` | `/api/sessions` | Yes | Initialize a new interview rehearsal session |
| `POST` | `/api/sessions/:id/turns` | Yes | Upload audio turn, transcribe & evaluate |
| `POST` | `/api/sessions/:id/finish` | Yes | Finalize session & generate dynamic summary report |
| `GET` | `/api/history` | Yes | Retrieve historical session summaries |
| `GET` | `/api/progress` | Yes | Retrieve aggregate progress & weekly activity data |
| `GET` | `/api/profile` | Yes | Retrieve user profile & rehearsal preferences |
| `PUT` | `/api/profile` | Yes | Update display name & coaching defaults |

---

## License

Proprietary and confidential. All rights reserved.
