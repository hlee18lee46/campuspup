'use client'

import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Heart, Star, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GameUIProps {
  happiness: number
  totalPets: number
  level: number
}

export function GameUI({ happiness, totalPets, level }: GameUIProps) {
  const getHappinessColor = () => {
    if (happiness >= 80) return 'text-green-500'
    if (happiness >= 50) return 'text-yellow-500'
    if (happiness >= 25) return 'text-orange-500'
    return 'text-red-500'
  }

  const getHappinessLabel = () => {
    if (happiness >= 90) return 'Ecstatic!'
    if (happiness >= 70) return 'Very Happy'
    if (happiness >= 50) return 'Happy'
    if (happiness >= 30) return 'Content'
    if (happiness >= 10) return 'Needs Pets'
    return 'Sad'
  }

  return (
    <div className="absolute top-20 left-4 right-4 z-10 pointer-events-none">
      <div className="flex flex-wrap gap-3 justify-between max-w-4xl mx-auto">
        {/* Happiness Meter */}
        <Card className="px-4 py-3 pointer-events-auto bg-background/90 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Heart className={cn('h-6 w-6', getHappinessColor())} fill="currentColor" />
            <div className="min-w-[140px]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-muted-foreground">Happiness</span>
                <span className={cn('text-xs font-bold', getHappinessColor())}>
                  {getHappinessLabel()}
                </span>
              </div>
              <Progress value={happiness} className="h-2" />
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="flex gap-3">
          {/* Total Pets */}
          <Card className="px-4 py-3 pointer-events-auto bg-background/90 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total Pets</p>
                <p className="text-lg font-bold">{totalPets}</p>
              </div>
            </div>
          </Card>

          {/* Level */}
          <Card className="px-4 py-3 pointer-events-auto bg-background/90 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" fill="currentColor" />
              <div>
                <p className="text-xs text-muted-foreground">Level</p>
                <p className="text-lg font-bold">{level}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center">
        <p className="text-sm text-muted-foreground bg-background/80 backdrop-blur-sm inline-block px-4 py-2 rounded-lg">
          Click and drag to orbit around the campus. Click on the pup to pet it!
        </p>
      </div>
    </div>
  )
}
