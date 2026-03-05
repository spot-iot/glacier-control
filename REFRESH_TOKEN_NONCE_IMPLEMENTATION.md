# Refresh Token Nonce Implementation Checklist

## Overview
Using Option 1B: Token Nonce/Version approach for refresh token invalidation.

## Step 1: Add Field to Users Table

**In XANO:**
1. Go to your `users` table
2. Add new field:
   - **Name**: `refresh_token_nonce`
   - **Type**: Number (Integer)
   - **Default Value**: `0`
   - **Required**: No (can be null initially)

## Step 2: Update Login Endpoint Lambda

**In your Login endpoint Lambda function** (the one that creates refresh_token):

**Current code probably has:**
```javascript
const payload = {
  user_id: user.id,
  email: user.email,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
};
```

**Update to:**
```javascript
const nonce = user.refresh_token_nonce || 0;  // Get current nonce, default to 0

const payload = {
  user_id: user.id,
  email: user.email,
  nonce: nonce,  // ADD THIS LINE
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
};
```

## Step 3: Update Refresh Endpoint

### Step 3a: Decode Token (Already have this)
- Decode JWT to get `tokenData`
- Should include: `user_id`, `email`, `nonce`, `exp`, `iat`

### Step 3b: Get User Record (Already have this)
- Get user by `tokenData.user_id`
- Returns as: `user`

### Step 3c: Add Nonce Validation (NEW STEP)
**Add this BEFORE creating new tokens:**

1. **Function**: "Precondition"
2. **Condition**: `tokenData.nonce == user.refresh_token_nonce`
3. **Purpose**: Ensure token's nonce matches user's current nonce
4. **If false**: Token is old/invalid → Endpoint returns error (401)

**XANO Setup:**
- Add precondition function
- Condition: `{{tokenData.nonce}} == {{user.refresh_token_nonce}}`
- If condition fails, endpoint should return 401

### Step 3d: Increment Nonce (NEW STEP)
**Add this BEFORE creating new tokens:**

1. **Function**: "Update Record" (users table)
2. **Filter**: `id == user.id`
3. **Field to Update**: `refresh_token_nonce`
4. **Value**: `{{user.refresh_token_nonce}} + 1`
   - Or use XANO's expression: `user.refresh_token_nonce + 1`

**Purpose**: Invalidate all old tokens by incrementing nonce

### Step 3e: Create New Tokens (Already have this)
- Create new `authToken`
- Create new `refreshToken` in Lambda

**In Lambda for new refresh token:**
```javascript
const newNonce = user.refresh_token_nonce + 1;  // Use incremented nonce

const payload = {
  user_id: user.id,
  email: user.email,
  nonce: newNonce,  // Use new nonce
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
};
```

## Step 4: Test the Flow

### Test 1: Login
1. Login → Get refresh token
2. Decode token → Should have `nonce: 0` (or current nonce)
3. Check user record → `refresh_token_nonce` should be 0

### Test 2: Refresh
1. Call refresh endpoint with token from Test 1
2. Should get new tokens
3. Decode new refresh token → Should have `nonce: 1`
4. Check user record → `refresh_token_nonce` should be 1

### Test 3: Old Token Invalid
1. Try to use OLD refresh token (from Test 1)
2. Should fail → Old token has `nonce: 0`, user has `nonce: 1`
3. Precondition fails → Returns 401

## Function Stack Order (Refresh Endpoint)

1. **Decode JWT Token** → `tokenData`
2. **Precondition**: `tokenData.exp > current_timestamp` (token not expired)
3. **Get Record From users** → `user` (by `tokenData.user_id`)
4. **Precondition**: `user != null` (user exists)
5. **Precondition**: `tokenData.nonce == user.refresh_token_nonce` ⭐ NEW
6. **Update Record** (users): Increment `refresh_token_nonce` ⭐ NEW
7. **Create Authentication Token** → `authToken`
8. **Lambda Function**: Create new refresh token with new nonce → `refreshToken`
9. **Response**: Return `{ access_token, refresh_token, user }`

## Important Notes

1. **Order Matters**: 
   - Validate nonce BEFORE incrementing
   - Increment BEFORE creating new tokens
   - Use incremented nonce in new token

2. **Initial State**:
   - Existing users might have `null` nonce
   - Use `user.refresh_token_nonce || 0` in code
   - Or set default to 0 in database

3. **Error Handling**:
   - If nonce doesn't match → Return 401
   - Clear error message: "Refresh token has been revoked"

4. **Migration**:
   - Existing refresh tokens (without nonce) will fail validation
   - Users will need to login again (one-time)
   - New tokens will have nonce

## Security Benefits

✅ **Immediate Invalidation**: Old tokens stop working as soon as new one is issued
✅ **No Database Lookup**: Still stateless JWT validation
✅ **Simple**: Just one number field
✅ **Upgrade Path**: Can move to database storage later if needed

## Troubleshooting

**Issue**: Nonce validation always fails
- **Check**: Are you comparing the right values?
- **Check**: Is nonce included in JWT payload?
- **Check**: Is user's nonce being read correctly?

**Issue**: Old tokens still work
- **Check**: Did you increment nonce before creating new token?
- **Check**: Is new token using incremented nonce?

**Issue**: Can't refresh after login
- **Check**: Is nonce being set in login endpoint?
- **Check**: Is nonce validation step in refresh endpoint?

---

Once implemented, old refresh tokens will be immediately invalidated when new ones are issued! 🎉
