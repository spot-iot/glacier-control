# Heater Telemetry WebSocket Payload Structure

## Current HeaterControl Component State

The `HeaterControl` component currently manages:
- `powerOn` (boolean) - Power state (on/off)
- `level` (number) - Heater level (1-10)

## Recommended Payload Structure

### Minimal Payload (Start Here)

```json
{
  "channel": "glacier_live_feed/heater-telemetry",
  "data": {
    "device_uid": "345F4537C1B0",
    "power_state": 1,
    "level": 5,
    "timestamp": 1772430188000
  }
}
```

**Note**: Timestamp is in **milliseconds UTC** (Unix timestamp * 1000). This is XANO's native format and is more efficient for JavaScript.

### Extended Payload (For Future Sensors)

```json
{
  "channel": "glacier_live_feed/heater-telemetry",
  "data": {
    "device_uid": "345F4537C1B0",
    "power_state": 1,
    "level": 5,
    "temperature": {
      "internal": 25.3,
      "external": 30.5
    },
    "consumption": {
      "current": 10.6,
      "unit": "W"
    },
    "status": "running",
    "timestamp": 1772430188000
  }
}
```

## Field Definitions

### Required Fields (Current)

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `device_uid` | string | "345F4537C1B0" | Device identifier |
| `power_state` | number | 0 or 1 | 0 = off, 1 = on |
| `level` | number | 1-10 | Heater level/gear |
| `timestamp` | number | Milliseconds UTC | Unix timestamp in milliseconds (e.g., 1772430188000) |

### Optional Fields (Future)

| Field | Type | Description |
|-------|------|-------------|
| `temperature.internal` | number | Internal temperature (°C) |
| `temperature.external` | number | External temperature (°C) |
| `consumption.current` | number | Current power consumption (W) |
| `consumption.unit` | string | "W" (watts) |
| `status` | string | "running", "idle", "error", etc. |
| `error_code` | number | Error code if status is "error" |
| `runtime` | number | Runtime in minutes |
| `fuel_level` | number | Fuel level percentage (if available) |

## XANO Broadcast Setup

### In Telemetry Heartbeat API (Post-Processing)

**Function**: "Broadcast to WebSocket Channel"

**Channel**: `glacier_live_feed/heater-telemetry`

**Data Structure**:
```json
{
  "device_uid": "{{device_uid}}",
  "power_state": {{power_state}},
  "level": {{level}},
  "timestamp": {{timestamp_ms}}
}
```

**XANO Expression** (if using variables):
- `device_uid`: From your API response or constant
- `power_state`: From telemetry data (0 or 1)
- `level`: From telemetry data (1-10)
- `timestamp_ms`: Use XANO's timestamp function (returns milliseconds UTC)
  - In XANO: `{{timestamp()}}` or `{{now()}}` (check which returns milliseconds)
  - Should return number like `1772430188000`, not formatted string

## Frontend Integration

### Update HeaterControl Component

The component will:
1. Connect to WebSocket on mount
2. Listen for `heater-telemetry` messages
3. Update local state when messages arrive
4. Sync power state and level from device

### State Sync Flow

```
User clicks "Power On" button
  ↓
POST /commands/send_new (power_state: 1)
  ↓
Command sent to device
  ↓
Device updates state
  ↓
Telemetry heartbeat API called
  ↓
Broadcast to WebSocket: { power_state: 1, level: 5 }
  ↓
Frontend receives message
  ↓
HeaterControl updates state: powerOn = true, level = 5
  ↓
UI reflects device state ✅
```

## Payload Examples

### Power On, Level 5
```json
{
  "channel": "glacier_live_feed/heater-telemetry",
  "data": {
    "device_uid": "345F4537C1B0",
    "power_state": 1,
    "level": 5,
    "timestamp": 1772430188000
  }
}
```

### Power Off
```json
{
  "channel": "glacier_live_feed/heater-telemetry",
  "data": {
    "device_uid": "345F4537C1B0",
    "power_state": 0,
    "level": 0,
    "timestamp": 1772430488000
  }
}
```

### Level Changed to 8
```json
{
  "channel": "glacier_live_feed/heater-telemetry",
  "data": {
    "device_uid": "345F4537C1B0",
    "power_state": 1,
    "level": 8,
    "timestamp": 1772430788000
  }
}
```

## Data Validation

### Frontend Should Validate

```javascript
// Validate incoming telemetry data
const validateTelemetry = (data) => {
  // Required fields
  if (!data.device_uid) return false
  if (typeof data.power_state !== 'number') return false
  if (data.power_state !== 0 && data.power_state !== 1) return false
  if (typeof data.level !== 'number') return false
  if (data.level < 0 || data.level > 10) return false
  
  return true
}
```

## Handling State Conflicts

### Scenario: User Changes State, Then Receives Old Telemetry

**Problem**: User turns heater on, but receives old telemetry showing off

**Solution**: Use timestamp to determine which state is newer

```javascript
// Only update if telemetry is newer than local state
// Timestamp is in milliseconds UTC, easy to compare
if (telemetry.timestamp > lastUpdateTimestamp) {
  updateState(telemetry)
}
```

**Note**: With milliseconds UTC, comparison is straightforward:
```javascript
const now = Date.now() // Also milliseconds UTC
if (telemetry.timestamp > now - 5000) { // Within last 5 seconds
  // Update state
}
```

### Scenario: User Changes State, Device Confirms

**Problem**: User turns heater on, device confirms it's on

**Solution**: Update state to match device (this is correct behavior)

```javascript
// Device confirms state - update UI
setPowerOn(telemetry.power_state === 1)
setLevel(telemetry.level)
```

## Extensibility

### Adding New Fields Later

The payload structure is designed to be extensible:

```json
{
  "device_uid": "345F4537C1B0",
  "power_state": 1,
  "level": 5,
  "temperature": { ... },      // Add when available
  "consumption": { ... },       // Add when available
  "fuel_level": 85,            // Add when available
  "timestamp": "..."
}
```

**Frontend**: Will ignore unknown fields, use known fields

## XANO Post-Processing Block Example

**In your Telemetry Heartbeat API:**

1. **Function**: "Broadcast to WebSocket Channel"
2. **Channel**: `glacier_live_feed/heater-telemetry`
3. **Data**: Construct object with:
   ```json
   {
     "device_uid": "345F4537C1B0",
     "power_state": {{response.power_state}},
     "level": {{response.level}},
     "timestamp": "{{now()}}"
   }
   ```

## Testing

### Test Payload Structure

1. **Send test broadcast** from XANO
2. **Connect WebSocket** from frontend
3. **Verify** message received
4. **Check** payload structure matches
5. **Verify** component state updates

### Test State Sync

1. **Change state** via UI (turn on heater)
2. **Wait** for telemetry update
3. **Verify** UI reflects device state
4. **Check** no conflicts or flickering

## Summary

**Minimal Payload** (Start with this):
```json
{
  "device_uid": "345F4537C1B0",
  "power_state": 1,
  "level": 5,
  "timestamp": 1772430188000
}
```

**Key Points**:
- ✅ Matches current HeaterControl state
- ✅ Extensible for future sensors
- ✅ Timestamp in milliseconds UTC (efficient, easy to compare)
- ✅ Simple structure, easy to parse
- ✅ Native JavaScript format (no parsing needed)

---

Once you set up broadcasting with this payload structure, we can implement the frontend WebSocket listener to sync the state! 🚀
