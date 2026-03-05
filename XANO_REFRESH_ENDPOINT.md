# XANO Refresh Endpoint Setup Guide

## Endpoint Details

- **Method**: POST
- **Path**: `/users/auth/refresh`
- **Description**: Refresh access token using refresh token

## Inputs

Instead of email/password, you only need:

1. **refresh_token** (type: text)
   - The JWT refresh token from the client

## Function Stack Logic

### Step 1: Decode/Validate Refresh Token
- **Function**: "Decode JWT" or "Validate JWT Token"
- **Purpose**: Extract user information from the refresh token
- **Returns**: Decoded token data (user_id, email, exp, etc.)
- **Returns as**: `tokenData`

**Alternative**: If XANO doesn't have a JWT decode function, you might need to:
- Use a Lambda function to decode the JWT
- Or use XANO's built-in token validation if available

### Step 2: Precondition - Check Token Expiration
- **Function**: "Precondition"
- **Condition**: `tokenData.exp > current_timestamp`
- **Purpose**: Ensure refresh token hasn't expired
- **Returns as**: (no return, just validation)

### Step 3: Get User Record
- **Function**: "Get Record From users"
- **Filter**: `id == tokenData.user_id` (or use email: `email == tokenData.email`)
- **Returns as**: `user`

**Note**: If `user_id` is null in your refresh token (as we saw earlier), you might need to use `email` instead:
- Filter: `email == tokenData.email`

### Step 4: Precondition - User Exists
- **Function**: "Precondition"
- **Condition**: `user != null`
- **Purpose**: Ensure user still exists in database
- **Returns as**: (no return, just validation)

### Step 5: Create New Authentication Token
- **Function**: "Create Authentication Token"
- **User**: Use `user` from Step 3
- **Returns as**: `authToken` (new access token)

**Settings**: 
- Set expiration (30 minutes, same as login)
- This creates a fresh access token

### Step 6: Create New Refresh Token (Lambda Function)
- **Function**: "Lambda Function" or "Custom Code"
- **Purpose**: Generate new JWT refresh token
- **Returns as**: `refreshToken`

**Lambda Code Logic** (similar to login):
```javascript
// Pseudo-code - adjust based on your XANO Lambda syntax
const jwt = require('jsonwebtoken'); // or XANO's JWT function

const payload = {
  user_id: user.id,
  email: user.email,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
};

const refreshToken = jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });

return refreshToken;
```

**Important**: 
- Use the same JWT secret as login
- Set expiration to 30 days (same as login)
- Include `user_id` and `email` in payload
- Include `exp` claim for frontend expiration checking

### Step 7: (Optional) Invalidate Old Refresh Token
- **Function**: "Update Record" or custom logic
- **Purpose**: Mark old refresh token as used/invalid
- **Note**: If you're storing refresh tokens in database, update their status
- **Alternative**: If using stateless JWT, skip this step (old token becomes invalid when new one is issued)

## Response

Return the same format as login:

```json
{
  "access_token": "{{authToken}}",
  "refresh_token": "{{refreshToken}}",
  "user": {
    "id": "{{user.id}}",
    "email": "{{user.email}}"
  }
}
```

**XANO Response Setup**:
- **KEY**: `access_token` → **VALUE**: `{{authToken}}`
- **KEY**: `refresh_token` → **VALUE**: `{{refreshToken}}`
- **KEY**: `user` → **VALUE**: `{{user}}` (or construct object with id and email)

## Key Differences from Login

| Login Endpoint | Refresh Endpoint |
|----------------|------------------|
| Input: email, password | Input: refresh_token |
| Validate password | Validate refresh token JWT |
| Get user by email | Get user by user_id/email from token |
| Create auth token | Create NEW auth token |
| Create refresh token | Create NEW refresh token |
| Return tokens | Return NEW tokens |

## Important Notes

1. **Token Rotation**: 
   - Always issue a NEW refresh token
   - Old refresh token should become invalid
   - This prevents token reuse if stolen

2. **User ID in Token**:
   - Your current refresh token has `user_id: null`
   - Consider setting `user_id: user.id` in the Lambda function
   - Makes it easier to look up user later

3. **JWT Secret**:
   - Must use the same secret as login endpoint
   - Store in XANO environment variables for security

4. **Error Handling**:
   - If token is expired → Return 401
   - If token is invalid → Return 401
   - If user not found → Return 401
   - Clear error messages help with debugging

## Testing

1. **Get refresh token** from login response
2. **Call refresh endpoint** with refresh token
3. **Verify**:
   - New access_token is different from old one
   - New refresh_token is different from old one
   - User object is returned
   - Old refresh token no longer works

## XANO-Specific Functions

If XANO has built-in functions, use:
- **"Validate JWT Token"** instead of manual decode
- **"Create JWT Token"** instead of Lambda function
- **"Get Current Timestamp"** for expiration checks

Check XANO documentation for available JWT/token functions.

## Troubleshooting

**Issue**: Can't decode JWT
- **Solution**: Use Lambda function with JWT library, or XANO's built-in JWT functions

**Issue**: User not found
- **Solution**: Check if using `user_id` or `email` from token, ensure it matches database

**Issue**: Token expiration check fails
- **Solution**: Verify timestamp format (Unix seconds vs milliseconds)

**Issue**: New tokens same as old
- **Solution**: Ensure you're generating new tokens, not returning old ones

---

Once this endpoint is created, the frontend auto-refresh will work correctly and you won't get logged out unexpectedly!
