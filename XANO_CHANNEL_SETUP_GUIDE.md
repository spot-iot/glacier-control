# XANO Channel Setup Guide

## Your Current Setup

**Channel Name**: `glacier_live_feed`
**Nested Channels**: Unchecked
**Anonymous Clients**: ✅ Checked (Good for public dashboard!)

## Option 1: Nested Channels (Recommended for Your Use Case)

### If You Enable Nested Channels

**Important**: You only create the **main channel** in channel management. Nested channels are created automatically when you broadcast to them!

**Format**: `CHANNEL_NAME/*`

**Your channels would be:**
- `glacier_live_feed/heater-telemetry` (created automatically)
- `glacier_live_feed/forecast` (created automatically)
- `glacier_live_feed/power` (created automatically)

**Benefits:**
- ✅ One main channel to manage
- ✅ Organized hierarchy
- ✅ Easy to add new sub-channels
- ✅ All under one namespace

**Setup:**
1. Create main channel: `glacier_live_feed` (in channel management)
2. Enable "Nested Channels" checkbox
3. Save channel

**Broadcasting:**
- Broadcast to: `glacier_live_feed/heater-telemetry` (use `/` in broadcast function, not in channel name!)
- Broadcast to: `glacier_live_feed/forecast`
- Broadcast to: `glacier_live_feed/power`

**Note**: You can't use `/` in the channel name field - that's correct! Use `/` only when broadcasting to nested channels.

**Frontend Connection:**
- Connect to: `wss://x8ki-letl-twmt.n7.xano.net/ws:glacier_live_feed`
- Subscribe to sub-channels automatically
- Or connect to specific sub-channel: `wss://x8ki-letl-twmt.n7.xano.net/ws:glacier_live_feed/heater-telemetry`

### To Enable Nested Channels

**In your channel setup:**
1. ✅ Check "Enable Nested Channels"
2. Save channel
3. Now you can broadcast to `glacier_live_feed/heater-telemetry`, etc.

## Option 2: Separate Channels (Current Setup)

### If You Keep Nested Channels Disabled

**You'll need separate channels:**
- `glacier_live_feed` (or rename to `heater-telemetry`)
- `forecast` (separate channel)
- `power` (separate channel)

**Benefits:**
- ✅ Simpler (no nesting)
- ✅ Each channel is independent
- ✅ Clear separation

**Broadcasting:**
- Broadcast to: `heater-telemetry`
- Broadcast to: `forecast`
- Broadcast to: `power`

**Frontend Connection:**
- Connect to each channel separately
- Or use one connection if XANO supports multi-channel subscription

## Recommendation: Enable Nested Channels ✅

**Why:**
- Better organization (all under `glacier_live_feed`)
- Easier to manage permissions (one main channel)
- Scalable (easy to add new sub-channels)
- Matches your use case (multiple data types)

**Your channel structure:**
```
glacier_live_feed (main channel)
  ├── heater-telemetry
  ├── forecast
  └── power (future)
```

## Channel Configuration

### Current Settings (Good!)

**Channel Status**: ✅ Enabled
**Anonymous Clients**: ✅ Checked (Perfect for public dashboard)
**Presence**: ❌ Unchecked (Not needed)
**Client Public Messaging**: ❌ Unchecked (Good - read-only)
**Client Authenticated Messaging**: ❌ Unchecked (Good - read-only)

**These settings are perfect for your use case:**
- Public read-only access (for public dashboard)
- No client messaging (commands via POST only)
- Simple and secure

## Broadcasting Setup

### In Your APIs (Post-Processing Blocks)

**Telemetry Heartbeat API:**
```
Broadcast to WebSocket Channel
  Channel: "glacier_live_feed/heater-telemetry"
  Data: {{telemetry_data}}
```

**Forecast API:**
```
Broadcast to WebSocket Channel
  Channel: "glacier_live_feed/forecast"
  Data: {{forecast_data}}
```

**Power API (Future):**
```
Broadcast to WebSocket Channel
  Channel: "glacier_live_feed/power"
  Data: {{power_data}}
```

## Frontend Connection

### With Nested Channels

**Option A: Connect to Main Channel**
```javascript
// Connects to main channel, receives all sub-channels
wsService.connect('wss://x8ki-letl-twmt.n7.xano.net/ws:glacier_live_feed')
```

**Option B: Connect to Specific Sub-Channel**
```javascript
// Connect to specific sub-channel only
wsService.connect('wss://x8ki-letl-twmt.n7.xano.net/ws:glacier_live_feed/heater-telemetry')
```

**Option C: Multiple Connections (if needed)**
```javascript
// Connect to each sub-channel separately
wsService.connect('wss://x8ki-letl-twmt.n7.xano.net/ws:glacier_live_feed/heater-telemetry')
wsService.connect('wss://x8ki-letl-twmt.n7.xano.net/ws:glacier_live_feed/forecast')
```

### Message Routing

Messages will include the full channel path:

```json
{
  "channel": "glacier_live_feed/heater-telemetry",
  "data": { ... }
}
```

```json
{
  "channel": "glacier_live_feed/forecast",
  "data": { ... }
}
```

## Next Steps

1. **Enable Nested Channels** (if you want the hierarchy)
   - Check "Enable Nested Channels" checkbox
   - Save channel

2. **Or Keep Separate Channels**
   - Create separate channels: `heater-telemetry`, `forecast`, `power`
   - Each with same permissions (Anonymous Clients enabled)

3. **Set Up Broadcasting**
   - Add broadcast function in each API's post-processing
   - Use channel names: `glacier_live_feed/heater-telemetry` (if nested) or `heater-telemetry` (if separate)

4. **Test Connection**
   - Connect from frontend
   - Verify messages received
   - Check channel names in messages

## Summary

**Your current setup is good!** 

**If you want nested channels:**
- ✅ Check "Enable Nested Channels"
- Use: `glacier_live_feed/heater-telemetry`, etc.

**If you want separate channels:**
- Keep nested disabled
- Create separate channels: `heater-telemetry`, `forecast`, `power`

**Either approach works!** Nested channels give you better organization, but separate channels are simpler. Choose based on your preference! 🚀
