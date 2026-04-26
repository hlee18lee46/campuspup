import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const mongoClient = await clientPromise
    const db = mongoClient.db("campuspup")
    
    // Sort by most recent first
    const pups = await db
      .collection("minted_pups")
      .find({})
      .sort({ timestamp: -1 })
      .toArray()

    return NextResponse.json({ ok: true, pups })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}