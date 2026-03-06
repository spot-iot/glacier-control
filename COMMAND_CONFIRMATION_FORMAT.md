# Command Confirmation WebSocket Message Format

## Expected JSON Structure

When ESP32 sends a command confirmation to XANO, it should be broadcast to the `glacier_live_feed` channel with the following structure:

### Full Message Structure (as received by frontend)

```json
{
  "action": "event",
  "payload": {
    "data": {
      "type": "command_confirmation",
      "command_id": 31,
      "status": "success",
      "command_type": "POWER",
      "command_value": 1,
      "device_uid": "345F4537C1B0",
      "current_state": {
        "power_state": 1,
        "level": 5
      },
      "timestamp": 1772776642781
    }
  }
}
```

### Minimal Required Fields (For Testing Without ESP32 Reflash)

The frontend requires these fields (minimum to test the confirmation flow):

```json
{
  "action": "event",
  "payload": {
    "data": {
      "type": "command_confirmation",
      "command_id": 31,
      "status": "success"
    }
  }
}
```

**Note**: With minimal structure, the UI will update from the next regular telemetry message. The confirmation will clear the pending state and show the success toast, but the UI state will sync when the next heartbeat/telemetry arrives.

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | ✅ Yes | Must be `"command_confirmation"` |
| `command_id` | number | ✅ Yes | The command ID from XANO (matches the `id` returned when command was queued) |
| `status` | string | ✅ Yes | `"success"` or `"failed"` |
| `command_type` | string | ❌ Optional | `"POWER"` or `"LEVEL"` (used in toast messages) |
| `command_value` | number | ❌ Optional | The value that was sent (1/0 for POWER, 1-10 for LEVEL) |
| `device_uid` | string | ❌ Optional | Device UID (for validation) |
| `current_state` | object | ❌ Optional | Current device state after command execution |
| `current_state.power_state` | number | ❌ Optional | 0 or 1 (if current_state is provided) |
| `current_state.level` | number | ❌ Optional | 1-10 (if current_state is provided) |
| `timestamp` | number | ❌ Optional | Milliseconds UTC timestamp |

## Examples

### Success Confirmation (POWER ON)

```json
{
  "action": "event",
  "payload": {
    "data": {
      "type": "command_confirmation",
      "command_id": 31,
      "status": "success",
      "command_type": "POWER",
      "command_value": 1,
      "device_uid": "345F4537C1B0",
      "current_state": {
        "power_state": 1,
        "level": 5
      },
      "timestamp": 1772776642781
    }
  }
}
```

### Success Confirmation (LEVEL CHANGE)

```json
{
  "action": "event",
  "payload": {
    "data": {
      "type": "command_confirmation",
      "command_id": 32,
      "status": "success",
      "command_type": "LEVEL",
      "command_value": 7,
      "device_uid": "345F4537C1B0",
      "current_state": {
        "power_state": 1,
        "level": 7
      },
      "timestamp": 1772776642781
    }
  }
}
```

### Failed Confirmation

```json
{
  "action": "event",
  "payload": {
    "data": {
      "type": "command_confirmation",
      "command_id": 33,
      "status": "failed",
      "command_type": "POWER",
      "command_value": 1,
      "device_uid": "345F4537C1B0",
      "timestamp": 1772776642781
    }
  }
}
```

## How It Works

1. **User sends command** → XANO queues it and returns `{ id: 31, ... }`
2. **Frontend stores pending command** → `command_id: 31, type: 'POWER', value: 1`
3. **ESP32 executes command** → Sends confirmation to XANO
4. **XANO broadcasts confirmation** → To `glacier_live_feed` channel
5. **Frontend receives confirmation** → Matches `command_id: 31` to pending command
6. **Frontend clears pending** → Updates UI, shows success toast

## XANO Backend Setup

In your XANO endpoint that receives the ESP32 confirmation:

1. **Receive confirmation from ESP32** (via API endpoint)
2. **Broadcast to WebSocket channel** using "Broadcast to WebSocket Channel" function:
   - Channel: `glacier_live_feed`
   - Data: The confirmation JSON (as shown above)

## Notes

- The `command_id` must match the `id` returned when the command was originally queued
- If `current_state` is provided, it will be used to update the UI immediately
- If `current_state` is not provided, the UI will wait for the next regular telemetry update
- The frontend will show appropriate toasts based on `status`:
  - `"success"` → Green "Command confirmed" toast
  - `"failed"` → Red "Command failed" toast
