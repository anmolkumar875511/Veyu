import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/user.model.js';
import { logger } from '../utils/logger.js';

const SCOPE = 'Passport';

export function configurePassport() {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = process.env;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
        logger.warn(SCOPE, 'Google OAuth env vars missing — /auth/google routes will not work.');
        return;
    }

    passport.use(
        new GoogleStrategy(
            {
                clientID: GOOGLE_CLIENT_ID,
                clientSecret: GOOGLE_CLIENT_SECRET,
                callbackURL: GOOGLE_CALLBACK_URL,
            },
            async (_accessToken, _refreshToken, profile, done) => {
                try {
                    const email = profile.emails?.[0]?.value?.toLowerCase();
                    const name = profile.displayName;
                    const avatar = profile.photos?.[0]?.value ?? null;

                    if (!email) {
                        return done(null, false, { message: 'No email returned from Google.' });
                    }
                    let user = await User.findOne({ googleId: profile.id });
                    if (user) {
                        user.lastLogin = new Date();
                        await user.save();
                        return done(null, user);
                    }

                    user = await User.findOne({ email });
                    if (user) {
                        user.googleId = profile.id;
                        user.isVerified = true;
                        if (!user.avatar) user.avatar = avatar;
                        user.lastLogin = new Date();
                        await user.save();
                        return done(null, user);
                    }

                    user = await User.create({
                        name,
                        email,
                        googleId: profile.id,
                        avatar,
                        role: 'citizen',
                        isVerified: true,
                        lastLogin: new Date(),
                    });

                    logger.success(SCOPE, `New Google user created: ${email}`);
                    return done(null, user);
                } catch (err) {
                    logger.error(SCOPE, 'Google OAuth callback error', err);
                    return done(err);
                }
            }
        )
    );
}
