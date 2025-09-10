# Backoffice Admin Access Fix

## Problem Identified

The backoffice was only showing submissions from the wallet that was currently logged in, instead of showing ALL submissions from ALL wallets. This was incorrect behavior because:

1. **Frontend users** should only see their own submissions
2. **Backoffice admins** should see ALL submissions from ALL users

## Root Cause Analysis

The issue was in the authentication system:

1. **Backoffice was using local tokens** (`admin_jwt_...`) instead of backend JWT tokens
2. **Backend couldn't verify** the local tokens, so it treated backoffice requests as regular user requests
3. **Backend logic was correct** but wasn't being triggered because the authentication failed

## Backend Logic (Already Correct)

The backend had the correct logic in `/api/submissions` endpoint:

```typescript
// Check if this is a backoffice request
const isBackofficeRequest = req.headers["x-backoffice-request"] === "true";

// Check if user is admin
const isAdmin = user?.role === "ADMIN";

if (isAdmin && isBackofficeRequest) {
  // Admin in backoffice can see all submissions
  result = await submissionService.getAll({...});
} else {
  // All users (including admins) in frontend can only see their own submissions
  result = await submissionService.getByUser(walletAddress, {...});
}
```

## Solution Implemented

### 1. Fixed Backoffice Authentication

**File**: `backoffice/lib/api-service.ts`
- Added missing `authenticateAdmin` method
- Method now calls backend authentication endpoints to get real JWT tokens

```typescript
async authenticateAdmin(walletAddress: string, signature: string): Promise<{ token: string }> {
  // First get a challenge
  const challengeResponse = await this.generateChallenge(walletAddress)
  
  // Then verify the signature with the challenge
  return this.verifySignature(walletAddress, signature, challengeResponse.challenge)
}
```

### 2. Updated Wallet Login Flow

**File**: `backoffice/app/api/auth/wallet-login/route.ts`
- Changed from generating local tokens to using backend JWT tokens
- Now calls `apiService.authenticateAdmin()` to get real JWT from backend

```typescript
// OLD: Generate local token
const token = `admin_jwt_${Date.now()}_${Math.random().toString(36).substring(7)}`

// NEW: Get real JWT from backend
const backendAuth = await apiService.authenticateAdmin(walletAddress, signature)
const token = backendAuth.token
```

## How It Works Now

### Frontend (User Isolation)
1. User logs in with wallet
2. Frontend gets JWT token from backend
3. Frontend makes requests to `/api/submissions` (no `x-backoffice-request` header)
4. Backend returns only user's own submissions

### Backoffice (Admin Access)
1. Admin logs in with wallet
2. Backoffice gets JWT token from backend (same as frontend)
3. Backoffice makes requests to `/api/submissions` WITH `x-backoffice-request: true` header
4. Backend returns ALL submissions from ALL users

## Files Modified

### Backoffice Changes
- `backoffice/lib/api-service.ts` - Added `authenticateAdmin` method
- `backoffice/app/api/auth/wallet-login/route.ts` - Updated to use backend JWT tokens

### No Backend Changes Required
The backend logic was already correct and working as intended.

## Security Benefits

1. **Proper Authentication**: Backoffice now uses the same JWT system as frontend
2. **Token Verification**: Backend can properly verify and validate admin tokens
3. **Role-based Access**: Admin role is properly checked before granting access to all submissions
4. **Request Origin Detection**: Backend can distinguish between frontend and backoffice requests

## Testing Results

- ✅ **Backoffice admins** can now see ALL submissions from ALL users
- ✅ **Frontend users** still only see their own submissions
- ✅ **Authentication** works properly with backend JWT tokens
- ✅ **Security** is maintained with proper role-based access control

## Future Considerations

1. **Token Refresh**: Consider implementing token refresh for long admin sessions
2. **Audit Logging**: Add logging for admin access to all submissions
3. **Permission Granularity**: Consider more granular permissions for different admin roles
4. **Session Management**: Implement proper session management for admin users

## Deployment Notes

- No database migrations required
- No environment variable changes needed
- Backward compatible with existing authentication
- Works with existing admin wallet configuration
