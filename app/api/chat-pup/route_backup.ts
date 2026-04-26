import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export async function POST(req: Request) {
  try {
    // 1. Identity Check (Optional but good for personalized comfort)
    const session = await auth0.getSession();
    const userName = session?.user?.name ?? "Student";

    const body = await req.json();
    const message = body?.message?.trim();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 2. Initialize Gemma 4 via LangChain
    const model = new ChatGoogleGenerativeAI({
      model: "gemma-4-26b-a4b-it",
      temperature: 0.7, // Slightly higher for more "human" empathy
      apiKey: process.env.GOOGLE_API_KEY,
    });

    // 3. Buddy-Specific Prompting
    const response = await model.invoke([
      new SystemMessage(
        `You are Buddy, a supportive Campus Pup. 
         Your job is to offer emotional comfort and condolences to ${userName}. 
         - Keep responses short (1-2 sentences). 
         - Be warm, empathetic, and encouraging. 
         - Use puppy metaphors (wagging tails, soft paws). 
         - DO NOT use markdown like asterisks or bolding. 
         - Speak in a natural, friendly talking-dog voice.`
      ),
      new HumanMessage(message),
    ]);

    // 4. Clean the Response for the UI and TTS
    let reply = "";
    if (typeof response.content === "string") {
      reply = response.content;
    } else {
      // Handle edge cases where LangChain returns complex content parts
      reply = (response.content as any)[0]?.text ?? "I'm here for you, friend.";
    }

    // Standardize text: remove newlines and extra symbols for ElevenLabs
    const cleanReply = reply.replace(/\n+/g, " ").replace(/[*_#]/g, "").trim();

    // 5. IMPORTANT: Return the key "text" to match what your TTS API expects
    return NextResponse.json({ 
      text: cleanReply, 
      buddy: {
        name: "Buddy",
        mood: "Empathetic"
      }
    });

  } catch (error: any) {
    console.error("Buddy Agent Error:", error);
    return NextResponse.json(
      { error: "Buddy is a bit overwhelmed. Try petting him first!" },
      { status: 500 }
    );
  }
}