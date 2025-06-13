const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../app/models/User');
require('dotenv').config();

// Passport setup
passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL:
				process.env.NODE_ENV === 'development' ? process.env.GOOGLE_CALLBACK_URL_DEV : process.env.GOOGLE_CALLBACK_URL_PRODUCTION,
		},
		async (accessToken, refreshToken, profile, done) => {
			try {
				let user = await User.findOne({googleId: profile.id});
				if (!user) {
					user = await new User({
						name: profile.displayName,
						email: profile.emails[0].value,
						googleId: profile.id,
						avatar: profile.photos[0].value,
						verified: true,
						status: 1,
						role: 1,
					}).save();
				}
				return done(null, user);
			} catch (error) {
				return done(error, null);
			}
		}
	)
);

// Serialize User
passport.serializeUser((user, done) => {
	done(null, user.id);
});

// Deserialize User
passport.deserializeUser(async (id, done) => {
	try {
		const user = await User.findById(id);
		done(null, user);
	} catch (error) {
		done(error, null);
	}
});
