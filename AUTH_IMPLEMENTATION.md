# Authentication Implementation Guide

## Overview

The authentication system uses **refresh token rotation** with automatic token renewal:
- **Access Token**: Managed by XANO, expires every 30 minutes
- **Refresh Token**: JWT token, expires in 30 days, auto-renewed when < 7 days remaining

## How It Works

### Token Storage
- **Access Token**: Stored in `localStorage` as `authToken`
- **Refresh Token**: Stored in `localStorage` as `refreshToken` (JWT format)
- **User Data**: Stored in `localStorage` as `user` (JSON)

### Auto-Refresh Mechanism

#### 1. Access Token Refresh (Every 25 Minutes)
- Automatically refreshes access token every 25 minutes
- 5-minute buffer before 30-minute expiration
- Uses refresh token to get new access token + new refresh token (rotation)

#### 2. Refresh Token Renewal (Daily Check)
- Checks refresh token expiration daily
- If expires in < 7 days, proactively renews
- Ensures you stay logged in as long as you use the app regularly

#### 3. Automatic Refresh on 401
- If API call returns 401 (unauthorized)
- Automatically attempts token refresh
- Retries the original request with new token
- If refresh fails, redirects to login

## XANO Backend Requirements

### Endpoints Needed

#### 1. Login Endpoint
```
POST /auth/login
Body: {
  email: string,
  password: string
}

Response: {
  access_token: string,      // XANO-managed access token
  refresh_token: string,      // JWT refresh token (30 days)
  user: {
    id: number,
    email: string,
    // ... other user fields
  }
}
```

#### 2. Refresh Endpoint
```
POST /auth/refresh
Body: {
  refresh_token: string
}

Response: {
  access_token: string,       // New access token
  refresh_token: string,      // NEW refresh token (old one invalidated)
  user: {
    id: number,
    email: string,
    // ... other user fields
  }
}
```

### Refresh Token JWT Structure

The refresh token should be a JWT with at minimum:
```json
{
  "exp": 1735689600,  // Expiration timestamp (Unix seconds)
  "user_id": 1,       // User ID
  // ... other claims
}
```

The frontend will decode this to check expiration without needing to call the API.

### XANO Configuration

1. **Access Token**:
   - Stored in XANO user table
   - Expires every 30 minutes
   - Managed by XANO's built-in authorization
   - No manual expiration handling needed

2. **Refresh Token**:
   - Generate as JWT in XANO
   - 30-day expiration
   - Include `exp` claim (expiration timestamp)
   - Include `user_id` or similar identifier

3. **Token Rotation**:
   - When `/auth/refresh` is called:
     - Validate old refresh token
     - Issue NEW refresh token
     - Invalidate old refresh token
     - Return new access token + new refresh token

## Frontend Implementation

### Files Created/Updated

1. **`src/utils/jwt.js`**
   - JWT decoding utilities
   - Expiration checking
   - Days/seconds until expiration

2. **`src/services/authService.js`**
   - Login function
   - Token refresh function
   - Token storage/retrieval
   - Refresh token renewal checking

3. **`src/services/api.js`**
   - Auto-refresh on 401 errors
   - Request queuing during refresh
   - Token injection in requests

4. **`src/contexts/AuthContext.jsx`**
   - Auto-refresh intervals
   - Token management
   - User state management

### Auto-Refresh Intervals

- **Access Token**: Every 25 minutes
- **Refresh Token Check**: Every 24 hours
- **On 401 Error**: Immediate refresh attempt

## Usage

### Login Flow
```javascript
const { login } = useAuth()
const result = await login(email, password)
if (result.success) {
  // Redirected to dashboard automatically
  // Tokens stored automatically
  // Auto-refresh started automatically
}
```

### Logout Flow
```javascript
const { logout } = useAuth()
logout()
// Clears tokens, stops intervals, redirects to login
```

### Automatic Behavior
- No manual token management needed
- Tokens refresh automatically
- User stays logged in as long as app is used regularly
- Only need to login again after 30 days of inactivity

## Testing

### Test Auto-Refresh
1. Login to dashboard
2. Wait 25 minutes (or modify interval for testing)
3. Check console for "Access token refreshed automatically"
4. Verify API calls still work

### Test Refresh Token Renewal
1. Login to dashboard
2. Modify refresh token expiration to < 7 days (for testing)
3. Wait for daily check (or trigger manually)
4. Check console for "Refresh token renewed proactively"

### Test 401 Auto-Refresh
1. Manually expire access token (or wait)
2. Make API call
3. Should automatically refresh and retry
4. Should work seamlessly

## Security Notes

1. **JWT Decoding**: Frontend JWT decoding is for expiration checking only
   - Does NOT verify signature (server-side only)
   - Never trust client-side JWT validation for security

2. **Token Storage**: Tokens stored in localStorage
   - Acceptable for single-user, single-device use case
   - Consider httpOnly cookies for production if needed

3. **Token Rotation**: Old refresh tokens invalidated immediately
   - Prevents token reuse if stolen
   - Industry best practice

4. **No Revocation**: As requested, no token revocation
   - Tokens expire naturally
   - Access tokens expire every 30 minutes
   - Refresh tokens expire after 30 days

## Troubleshooting

### Tokens Not Refreshing
- Check browser console for errors
- Verify XANO refresh endpoint is working
- Check network tab for API calls

### Auto-Logout Unexpectedly
- Check refresh token expiration
- Verify XANO endpoints return correct format
- Check for network errors

### Multiple Refresh Attempts
- Request queuing prevents multiple simultaneous refreshes
- If issues persist, check interceptor logic

## Next Steps

1. **Implement XANO Endpoints**:
   - `/auth/login` - Returns access_token, refresh_token (JWT), user
   - `/auth/refresh` - Takes refresh_token, returns new tokens

2. **Test Integration**:
   - Test login flow
   - Test auto-refresh
   - Test refresh token renewal

3. **Update Login Component**:
   - Replace placeholder login with actual API call
   - Handle errors appropriately

4. **Monitor**:
   - Watch console for refresh logs
   - Monitor token expiration
   - Verify seamless operation
