// app/api/apply-user/route.ts

import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const client = new MongoClient(process.env.MONGO_URI!)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { name, email, role, reason } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      )
    }

    await client.connect()

    const db = client.db("campuspup")
    const collection = db.collection("userApplications")

    await collection.updateOne(
      { email },
      {
        $set: {
          name,
          email,
          role: role || "user",
          reason: reason || "",
          status: "pending",
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    )

    return NextResponse.json({
      success: true,
      message: "Application submitted",
    })
  } catch (error) {
    console.error("Apply user error:", error)

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}