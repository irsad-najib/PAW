const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user.model");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.googleClientID,
      clientSecret: process.env.googleClientSecret,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          // derive username dari email (bagian sebelum @), fallback random kalau bentrok
          const baseUsername = (profile.emails?.[0]?.value || profile.id)
            .split("@")[0]
            .replace(/[^a-zA-Z0-9_]/g, "_")
            .toLowerCase();
          let finalUsername = baseUsername;
          let counter = 1;
          while (await User.findOne({ username: finalUsername })) {
            finalUsername = `${baseUsername}${counter++}`;
          }
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails?.[0]?.value?.toLowerCase(),
            username: finalUsername,
            role: "user",
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});
