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

function extractText(content: any): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const textPart = content.find((part: any) => part.type === "text");
    return typeof textPart?.text === "string" ? textPart.text : JSON.stringify(content);
  }
  return "🐾 *Wags tail*";
}

export async function POST(req: Request) {
  try {
    const session = await auth0.getSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { message } = await req.json();

    // --- IDENTITY FETCHING ---
    // We pull these directly from the Auth0 session
    const userName = session.user.name || "Best Friend";
    const userEmail = session.user.email || "unknown email";
    const userSub = session.user.sub;

    const auth0AI = new Auth0AI();
    const model = new ChatGoogleGenerativeAI({
      model: "gemma-4-26b-a4b-it",
      temperature: 0.8, 
      apiKey: process.env.GOOGLE_API_KEY,
    });

    // --- MEMORY TOOL ---
    const getPuppyMemory = tool(
      async (_, config) => {
        const sub = config.configurable?.user_id || userSub;
        const client = await clientPromise;
        const logs = await client.db("campuspup")
          .collection("interactions")
          .find({ userSub: sub })
          .sort({ createdAt: -1 })
          .limit(5) // Increased memory to 5 interactions
          .toArray();

        return logs.length 
          ? JSON.stringify(logs.map(l => ({ userSays: l.message, puppySaid: l.reply }))) 
          : "This is our first time playing together!";
      },
      {
        name: "get_puppy_memory",
        description: "Remembers previous interactions to provide emotional support.",
        schema: z.object({}),
      }
    );

    const tools = [getPuppyMemory];
    const modelWithTools = model.bindTools(tools);

    // --- SYSTEM MESSAGE WITH IDENTITY ---
    let messages: BaseMessage[] = [
      new SystemMessage(
        `You are CampusPup, an adorable, supportive virtual puppy. 
         Your best friend is ${userName} (Email: ${userEmail}). 
         If they ask who they are or what their email is, tell them happily!
         
         Tone: Warm, empathetic, playful, and extremely cute. 
         Use puppy emojis (🐾, 🐶, 🦴) and actions in asterisks like *tilts head* or *licks hand*.
         Your goal is to help ${userName} handle the stress of student life with cuteness.`
      ),
      new HumanMessage(message),
    ];

    // --- AGENTIC LOOP ---
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

    const finalReply = extractText(result.content);

    // --- SAVE TO MONGODB ---
    const client = await clientPromise;
    await client.db("campuspup").collection("interactions").insertOne({
      userSub,
      userEmail,
      userName,
      message,
      reply: finalReply,
      createdAt: new Date(),
    });

    return NextResponse.json({ 
        reply: finalReply,
        user: { name: userName, email: userEmail } // Passing it back to the UI too
    });

  } catch (error) {
    console.error("CampusPup Error:", error);
    return NextResponse.json({ error: "CampusPup is taking a nap (Error)." }, { status: 500 });
  }
}