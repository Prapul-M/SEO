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
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          uid: user.id,
        };
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token && session.user) {
        session.accessToken = token.accessToken as string;
        session.user.id = token.uid as string;
      }
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
  secret: process.env.NEXTAUTH_SECRET || "This_should_be_changed_in_production", // Add a strong secret in production
};

export default NextAuth(authOptions); 