# XANO WebSocket Connection Setup

## Connection Hash

XANO uses a **connection hash** (also called "realtime canonical") for WebSocket connections. This is unique to your XANO instance.

**Your Connection Hash**: `04aMV5lTFz_cBcFaEa8SNE7bCyI`

## Environment Variables

Add to your `.env` file:

```env
# XANO WebSocket Connection
VITE_WS_CONNECTION_HASH=04aMV5lTFz_cBcFaEa8SNE7bCyI
VITE_WS_BASE_URL=wss://x8ki-letl-twmt.n7.xano.net
```

## WebSocket URL Format

XANO WebSocket URLs use this format:

```
wss://base-url/ws:connection-hash:channel-name
```

### Examples

**Main Channel:**
```
wss://x8ki-letl-twmt.n7.xano.net/ws:04aMV5lTFz_cBcFaEa8SNE7bCyI:glacier_live_feed
```

**Nested Channel (if enabled):**
```
wss://x8ki-letl-twmt.n7.xano.net/ws:04aMV5lTFz_cBcFaEa8SNE7bCyI:glacier_live_feed/heater-telemetry
```

**Separate Channel:**
```
wss://x8ki-letl-twmt.n7.xano.net/ws:04aMV5lTFz_cBcFaEa8SNE7bCyI:heater-telemetry
```

## Frontend Usage

The WebSocket service now includes a helper function:

```javascript
import { buildWebSocketURL } from './services/websocket'

// Build URL for a channel
const url = buildWebSocketURL('glacier_live_feed')
// Returns: wss://x8ki-letl-twmt.n7.xano.net/ws:04aMV5lTFz_cBcFaEa8SNE7bCyI:glacier_live_feed

// Connect
wsService.connect(url)
```

## Connection Hash Location

You can find your connection hash in:
- XANO Dashboard → Settings → Realtime/WebSocket
- Or in the channel creation/management interface

## Security Note

The connection hash is **not secret** - it's used to identify your XANO instance's WebSocket server. It's safe to include in frontend code and environment variables.

## Updating Connection Hash

If your connection hash changes:
1. Update `.env` file
2. Update Vercel environment variables (if deployed)
3. Restart dev server (if running)
4. No code changes needed (uses environment variable)

---

The connection hash is now stored in environment variables and used automatically! 🚀
