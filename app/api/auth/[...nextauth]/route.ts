import NextAuth, { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
      authorization: {
        params: {
          scope: "repo workflow read:user user:email user:follow",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "github") {
        try {
          await dbConnect();
          const email = user.email;
          // @ts-expect-error - profile.login comes from GitHub
          const username = profile?.login || user.name;
          const accessToken = account.access_token;

          if (email) {
            await User.findOneAndUpdate(
              { email },
              {
                email,
                username,
                accessToken,
              },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
          }
        } catch (error) {
          console.error("Error saving user to DB:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      if (profile) {
        // @ts-expect-error - NextAuth types are not perfectly aligned with GitHub profile
        token.username = profile.login;
      }
      return token;
    },
    async session({ session, token }) {
      // @ts-expect-error - augmenting session type
      session.accessToken = token.accessToken;
      if (session.user) {
        // @ts-expect-error - augmenting session user type
        session.user.username = token.username;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
