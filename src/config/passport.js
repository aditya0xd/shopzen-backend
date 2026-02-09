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

// Google OAuth Strategy

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/v1/auth/google/callback',
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Check if user already exists
                    let user = await prisma.user.findUnique({
                        where: { googleId: profile.id },
                    });

                    if (user) {
                        // User exists, return user
                        return done(null, user);
                    }

                    // Check if user with same email exists (email-based login)
                    const existingEmailUser = await prisma.user.findUnique({
                        where: { email: profile.emails[0].value },
                    });

                    if (existingEmailUser) {
                        // Link Google account to existing user
                        user = await prisma.user.update({
                            where: { id: existingEmailUser.id },
                            data: {
                                googleId: profile.id,
                                name: profile.displayName,
                            },
                        });
                        return done(null, user);
                    }

                    // Create new user
                    user = await prisma.user.create({
                        data: {
                            googleId: profile.id,
                            email: profile.emails[0].value,
                            name: profile.displayName,
                            password: null, // No password for OAuth users
                        },
                    });

                    done(null, user);
                } catch (error) {
                    done(error, null);
                }
            }
        )
    );
} else {
    console.warn("Google OAuth credentials missing. Google login disabled.");
}

module.exports = passport;
