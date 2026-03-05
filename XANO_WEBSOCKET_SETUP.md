# XANO WebSocket Setup Guide

## Overview

XANO WebSockets allow real-time data streaming from your backend to the frontend. You can broadcast telemetry data without needing triggers (perfect for free plan!).

## How XANO WebSockets Work

### Architecture
```
Telemetry Heartbeat API (Post-processing)
    ↓
Broadcast to WebSocket Channel
    ↓
Frontend WebSocket Connection
    ↓
Update Dashboard in Real-Time
```

### Key Concepts

1. **Channels**: Named channels for different data types
   - Example: `heater-telemetry`, `temperature-updates`, etc.

2. **Broadcasting**: Send data to all connected clients on a channel
   - Done in API post-processing blocks
   - No triggers needed!

3. **Subscribing**: Frontend connects and subscribes to channels
   - Receives real-time updates
   - Auto-reconnects on disconnect

## Option 1: Post-Processing Block (Your Current Plan) ✅

**Perfect for free plan!** No triggers needed.

### Setup in Telemetry Heartbeat API

**In your telemetry heartbeat endpoint's post-processing block:**

1. **Add Function**: "Broadcast to WebSocket Channel"
   - **Channel Name**: `heater-telemetry` (or your preferred name)
   - **Data to Broadcast**: Your telemetry response data

**XANO Steps:**
```
Post-Processing Block:
  → Broadcast to WebSocket Channel
    Channel: "heater-telemetry"
    Data: {{response_data}} (or construct object with telemetry)
```

**What to Broadcast:**
```json
{
  "device_uid": "345F4537C1B0",
  "power_state": 1,
  "level": 5,
  "temperature": 25.3,
  "timestamp": "2026-03-04T10:30:00Z"
}
```

**Pros:**
- ✅ Works on free plan (no triggers needed)
- ✅ Simple setup
- ✅ Broadcasts every time heartbeat API is called
- ✅ Real-time updates

**Cons:**
- Only broadcasts when heartbeat API is called
- If heartbeat stops, no updates (but that's expected)

## Option 2: Separate Broadcast Endpoint (Alternative)

Create a dedicated endpoint just for broadcasting:

**Endpoint**: `POST /telemetry/broadcast`
- Accepts telemetry data
- Broadcasts to WebSocket
- Returns success

**Use Case**: If you want to broadcast from multiple sources

## Frontend WebSocket Connection

### XANO WebSocket URL Format

```
wss://your-instance.xano.net/ws:channel-name
```

For your setup:
```
wss://x8ki-letl-twmt.n7.xano.net/ws:heater-telemetry
```

### Connection Flow

1. **Connect**: Frontend connects to WebSocket URL
2. **Subscribe**: Automatically subscribed to channel
3. **Receive**: Gets real-time updates
4. **Reconnect**: Auto-reconnects on disconnect

## Data Flow Example

### Backend (XANO)
```
Telemetry Heartbeat API called
  → Processes telemetry
  → Post-processing block
  → Broadcast to "heater-telemetry" channel
  → Data: { power_state: 1, level: 5, temp: 25.3 }
```

### Frontend
```
WebSocket connected to "heater-telemetry"
  → Receives: { power_state: 1, level: 5, temp: 25.3 }
  → Updates React state
  → Dashboard re-renders with new data
```

## Implementation Plan

### Phase 1: Backend Setup (XANO)

1. **In Telemetry Heartbeat API Post-Processing:**
   - Add "Broadcast to WebSocket Channel" function
   - Channel: `heater-telemetry`
   - Data: Telemetry response

2. **Test Broadcasting:**
   - Call heartbeat API
   - Check XANO WebSocket logs (if available)
   - Verify data format

### Phase 2: Frontend Setup

1. **Update WebSocket Service** (`src/services/websocket.js`)
   - Connect to XANO WebSocket URL
   - Subscribe to `heater-telemetry` channel
   - Handle incoming messages

2. **Create Telemetry Hook** (`src/hooks/useTelemetry.js`)
   - Manage WebSocket connection
   - Parse incoming data
   - Update state

3. **Update Components:**
   - HeaterControl: Update power/level from telemetry
   - TemperatureHistory: Update temperature data
   - Dashboard: Connect telemetry hook

## XANO WebSocket Function Details

### Broadcast Function

**Function**: "Broadcast to WebSocket Channel"

**Parameters:**
- **Channel Name**: String (e.g., "heater-telemetry")
- **Data**: Object/JSON to broadcast

**Example:**
```
Channel: "heater-telemetry"
Data: {
  "device_uid": "{{device_uid}}",
  "power_state": {{power_state}},
  "level": {{level}},
  "temperature": {{temperature}},
  "timestamp": "{{current_timestamp}}"
}
```

### Channel Naming

**Best Practices:**
- Use descriptive names: `heater-telemetry`, `temperature-updates`
- Use device-specific channels if multiple devices: `heater-345F4537C1B0`
- Use namespacing: `glacier-control:heater:telemetry`

## Frontend WebSocket Implementation

### Connection URL

Based on your XANO instance:
```
wss://x8ki-letl-twmt.n7.xano.net/ws:heater-telemetry
```

### Message Format

XANO typically sends messages as JSON:
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

### Handling Messages

1. **Parse JSON**: Extract data from message
2. **Validate**: Check data structure
3. **Update State**: Update React state
4. **Re-render**: Components update automatically

## Security Considerations

### Authentication

XANO WebSockets can be:
- **Public**: No auth required (for public dashboard)
- **Authenticated**: Require auth token

**For your setup:**
- **Public dashboard** (`/public`): Public WebSocket (read-only)
- **Authenticated dashboard** (`/dashboard`): Authenticated WebSocket

### Channel Access

- Public channels: Anyone can subscribe
- Private channels: Require authentication
- Device-specific: Use device_uid in channel name

## Testing

### Test Backend Broadcasting

1. **Call heartbeat API** manually or via Postman
2. **Check XANO logs** (if available)
3. **Verify** data is being broadcast

### Test Frontend Connection

1. **Open browser console**
2. **Connect WebSocket**
3. **Check connection status**
4. **Verify messages received**

### Test Real-Time Updates

1. **Open dashboard**
2. **Trigger heartbeat** (or wait for automatic)
3. **Watch dashboard update** in real-time
4. **Verify** power state, level, temperature update

## Troubleshooting

### No Messages Received

**Check:**
- WebSocket URL is correct
- Channel name matches (case-sensitive)
- Backend is broadcasting
- Network/firewall allows WebSocket connections

### Connection Drops

**Solution:**
- Auto-reconnect logic (already in websocket.js)
- Exponential backoff
- Connection status indicator

### Data Not Parsing

**Check:**
- Message format matches expected structure
- JSON parsing error handling
- Data validation

## Next Steps

1. **Set up broadcasting** in heartbeat API post-processing
2. **Test broadcasting** manually
3. **Update frontend WebSocket** service
4. **Create telemetry hook**
5. **Update components** to use real-time data
6. **Test end-to-end**

## Questions to Answer

1. **What data does your heartbeat API return?**
   - Power state?
   - Level/gear?
   - Temperature?
   - Other telemetry?

2. **How often is heartbeat called?**
   - Every X seconds?
   - On demand?
   - Event-driven?

3. **Do you need multiple channels?**
   - One for all telemetry?
   - Separate channels for different data types?

4. **Authentication needed?**
   - Public WebSocket for public dashboard?
   - Authenticated for private dashboard?

---

Once you set up the broadcasting in the post-processing block, we can implement the frontend WebSocket connection! 🚀
