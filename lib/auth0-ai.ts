import { Auth0AI, getAccessTokenFromTokenVault } from "@auth0/ai-langchain";
import { getRefreshToken } from "@/lib/auth0";

export const getGoogleAccessToken = async () => getAccessTokenFromTokenVault();

const auth0AI = new Auth0AI();

export const withGoogleGmail = auth0AI.withTokenVault({
  connection: "google-oauth2",
  scopes: ["openid", "https://www.googleapis.com/auth/gmail.readonly"],
  refreshToken: getRefreshToken,
});