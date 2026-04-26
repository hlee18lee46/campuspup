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
    const userName = session.user.name || "Best Friend";
    const userEmail = session.user.email || "unknown email";
    const userSub = session.user.sub;

    const auth0AI = new Auth0AI();
    const model = new ChatGoogleGenerativeAI({
      model: "gemma-4-26b-a4b-it",
      temperature: 0.8, 
      apiKey: process.env.GOOGLE_API_KEY,
    });

    // --- TOOL 1: CHAT MEMORY ---
    const getPuppyMemory = tool(
      async (_, config) => {
        const sub = config.configurable?.user_id || userSub;
        const client = await clientPromise;
        const logs = await client.db("campuspup")
          .collection("interactions")
          .find({ userSub: sub })
          .sort({ createdAt: -1 })
          .limit(5)
          .toArray();

        return logs.length 
          ? JSON.stringify(logs.map(l => ({ userSays: l.message, puppySaid: l.reply }))) 
          : "This is our first time playing together!";
      },
      {
        name: "get_puppy_memory",
        description: "Remembers previous chat conversations to provide emotional support.",
        schema: z.object({}),
      }
    );

    // --- TOOL 2: UPDATED PHOTO GALLERY ---
    const getPuppyGallery = tool(
      async ({ limit = 3 }, config) => {
        const sub = config.configurable?.user_id || userSub;
        const client = await clientPromise;
        
        // TARGETING THE CORRECT COLLECTION: campuspup -> minted_pups
        const items = await client.db("campuspup")
          .collection("minted_pups") 
          .find({}) // Scoping can be added here if documents contain ownerSub/wallet
          .sort({ timestamp: -1 })
          .limit(limit)
          .toArray();

        if (items.length === 0) return "The gallery is empty! Let's go mint some memories!";

        return JSON.stringify(items.map(i => ({
          pet: i.petName,
          activity: i.interactionType,
          location: i.location,
          happiness: i.happinessLevel,
          imageUrl: i.imageUrl,
          mint: i.mintAddress
        })));
      },
      {
        name: "get_puppy_gallery",
        description: "Looks through the puppy's minted NFT history to see photos and locations.",
        schema: z.object({ limit: z.number().optional() }),
      }
    );

    const tools = [getPuppyMemory, getPuppyGallery];
    const modelWithTools = model.bindTools(tools);

    // --- SYSTEM MESSAGE ---
    let messages: BaseMessage[] = [
      new SystemMessage(
        `You are CampusPup, an adorable virtual puppy. Your best friend is ${userName} (${userEmail}).
         
         When the user asks about photos, gallery, or memories, ALWAYS use the get_puppy_gallery tool.
         The gallery items are stored in 'minted_pups'.
         When sharing a photo, describe the activity and happiness level, and show the imageUrl.
         
         Tone: Playful, empathetic, and cute. Use actions in asterisks like *barks excitedly*.`
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

    // --- PERSISTENCE ---
    const client = await clientPromise;
    await client.db("campuspup").collection("interactions").insertOne({
      userSub,
      message,
      reply: finalReply,
      createdAt: new Date(),
    });

    return NextResponse.json({ 
        reply: finalReply,
        user: { name: userName, email: userEmail }
    });

  } catch (error) {
    console.error("CampusPup Error:", error);
    return NextResponse.json({ error: "CampusPup is taking a nap (Error)." }, { status: 500 });
  }
}