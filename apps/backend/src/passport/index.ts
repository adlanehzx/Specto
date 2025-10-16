import passport from "passport";
import { PrismaClient } from "@prisma/client";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as SlackStrategy } from "@aoberoi/passport-slack";

const prisma = new PrismaClient();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;

// Google
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${
          process.env.API_URL || "http://localhost:4000"
        }/api/auth/google/callback`,
      },
      async (
        accessToken: string,
        refreshToken: string | undefined,
        profile: any,
        done: (err: any, user?: any) => void
      ) => {
        try {
          // Pass profile to the route handler via done
          done(null, profile);
        } catch (err) {
          done(err as Error);
        }
      }
    )
  );
}

// GitHub
if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: GITHUB_CLIENT_ID,
        clientSecret: GITHUB_CLIENT_SECRET,
        callbackURL: `${
          process.env.API_URL || "http://localhost:4000"
        }/api/auth/github/callback`,
        scope: ["user:email"],
      },
      async (
        accessToken: string,
        refreshToken: string | undefined,
        profile: any,
        done: (err: any, user?: any) => void
      ) => {
        try {
          done(null, profile);
        } catch (err) {
          done(err as Error);
        }
      }
    )
  );
}

// Slack
if (SLACK_CLIENT_ID && SLACK_CLIENT_SECRET) {
  passport.use(
    new SlackStrategy(
      {
        clientID: SLACK_CLIENT_ID,
        clientSecret: SLACK_CLIENT_SECRET,
        callbackURL: `${
          process.env.API_URL || "http://localhost:4000"
        }/api/auth/slack/callback`,
        scope: ["identity.basic", "identity.email", "identity.avatar"],
      },
      async (
        accessToken: string,
        scopes: any,
        team: any,
        extra: any,
        profiles: any,
        done: (err: any, user?: any) => void
      ) => {
        try {
          // The Slack strategy returns profiles differently; pass profiles
          done(null, profiles);
        } catch (err) {
          done(err as Error);
        }
      }
    )
  );
}

export default passport;
