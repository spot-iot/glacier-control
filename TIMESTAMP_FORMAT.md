# Timestamp Format Recommendation

## Recommendation: Milliseconds UTC (Native XANO Format) ✅

**Format**: Number (milliseconds since Unix epoch)
**Example**: `1772430188000`

## Why Milliseconds UTC?

### Advantages

1. **Efficiency**
   - Smaller payload size (number vs string)
   - No string parsing needed
   - Faster JSON serialization/deserialization

2. **JavaScript Native**
   - `Date.now()` returns milliseconds UTC
   - `new Date(timestamp)` works directly
   - Easy to compare: `timestamp1 > timestamp2`
   - No parsing overhead

3. **Easy Comparisons**
   ```javascript
   // Compare timestamps
   if (telemetry.timestamp > lastUpdateTimestamp) {
     // Update state
   }
   
   // Check if recent (within last 5 seconds)
   const now = Date.now()
   if (telemetry.timestamp > now - 5000) {
     // Recent data
   }
   ```

4. **XANO Native**
   - XANO's `timestamp()` or `now()` functions return milliseconds
   - No conversion needed
   - Matches database timestamp format

5. **Time Zone Independent**
   - UTC is universal
   - No timezone conversion issues
   - Consistent across servers/clients

### Disadvantages

1. **Not Human-Readable**
   - `1772430188000` vs `"2026-03-04T10:30:00Z"`
   - Need to convert for display/logging

2. **Easy to Convert When Needed**
   ```javascript
   // Convert to readable format when needed
   const date = new Date(timestamp)
   const readable = date.toISOString() // "2026-03-04T10:30:00.000Z"
   ```

## Comparison

### Milliseconds UTC (Recommended)
```json
{
  "timestamp": 1772430188000
}
```

**Frontend Usage:**
```javascript
// Direct comparison
if (data.timestamp > lastTimestamp) { ... }

// Convert to Date object
const date = new Date(data.timestamp)

// Format for display
const formatted = new Date(data.timestamp).toLocaleString()
```

### ISO 8601 String (Alternative)
```json
{
  "timestamp": "2026-03-04T10:30:00Z"
}
```

**Frontend Usage:**
```javascript
// Need to parse first
const timestamp = new Date(data.timestamp).getTime()

// Then compare
if (timestamp > lastTimestamp) { ... }
```

## XANO Implementation

### In Post-Processing Block

**Use XANO's timestamp function:**
- `{{timestamp()}}` - Returns milliseconds UTC (number)
- `{{now()}}` - Check XANO docs for format

**Data Structure:**
```json
{
  "device_uid": "345F4537C1B0",
  "power_state": {{power_state}},
  "level": {{level}},
  "timestamp": {{timestamp()}}
}
```

**Result:**
```json
{
  "device_uid": "345F4537C1B0",
  "power_state": 1,
  "level": 5,
  "timestamp": 1772430188000
}
```

## Frontend Handling

### Receiving Timestamp

```javascript
// WebSocket message received
const telemetry = {
  device_uid: "345F4537C1B0",
  power_state: 1,
  level: 5,
  timestamp: 1772430188000  // Milliseconds UTC
}

// Compare with last update
if (telemetry.timestamp > lastUpdateTimestamp) {
  updateState(telemetry)
  lastUpdateTimestamp = telemetry.timestamp
}
```

### Displaying Timestamp

```javascript
// Convert to readable format when displaying
const displayTime = new Date(telemetry.timestamp).toLocaleString()
// "3/4/2026, 10:30:00 AM"

// Or ISO format
const isoTime = new Date(telemetry.timestamp).toISOString()
// "2026-03-04T10:30:00.000Z"
```

### Calculating Time Differences

```javascript
// Time since update
const now = Date.now()
const timeSinceUpdate = now - telemetry.timestamp
const secondsAgo = Math.floor(timeSinceUpdate / 1000)

// Check if data is stale (> 60 seconds old)
if (timeSinceUpdate > 60000) {
  console.warn('Telemetry data is stale')
}
```

## Summary

✅ **Use Milliseconds UTC** (Native XANO format)
- More efficient
- Easier to work with in JavaScript
- Native format, no conversion needed
- Better for comparisons and calculations

**Format**: `1772430188000` (number, milliseconds UTC)

**When you need human-readable**: Convert with `new Date(timestamp).toISOString()` or `.toLocaleString()`

---

This is the recommended approach for your WebSocket payload! 🚀
