import { NextRequest, NextResponse } from "next/server"
import axios from "axios"
import FormData from "form-data"
import bs58 from "bs58"
import clientPromise from "@/lib/mongodb"

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
  publicKey,
} from "@metaplex-foundation/umi"
import {
  mplTokenMetadata,
  createNft,
} from "@metaplex-foundation/mpl-token-metadata"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()

    // 1. CampusPup Specific Inputs
    const recipientWallet = form.get("recipientWallet") as string | null
    const imageFile = form.get("image") as File | null
    
    // Pet details
    const petName = (form.get("petName") as string | null) || "Campus Pup"
    const breed = (form.get("breed") as string | null) || "Golden Retriever"
    const interactionType = (form.get("interactionType") as string | null) || "Interaction" // e.g., "Feeding", "Playing"
    const happinessLevel = (form.get("happinessLevel") as string | null) || "100"
    const location = (form.get("location") as string | null) || "Campus Square"

    const name = `${petName}'s Moment`
    const symbol = "PUP"
    const description = `A special memory captured with ${petName} during a ${interactionType} session at ${location}.`

    // Validation
    if (!recipientWallet || !imageFile) {
      return NextResponse.json({ ok: false, error: "Missing wallet or image" }, { status: 400 })
    }

    // 2. Env Config (Reuse your existing variables)
    const pinataJwt = process.env.PINATA_JWT
    const pinataGateway = process.env.PINATA_GATEWAY
    const solanaPrivateKey = process.env.SOLANA_PRIVATE_KEY_BASE58
    const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com"

    const normalizedGateway = pinataGateway?.replace(/\/+$/, "")

    // 3. Upload Image to Pinata
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer())
    const pinataFileForm = new FormData()
    pinataFileForm.append("file", imageBuffer, {
      filename: `campuspup_${Date.now()}.png`,
      contentType: imageFile.type,
    })

    const imageRes = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", pinataFileForm, {
      headers: { ...pinataFileForm.getHeaders(), Authorization: `Bearer ${pinataJwt}` },
    })

    const imageUrl = `${normalizedGateway}/${imageRes.data.IpfsHash}`

    // 4. Build CampusPup Metadata
    const metadata = {
      name,
      symbol,
      description,
      image: imageUrl,
      attributes: [
        { trait_type: "Pet Name", value: petName },
        { trait_type: "Breed", value: breed },
        { trait_type: "Interaction", value: interactionType },
        { trait_type: "Happiness Level", value: happinessLevel },
        { trait_type: "Location", value: location },
        { trait_type: "Date", value: new Date().toLocaleDateString() },
      ],
      properties: {
        files: [{ uri: imageUrl, type: imageFile.type }],
        category: "image",
      },
    }

    const metaRes = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", metadata, {
      headers: { Authorization: `Bearer ${pinataJwt}` },
    })

    const metadataUri = `${normalizedGateway}/${metaRes.data.IpfsHash}`

    // 5. Mint on Solana
    const umi = createUmi(rpcUrl).use(mplTokenMetadata())
    const umiKeypair = umi.eddsa.createKeypairFromSecretKey(bs58.decode(solanaPrivateKey!))
    umi.use(keypairIdentity(umiKeypair))

    const mintSigner = generateSigner(umi)
    const mintResult = await createNft(umi, {
      mint: mintSigner,
      name,
      symbol,
      uri: metadataUri,
      sellerFeeBasisPoints: percentAmount(0),
      tokenOwner: publicKey(recipientWallet),
    }).sendAndConfirm(umi)

    // 6. Save to MongoDB
    const mongoClient = await clientPromise
    const db = mongoClient.db("campuspup")
    await db.collection("minted_pups").insertOne({
      petName,
      breed,
      recipientWallet,
      interactionType,
      happinessLevel,
      location,
      mintAddress: mintSigner.publicKey.toString(),
      imageUrl,
      metadataUri,
      timestamp: new Date(),
    })

    return NextResponse.json({
      ok: true,
      mintAddress: mintSigner.publicKey.toString(),
      explorer: `https://explorer.solana.com/address/${mintSigner.publicKey.toString()}?cluster=devnet`,
    })

  } catch (error: any) {
    console.error("CampusPup Mint Error:", error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}