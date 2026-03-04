# Public Read-Only Dashboard

## Overview

A public, read-only version of the dashboard is available for sharing and embedding in content (YouTube, blog posts, etc.). This allows viewers to see live data without requiring authentication or having access to controls.

## Routes

- `/public` - Public read-only dashboard
- `/view` - Alias for `/public` (shorter URL)

## Security Features

### ✅ Implemented

1. **Separate Public API Service** (`src/services/publicApi.js`)
   - Only contains GET/read-only methods
   - No authentication tokens
   - No POST/PUT/DELETE operations

2. **Component Read-Only Mode**
   - All components accept `readOnly` prop
   - Controls are disabled/hidden in public view
   - Action buttons are completely hidden

3. **Visual Indicators**
   - Blue banner at top indicating "Public View"
   - Read-only labels on components
   - Disabled state styling

4. **No Authentication Required**
   - Public route is outside protected routes
   - No login required to access

### 🔒 Backend Requirements (XANO)

When implementing the XANO backend, ensure:

1. **Separate Read-Only Endpoints**
   - Create public endpoints that only return data
   - No write operations allowed
   - Consider rate limiting for public endpoints

2. **Recommended Endpoint Structure**
   ```
   GET /api/v1/public/weather/current      - Current weather (read-only)
   GET /api/v1/public/weather/forecast     - Forecast (read-only)
   GET /api/v1/public/heater/status        - Heater status (read-only)
   GET /api/v1/public/temperature/current  - Current temps (read-only)
   GET /api/v1/public/temperature/history  - Temp history (read-only)
   ```

3. **Rate Limiting**
   - Implement rate limiting on public endpoints
   - Suggested: 60 requests per minute per IP
   - Different limits than authenticated endpoints

4. **Data Privacy**
   - Only expose non-sensitive data
   - Consider anonymizing location data if needed
   - Don't expose user information

## Usage

### For Sharing

**Direct Link:**
```
https://glaciercontrol.com/public
```

**Shorter Link:**
```
https://glaciercontrol.com/view
```

### For Embedding

The public dashboard is designed to be embeddable:

**YouTube Description:**
```
Check out the live dashboard: https://glaciercontrol.com/public
```

**Blog Post (iframe):**
```html
<iframe 
  src="https://glaciercontrol.com/public" 
  width="100%" 
  height="800px" 
  frameborder="0"
  title="Glacier Control Dashboard">
</iframe>
```

**Markdown:**
```markdown
[View Live Dashboard](https://glaciercontrol.com/public)
```

## Component Behavior

### WeatherWidget
- ✅ Shows weather data (read-only)
- ✅ Shows forecast (read-only)
- ✅ No controls to modify

### HeaterControl
- ✅ Shows heater status
- ✅ Shows current setpoint (read-only)
- ❌ No power toggle
- ❌ No setpoint controls
- ❌ No future setpoints editing

### ActionButtons
- ❌ Completely hidden in public view
- ✅ Visible only in authenticated dashboard

### TemperatureHistory
- ✅ Shows current temperatures
- ✅ Shows temperature history/charts
- ✅ Expandable detail view works
- ❌ No controls to modify

## Future Enhancements

1. **Multiple Public Dashboards**
   - Support for different locations/devices
   - `/public/location1`, `/public/location2`, etc.

2. **Embed Optimization**
   - Iframe-friendly headers
   - Responsive embed sizing
   - Mobile-optimized embed view

3. **Analytics**
   - Track public view usage
   - Monitor for abuse
   - Usage statistics

4. **Customization**
   - Allow custom branding for public view
   - Different themes for public vs authenticated

## Testing

To test the public route:

1. Navigate to `http://localhost:3000/public`
2. Verify:
   - ✅ No login required
   - ✅ Banner shows "Public View"
   - ✅ All controls are disabled/hidden
   - ✅ Data displays correctly (when API is connected)
   - ✅ Action buttons are hidden

## Notes

- The public route uses the same components as the authenticated dashboard
- Components automatically adapt based on `readOnly` prop
- When implementing Phase 2-5, ensure all new components respect the `readOnly` prop
- Always use `publicApi` service methods in public view, never the authenticated `api` service
