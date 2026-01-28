# Sentra - AI-Powered Water System Cyber Defense Platform

Sentra is an AI-powered anomaly detection platform designed to protect small public water systems from cyber threats. It runs locally on edge devices, fusing Operational Technology (OT) and Information Technology (IT) telemetry to detect suspicious behavior — even in low-connectivity environments.

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Backend Architecture](#backend-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Machine Learning Models](#machine-learning-models)
- [Data Flow](#data-flow)
- [Security](#security)
- [Getting Started](#getting-started)
- [Development Guide](#development-guide)
- [API Documentation](#api-documentation)

---

## Project Overview

### Challenge Statements Addressed

- How might we use AI to protect small public water systems without requiring IT staff or cloud access?
- How might we bring AI-powered anomaly detection to rural infrastructure where connectivity is limited and stakes are high?
- How might we make AI cybersecurity accessible to small communities?

### Project Value

Sentra's target customers are small public water systems — especially those in rural or underserved communities with limited IT staff and aging infrastructure. These operators often lack the resources to implement traditional cybersecurity solutions, leaving them vulnerable to service disruptions and costly post-attack recovery.

Sentra delivers tangible benefits by providing:
- AI-powered anomaly detection
- Real-time alerts and dashboards
- Local execution (no cloud dependency)
- Grant-aligned pricing
- Zero need for cybersecurity expertise

### Demo Presentation

[AAMU Jetsetters Presentation](https://www.canva.com/design/DAG4CyeQGW4/4sSfCAHA_S1LJHvV-ceS0Q/view?utm_content=DAG4CyeQGW4&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h0a938676b0)

---

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Dashboard  │  │  AI Analyst  │  │   Auth UI    │          │
│  │   Components │  │    Chat      │  │  (Login/MFA)│          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                   │
│         └─────────────────┼──────────────────┘                  │
│                           │                                      │
│                    ┌──────▼───────┐                             │
│                    │  adminApi.ts  │                             │
│                    │  (API Client) │                             │
│                    └──────┬───────┘                             │
└───────────────────────────┼─────────────────────────────────────┘
                            │ HTTPS + Firebase ID Token
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                    Backend (Node.js/Express)                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Express Server (Port 3001)                  │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │  Middleware Stack                                │   │   │
│  │  │  • CORS (allowed origins)                        │   │   │
│  │  │  • Rate Limiting (per endpoint)                  │   │   │
│  │  │  • Firebase Auth (ID token verification)          │   │   │
│  │  │  • Request Size Limits (1MB)                      │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │  Routes: /api/admin/*                            │   │   │
│  │  │  • /anomaly/current, /anomaly/history          │   │   │
│  │  │  • /system/status, /system/metrics              │   │   │
│  │  │  • /network/health                              │   │   │
│  │  │  • /alerts, /incidents                           │   │   │
│  │  │  • /sensors/data, /schematic/status             │   │   │
│  │  │  • /logs                                        │   │   │
│  │  │  • /chat, /chat/stream (Gemini)                │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ OperatorData     │  │ OperatorML       │                    │
│  │ Service          │  │ Service          │                    │
│  │                  │  │                  │                    │
│  │ • Generates      │  │ • Calls Python   │                    │
│  │   synthetic      │  │   ML service     │                    │
│  │   telemetry      │  │ • Caches         │                    │
│  │ • Maintains      │  │   predictions     │                    │
│  │   in-memory      │  │ • Fallback       │                    │
│  │   history        │  │   handling       │                    │
│  └────────┬─────────┘  └────────┬─────────┘                    │
│           │                      │                               │
│           │                      │ HTTP (localhost:5050)        │
│           │                      │                               │
│           │              ┌───────▼────────┐                      │
│           │              │ Python Flask   │                      │
│           │              │ ML Service     │                      │
│           │              │ (Port 5050)     │                      │
│           │              │                 │                      │
│           │              │ • Loads .pkl   │                      │
│           │              │   model files  │                      │
│           │              │ • Predicts     │                      │
│           │              │   anomalies     │                      │
│           │              └─────────────────┘                      │
│           │                                                        │
│           │              ┌──────────────────┐                     │
│           │              │ GeminiChat       │                     │
│           │              │ Service          │                     │
│           │              │                  │                     │
│           │              │ • Calls Google   │                     │
│           │              │   Gemini API     │                     │
│           │              │ • Server-side    │                     │
│           │              │   API key        │                     │
│           │              └──────────────────┘                     │
│           │                                                        │
│           └──────────────┐                                        │
│                          │                                        │
│                  ┌───────▼────────┐                               │
│                  │ OperatorData   │                               │
│                  │ Mapper         │                               │
│                  │                │                               │
│                  │ • Transforms   │                               │
│                  │   raw data to  │                               │
│                  │   dashboard    │                               │
│                  │   formats      │                               │
│                  │ • Generates    │                               │
│                  │   alerts/      │                               │
│                  │   incidents    │                               │
│                  └────────────────┘                               │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    External Services                           │
│  • Firebase Auth (Authentication & MFA)                        │
│  • Google Gemini API (AI Chat Assistant)                       │
└─────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```mermaid
sequenceDiagram
    participant Frontend
    participant Backend
    participant DataService
    participant MLService
    participant PythonML
    participant GeminiAPI

    Frontend->>Backend: GET /api/admin/system/status<br/>(with Firebase ID token)
    Backend->>Backend: Verify Firebase token
    Backend->>DataService: getCurrentState()
    DataService-->>Backend: Current telemetry data
    Backend->>MLService: detectOperatorAnomaly()
    MLService->>DataService: getSequenceForModel()
    DataService-->>MLService: 24-step feature sequence
    MLService->>PythonML: POST /predict {sequence}
    PythonML->>PythonML: Load model, scale, predict
    PythonML-->>MLService: {anomaly_score, feature_importance}
    MLService-->>Backend: Anomaly prediction
    Backend->>Backend: Map to dashboard format
    Backend-->>Frontend: System status JSON

    Frontend->>Backend: POST /api/admin/chat/stream<br/>(with Firebase ID token)
    Backend->>Backend: Verify Firebase token
    Backend->>GeminiAPI: POST generateContent<br/>(with system prompt)
    GeminiAPI-->>Backend: Stream response
    Backend-->>Frontend: SSE stream chunks
```

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | ^19.1.1 | UI framework |
| **TypeScript** | ~5.9.3 | Type safety |
| **Vite** | ^7.1.7 | Build tool & dev server |
| **React Router** | ^7.9.5 | Client-side routing |
| **Firebase Auth** | ^12.5.0 | Authentication & MFA |
| **React Joyride** | ^2.9.3 | User onboarding tours |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20+ | Runtime |
| **Express** | ^4.18.2 | Web framework |
| **TypeScript** | ^5.3.3 | Type safety |
| **Firebase Admin SDK** | ^13.4.0 | Server-side auth verification |
| **Axios** | ^1.6.2 | HTTP client (Gemini API, ML service) |
| **Python 3** | 3.x | ML inference service runtime |
| **Flask** | (Python) | ML service HTTP server |

### Machine Learning

| Component | Format | Purpose |
|-----------|--------|---------|
| **Random Forest Model** | `random_forest_model.pkl` | Anomaly detection (99.1% AUC) |
| **Feature Scaler** | `feature_scaler.pkl` | Feature normalization |
| **Feature Names** | `feature_names.pkl` | Feature ordering (145 features) |
| **Model Metadata** | `model_metadata.json` | Training info & thresholds |

### External APIs

- **Google Gemini API**: AI chat assistant (server-side)
- **Firebase Authentication**: User auth & MFA

---

## Backend Architecture

### Directory Structure

```
backend/
├── src/
│   ├── config/
│   │   └── ai-analyst-prompt.ts      # System prompt for Gemini chat
│   ├── middleware/
│   │   ├── error-handler.middleware.ts    # Global error handling
│   │   ├── firebase-auth.middleware.ts    # Firebase ID token verification
│   │   └── rate-limit.middleware.ts       # In-memory rate limiting
│   ├── routes/
│   │   └── admin.routes.ts                # All /api/admin/* endpoints
│   ├── services/
│   │   ├── operator-data.service.ts       # Synthetic telemetry generation
│   │   ├── operator-ml.service.ts         # ML inference wrapper
│   │   ├── gemini-chat.service.ts         # Gemini API client
│   │   └── ml-inference-service.py        # Python Flask ML service
│   ├── types/
│   │   └── index.ts                       # TypeScript type definitions
│   ├── utils/
│   │   └── operator-data-mapper.ts        # Data transformation utilities
│   └── server.ts                          # Express app entry point
├── models/                                 # ML model files (shared)
│   ├── random_forest_model.pkl
│   ├── feature_scaler.pkl
│   ├── feature_names.pkl
│   └── model_metadata.json
├── package.json
└── tsconfig.json
```

### Core Services

#### 1. OperatorDataService (`operator-data.service.ts`)

**Purpose**: Generates synthetic OT/IT telemetry data and maintains an in-memory history buffer.

**Key Responsibilities**:
- Generates realistic water system telemetry:
  - **7 tanks** (levels: `L_T1` through `L_T7`)
  - **11 pumps** (flows: `F_PU1-F_PU11`, statuses: `S_PU1-S_PU11`)
  - **12 junctions** (pressures: `P_J280`, `P_J269`, etc.)
  - **IT security metrics** (failed logins, firewall alerts, network traffic, etc.)
- Calculates **145 engineered features** including:
  - Raw sensor readings
  - Aggregated metrics (total flow, avg pressure, etc.)
  - Rolling statistics (3h, 6h, 12h, 24h windows)
  - Time-based features (hour, day of week, cyclical encoding)
- Maintains a **sliding window history** (configurable size)
- Updates data every **60 seconds** (configurable via `DATA_UPDATE_INTERVAL_MS`)

**Data Storage**: In-memory arrays (`dataHistory: OperatorDataPoint[]`). **No database persistence** — data resets on backend restart.

**Key Methods**:
- `getCurrentState()`: Returns latest telemetry snapshot
- `getHistory(hours)`: Returns historical data points
- `getSequenceForModel()`: Returns 24-step sequence for ML model input
- `getFeatureNames()`: Returns ordered list of 145 feature names

#### 2. OperatorMLService (`operator-ml.service.ts`)

**Purpose**: Wraps the Python ML inference service and provides anomaly detection to the backend.

**Key Responsibilities**:
- Calls Python ML service at `http://localhost:5050/predict`
- Formats feature sequences (24 timesteps × 145 features)
- Caches predictions (30-second TTL) to reduce ML service load
- Provides fallback predictions if ML service is unavailable
- Determines anomaly type (`cyber`, `physical`, `network`, `chemical`) based on feature importance

**Fallback Behavior**: If Python service fails or times out, returns a cached prediction or a low-severity default.

**Key Methods**:
- `detectOperatorAnomaly()`: Main prediction method
- `getLastPrediction()`: Returns most recent prediction

#### 3. GeminiChatService (`gemini-chat.service.ts`)

**Purpose**: Server-side client for Google Gemini API (chat assistant).

**Key Responsibilities**:
- Calls Gemini API with system prompt + user message + conversation history
- Handles API key management (server-side only)
- Formats requests according to Gemini API spec
- Returns generated text responses

**Configuration**:
- Model: `gemini-1.5-flash` (default, configurable via `GEMINI_MODEL`)
- API Key: `GEMINI_API_KEY` (required in backend `.env`)

**Key Methods**:
- `generateReply({ systemPrompt, userMessage, history })`: Generates AI response

#### 4. Python ML Inference Service (`ml-inference-service.py`)

**Purpose**: Standalone Flask service that loads and runs the Random Forest model.

**Architecture**:
- Runs as a **separate Python process** spawned by Node.js backend
- Binds to `127.0.0.1:5050` (localhost only, not externally accessible)
- Auto-restarts if it crashes (handled by Node.js spawn logic)

**Model Loading**:
- Searches multiple paths for `models/` directory:
  - Relative to script location
  - `/opt/render/project/src/models` (Render deployment)
  - `/app/models` (Docker deployment)
- Loads three files:
  - `random_forest_model.pkl`: Trained scikit-learn Random Forest
  - `feature_scaler.pkl`: StandardScaler for feature normalization
  - `feature_names.pkl`: Ordered list of feature names

**Endpoints**:
- `GET /health`: Returns service status and model load state
- `POST /predict`: Accepts `{ sequence: number[][] }` (24×145), returns `{ anomaly_score, feature_importance }`

**Input Format**: Expects exactly `(24, 145)` numpy array (24 timesteps, 145 features per timestep)

**Output Format**: 
```json
{
  "anomaly_score": 0.85,
  "feature_importance": [0.01, 0.02, ...],
  "status": "success"
}
```

### Routes (`admin.routes.ts`)

All routes are under `/api/admin/*` and require Firebase authentication.

#### Dashboard Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/anomaly/current` | GET | Current anomaly score, severity, system status |
| `/anomaly/history` | GET | Historical anomaly scores (query: `?days=7`) |
| `/system/status` | GET | System status, water quality index, pump flow, tank levels |
| `/system/metrics` | GET | Aggregated metrics (total flow, active pumps, efficiency, etc.) |
| `/network/health` | GET | Network health status, traffic volume, failed connections |
| `/alerts` | GET | Active alerts based on anomaly score |
| `/incidents` | GET | Generated incidents based on anomaly context |
| `/sensors/data` | GET | Sensor data history (query: `?hours=24`) |
| `/schematic/status` | GET | Component status for schematic visualization |
| `/logs` | GET | System logs (query: `?hours=24&component=&severity=`) |

#### Chat Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/chat` | POST | Non-streaming chat (returns full response) |
| `/chat/stream` | POST | Streaming chat (Server-Sent Events) |

**Request Format**:
```json
{
  "message": "What's causing the high anomaly score?",
  "history": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi! How can I help?" }
  ]
}
```

**Response Format** (`/chat`):
```json
{
  "success": true,
  "data": {
    "message": "Based on the current anomaly score..."
  }
}
```

**Response Format** (`/chat/stream`): Server-Sent Events (SSE)
```
data: {"content": "Based", "done": false}

data: {"content": " on the", "done": false}

data: [DONE]
```

### Middleware

#### Firebase Auth Middleware (`firebase-auth.middleware.ts`)

**Purpose**: Verifies Firebase ID tokens on every `/api/admin/*` request.

**Flow**:
1. Extracts `Authorization: Bearer <token>` header
2. Verifies token with Firebase Admin SDK
3. Attaches decoded token to `req.user`
4. Returns `401` if token is missing/invalid

**Configuration**: Requires backend env vars:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (with `\n` newlines escaped as `\\n`)

#### Rate Limiting Middleware (`rate-limit.middleware.ts`)

**Purpose**: In-memory rate limiting to prevent abuse.

**Limits**:
- **Chat endpoints** (`/chat`, `/chat/stream`): 30 requests/minute per IP
- **Other admin endpoints**: 300 requests/minute per IP

**Implementation**: Simple in-memory Map with sliding window (no external dependencies).

#### Error Handler Middleware (`error-handler.middleware.ts`)

**Purpose**: Global error handler that catches unhandled errors and returns consistent JSON error responses.

### Data Mapper (`operator-data-mapper.ts`)

**Purpose**: Transforms raw telemetry data into dashboard-friendly formats.

**Key Functions**:
- `mapToSystemStatus()`: Converts anomaly score to status object
- `calculateWaterQualityIndex()`: Computes water quality score from pressure/tank/efficiency
- `calculatePumpFlowRate()`: Formats pump flow metrics
- `calculateTankLevel()`: Computes tank level with trends
- `calculateNetworkHealth()`: Assesses network security health
- `generateAlerts()`: Creates alert objects from anomaly context
- `generateIncidents()`: Creates incident objects from anomaly context
- `generateSensorData()`: Formats sensor history for charts
- `generateSchematicStatus()`: Creates component status for schematic view
- `generateLogs()`: Generates synthetic system logs

---

## Frontend Architecture

### Directory Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── admin/                    # Dashboard components
│   │   │   ├── AdminLandingPage.tsx
│   │   │   ├── AdminHeader.tsx
│   │   │   ├── AlertList.tsx
│   │   │   ├── ChartWidget.tsx
│   │   │   ├── DataCard.tsx
│   │   │   ├── IncidentList.tsx
│   │   │   ├── LogViewer.tsx
│   │   │   ├── ModelOutput.tsx
│   │   │   ├── NetworkHealth.tsx
│   │   │   ├── SchematicWidget.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── common/                  # Shared components
│   │   │   ├── HistoricalTrends.tsx
│   │   │   ├── Logo.tsx
│   │   │   └── ThemeToggle.tsx
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   └── TwoFactorAuth.tsx
│   ├── pages/
│   │   └── admin/
│   │       ├── AnomalyOverview.tsx      # Main dashboard
│   │       ├── AIAnalystChat.tsx        # AI chat interface
│   │       └── DiagnosticsForensics.tsx # Diagnostics view
│   ├── hooks/                        # Custom React hooks
│   │   ├── useAlerts.ts
│   │   ├── useAnomalyData.ts
│   │   ├── useIncidents.ts
│   │   ├── useLogs.ts
│   │   ├── useSensorData.ts
│   │   └── useSystemMetrics.ts
│   ├── services/
│   │   ├── adminApi.ts               # Backend API client
│   │   ├── adminFirebaseAuth.ts      # Firebase MFA helpers
│   │   ├── authService.ts
│   │   └── firebaseAuth.ts
│   ├── config/
│   │   ├── firebase.ts               # Firebase config
│   │   ├── chatbot.config.ts         # Chat UI config
│   │   └── adminTourSteps.ts         # Onboarding tour
│   ├── App.tsx                       # Root component & routing
│   └── main.tsx                      # Entry point
├── package.json
└── vite.config.ts
```

### Core Components

#### API Client (`services/adminApi.ts`)

**Purpose**: Centralized client for all backend API calls.

**Features**:
- Automatically attaches Firebase ID token to all requests
- Handles errors consistently
- Provides TypeScript types for all API responses
- Supports streaming for chat (`chatStream()` async generator)

**Key Methods**:
- `chat(message, history)`: Non-streaming chat
- `chatStream(message, history)`: Streaming chat (SSE)
- `getAnomalyCurrent()`, `getAnomalyHistory()`
- `getSystemStatus()`, `getSystemMetrics()`
- `getNetworkHealth()`
- `getAlerts()`, `getIncidents()`
- `getSensorData()`, `getSchematicStatus()`, `getLogs()`

**Authentication**: Reads `auth.currentUser` from Firebase and calls `getIdToken()` before each request.

#### Custom Hooks

All hooks follow a similar pattern: poll backend endpoints at configurable intervals and manage loading/error states.

| Hook | Purpose | Polls |
|------|---------|-------|
| `useSystemMetrics` | System status & network health | `/system/status`, `/network/health` |
| `useAnomalyData` | Current & historical anomalies | `/anomaly/current`, `/anomaly/history` |
| `useAlerts` | Active alerts | `/alerts` |
| `useIncidents` | System incidents | `/incidents` |
| `useSensorData` | Sensor telemetry history | `/sensors/data` |
| `useLogs` | System logs | `/logs` |

**Default Poll Interval**: 60 seconds (configurable)

#### Pages

**AnomalyOverview** (`pages/admin/AnomalyOverview.tsx`):
- Main dashboard page
- Displays system status cards, charts, alerts, incidents, network health
- Uses multiple hooks to fetch data

**AIAnalystChat** (`pages/admin/AIAnalystChat.tsx`):
- AI chat interface
- Calls `adminApi.chatStream()` for streaming responses
- Manages conversation history (last 10 messages)
- Shows suggested prompts

**DiagnosticsForensics** (`pages/admin/DiagnosticsForensics.tsx`):
- Diagnostics and forensics view
- Displays logs, schematic status, sensor data

#### Authentication Flow

1. **Login/Signup**: User authenticates via Firebase Auth
2. **MFA**: If enabled, user completes MFA verification
3. **Token Management**: Frontend automatically gets ID token via `auth.currentUser.getIdToken()`
4. **API Calls**: All `adminApi` calls include `Authorization: Bearer <token>` header
5. **Backend Verification**: Backend verifies token with Firebase Admin SDK

---

## Machine Learning Models

### Anomaly Detection Model

**Model Type**: Random Forest Classifier (scikit-learn)

**Performance**:
- **Test AUC**: 99.1% (`0.991451936263919`)
- **Test F1**: 88.3% (`0.8826185101580135`)

**Input Format**:
- **Sequence Length**: 24 timesteps
- **Features per Timestep**: 145 features
- **Total Input Shape**: `(24, 145)` numpy array

**Feature Categories** (145 total):

1. **Tank Levels** (7 features): `L_T1` through `L_T7`
2. **Pump Data** (22 features): 
   - Flows: `F_PU1` through `F_PU11`
   - Statuses: `S_PU1` through `S_PU11`
3. **Junction Pressures** (12 features): `P_J280`, `P_J269`, `P_J300`, etc.
4. **IT Security Metrics** (12 features):
   - `remote_access_attempts`
   - `failed_login_attempts`
   - `network_anomalies`
   - `firewall_alerts`
   - `unusual_ip_detected`
   - `off_hours_access`
   - `privileged_account_access`
   - `scada_config_changes`
   - `network_traffic_mb`
   - `port_scan_detected`
   - `vpn_connections`
   - `data_exfiltration_flag`
5. **Time Features** (8 features):
   - `hour`, `day_of_week`, `is_weekend`, `is_night`, `is_business_hours`
   - `hour_sin`, `hour_cos`, `dow_sin`, `dow_cos` (cyclical encoding)
6. **Aggregated Metrics** (23 features):
   - `total_tank_volume`, `avg_tank_level`, `tank_level_variance`, etc.
   - `total_pump_flow`, `active_pumps`, `avg_pump_flow`, `pump_efficiency`
   - `avg_pressure`, `pressure_variance`, etc.
   - `total_security_events`, `critical_security_score`, etc.
7. **Rolling Statistics** (61 features):
   - Rolling means, std devs, and rate changes for:
     - `total_tank_volume`, `total_pump_flow`, `avg_pressure`
     - `total_security_events`, `network_traffic_mb`
   - Windows: 3h, 6h, 12h, 24h

**Output**:
- **Anomaly Score**: Probability of anomaly (0.0 to 1.0)
- **Feature Importance**: Array of 145 importance scores (optional)

**Model Files**:
- `random_forest_model.pkl`: Trained model (pickle format)
- `feature_scaler.pkl`: StandardScaler for normalization
- `feature_names.pkl`: Ordered list of feature names
- `model_metadata.json`: Training metadata

**Model Location**: `jetsetters/models/` (shared between backend and Python service)

### AI Chat Model

**Model**: Google Gemini 1.5 Flash (default, configurable)

**Purpose**: Conversational AI assistant for water quality analysis

**System Prompt**: Defined in `backend/src/config/ai-analyst-prompt.ts`
- Role: Expert water quality engineer with 15+ years experience
- Expertise: Municipal water treatment, SCADA systems, anomaly detection
- Guidelines: Be specific, actionable, risk-aware, technical but clear

**Configuration**:
- Model: `gemini-1.5-flash` (default)
- Max Output Tokens: 1000
- Temperature: 0.7

**API**: Google Generative Language API (`generativelanguage.googleapis.com/v1beta`)

---

## Data Flow

### Dashboard Data Flow

```
1. Frontend Hook (e.g., useSystemMetrics)
   ↓
2. Calls adminApi.getSystemStatus()
   ↓
3. adminApi attaches Firebase ID token
   ↓
4. HTTP GET /api/admin/system/status
   ↓
5. Backend middleware:
   - Rate limiter checks
   - Firebase auth verifies token
   ↓
6. Route handler calls:
   - operatorDataService.getCurrentState()
   - operatorMLService.detectOperatorAnomaly()
   ↓
7. ML Service:
   - Gets 24-step sequence from DataService
   - Calls Python ML service (localhost:5050)
   ↓
8. Python ML Service:
   - Loads model, scaler, feature names
   - Scales input sequence
   - Runs prediction
   - Returns anomaly_score + feature_importance
   ↓
9. Backend maps raw data to dashboard format
   ↓
10. Returns JSON response
   ↓
11. Frontend hook updates state
   ↓
12. React components re-render with new data
```

### Chat Data Flow

```
1. User types message in AIAnalystChat
   ↓
2. Calls adminApi.chatStream(message, history)
   ↓
3. adminApi attaches Firebase ID token
   ↓
4. HTTP POST /api/admin/chat/stream
   ↓
5. Backend middleware:
   - Rate limiter checks (30/min)
   - Firebase auth verifies token
   ↓
6. Route handler:
   - Validates message & history
   - Calls GeminiChatService.generateReply()
   ↓
7. GeminiChatService:
   - Formats system prompt + history + user message
   - Calls Google Gemini API
   ↓
8. Gemini API returns full response
   ↓
9. Backend streams response in 40-char chunks via SSE
   ↓
10. Frontend receives chunks and updates UI in real-time
```

### Telemetry Generation Flow

```
1. Backend starts: operatorDataService.startDataGeneration()
   ↓
2. Every 60 seconds (configurable):
   - Updates tank levels (drift toward 60%, random walk)
   - Updates pump flows/statuses (stochastic on/off)
   - Updates junction pressures (based on total flow)
   - Generates IT security metrics (random spikes)
   ↓
3. Calculates 145 features:
   - Raw sensor readings
   - Aggregated metrics
   - Rolling statistics
   - Time-based features
   ↓
4. Stores in:
   - currentState (latest snapshot)
   - dataHistory (sliding window buffer)
   ↓
5. Frontend polls endpoints → reads from in-memory state
```

---

## Security

### Authentication & Authorization

**Frontend**:
- Firebase Authentication (email/password)
- Multi-Factor Authentication (MFA) via SMS
- reCAPTCHA for bot protection

**Backend**:
- All `/api/admin/*` endpoints require Firebase ID token
- Token verification via Firebase Admin SDK
- No anonymous access to dashboard/chat endpoints

### API Security

**Rate Limiting**:
- Chat endpoints: 30 requests/minute per IP
- Other endpoints: 300 requests/minute per IP
- In-memory implementation (resets on restart)

**Request Size Limits**:
- JSON payloads: 1MB max
- Prevents abuse via large chat history payloads

**CORS**:
- Strict origin allowlist (localhost + production frontend URL)
- Allows `Authorization` header for token-based auth

### Secrets Management

**Backend Secrets** (stored in `.env`, not committed):
- `GEMINI_API_KEY`: Google Gemini API key
- `FIREBASE_PROJECT_ID`: Firebase project ID
- `FIREBASE_CLIENT_EMAIL`: Firebase service account email
- `FIREBASE_PRIVATE_KEY`: Firebase service account private key

**Frontend Secrets**:
- None! All API keys are server-side only
- Firebase config is public (client-side auth is expected)

### ML Service Security

- Binds to `127.0.0.1` (localhost only)
- Not accessible from external networks
- Only backend can call it (via localhost HTTP)

---

## Getting Started

### Prerequisites

- **Node.js** 20+ and npm
- **Python 3** with pip
- **Firebase project** (for authentication)
- **Google Gemini API key** (for chat)

### Backend Setup

1. **Install dependencies**:
   ```bash
   cd jetsetters/backend
   npm install
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   # Or: pip install flask numpy scikit-learn
   ```

3. **Configure environment variables** (`backend/.env`):
   ```bash
   # Firebase Admin (for auth verification)
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

   # Gemini API (for chat)
   GEMINI_API_KEY=your-gemini-api-key
   GEMINI_MODEL=gemini-1.5-flash  # Optional

   # Server Configuration
   PORT=3001
   ML_SERVICE_PORT=5050
   ML_SERVICE_HOST=127.0.0.1
   DATA_UPDATE_INTERVAL_MS=60000
   START_ML_SERVICE=true

   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:5173
   ```

4. **Build TypeScript**:
   ```bash
   npm run build
   ```

5. **Start backend**:
   ```bash
   npm run dev  # Development (with hot reload)
   # Or
   npm start    # Production
   ```

### Frontend Setup

1. **Install dependencies**:
   ```bash
   cd jetsetters/frontend
   npm install
   ```

2. **Configure environment variables** (`frontend/.env.local`):
   ```bash
   VITE_API_BASE_URL=http://localhost:3001
   VITE_FIREBASE_API_KEY=your-firebase-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   # ... other Firebase config
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

### Verifying Setup

1. **Backend health check**:
   ```bash
   curl http://localhost:3001/health
   ```

2. **ML service health** (should be running on port 5050):
   ```bash
   curl http://localhost:5050/health
   ```

3. **Frontend**: Open `http://localhost:5173` and log in

---

## Development Guide

### Project Structure

```
jetsetters/
├── backend/          # Node.js/Express backend
├── frontend/         # React frontend
├── models/           # ML model files (shared)
└── README.md         # This file
```

### Adding a New API Endpoint

1. **Add route** in `backend/src/routes/admin.routes.ts`:
   ```typescript
   router.get('/your-endpoint', ErrorHandler.asyncHandler(async (req, res) => {
     // Your logic
     res.json({ success: true, data: {...} });
   }));
   ```

2. **Add frontend method** in `frontend/src/services/adminApi.ts`:
   ```typescript
   yourMethod: async (): Promise<YourType> => {
     return fetchApi<YourType>('/api/admin/your-endpoint');
   }
   ```

3. **Create hook** (optional) in `frontend/src/hooks/useYourData.ts`:
   ```typescript
   export function useYourData() {
     const [data, setData] = useState(null);
     useEffect(() => {
       adminApi.yourMethod().then(setData);
     }, []);
     return { data };
   }
   ```

### Adding a New Dashboard Component

1. Create component in `frontend/src/components/admin/YourComponent.tsx`
2. Use hooks to fetch data
3. Add to `AnomalyOverview.tsx` or create new page

### Modifying Telemetry Generation

Edit `backend/src/services/operator-data.service.ts`:
- `updateTankLevels()`: Tank level simulation logic
- `updatePumpData()`: Pump flow/status simulation
- `updateJunctionPressures()`: Pressure simulation
- `generateITData()`: IT security metrics generation

### Modifying ML Model

1. Retrain model and save new `.pkl` files to `models/`
2. Update `model_metadata.json` if needed
3. Restart backend (Python service will reload model)

### Debugging

**Backend logs**: Check console output (all requests are logged)

**ML service logs**: Check Python process stdout/stderr

**Frontend**: Use browser DevTools → Network tab to inspect API calls

**Firebase Auth issues**: Check browser console for Firebase errors

---

## API Documentation

### Base URL

- **Development**: `http://localhost:3001`
- **Production**: Set via `FRONTEND_URL` env var

### Authentication

All `/api/admin/*` endpoints require:
```
Authorization: Bearer <Firebase_ID_Token>
```

### Endpoints

#### `GET /health`
Public health check endpoint (no auth required).

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-28T22:00:00.000Z",
  "service": "jetsetters-backend"
}
```

#### `GET /api/admin/anomaly/current`
Returns current anomaly detection results.

**Response**:
```json
{
  "success": true,
  "data": {
    "anomalyScore": 0.85,
    "severity": "high",
    "systemStatus": {
      "anomalyScore": 0.85,
      "severity": "High",
      "statusType": "warning",
      "label": "High Alert"
    },
    "anomalyContext": {
      "isActive": true,
      "severity": "high",
      "type": "cyber",
      "startTime": "2025-01-28T22:00:00.000Z"
    },
    "predictedFailurePoint": "Network Security Breach",
    "confidence": 85,
    "lastUpdated": "2025-01-28T22:00:00.000Z"
  }
}
```

#### `GET /api/admin/anomaly/history?days=7`
Returns historical anomaly scores.

**Query Parameters**:
- `days` (optional): Number of days of history (default: 7)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "date": "Jan 21",
      "value": 0.45,
      "timestamp": "2025-01-21T10:00:00.000Z",
      "label": "Jan 21 10:00"
    },
    ...
  ]
}
```

#### `GET /api/admin/system/status`
Returns comprehensive system status.

**Response**:
```json
{
  "success": true,
  "data": {
    "systemStatus": {...},
    "waterQualityIndex": {
      "value": 7.8,
      "trend": { "value": "0.2", "direction": "up" },
      "optimalRange": "7.0 - 8.5"
    },
    "pumpFlowRate": {
      "value": "450m³/hr",
      "description": "Current aggregated flow rate"
    },
    "tankT1Level": {...},
    "allTankLevels": {
      "T1": "65%",
      "T2": "72%",
      ...
    }
  }
}
```

#### `POST /api/admin/chat`
Non-streaming chat endpoint.

**Request Body**:
```json
{
  "message": "What's causing the high anomaly score?",
  "history": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi! How can I help?" }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Based on the current anomaly score of 0.85..."
  }
}
```

#### `POST /api/admin/chat/stream`
Streaming chat endpoint (Server-Sent Events).

**Request Body**: Same as `/chat`

**Response**: SSE stream
```
data: {"content": "Based", "done": false}

data: {"content": " on the", "done": false}

data: [DONE]
```

---

## Environment Variables Reference

### Backend (`.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Yes | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | Yes | Firebase service account private key (escape `\n`) |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `GEMINI_MODEL` | No | Gemini model name (default: `gemini-1.5-flash`) |
| `PORT` | No | Backend port (default: `3001`) |
| `ML_SERVICE_PORT` | No | Python ML service port (default: `5050`) |
| `ML_SERVICE_HOST` | No | ML service bind address (default: `127.0.0.1`) |
| `DATA_UPDATE_INTERVAL_MS` | No | Telemetry update interval (default: `60000`) |
| `START_ML_SERVICE` | No | Auto-start ML service (default: `true`) |
| `FRONTEND_URL` | No | Frontend URL for CORS |

### Frontend (`.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | No | Backend API URL (default: `http://localhost:3001`) |
| `VITE_FIREBASE_API_KEY` | Yes | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | No | Firebase analytics measurement ID |

---

## Deployment

### Backend Deployment

1. Set all environment variables in your hosting platform (Render, Railway, etc.)
2. Build: `npm run build`
3. Start: `npm start`
4. Ensure Python 3 is available in the deployment environment
5. Ensure `models/` directory is accessible to the Python ML service

### Frontend Deployment

1. Set `VITE_API_BASE_URL` to your backend URL
2. Build: `npm run build`
3. Deploy `dist/` folder to static hosting (Vercel, Netlify, etc.)

### Model Files

Ensure `models/` directory is included in deployment and accessible to both backend and Python ML service.

---

## Troubleshooting

### Backend won't start

- Check that all required env vars are set
- Verify Firebase Admin credentials are correct
- Check that port 3001 is not already in use

### ML service fails to start

- Verify Python 3 is installed: `python3 --version`
- Check that Flask, numpy, scikit-learn are installed: `pip list`
- Verify `models/` directory exists and contains `.pkl` files
- Check Python process logs in backend console

### Frontend can't connect to backend

- Verify `VITE_API_BASE_URL` matches backend URL
- Check CORS configuration in backend
- Verify backend is running and accessible

### 401 Unauthorized errors

- Check that user is logged in (Firebase Auth)
- Verify Firebase Admin credentials in backend `.env`
- Check browser console for Firebase auth errors

### Chat not working

- Verify `GEMINI_API_KEY` is set in backend `.env`
- Check backend logs for Gemini API errors
- Verify API key is valid and has quota

---

## Contributing

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for both frontend and backend
- **Formatting**: Use consistent indentation (spaces, 2-space tabs)

### Git Workflow

1. Create a feature branch from `main`
2. Make changes and test locally
3. Ensure builds pass (`npm run build`)
4. Commit with descriptive messages
5. Push and create pull request

### Testing Checklist

Before submitting PR:
- [ ] Backend builds successfully (`npm run build`)
- [ ] Frontend builds successfully (`npm run build`)
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Tested locally (backend + frontend running)
- [ ] Verified API endpoints work
- [ ] Verified authentication flow works

---

## License

MIT

---

## School & Team

**School**: Alabama A&M University  
**Team**: AAMU Jetsetters

---

## Additional Resources

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Google Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [Express.js Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)
