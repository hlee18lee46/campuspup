'use client'

import { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { GameUI } from '@/components/game/game-ui'
import { Dog, Loader2 } from 'lucide-react'

// Dynamically import the 3D scene to avoid SSR issues
const GameScene = dynamic(
  () => import('@/components/game/game-scene').then((mod) => mod.GameScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-muted">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading campus...</p>
        </div>
      </div>
    ),
  }
)

export default function DogGamePage() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth()
  const [happiness, setHappiness] = useState(50)
  const [totalPets, setTotalPets] = useState(0)
  const [level, setLevel] = useState(1)

  // Happiness decays over time
  useEffect(() => {
    const interval = setInterval(() => {
      setHappiness((prev) => Math.max(0, prev - 1))
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  // Calculate level based on total pets
  useEffect(() => {
    const newLevel = Math.floor(totalPets / 20) + 1
    setLevel(newLevel)
  }, [totalPets])

  const handlePet = useCallback(() => {
    setHappiness((prev) => Math.min(100, prev + 10))
    setTotalPets((prev) => prev + 1)
  }, [])

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 pt-16">
        <Card className="max-w-md p-8 text-center">
          <Dog className="mx-auto h-16 w-16 text-primary mb-4" />
          <h1 className="text-2xl font-bold mb-2">Pet the Pup</h1>
          <p className="text-muted-foreground mb-6">
            Sign in to enter the campus and start petting our adorable campus pup!
          </p>
          <Button onClick={login} size="lg" className="w-full">
            Sign in to Play
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen w-full pt-16 relative">
      <GameUI happiness={happiness} totalPets={totalPets} level={level} />
      <div className="h-full w-full">
        <GameScene onPet={handlePet} happiness={happiness} />
      </div>
    </div>
  )
}
