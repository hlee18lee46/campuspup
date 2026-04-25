import { auth0 } from "./lib/auth0";

export async function proxy(request: Request) {
  console.log("PROXY HIT:", request.url);
  return await auth0.middleware(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};