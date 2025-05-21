import NextAuth, { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
// Removing the Supabase adapter since it's causing schema issues

// Extend the session and JWT types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    accessToken?: string;
  }
}

export const authOptions: NextAuthOptions = {
  // Configure one or more authentication providers
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
      authorization: {
        params: {
          scope: 'read:user user:email repo',
        },
      },
    }),
    // Keeping Google provider as a secondary option
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  debug: true,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token from a provider.
      session.accessToken = token.accessToken;
      return session;
    },
  },
  theme: {
    colorScheme: "auto", // "auto" | "dark" | "light"
    brandColor: "#0070f3", // Hex color code
    logo: "/logo.png", // Absolute URL to image
  },
  pages: {
    signIn: '/auth/signin',
    newUser: '/auth/repository-selection',
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log('User signed in:', user.name);
    },
  },
};

export default NextAuth(authOptions); 