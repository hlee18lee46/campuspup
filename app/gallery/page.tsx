'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, ExternalLink, Heart } from 'lucide-react'
import Image from 'next/image'

interface PupNFT {
  _id: string
  petName: string
  breed: string
  imageUrl: string
  happinessLevel: string
  interactionType: string
  location: string
  mintAddress: string
  timestamp: string
}

export default function GalleryPage() {
  const [pups, setPups] = useState<PupNFT[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPups() {
      try {
        const res = await fetch('/api/get-pups')
        const data = await res.json()
        if (data.ok) setPups(data.pups)
      } catch (err) {
        console.error("Failed to fetch gallery", err)
      } finally {
        setLoading(false)
      }
    }
    fetchPups()
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center pt-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-24 px-4">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold mb-2">Pup Moments Gallery</h1>
        <p className="text-muted-foreground text-lg">Memories captured and minted on Solana</p>
      </div>

      {pups.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
          <p>No moments captured yet. Go play with Buddy!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pups.map((pup) => (
            <Card key={pup._id} className="overflow-hidden hover:shadow-2xl transition-all duration-300 group">
              {/* Image Container */}
              <div className="relative aspect-video w-full bg-muted">
                <img 
                  src={pup.imageUrl} 
                  alt={pup.petName}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
                <Badge className="absolute top-3 right-3 bg-black/60 backdrop-blur-md border-none">
                  <Heart className="w-3 h-3 mr-1 fill-red-500 text-red-500" /> 
                  {pup.happinessLevel}%
                </Badge>
              </div>

              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{pup.petName}</CardTitle>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">{pup.breed}</p>
                  </div>
                  <a 
                    href={`https://explorer.solana.com/address/${pup.mintAddress}?cluster=devnet`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{pup.interactionType}</Badge>
                  <Badge variant="outline">{pup.location}</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mt-4">
                  Minted: {new Date(pup.timestamp).toLocaleDateString()}
                </p>
                <code className="block bg-muted p-2 rounded text-[10px] truncate">
                  {pup.mintAddress}
                </code>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}