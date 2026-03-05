# Refresh Endpoint Usage

## Single Endpoint for All Refresh Scenarios

The `/users/auth/refresh` endpoint is used for **both** scenarios:

1. **Automatic refresh on 401** (access token expired)
2. **Proactive refresh token renewal** (when < 7 days remaining)

## How It Works

### Scenario 1: Access Token Expired (401 Error)
```
User makes API call → Returns 401
→ API interceptor calls /users/auth/refresh
→ Gets new access_token + new refresh_token
→ Retries original request with new access_token
```

### Scenario 2: Proactive Refresh Token Renewal
```
Daily check: Is refresh token expiring in < 7 days?
→ If yes, call /users/auth/refresh
→ Gets new access_token + new refresh_token
→ Updates stored tokens
→ Resets the 30-day clock
```

## Token Rotation

**Important**: The refresh endpoint should always return a **NEW** refresh token, not the same one.

**Why?**
- Old refresh token becomes invalid
- Prevents token reuse if stolen
- Industry best practice (OAuth 2.0)

**What happens:**
1. Client sends old refresh_token
2. Server validates it
3. Server issues NEW access_token + NEW refresh_token
4. Old refresh_token is invalidated
5. Client stores new tokens

## Endpoint Requirements

Your `/users/auth/refresh` endpoint should:

1. **Accept**: `{ "refresh_token": "..." }`
2. **Validate**: 
   - Token is valid
   - Token hasn't expired
   - User exists
3. **Return**: 
   ```json
   {
     "access_token": "new-access-token",
     "refresh_token": "new-refresh-token",  // NEW token!
     "user": { "id": 1, "email": "..." }
   }
   ```
4. **Invalidate**: Old refresh token (if stored in database)

## No Separate Endpoint Needed

You don't need:
- ❌ `/users/auth/refresh-access` (just for access token)
- ❌ `/users/auth/renew-refresh` (just for refresh token)
- ❌ `/users/auth/extend-token` (extension endpoint)

**One endpoint handles everything**: `/users/auth/refresh`

## Frontend Code

Both scenarios use the same function:

```javascript
// From authService.js
export const refreshTokens = async () => {
  const { refreshToken } = getStoredTokens()
  const response = await api.post('/users/auth/refresh', {
    refresh_token: refreshToken,
  })
  // Returns new access_token AND new refresh_token
  return response.data
}
```

## When Refresh Happens

### Automatic (401 Error)
- **Trigger**: Any API call returns 401
- **Frequency**: As needed (when access token expires)
- **User experience**: Seamless, automatic

### Proactive (Daily Check)
- **Trigger**: Daily background check
- **Condition**: Refresh token expires in < 7 days
- **Frequency**: Once per day (if condition met)
- **User experience**: Prevents expiration, keeps user logged in

## Example Timeline

**Day 1**: Login → Get tokens (30 days)
**Day 23**: Proactive refresh → New tokens (30 days from now)
**Day 53**: Proactive refresh → New tokens (30 days from now)
**...continues as long as user is active**

**If user stops using app for 30+ days:**
- Refresh token expires
- User must login again
- This is expected behavior

## Summary

✅ **One endpoint**: `/users/auth/refresh`
✅ **Handles both**: 401 auto-refresh + proactive renewal
✅ **Always returns**: New access_token + new refresh_token
✅ **Token rotation**: Old refresh token invalidated

No additional endpoints needed!
