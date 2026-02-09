# Google OAuth Authentication Integration

## Overview
The ShopZen backend now supports **Google Account Login** via OAuth 2.0, allowing users to sign in with their Google accounts. This integration uses Passport.js with the Google OAuth2 strategy.

## Features
- ✅ Sign in with Google account
- ✅ Automatic user creation on first login
- ✅ Account linking (link Google to existing email-based accounts)
- ✅ JWT token generation after successful authentication
- ✅ Secure user data storage (Google ID, name, email)

## Architecture Changes

### Database Schema Updates
The `User` model now includes:
```prisma
model User {
  password String? // Optional: null for OAuth users
  googleId String? @unique
  name     String?
}
```

### New Files
- `src/config/passport.js` - Passport.js configuration with Google OAuth strategy
- Updated `auth.service.js`, `auth.controller.js`, `auth.routes.js`

## Setup Instructions

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Google+ API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 Credentials:
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     ```
     http://localhost:3000/api/v1/auth/google/callback
     https://yourdomain.com/api/v1/auth/google/callback
     ```
5. Copy your **Client ID** and **Client Secret**

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID="your-google-client-id-here"
GOOGLE_CLIENT_SECRET="your-google-client-secret-here"
GOOGLE_CALLBACK_URL="http://localhost:3000/api/v1/auth/google/callback"

# JWT Secrets (existing)
JWT_ACCESS_SECRET="your-access-secret"
JWT_SECRET="your-refresh-secret"
SALT=10
```

### 3. Run Database Migration

The schema has been updated to support Google OAuth. Apply the migration:

```bash
npx prisma migrate dev
```

### 4. Restart Your Server

```bash
npm run dev
```

## API Endpoints

### 1. Initiate Google Login
**GET** `/api/v1/auth/google`

Redirects the user to Google's OAuth consent screen.

**Usage:**
```html
<!-- Frontend button -->
<a href="http://localhost:3000/api/v1/auth/google">
  Sign in with Google
</a>
```

### 2. Google OAuth Callback
**GET** `/api/v1/auth/google/callback`

Google redirects here after user authentication. This endpoint generates JWT tokens.

**Response (Success):**
```json
{
  "message": "Google authentication successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-uuid",
    "email": "user@gmail.com",
    "name": "John Doe"
  }
}
```

### 3. Google Login Failure
**GET** `/api/v1/auth/google/failure`

Handles authentication failures.

**Response:**
```json
{
  "message": "Google authentication failed"
}
```

## Authentication Flow

```
1. User clicks "Sign in with Google" button
   ↓
2. Frontend redirects to: GET /api/v1/auth/google
   ↓
3. Backend redirects to Google OAuth consent screen
   ↓
4. User authorizes the application
   ↓
5. Google redirects back to: GET /api/v1/auth/google/callback
   ↓
6. Backend:
   - Finds or creates user in database
   - Links Google account if email exists
   - Generates JWT access & refresh tokens
   ↓
7. Response sent to client with tokens and user info
   ↓
8. Frontend stores tokens and redirects to dashboard
```

## User Creation & Linking Logic

### New Google User
If no user exists with the Google ID or email:
```javascript
// Creates new user
{
  googleId: "google-user-id",
  email: "user@gmail.com",
  name: "John Doe",
  password: null  // No password for OAuth users
}
```

### Existing Email User
If a user with the same email already exists (registered via email/password):
```javascript
// Links Google account to existing user
{
  id: "existing-user-id",
  email: "user@gmail.com",
  password: "hashed-password",  // Kept from original registration
  googleId: "google-user-id",   // Added
  name: "John Doe"              // Added
}
```

This user can now sign in using:
- Email/password (POST `/api/v1/auth/login`)
- Google OAuth (GET `/api/v1/auth/google`)

## Frontend Integration Example

### React Example
```javascript
const GoogleLoginButton = () => {
  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = 'http://localhost:3000/api/v1/auth/google';
  };

  return (
    <button onClick={handleGoogleLogin}>
      <img src="/google-icon.svg" alt="Google" />
      Sign in with Google
    </button>
  );
};

// Handle callback in your app
// After Google redirects back, extract tokens from URL or response
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get('accessToken');
  
  if (accessToken) {
    localStorage.setItem('accessToken', accessToken);
    // Redirect to dashboard
  }
}, []);
```

### Production Considerations

For production, update the callback handler to redirect to your frontend with tokens:

```javascript
// In auth.controller.js - googleCallback function
const googleCallback = async (req, res) => {
  try {
    const tokens = await googleOAuthCallback(req.user);
    
    // Redirect to frontend with tokens
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(
      `${frontendUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`
    );
  } catch (err) {
    res.redirect(`${frontendUrl}/auth/failure`);
  }
};
```

## Security Notes

1. **No Sessions**: We use JWT tokens, not server-side sessions (`session: false`)
2. **Secure Tokens**: Store JWT secrets securely in environment variables
3. **HTTPS Required**: In production, use HTTPS for all OAuth flows
4. **Token Expiry**: Access tokens expire in 15 minutes, refresh tokens in 7 days
5. **Email Verification**: Google emails are pre-verified by Google

## Testing

### Test the OAuth Flow

1. Start your server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000/api/v1/auth/google
   ```

3. Sign in with a Google account

4. You should be redirected to the callback URL with tokens in the response

5. Verify the user was created in your database:
   ```bash
   npx prisma studio
   ```

## Troubleshooting

### "Redirect URI mismatch" Error
- Ensure the callback URL in Google Cloud Console exactly matches `GOOGLE_CALLBACK_URL`
- Check for trailing slashes, http vs https, port numbers

### "Invalid Client ID" Error
- Verify `GOOGLE_CLIENT_ID` in `.env` matches Google Cloud Console
- Ensure no extra spaces or quotes in environment variables

### User Not Created
- Check server logs for Prisma errors
- Verify database migration was applied successfully
- Ensure database connection is working

### Tokens Not Generated
- Verify `JWT_ACCESS_SECRET` and `JWT_SECRET` are set in `.env`
- Check server logs for JWT signing errors

## Next Steps

- [ ] Add Google account unlinking functionality
- [ ] Implement frontend OAuth redirect handling
- [ ] Add other OAuth providers (GitHub, Facebook, etc.)
- [ ] Implement refresh token rotation
- [ ] Add account deletion with OAuth handling
