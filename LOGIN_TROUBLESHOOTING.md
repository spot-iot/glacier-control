# Login Troubleshooting Guide

## Quick Checks

### 1. Check Browser Console
Open browser DevTools (F12) → Console tab and look for:
- Network errors (CORS, 401, 500, etc.)
- JavaScript errors
- Failed API calls

### 2. Check Network Tab
Open DevTools → Network tab → Try to login → Look for:
- `/users/auth/login` request
- Status code (200 = success, 401 = auth failed, 500 = server error)
- Response body (check for error messages)

### 3. Check localStorage
Open DevTools → Application/Storage → Local Storage → Check for:
- `authToken` (should exist after successful login)
- `refreshToken` (should exist after successful login)
- `user` (should exist after successful login)

### 4. Clear Browser Data
Try clearing:
- Cookies for `glaciercontrol.com`
- Local Storage for `glaciercontrol.com`
- Cache

## Common Issues

### Issue: "Login failed" but no specific error

**Possible Causes:**
1. **CORS Error** - XANO not allowing requests from your domain
2. **Environment Variable Missing** - `VITE_API_BASE_URL` not set in Vercel
3. **Network Error** - Can't reach XANO API

**Fix:**
1. Check browser console for CORS errors
2. Verify environment variables in Vercel dashboard
3. Check if XANO API is accessible

### Issue: Works on one device but not another

**Possible Causes:**
1. **DNS Propagation** - Different DNS cache on different devices
2. **Browser Cache** - Old cached version
3. **localStorage Issues** - Corrupted tokens

**Fix:**
1. Clear browser cache and localStorage
2. Try incognito/private mode
3. Check DNS propagation: `dig glaciercontrol.com` on both devices

### Issue: Works once, then fails on second attempt

**Possible Causes:**
1. **Token Refresh Issue** - Refresh token expired or invalid
2. **Session Issue** - XANO session management
3. **localStorage Corruption** - Tokens not saving properly

**Fix:**
1. Clear localStorage and try again
2. Check browser console for token refresh errors
3. Check XANO logs for authentication errors

### Issue: DNS still pointing to Porkbun

**Check:**
```bash
dig glaciercontrol.com
nslookup glaciercontrol.com
```

**Fix:**
- Wait for DNS propagation (can take 24-48 hours)
- Clear DNS cache: `sudo dscacheutil -flushcache` (macOS)
- Try different network (mobile data vs WiFi)

## XANO Configuration Checks

### 1. CORS Settings
In XANO, check API group settings:
- Allowed Origins should include:
  - `https://glaciercontrol.com`
  - `https://www.glaciercontrol.com`
  - `http://localhost:3000` (for local dev)

### 2. Login Endpoint
Verify `/users/auth/login` endpoint:
- Method: POST
- No authentication required
- Returns: `{ access_token, refresh_token, user }`

### 3. Environment Variables in Vercel
Check Vercel dashboard → Settings → Environment Variables:
- `VITE_API_BASE_URL` should be: `https://x8ki-letl-twmt.n7.xano.io/api:Gw3_pzGF`
- Make sure it's set for **Production** environment

## Debug Steps

### Step 1: Check Console Logs
The login function logs to console:
- `🔐 Attempting login to: [URL]`
- `✅ Login successful, response: [data]`
- `❌ Login error: [error]`

Look for these in browser console.

### Step 2: Test API Directly
Try calling the login endpoint directly:

```bash
curl -X POST https://x8ki-letl-twmt.n7.xano.io/api:Gw3_pzGF/users/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}'
```

If this works, the issue is in the frontend. If it fails, the issue is in XANO.

### Step 3: Check Network Request
In browser DevTools → Network:
1. Filter by "login"
2. Click on the request
3. Check:
   - **Request URL**: Should be correct
   - **Request Method**: Should be POST
   - **Request Headers**: Should have `Content-Type: application/json`
   - **Request Payload**: Should have email and password
   - **Response Status**: 200 = success, 401 = wrong credentials, 500 = server error
   - **Response Body**: Check for error messages

### Step 4: Check localStorage
After attempting login, check:
```javascript
// In browser console:
localStorage.getItem('authToken')
localStorage.getItem('refreshToken')
localStorage.getItem('user')
```

If these are null after login, tokens aren't being saved.

## Quick Fixes

### Fix 1: Clear Everything and Retry
```javascript
// In browser console:
localStorage.clear()
sessionStorage.clear()
// Then refresh page and try login again
```

### Fix 2: Check Environment Variables
In Vercel:
1. Go to project → Settings → Environment Variables
2. Verify `VITE_API_BASE_URL` is set
3. Make sure it's for **Production** environment
4. Redeploy if you just added it

### Fix 3: Test on Different Browser/Device
- Try incognito/private mode
- Try different browser
- Try different device/network

### Fix 4: Check XANO Request History
1. Go to XANO dashboard
2. Check Request History
3. Look for `/users/auth/login` requests
4. Check if they're failing and why

## Still Not Working?

1. **Share browser console errors** (screenshot or copy/paste)
2. **Share network request details** (from DevTools → Network)
3. **Check XANO request history** for login attempts
4. **Verify environment variables** are set correctly in Vercel
