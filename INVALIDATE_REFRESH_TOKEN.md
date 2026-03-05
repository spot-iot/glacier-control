# Invalidating Old Refresh Tokens

## Understanding the Problem

When you issue a new refresh token, you want to ensure the old one can't be used anymore. This is called **token rotation** and prevents token reuse if stolen.

## Option 1: Stateless JWT (Simplest - Current Setup)

If you're using **stateless JWTs** (not storing tokens in database), you have a few approaches:

### Approach A: Natural Expiration (Simplest)
**How it works:**
- Old token has expiration time (30 days from when it was issued)
- New token has NEW expiration time (30 days from now)
- Old token will eventually expire naturally
- **Window of vulnerability**: Both tokens work until old one expires

**Pros:**
- Simple, no database needed
- Works with current JWT setup

**Cons:**
- Old token still works until it expires (security risk)
- Not true "invalidation"

**Implementation:**
- Just issue new token with new expiration
- No additional steps needed

### Approach B: Token Version/Nonce (Better Security)
**How it works:**
- Add a `nonce` or `version` field to JWT payload
- Store current `nonce` in user record
- When validating refresh token, check if `nonce` matches user's current `nonce`
- When issuing new token, increment `nonce` in user record
- Old token's `nonce` won't match → invalid

**Implementation in XANO:**

1. **Add field to users table:**
   - Field: `refresh_token_nonce` (type: number, default: 0)

2. **When creating refresh token (Login endpoint):**
   ```javascript
   // In Lambda function
   const nonce = user.refresh_token_nonce || 0;
   const payload = {
     user_id: user.id,
     email: user.email,
     nonce: nonce,  // Include nonce
     iat: Math.floor(Date.now() / 1000),
     exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
   };
   ```

3. **In Refresh endpoint - Step 3 (Get User):**
   - Get user record (already doing this)

4. **In Refresh endpoint - Add new step (Validate Nonce):**
   - **Function**: "Precondition"
   - **Condition**: `tokenData.nonce == user.refresh_token_nonce`
   - **Purpose**: Ensure token's nonce matches user's current nonce
   - If mismatch → Token is old/invalid → Return 401

5. **In Refresh endpoint - Before creating new tokens:**
   - **Function**: "Update Record" (users table)
   - **Field**: `refresh_token_nonce`
   - **Value**: `user.refresh_token_nonce + 1` (increment)
   - **Purpose**: Invalidate all old tokens

6. **When creating new refresh token:**
   - Use new incremented `nonce` value

**Result:**
- Old token has `nonce: 0`
- User's `refresh_token_nonce` is now `1`
- Old token validation fails → Invalidated ✅

## Option 2: Database Token Storage (Most Secure)

Store refresh tokens in a database table and mark them as used.

### Implementation in XANO:

1. **Create table: `refresh_tokens`**
   - `id` (primary key)
   - `user_id` (foreign key to users)
   - `token_hash` (hashed version of token, or just store token)
   - `is_active` (boolean, default: true)
   - `expires_at` (timestamp)
   - `created_at` (timestamp)

2. **In Login endpoint - After creating refresh token:**
   - **Function**: "Create Record" (refresh_tokens table)
   - Store the refresh token
   - Set `is_active = true`

3. **In Refresh endpoint - Before validating:**
   - **Function**: "Get Record From refresh_tokens"
   - **Filter**: `token_hash == hash(refresh_token)` AND `is_active == true`
   - **Returns as**: `tokenRecord`

4. **Precondition:**
   - **Function**: "Precondition"
   - **Condition**: `tokenRecord != null`
   - If null → Token not found or already used → Return 401

5. **In Refresh endpoint - Before creating new tokens:**
   - **Function**: "Update Record" (refresh_tokens table)
   - **Filter**: `id == tokenRecord.id`
   - **Field**: `is_active`
   - **Value**: `false`
   - **Purpose**: Mark old token as used/invalid

6. **After creating new refresh token:**
   - **Function**: "Create Record" (refresh_tokens table)
   - Store new refresh token
   - Set `is_active = true`

**Result:**
- Old token marked as `is_active = false`
- Validation fails → Invalidated ✅

## Option 3: Single Active Token Per User (Simpler Database Approach)

Only allow one active refresh token per user at a time.

### Implementation in XANO:

1. **Add field to users table:**
   - Field: `current_refresh_token` (type: text, nullable)
   - Or: `last_refresh_token_id` (if using tokens table)

2. **In Login endpoint - After creating refresh token:**
   - **Function**: "Update Record" (users table)
   - **Field**: `current_refresh_token`
   - **Value**: `refreshToken` (the JWT string)

3. **In Refresh endpoint - Step 3 (Get User):**
   - Get user record (already doing this)

4. **In Refresh endpoint - Add new step (Validate Token):**
   - **Function**: "Precondition"
   - **Condition**: `tokenString == user.current_refresh_token`
   - **Purpose**: Ensure token matches user's current token
   - If mismatch → Token is old → Return 401

5. **In Refresh endpoint - Before creating new tokens:**
   - **Function**: "Update Record" (users table)
   - **Field**: `current_refresh_token`
   - **Value**: `null` (temporarily, or skip this step)

6. **After creating new refresh token:**
   - **Function**: "Update Record" (users table)
   - **Field**: `current_refresh_token`
   - **Value**: `newRefreshToken` (the new JWT string)

**Result:**
- Old token doesn't match `user.current_refresh_token`
- Validation fails → Invalidated ✅

## Recommendation

For your use case (single user, XANO backend), I recommend **Option 1B: Token Version/Nonce**.

**Why:**
- ✅ Simple to implement
- ✅ No new database table needed
- ✅ Works with stateless JWTs
- ✅ True invalidation (old tokens stop working immediately)
- ✅ Good security without complexity

## Implementation Steps (Option 1B - Nonce)

1. **Add field to users table:**
   - `refresh_token_nonce` (number, default: 0)

2. **Update Login endpoint Lambda:**
   - Include `nonce: user.refresh_token_nonce` in JWT payload

3. **Update Refresh endpoint:**
   - Add precondition: `tokenData.nonce == user.refresh_token_nonce`
   - Before creating new tokens: Increment `user.refresh_token_nonce`
   - Include new `nonce` in new refresh token

4. **Result:**
   - Old token has old nonce → Validation fails → Invalidated ✅

## Alternative: Don't Invalidate (Acceptable for Single User)

If you're the only user and security isn't critical:
- Just issue new tokens
- Old tokens expire naturally in 30 days
- Accept the small window where both work
- Simpler, but less secure

## Summary

**Simplest**: Don't invalidate (just issue new tokens)
**Recommended**: Use nonce/version approach (Option 1B)
**Most Secure**: Database token storage (Option 2)

Choose based on your security requirements!
