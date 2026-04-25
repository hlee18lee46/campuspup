// app/api/me/route.ts
import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

export async function GET() {
  const session = await auth0.getSession();

  return NextResponse.json({
    loggedIn: !!session,
    user: session?.user ?? null,
  });
}