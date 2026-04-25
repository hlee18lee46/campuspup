import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import clientPromise from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const session = await auth0.getSession();

    if (!session) {
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

    if (lowerMessage.includes("my auth0 profile")) {
      return NextResponse.json({
        reply: `Auth0 verified user: Name: ${userName}, Email: ${userEmail}, User ID: ${userSub}`,
      });
    }

    console.log("Authenticated user:", userSub);

    const model = new ChatGoogleGenerativeAI({
      model: "gemma-4-26b-a4b-it",
      temperature: 0.2,
    });

    const response = await model.invoke([
      new SystemMessage(
        "You are RoboTrack, a secure AI assistant protected by Auth0. Always respond concisely and helpfully. Use the authenticated user's identity when relevant. Never expose other users' data. Only answer using the current authenticated user's context."
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

    // Save authenticated AI interaction to MongoDB
    const client = await clientPromise;
    const db = client.db("passport");

    await db.collection("agent_logs").insertOne({
      userSub,
      userEmail,
      userName,
      message,
      reply,
      createdAt: new Date(),
    });

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
          "Model call failed. Check your GOOGLE_API_KEY, model name, MongoDB connection, and Auth0 session.",
      },
      { status: 500 }
    );
  }
}