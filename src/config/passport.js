const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const prisma = require('../utils/prisma');

// Serialize user to store in session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Email validation helper
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email && typeof email === 'string' && emailRegex.test(email) && email.length <= 255;
};

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/v1/auth/google/callback',
                passReqToCallback: true,
                state: true, // Enable state parameter for CSRF protection
            },
            async (req, accessToken, refreshToken, profile, done) => {
                // Validate required profile fields
                if (!profile || !profile.id) {
                    console.error('Invalid Google profile: missing profile ID');
                    return done(new Error('Invalid Google profile data'), null);
                }

                // Validate email
                const email = profile.emails?.[0]?.value;
                if (!email || !isValidEmail(email)) {
                    console.error('Invalid Google profile: missing or invalid email', { email });
                    return done(new Error('Google account email is invalid or not verified'), null);
                }

                // Extract optional profile data
                const profilePictureUrl = profile.photos?.[0]?.value || null;
                const displayName = profile.displayName || profile.name?.givenName || email.split('@')[0];

                try {
                    // Use transaction to prevent race conditions
                    const user = await prisma.$transaction(async (tx) => {
                        // Check if user with googleId exists
                        let existingUser = await tx.user.findUnique({
                            where: { googleId: profile.id },
                        });

                        if (existingUser) {
                            // Update last OAuth login timestamp
                            return await tx.user.update({
                                where: { id: existingUser.id },
                                data: {
                                    lastOAuthLogin: new Date(),
                                    // Also update picture if Google provided one
                                    ...(profilePictureUrl && { picture: profilePictureUrl }),
                                },
                            });
                        }

                        // Check if email already exists (prevent account takeover)
                        const existingByEmail = await tx.user.findUnique({
                            where: { email },
                        });

                        if (existingByEmail) {
                            // User exists with same email - link Google account (account merge)
                            // Only link if user was created by OAuth or has no password
                            if (existingByEmail.oauthProvider || !existingByEmail.password) {
                                return await tx.user.update({
                                    where: { id: existingByEmail.id },
                                    data: {
                                        googleId: profile.id,
                                        name: displayName,
                                        picture: profilePictureUrl,
                                        emailVerified: true, // OAuth emails are verified
                                        oauthProvider: 'google',
                                        lastOAuthLogin: new Date(),
                                    },
                                });
                            } else {
                                // User has password - don't auto-link (security risk)
                                throw new Error('Account with this email already exists. Please log in with your password first.');
                            }
                        }

                        // Create new OAuth user
                        return await tx.user.create({
                            data: {
                                googleId: profile.id,
                                email,
                                name: displayName,
                                picture: profilePictureUrl,
                                password: null,
                                emailVerified: true, // OAuth emails are automatically verified by Google
                                oauthProvider: 'google',
                                lastOAuthLogin: new Date(),
                            },
                        });
                    });

                    console.log(`[OAuth] Google user authenticated: ${user.id} (${user.email})`);
                    done(null, user);
                } catch (error) {
                    console.error('[OAuth] Google authentication error:', {
                        error: error.message,
                        googleId: profile.id,
                        email: email,
                    });
                    done(error, null);
                }
            }
        )
    );
} else {
    console.warn("[OAuth] Google OAuth credentials missing. Google login disabled.");
}

module.exports = passport;
