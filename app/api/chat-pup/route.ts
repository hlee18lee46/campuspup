import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { 
  BaseMessage, 
  HumanMessage, 
  SystemMessage, 
  ToolMessage 
} from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { Auth0AI } from "@auth0/ai-langchain";
import { z } from "zod";
import clientPromise from "@/lib/mongodb";
import { getMyHistoryTool } from "@/lib/tools/get-my-history";

export async function POST(req: Request) {
  try {
    const session = await auth0.getSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const message = body?.message?.trim();
    if (!message) return NextResponse.json({ error: "Message is required" }, { status: 400 });

    const userName = session.user.name ?? "Student";
    const userEmail = session.user.email ?? "unknown";
    const userSub = session.user.sub;

    // 1. Initialize Auth0 AI SDK
    const auth0AI = new Auth0AI();
    const model = new ChatGoogleGenerativeAI({
      model: "gemma-4-26b-a4b-it",
      temperature: 0.7, 
      apiKey: process.env.GOOGLE_API_KEY,
    });

    // 2. Identity-Aware Memory Tool
    const getPuppyMemory = tool(
      async (_, config) => {
        const sub = config.configurable?.user_id || userSub;
        const client = await clientPromise;
        const logs = await client.db("campuspup")
          .collection("interactions")
          .find({ userSub: sub })
          .sort({ createdAt: -1 })
          .limit(3)
          .toArray();

        return logs.length 
          ? JSON.stringify(logs.map(l => ({ user: l.message, buddy: l.reply }))) 
          : "This is our first time playing together!";
      },
      {
        name: "get_puppy_memory",
        description: "Remembers previous chat history for emotional support.",
        schema: z.object({}),
      }
    );

    const tools = [getPuppyMemory, getMyHistoryTool];
    const modelWithTools = model.bindTools(tools);

    // 3. System Message (Strict TTS-friendly rules)
    let messages: BaseMessage[] = [
      new SystemMessage(
        `You are Buddy, a supportive Campus Pup for ${userName} (${userEmail}). 
         - Use the get_puppy_memory tool if they ask about past chats.
         - Keep responses short (1-2 sentences). 
         - Be warm, empathetic, and encouraging. 
         - DO NOT use markdown like asterisks or bolding. 
         - DO NOT use actions in asterisks like *wags tail*.
         - Speak in a natural, friendly talking-dog voice.`
      ),
      new HumanMessage(message),
    ];

    // 4. Execution Loop (Agent Reasoning)
    let result = await modelWithTools.invoke(messages);

    while (result.tool_calls && result.tool_calls.length > 0) {
      messages.push(result);
      for (const toolCall of result.tool_calls) {
        const selectedTool = tools.find((t) => t.name === toolCall.name);
        if (selectedTool) {
          const toolResponse = await (selectedTool as any).invoke(toolCall.args);
          messages.push(new ToolMessage({ tool_call_id: toolCall.id!, content: toolResponse }));
        }
      }
      result = await modelWithTools.invoke(messages);
    }

    // 5. FIXED: Safe Extraction for TTS
    let rawReply = "";
    if (typeof result.content === "string") {
      rawReply = result.content;
    } else if (Array.isArray(result.content)) {
      const textPart = (result.content as any[]).find(p => p.type === "text" || typeof p === "string");
      rawReply = typeof textPart === "string" ? textPart : textPart?.text || "";
    }

    // Fallback if content is empty or weird
    if (!rawReply || rawReply.trim() === "") {
      rawReply = "I am wagging my tail and listening to you!";
    }

    // Clean for ElevenLabs/TTS
    const cleanReply = rawReply
      .replace(/\n+/g, " ")
      .replace(/[*_#]/g, "")
      .trim();

    // 6. Persistence
    const client = await clientPromise;
    await client.db("campuspup").collection("interactions").insertOne({
      userSub,
      userEmail,
      message,
      reply: cleanReply,
      createdAt: new Date(),
    });

    // 7. Return key "text" for frontend compatibility
    return NextResponse.json({ 
      text: cleanReply, 
      user: { name: userName, email: userEmail }
    });

  } catch (error) {
    console.error("Buddy Agent Error:", error);
    return NextResponse.json({ 
      text: "I am a little overwhelmed right now, but I am still here for you!",
      error: "Buddy process failed" 
    }, { status: 500 });
  }
}