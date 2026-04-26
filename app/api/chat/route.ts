import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { google } from "googleapis";

export async function POST(req: Request) {
  try {
    const session = await auth0.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const message = body?.message?.trim();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const userEmail = session.user.email ?? "unknown";
    const userName = session.user.name ?? "unknown";
    const userSub = session.user.sub ?? "unknown";
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("who am i")) {
      return NextResponse.json({
        reply: `You are ${userName !== "unknown" ? userName : userEmail}.`,
      });
    }

    if (
      lowerMessage.includes("gmail") ||
      lowerMessage.includes("canvas email") ||
      lowerMessage.includes("canvas emails")
    ) {
      const { accessToken } = await auth0.getAccessTokenForConnection({
        connection: "google-oauth2",
      });

      if (!accessToken) {
        return NextResponse.json(
          {
            error:
              "No Google access token found. Re-login with Google and approve Gmail.Readonly permission.",
          },
          { status: 401 }
        );
      }

      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({
        access_token: accessToken,
      });

      const gmail = google.gmail({
        version: "v1",
        auth: oauth2Client,
      });

      const list = await gmail.users.messages.list({
        userId: "me",
        q: '(canvas OR instructure OR "Canvas") newer_than:60d',
        maxResults: 5,
      });

      const messages = list.data.messages ?? [];

      if (messages.length === 0) {
        return NextResponse.json({
          reply: "I checked your Gmail, but I did not find recent Canvas emails.",
        });
      }

      const emailSummaries = await Promise.all(
        messages.map(async (msg) => {
          const full = await gmail.users.messages.get({
            userId: "me",
            id: msg.id!,
            format: "metadata",
            metadataHeaders: ["From", "Subject", "Date"],
          });

          const headers = full.data.payload?.headers ?? [];

          const from =
            headers.find((h) => h.name?.toLowerCase() === "from")?.value ??
            "Unknown sender";

          const subject =
            headers.find((h) => h.name?.toLowerCase() === "subject")?.value ??
            "No subject";

          const date =
            headers.find((h) => h.name?.toLowerCase() === "date")?.value ??
            "Unknown date";

          return {
            from,
            subject,
            date,
            snippet: full.data.snippet ?? "",
          };
        })
      );

      const model = new ChatGoogleGenerativeAI({
        model: "gemma-4-26b-a4b-it",
        temperature: 0.2,
        apiKey: process.env.GOOGLE_API_KEY,
      });

      const response = await model.invoke([
        new SystemMessage(
          "You are RoboTrack, a secure Auth0 AI assistant. Summarize Gmail results concisely. Never expose data from other users."
        ),
        new HumanMessage(
          `Authenticated user:
email: ${userEmail}
name: ${userName}
sub: ${userSub}

The user asked:
${message}

Recent Canvas-related Gmail messages:
${JSON.stringify(emailSummaries, null, 2)}

Summarize these emails clearly.`
        ),
      ]);

      const reply =
        typeof response.content === "string"
          ? response.content.replace(/\n+/g, " ").trim()
          : JSON.stringify(response.content);

      return NextResponse.json({
        reply,
        emails: emailSummaries,
        auth0AiAgent: {
          tokenVault: true,
          connection: "google-oauth2",
          scope: "gmail.readonly",
        },
      });
    }

    console.log("Authenticated user:", userSub);

    const model = new ChatGoogleGenerativeAI({
      model: "gemma-4-26b-a4b-it",
      temperature: 0.2,
      apiKey: process.env.GOOGLE_API_KEY,
    });

    const response = await model.invoke([
      new SystemMessage(
        "You are RoboTrack, a secure AI assistant protected by Auth0. Always respond concisely and helpfully. Use the authenticated user's identity when relevant. Never expose other users' data."
      ),
      new HumanMessage(
        `Authenticated user:
email: ${userEmail}
name: ${userName}
sub: ${userSub}

User request:
${message}`
      ),
    ]);

    let reply = "";

    if (typeof response.content === "string") {
      reply = response.content;
    } else if (Array.isArray(response.content)) {
      const textPart = response.content.find(
        (part: any) => part.type === "text"
      );

      reply =
        typeof textPart?.text === "string"
          ? textPart.text
          : JSON.stringify(textPart?.text ?? "No response");
    } else {
      reply = "No response";
    }

    reply = reply.replace(/\n+/g, " ").trim();

    return NextResponse.json({
      reply,
      user: {
        email: userEmail,
        name: userName,
        sub: userSub,
      },
    });
  } catch (error) {
    console.error("Agent error:", error);

    return NextResponse.json(
      {
        error:
          "Model call failed. Check GOOGLE_API_KEY, Gmail permission, Token Vault connection, and model name.",
      },
      { status: 500 }
    );
  }
}