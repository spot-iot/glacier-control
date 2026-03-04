# Diesel Heater Control Dashboard - Implementation Plan

## Project Overview
Build a mobile-friendly web dashboard for controlling a diesel heater system with weather integration, temperature monitoring, and device control capabilities.

## System Architecture
```
Frontend (Web App) 
    ↓ HTTP/WebSocket
XANO Backend API
    ↓ Ethernet
Coordinator Node (Microcontroller)
    ↓ MQTT
Edge Devices (Local Network)
    ↓ BLE
Diesel Heater
```

## Technology Stack Recommendations

### Frontend
- **Framework**: React or Vue.js (for component-based architecture)
- **Styling**: CSS Framework (not Tailwind per user preference) - Consider:
  - Material-UI / MUI
  - Chakra UI
  - Bootstrap
  - Custom CSS with CSS Grid/Flexbox
- **State Management**: React Context/Redux or Vuex (for state management)
- **Charts/Graphs**: Chart.js, Recharts, or ApexCharts (for temperature history)
- **HTTP Client**: Axios or Fetch API
- **Real-time Updates**: WebSocket or Server-Sent Events (SSE) for live data

### Backend Integration
- **API Client**: Configure for XANO backend endpoints
- **WebSocket**: For real-time temperature/heater status updates

### Weather Integration
- **Weather API**: OpenWeatherMap, WeatherAPI, or similar
- **Caching**: Cache weather data to reduce API calls

## Project Structure

```
GlacierNode/
├── src/
│   ├── components/
│   │   ├── WeatherWidget/
│   │   │   ├── WeatherWidget.jsx
│   │   │   ├── WeatherWidget.css
│   │   │   └── ForecastItem.jsx
│   │   ├── HeaterControl/
│   │   │   ├── HeaterControl.jsx
│   │   │   ├── HeaterControl.css
│   │   │   ├── PowerToggle.jsx
│   │   │   └── SetpointControl.jsx
│   │   ├── TemperatureHistory/
│   │   │   ├── TemperatureHistory.jsx
│   │   │   ├── TemperatureHistory.css
│   │   │   └── TemperatureChart.jsx
│   │   ├── ActionButtons/
│   │   │   ├── ActionButtons.jsx
│   │   │   ├── ActionButtons.css
│   │   │   └── ActionButton.jsx
│   │   └── Layout/
│   │       ├── Dashboard.jsx
│   │       └── Dashboard.css
│   ├── services/
│   │   ├── api.js (XANO API client)
│   │   ├── weather.js (Weather API client)
│   │   └── websocket.js (WebSocket connection)
│   ├── hooks/ (if using React)
│   │   ├── useHeater.js
│   │   ├── useWeather.js
│   │   └── useTemperature.js
│   ├── utils/
│   │   ├── dateFormatter.js
│   │   └── constants.js
│   ├── App.jsx
│   └── index.js
├── public/
│   └── index.html
├── package.json
└── README.md
```

## Component Breakdown

### 1. Weather Widget (Top Section)
**Purpose**: Display current weather and 3-day forecast
**Features**:
- Current weather icon and temperature
- Current time and date
- 3-day forecast with:
  - Day abbreviation (e.g., "Ven", "Sab", "Dom")
  - Weather icon
  - Min/Max temperature
  - Visual temperature bar (gradient)
- Mute/unmute audio indicator (top-left corner)

**Data Requirements**:
- Current weather: condition, temperature, time, date
- Forecast: 3 days of min/max temps, conditions, icons

### 2. Heater Control Widget
**Purpose**: Control diesel heater on/off and setpoints
**Features**:
- Power toggle (On/Off button)
- Current heater status indicator
- Setpoint controls:
  - Current setpoint display
  - Setpoint adjustment (increase/decrease buttons or slider)
  - Future setpoints (schedule multiple setpoints)
- Current consumption/power usage display
- Visual status indicator (similar to washing machine widget)

**Data Requirements**:
- Heater state: on/off, current temperature, setpoint
- Setpoint history/schedule
- Power consumption

### 3. Temperature History Widget (Bottom Section)
**Purpose**: Display temperature history with expandable detail view
**Features**:
- Compact view showing:
  - Internal temperature (current)
  - External temperature (current)
  - Visual temperature bars
- Expandable detail view (on touch/click):
  - Temperature graph/chart
  - Historical data (last 24 hours, 7 days, etc.)
  - Min/Max indicators
  - Time range selector

**Data Requirements**:
- Real-time temperature updates
- Historical temperature data (time-series)
- Internal and external temperature readings

### 4. Action Buttons
**Purpose**: Quick actions for heater control
**Features**:
- Sync Time button (active/primary button)
  - Syncs time on diesel heater
  - Visual feedback when pressed
- Placeholder buttons (3 additional buttons)
  - Reserved for future functionality
  - Inactive state for now

**Data Requirements**:
- Button states (active/inactive)
- Action confirmation/feedback

## Implementation Phases

### Phase 1: Project Setup & Foundation
**Duration**: 1-2 hours
**Tasks**:
1. Initialize project (React/Vue setup)
2. Install dependencies (HTTP client, charting library, CSS framework)
3. Set up project structure
4. Configure build tools
5. Set up basic routing (if needed)
6. Create base layout component

**Deliverables**:
- Working development environment
- Basic app structure
- Base layout with responsive design

### Phase 2: Weather Widget Implementation
**Duration**: 2-3 hours
**Tasks**:
1. Design weather widget component
2. Integrate weather API
3. Implement current weather display
4. Implement 3-day forecast
5. Add weather icons
6. Style to match reference design
7. Add time/date display
8. Implement audio mute indicator

**Deliverables**:
- Functional weather widget
- Weather data fetching and caching
- Responsive weather display

### Phase 3: Heater Control Widget
**Duration**: 3-4 hours
**Tasks**:
1. Design heater control component
2. Create power toggle component
3. Implement setpoint controls
4. Design future setpoints interface
5. Connect to XANO API for heater control
6. Implement status indicators
7. Add power consumption display
8. Style to match reference design

**Deliverables**:
- Functional heater control
- API integration for commands
- Setpoint management

### Phase 4: Temperature History Widget
**Duration**: 2-3 hours
**Tasks**:
1. Design temperature display component
2. Implement compact view (internal/external temps)
3. Integrate charting library
4. Create expandable detail view
5. Implement touch/click interaction
6. Connect to real-time temperature updates
7. Fetch historical data
8. Style to match reference design

**Deliverables**:
- Temperature display with history
- Interactive chart view
- Real-time updates

### Phase 5: Action Buttons
**Duration**: 1-2 hours
**Tasks**:
1. Design action button component
2. Implement sync time button (active)
3. Create placeholder buttons
4. Connect sync time to API
5. Add visual feedback
6. Style to match reference design

**Deliverables**:
- Functional action buttons
- Sync time functionality
- Placeholder buttons for future use

### Phase 6: API Integration & Real-time Updates
**Duration**: 2-3 hours
**Tasks**:
1. Set up XANO API client
2. Implement WebSocket/SSE for real-time updates
3. Create API service layer
4. Implement error handling
5. Add loading states
6. Implement retry logic
7. Add connection status indicator

**Deliverables**:
- Complete API integration
- Real-time data updates
- Error handling

### Phase 7: Styling & Mobile Optimization
**Duration**: 2-3 hours
**Tasks**:
1. Refine mobile responsiveness
2. Optimize touch interactions
3. Test on various screen sizes
4. Add animations/transitions
5. Ensure dark theme consistency
6. Optimize performance
7. Test accessibility

**Deliverables**:
- Fully responsive mobile design
- Smooth interactions
- Performance optimized

### Phase 8: Testing & Polish
**Duration**: 1-2 hours
**Tasks**:
1. Test all functionality
2. Fix bugs
3. Add loading states
4. Improve error messages
5. Add user feedback (toasts/notifications)
6. Final styling adjustments

**Deliverables**:
- Production-ready application
- Bug-free functionality
- Polished UI/UX

## API Endpoints Needed (XANO Backend)

### Heater Control
- `GET /heater/status` - Get current heater status
- `POST /heater/power` - Turn heater on/off
- `GET /heater/setpoint` - Get current setpoint
- `POST /heater/setpoint` - Set new setpoint
- `GET /heater/setpoints` - Get scheduled setpoints
- `POST /heater/setpoints` - Create scheduled setpoint
- `DELETE /heater/setpoints/:id` - Delete scheduled setpoint

### Temperature Data
- `GET /temperature/current` - Get current temperatures
- `GET /temperature/history` - Get historical temperature data
- WebSocket endpoint for real-time temperature updates

### Actions
- `POST /heater/sync-time` - Sync time on diesel heater

### Weather (if not using external API directly)
- `GET /weather/current` - Get current weather (if cached on backend)
- `GET /weather/forecast` - Get forecast (if cached on backend)

## Design Considerations

### Mobile-First Approach
- Touch-friendly button sizes (minimum 44x44px)
- Swipe gestures for navigation (if needed)
- Responsive grid layout
- Optimized for portrait orientation

### Dark Theme
- Dark background (#1a1a1a or similar)
- High contrast text
- Colorful widget accents
- Consistent color scheme

### Visual Elements
- Gradient temperature bars
- Weather icons
- Status indicators
- Smooth animations
- Loading states

### User Experience
- Immediate feedback on actions
- Clear status indicators
- Error handling with user-friendly messages
- Offline state handling

## Next Steps

1. **Choose Framework**: Decide on React or Vue.js
2. **Choose CSS Framework**: Select styling approach (Material-UI, Chakra, Bootstrap, or custom)
3. **Set Up Project**: Initialize project with chosen stack
4. **Get API Details**: Obtain XANO backend endpoints and authentication details
5. **Get Weather API Key**: Sign up for weather service API
6. **Start Phase 1**: Begin project setup

## Questions to Resolve

1. **Framework Preference**: React or Vue.js?
2. **CSS Framework**: Which framework do you prefer? (Material-UI, Chakra UI, Bootstrap, or custom CSS?)
3. **Weather API**: Do you have a preference for weather service? (OpenWeatherMap, WeatherAPI, etc.)
4. **XANO Backend**: Do you have the API endpoints documented? Authentication method?
5. **Real-time Updates**: Preferred method - WebSocket or Server-Sent Events?
6. **Chart Library**: Preference for temperature graphs? (Chart.js, Recharts, ApexCharts)
7. **Deployment**: Where will this be hosted? (affects build configuration)

## Estimated Total Time
**12-18 hours** of development time across all phases.

---

Ready to proceed? Let me know your preferences for the questions above, and we can start with Phase 1!
