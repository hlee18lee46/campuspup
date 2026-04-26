import { tool } from "@langchain/core/tools";
import { z } from "zod";
import clientPromise from "@/lib/mongodb";

export const getMyHistoryTool = tool(
  async ({ userSub }: { userSub: string }) => {
    const client = await clientPromise;
    const db = client.db("passport");

    const logs = await db
      .collection("agent_logs")
      .find({ userSub })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    if (logs.length === 0) {
      return "No chat history found for this authenticated Auth0 user.";
    }

    return JSON.stringify(
      logs.map((log) => ({
        message: log.message,
        reply: log.reply,
        createdAt: log.createdAt,
      }))
    );
  },
  {
    name: "get_my_chat_history",
    description:
      "Gets recent chat history for the currently authenticated Auth0 user only.",
    schema: z.object({
      userSub: z.string(),
    }),
  }
);