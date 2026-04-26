import { Auth0Client } from "@auth0/nextjs-auth0/server";

export const auth0 = new Auth0Client({
  enableConnectAccountEndpoint: true,
  authorizationParameters: {
    scope: [
      "openid profile email offline_access",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/youtube.readonly" // Add this!
    ].join(" "),
  },
});

export const getRefreshToken = async () => {
  const session = await auth0.getSession();
  
  // We check for both because some SDK versions normalize the keys 
  // while others pass the raw snake_case from the provider.
  return session?.tokenSet?.refreshToken || (session?.tokenSet as any)?.refresh_token;
};