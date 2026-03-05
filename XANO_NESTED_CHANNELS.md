# XANO Nested Channels - How They Work

## Important: You Don't Create Nested Channels Separately!

When you enable "Nested Channels" on a channel, you **don't create the sub-channels in the channel management interface**. Instead, nested channels are created **automatically** when you broadcast to them.

## How It Works

### Step 1: Create Main Channel Only

**In XANO Channel Management:**
- Create channel: `glacier_live_feed`
- ✅ Enable "Nested Channels" checkbox
- Save channel

**That's it!** You only create the main channel.

### Step 2: Broadcast to Nested Channels

**In your API post-processing blocks**, you broadcast to the **full nested path**:

**Telemetry Heartbeat API:**
```
Broadcast to WebSocket Channel
  Channel: "glacier_live_feed/heater-telemetry"  ← Full path with /
  Data: {{telemetry_data}}
```

**Forecast API:**
```
Broadcast to WebSocket Channel
  Channel: "glacier_live_feed/forecast"  ← Full path with /
  Data: {{forecast_data}}
```

**Power API:**
```
Broadcast to WebSocket Channel
  Channel: "glacier_live_feed/power"  ← Full path with /
  Data: {{power_data}}
```

## Key Points

1. **Main Channel**: Created in channel management (`glacier_live_feed`)
2. **Nested Channels**: Created automatically when you broadcast to them
3. **Naming**: Use the full path with `/` in the broadcast function, not in channel management
4. **No Separate Creation**: You don't need to create `heater-telemetry`, `forecast`, etc. as separate channels

## Channel Name Rules

**In Channel Management (Creating Channels):**
- ✅ Alphanumeric characters
- ✅ Underscores (`_`)
- ✅ Dashes (`-`)
- ❌ No slashes (`/`) - This is why you can't name nested channels here!

**In Broadcast Function (Using Channels):**
- ✅ Full path with slashes: `glacier_live_feed/heater-telemetry`
- ✅ This is where you use the `/` character

## Example Flow

### 1. Channel Management
```
Create Channel:
  Name: "glacier_live_feed"
  Enable Nested Channels: ✅
  Save
```

### 2. Broadcasting (Post-Processing Blocks)
```
Broadcast Function:
  Channel: "glacier_live_feed/heater-telemetry"  ← Use / here
  Data: {...}
```

### 3. Frontend Connection
```javascript
// Connect to main channel (receives all nested channels)
wsService.connect('wss://.../ws:hash:glacier_live_feed')

// Or connect to specific nested channel
wsService.connect('wss://.../ws:hash:glacier_live_feed/heater-telemetry')
```

## What Happens Behind the Scenes

1. You create main channel: `glacier_live_feed` (with nested enabled)
2. You broadcast to: `glacier_live_feed/heater-telemetry`
3. XANO automatically creates the nested channel
4. Clients can now subscribe to that nested channel
5. Future broadcasts to the same nested channel work immediately

## Testing

1. **Create main channel** with nested enabled
2. **Broadcast to nested channel** from an API
3. **Connect from frontend** to the nested channel
4. **Verify** you receive messages

## Troubleshooting

**Issue**: Can't use `/` in channel name field
- **Solution**: That's correct! Use `/` only in the broadcast function, not in channel management

**Issue**: Nested channel not receiving messages
- **Check**: Did you enable "Nested Channels" on the main channel?
- **Check**: Are you using the full path in broadcast? (`glacier_live_feed/heater-telemetry`)
- **Check**: Is the main channel name correct?

**Issue**: Don't see nested channels in channel list
- **Solution**: That's normal! Nested channels don't appear in the channel management list. They exist only when you broadcast to them.

## Summary

✅ **Create**: Only the main channel (`glacier_live_feed`) in channel management
✅ **Enable**: "Nested Channels" checkbox on the main channel
✅ **Broadcast**: Use full paths with `/` in the broadcast function (`glacier_live_feed/heater-telemetry`)
✅ **Connect**: Use full paths in WebSocket URLs

**You don't create nested channels separately - they're created automatically when you broadcast to them!** 🚀
