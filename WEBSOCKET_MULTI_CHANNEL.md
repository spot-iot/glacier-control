# WebSocket Multi-Channel Architecture

## Can One WebSocket Have Multiple Channels?

**Short Answer**: It depends on XANO's implementation, but typically **yes** - you can subscribe to multiple channels on a single WebSocket connection.

## XANO WebSocket Channel Options

### Option 1: Multiple Channels on One Connection (Recommended)

**How it works:**
- One WebSocket connection
- Subscribe to multiple channels: `heater-telemetry`, `forecast`, `power`
- Receive messages from all subscribed channels
- Messages include channel identifier

**XANO URL Format:**
```
wss://x8ki-letl-twmt.n7.xano.net/ws
```

**Subscription:**
- Connect to base WebSocket URL
- Send subscription messages for each channel
- Or XANO auto-subscribes based on URL parameters

### Option 2: Separate Connections Per Channel

**How it works:**
- Multiple WebSocket connections
- One connection per channel
- Each connection handles one channel

**XANO URL Format:**
```
wss://x8ki-letl-twmt.n7.xano.net/ws:heater-telemetry
wss://x8ki-letl-twmt.n7.xano.net/ws:forecast
wss://x8ki-letl-twmt.n7.xano.net/ws:power
```

## Recommended Architecture

### Single Connection with Multiple Channels ✅

**Why:**
- ✅ More efficient (one connection vs multiple)
- ✅ Lower overhead
- ✅ Easier to manage
- ✅ Better for mobile (fewer connections)

**Implementation:**
- One WebSocket connection
- Messages include channel identifier
- Frontend routes messages to appropriate handlers

## Channel Structure

### Channel 1: Heater Telemetry
- **Channel Name**: `heater-telemetry`
- **Data**: Power state, level, temperature, device status
- **Frequency**: Every heartbeat (e.g., every 30 seconds)
- **Source**: Telemetry heartbeat API post-processing

### Channel 2: Forecast
- **Channel Name**: `forecast`
- **Data**: Weather forecast updates
- **Frequency**: When forecast changes (e.g., every hour)
- **Source**: Weather API post-processing (or scheduled update)

### Channel 3: Power (Future)
- **Channel Name**: `power`
- **Data**: Power consumption, energy usage
- **Frequency**: Periodic updates
- **Source**: Power monitoring API post-processing

## Message Format

### Option A: Channel in Message (Recommended)

Each message includes the channel name:

```json
{
  "channel": "heater-telemetry",
  "data": {
    "device_uid": "345F4537C1B0",
    "power_state": 1,
    "level": 5,
    "temperature": 25.3,
    "timestamp": "2026-03-04T10:30:00Z"
  }
}
```

```json
{
  "channel": "forecast",
  "data": {
    "current": { "temp": 27, "condition": "Sunny" },
    "forecast": [
      { "day": "Fri", "min": 24, "max": 31 },
      { "day": "Sat", "min": 22, "max": 32 }
    ]
  }
}
```

### Option B: Separate Message Types

Use message type instead of channel:

```json
{
  "type": "heater-telemetry",
  "payload": { ... }
}
```

## Frontend Implementation

### Single WebSocket Service

```javascript
// Connect once
wsService.connect('wss://x8ki-letl-twmt.n7.xano.net/ws')

// Listen for all messages
wsService.on('message', (message) => {
  // Route based on channel
  switch(message.channel) {
    case 'heater-telemetry':
      updateHeaterState(message.data)
      break
    case 'forecast':
      updateForecast(message.data)
      break
    case 'power':
      updatePowerData(message.data)
      break
  }
})
```

### Channel-Specific Hooks

```javascript
// useHeaterTelemetry.js
useEffect(() => {
  const handler = (message) => {
    if (message.channel === 'heater-telemetry') {
      setHeaterData(message.data)
    }
  }
  wsService.on('message', handler)
  return () => wsService.off('message', handler)
}, [])
```

## Authentication

### Your Approach: Public WebSocket ✅

**Why this works:**
- ✅ Commands are POST requests (authenticated)
- ✅ WebSocket is read-only (telemetry/forecast)
- ✅ Public dashboard needs public WebSocket
- ✅ Simpler setup

**Security:**
- Commands require auth (POST endpoints)
- WebSocket only receives data (no commands)
- Public view can see data (intended behavior)

**If you need authenticated WebSocket later:**
- Can add auth token to WebSocket connection
- XANO can validate token on connection
- For now, public is fine

## XANO Setup

### Broadcasting to Multiple Channels

**In Telemetry Heartbeat API (Post-processing):**
```
Broadcast to WebSocket Channel
  Channel: "heater-telemetry"
  Data: {{telemetry_data}}
```

**In Weather/Forecast API (Post-processing):**
```
Broadcast to WebSocket Channel
  Channel: "forecast"
  Data: {{forecast_data}}
```

**In Power API (Post-processing - Future):**
```
Broadcast to WebSocket Channel
  Channel: "power"
  Data: {{power_data}}
```

## Frontend Channel Routing

### Message Router

```javascript
// services/telemetryService.js
export const setupTelemetryListener = (onHeaterUpdate, onForecastUpdate, onPowerUpdate) => {
  wsService.on('message', (message) => {
    switch(message.channel) {
      case 'heater-telemetry':
        onHeaterUpdate(message.data)
        break
      case 'forecast':
        onForecastUpdate(message.data)
        break
      case 'power':
        onPowerUpdate(message.data)
        break
      default:
        console.warn('Unknown channel:', message.channel)
    }
  })
}
```

## Testing Multiple Channels

### Test Each Channel

1. **Heater Telemetry**:
   - Trigger heartbeat API
   - Check WebSocket receives message
   - Verify channel is "heater-telemetry"

2. **Forecast**:
   - Trigger forecast update
   - Check WebSocket receives message
   - Verify channel is "forecast"

3. **Power** (Future):
   - Trigger power update
   - Check WebSocket receives message
   - Verify channel is "power"

## Channel Naming Conventions

**Recommended:**
- `heater-telemetry` - Heater status updates
- `forecast` - Weather forecast
- `power` - Power consumption
- `temperature` - Temperature updates (if separate)

**Alternative:**
- `glacier:heater:telemetry`
- `glacier:weather:forecast`
- `glacier:power:consumption`

## Summary

✅ **Single WebSocket Connection** - More efficient
✅ **Multiple Channels** - One connection, multiple channels
✅ **Channel in Message** - Each message identifies its channel
✅ **Public WebSocket** - Fine since commands are POST (authenticated)
✅ **Frontend Routing** - Route messages based on channel field

## Next Steps

1. **Set up broadcasting** in each API's post-processing:
   - Telemetry heartbeat → `heater-telemetry`
   - Forecast API → `forecast`
   - Power API → `power` (future)

2. **Update frontend WebSocket**:
   - Connect to single WebSocket URL
   - Handle messages with channel routing
   - Update appropriate components

3. **Test each channel**:
   - Verify messages received
   - Verify correct channel routing
   - Verify UI updates

---

**Answer**: Yes, one WebSocket can handle multiple channels! Just include the channel name in each message, and route on the frontend. 🚀
