# Glacier Control - Diesel Heater Control Dashboard

A mobile-friendly web dashboard for controlling diesel heaters with weather integration, temperature monitoring, and device control capabilities.

## Tech Stack

- **React 18** - UI Framework
- **Vite** - Build tool and dev server
- **Chakra UI** - Component library with dark theme
- **Recharts** - Charting library for temperature history
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Vercel** - Hosting platform

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── WeatherWidget/
│   ├── HeaterControl/
│   ├── TemperatureHistory/
│   └── ActionButtons/
├── contexts/           # React contexts (Auth, etc.)
├── pages/              # Page components
│   ├── Login.jsx
│   └── Dashboard.jsx
├── services/           # API and service integrations
│   ├── api.js          # XANO API client
│   └── websocket.js    # WebSocket service
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── theme.js            # Chakra UI theme configuration
└── App.jsx             # Main app component
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your XANO backend URL:
```
VITE_API_BASE_URL=https://your-xano-instance.xano.app/api/v1
VITE_WS_URL=wss://your-xano-instance.xano.app/ws
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Building for Production

Build the project:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Deployment to Vercel

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard:
   - `VITE_API_BASE_URL`
   - `VITE_WS_URL`
4. Deploy!

The `vercel.json` file is already configured for Vite projects.

## Features

### ✅ Phase 1: Project Setup (Complete)
- React + Vite setup
- Chakra UI with dark theme
- Authentication structure
- Routing setup
- Vercel configuration
- **Public read-only dashboard** (`/public` or `/view`)

### 🔒 Public Dashboard
- Read-only view for sharing and embedding
- No authentication required
- All controls disabled for security
- See `PUBLIC_ROUTE.md` for details

### 🚧 Phase 2: Weather Widget (Next)
- Current weather display
- 3-day forecast
- Weather icons

### 🚧 Phase 3: Heater Control
- Power on/off toggle
- Setpoint controls
- Future setpoints scheduling

### 🚧 Phase 4: Temperature History
- Current temperature display
- Expandable chart view
- Historical data visualization

### 🚧 Phase 5: Action Buttons
- Sync time functionality
- Placeholder buttons

### 🚧 Phase 6: API Integration
- XANO backend integration
- WebSocket real-time updates
- Error handling

## Environment Variables

- `VITE_API_BASE_URL` - Your XANO backend API URL
- `VITE_WS_URL` - WebSocket URL for real-time updates

## Authentication

The authentication system is set up but requires the XANO authentication API endpoints to be implemented. Currently, it uses placeholder authentication.

Once your XANO authentication endpoints are ready, update:
- `src/contexts/AuthContext.jsx` - Login function
- `src/services/api.js` - API base URL

## License

Private project - All rights reserved
