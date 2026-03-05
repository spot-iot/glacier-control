# Logout Issue Analysis

## What Happened

You got logged out unexpectedly after sending commands. This is likely due to the token refresh mechanism.

## Root Cause

Looking at the code flow:

1. **Command sent successfully** → Commands work fine
2. **401 Unauthorized received** → Could happen if:
   - Access token expired (30 minutes)
   - Token validation failed on XANO side
   - Command endpoint requires fresh token

3. **Auto-refresh triggered** → API interceptor tries to refresh token
4. **Refresh failed** → If `/users/auth/refresh` endpoint doesn't exist or fails
5. **Logout triggered** → Code clears tokens and redirects to login

## Why This Happens

The API interceptor in `src/services/api.js` has this logic:

```javascript
if (error.response?.status === 401 && !originalRequest._retry) {
  // Try to refresh token
  const result = await refreshTokens()
  
  if (result.success) {
    // Retry request with new token
  } else {
    // Refresh failed - LOGOUT USER
    localStorage.removeItem('authToken')
    localStorage.removeItem('refreshToken')
    window.location.href = '/login'
  }
}
```

## Possible Scenarios

### Scenario 1: Refresh Endpoint Not Implemented
- **Issue**: `/users/auth/refresh` endpoint doesn't exist in XANO yet
- **Result**: Refresh fails → User logged out
- **Solution**: Implement the refresh endpoint in XANO

### Scenario 2: Token Expired During Command
- **Issue**: Access token expired (30 min) while using the app
- **Result**: Command returns 401 → Refresh attempted → If refresh fails, logout
- **Solution**: Ensure refresh endpoint works, or extend token lifetime

### Scenario 3: Command Endpoint Auth Issue
- **Issue**: Command endpoint (`/commands/send_new`) has stricter auth requirements
- **Result**: Returns 401 even with valid token
- **Solution**: Check XANO endpoint auth settings

### Scenario 4: Refresh Token Expired
- **Issue**: Refresh token expired (30 days) or invalid
- **Result**: Refresh fails → User logged out
- **Solution**: User needs to login again (expected behavior)

## Immediate Solutions

### Option 1: Implement Refresh Endpoint (Recommended)
Create `/users/auth/refresh` endpoint in XANO:
- Accepts `refresh_token` in body
- Returns new `access_token` and `refresh_token`
- This will prevent unexpected logouts

### Option 2: Make Logout Less Aggressive (Temporary)
Modify the interceptor to:
- Only logout on refresh failure if refresh token is actually expired
- Show error message instead of immediate logout
- Allow user to retry

### Option 3: Extend Token Lifetime (Temporary)
- Increase access token lifetime in XANO (e.g., 1 hour instead of 30 min)
- Reduces chance of expiration during use

## Debugging Steps

1. **Check Browser Console**:
   - Look for "Token refresh error" messages
   - Check for 401 errors in Network tab

2. **Check Network Tab**:
   - See if `/users/auth/refresh` is being called
   - Check response status codes
   - See if refresh endpoint exists

3. **Check Token Expiration**:
   - Decode access token (if JWT) to see expiration
   - Check if token expired before command was sent

4. **Check XANO Logs**:
   - See what error the command endpoint returned
   - Check if refresh endpoint exists and works

## Recommended Fix

**Priority 1**: Implement the refresh endpoint in XANO
- This is the proper solution
- Prevents unexpected logouts
- Enables auto-refresh to work correctly

**Priority 2**: Add better error handling
- Don't logout immediately on refresh failure
- Check if refresh token is expired first
- Show user-friendly error messages

**Priority 3**: Add logging
- Log when refresh attempts happen
- Log refresh success/failure
- Help debug future issues

## Questions to Answer

1. **Does `/users/auth/refresh` endpoint exist in XANO?**
   - If no → That's why you got logged out
   - If yes → Check if it's working correctly

2. **How long were you using the app before logout?**
   - If > 30 minutes → Token expired (expected)
   - If < 30 minutes → Other issue

3. **Did you see any error messages?**
   - Check browser console
   - Check Network tab for failed requests

## Next Steps

1. **Check if refresh endpoint exists** in XANO
2. **Implement it if missing** (see AUTH_IMPLEMENTATION.md)
3. **Test token refresh** manually
4. **Add better error handling** to prevent aggressive logouts
5. **Add logging** to help debug future issues

## State Sync Issue

You mentioned states aren't synced because we haven't implemented WebSocket telemetry yet. This is expected:

- **Current**: Local state only (what you set in UI)
- **Future**: WebSocket will update state from device
- **Solution**: Implement WebSocket connection to receive device status

This is separate from the logout issue but worth noting for the full solution.
