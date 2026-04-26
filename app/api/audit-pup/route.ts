import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import snowflake from "snowflake-sdk";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const session = await auth0.getSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userSub = session.user.sub;

    // 1. Get the latest interaction from MongoDB
    const client = await clientPromise;
    const lastInteraction = await client.db("campuspup")
      .collection("interactions")
      .findOne({ userSub }, { sort: { createdAt: -1 } });

    if (!lastInteraction) {
      return NextResponse.json({ error: "No interactions to audit yet!" });
    }

    // 2. Setup Snowflake Connection
const connection = snowflake.createConnection({
  account: process.env.SNOWFLAKE_ACCOUNT || "",
  username: process.env.SNOWFLAKE_USER || "", // Matches your .env
  password: process.env.SNOWFLAKE_PASSWORD || "", // Matches your .env
  warehouse: process.env.SNOWFLAKE_WAREHOUSE || "",
  role: process.env.SNOWFLAKE_ROLE || "ACCOUNTADMIN",
});

    await new Promise((resolve, reject) => {
      connection.connect((err) => (err ? reject(err) : resolve(true)));
    });

    // 3. The Cortex AI Call
    // Escaping single quotes for SQL safety
    const escapedText = lastInteraction.message.replace(/'/g, "''");
    
    const sql = `
      SELECT SNOWFLAKE.CORTEX.COMPLETE(
        'mistral-large2', 
        'System: You are a pet behaviorist and student wellness auditor. 
         Analyze this student interaction for emotional distress: "${escapedText}"
         Provide a short wellness score (1-10) and a brief audit note.'
      ) as audit_result
    `;

    const auditResult: any = await new Promise((resolve, reject) => {
      connection.execute({
        sqlText: sql,
        complete: (err, stmt, rows) => {
          if (err) reject(err);
          else resolve(rows?.[0]?.AUDIT_RESULT);
        },
      });
    });

    // 4. Fixed: Clean up connection with callback to satisfy TS
    await new Promise((resolve) => {
      connection.destroy((err) => {
        if (err) console.error("Snowflake cleanup error:", err);
        resolve(true);
      });
    });

    return NextResponse.json({
      student: session.user.name,
      lastMessage: lastInteraction.message,
      cortexAudit: auditResult,
      timestamp: new Date()
    });

  } catch (error: any) {
    console.error("Snowflake Audit Error:", error);
    return NextResponse.json({ error: "Audit failed", details: error.message }, { status: 500 });
  }
}