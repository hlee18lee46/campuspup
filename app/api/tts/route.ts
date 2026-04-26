import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    const apiKey = process.env.ELEVENLABS_API_KEY
    const voiceId = process.env.ELEVENLABS_VOICE_ID
    const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_flash_v2_5"

    if (!apiKey || !voiceId) {
      return NextResponse.json(
        { error: "Missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID" },
        { status: 500 }
      )
    }

    const elevenlabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
        }),
      }
    )

    if (!elevenlabsResponse.ok) {
      const errorText = await elevenlabsResponse.text()
      return NextResponse.json(
        { error: errorText || "ElevenLabs request failed" },
        { status: elevenlabsResponse.status || 500 }
      )
    }

    const audioBuffer = await elevenlabsResponse.arrayBuffer()

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate speech",
      },
      { status: 500 }
    )
  }
}