import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import passport from 'passport';


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENTSECRET_ID,
    callbackURL: "http://localhost:3000/auth/google/callback",
    passReqToCallback:true
  },
  function(accessToken, refreshToken, profile, cb) {
    // 
    done(null,profile);
  }
));

passport.serializeUser((user,done)=>{
    done(null,user);
});

passport.deserializeUser((user,done)=>{
    done(null,user);
})