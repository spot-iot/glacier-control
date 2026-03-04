# XANO API Setup

## Base URL
```
https://x8ki-letl-twmt.n7.xano.io/api:Gw3_pzGF
```

## Endpoints

### Login
```
POST /users/auth/login
Body: {
  email: string,
  password: string
}
```

### Refresh Token (to be implemented)
```
POST /users/auth/refresh
Body: {
  refresh_token: string
}
```

## Environment Variable

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=https://x8ki-letl-twmt.n7.xano.io/api:Gw3_pzGF
```

Or the code will use the default URL above.

## Response Format

XANO login response format (confirmed working):
```json
{
  "access_token": "eyJhbGciOiJBMjU2S1ciLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwiemlwIjoiREVGIn0...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "m.l.akister@gmail.com"
  }
}
```

### Refresh Token JWT Structure
The refresh token is a JWT with:
- `exp`: Expiration timestamp (Unix seconds) - ~30 days
- `iat`: Issued at timestamp
- `email`: User email
- `user_id`: User ID (currently null, can be set in XANO)

The frontend decodes this to check expiration without needing the JWT secret.

## Next Steps

1. **Test Login Endpoint**: 
   - The login endpoint is now configured
   - Test with your credentials

2. **Implement Refresh Endpoint**:
   - Create `/users/auth/refresh` endpoint in XANO
   - Should accept `refresh_token` in body
   - Should return new `authToken` and `refresh_token`
   - Should invalidate old refresh token

3. **Verify Response Format**:
   - Check what XANO actually returns
   - Update field names in `authService.js` if needed

## Testing

1. Try logging in through the app
2. Check browser console for any errors
3. Check Network tab to see the actual API response
4. Adjust field names in `authService.js` if XANO uses different names

## Notes

- **JWT Secret**: Not needed for frontend - we only decode to read expiration
- **Token Verification**: Done server-side in XANO (secure)
- **Refresh Token**: Should be a JWT with `exp` claim for expiration checking
