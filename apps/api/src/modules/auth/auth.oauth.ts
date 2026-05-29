import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { env } from '../../config/env';
import { authService } from './auth.service';

let initialized = false;

export function initOAuth() {
  if (initialized) return passport;
  initialized = true;

  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${env.OAUTH_CALLBACK_BASE}/google/callback`,
        scope: ['profile', 'email']
      },
      async (_at, _rt, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('No email from Google'));
          const user = await authService.upsertFromOAuth({
            provider: 'google',
            providerId: profile.id,
            email,
            name: profile.displayName,
            avatar: profile.photos?.[0]?.value
          });
          done(null, user);
        } catch (e) { done(e as Error); }
      }
    ));
  }

  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy(
      {
        clientID: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        callbackURL: `${env.OAUTH_CALLBACK_BASE}/github/callback`,
        scope: ['user:email']
      },
      async (_at: string, _rt: string, profile: any, done: (err: any, user?: any) => void) => {
        try {
          const email = profile.emails?.[0]?.value ?? `${profile.username}@users.noreply.github.com`;
          const user = await authService.upsertFromOAuth({
            provider: 'github',
            providerId: profile.id,
            email,
            name: profile.displayName ?? profile.username,
            username: profile.username,
            avatar: profile.photos?.[0]?.value
          });
          done(null, user);
        } catch (e) { done(e as Error); }
      }
    ));
  }

  return passport;
}
