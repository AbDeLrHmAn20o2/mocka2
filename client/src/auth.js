import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, account, trigger }) {
      // Store the Google ID token when user first signs in
      if (account?.id_token) {
        token.idToken = account.id_token;
        token.idTokenExpiresAt = account.expires_at; // Google token expiry
      }

      // Handle token refresh
      if (trigger === "update") {
        // Force a fresh session by clearing cached tokens
        delete token.idToken;
        delete token.idTokenExpiresAt;
      }

      return token;
    },
    async session({ session, token }) {
      // Always include the ID token in session
      session.idToken = token.idToken;
      session.idTokenExpiresAt = token.idTokenExpiresAt;

      // Set session expiry based on ID token expiry
      if (token.idTokenExpiresAt) {
        session.expires = new Date(token.idTokenExpiresAt * 1000).toISOString();
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to home page after successful authentication
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour (same as Google ID token)
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
