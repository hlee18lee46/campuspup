'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { GameUI } from '@/components/game/game-ui'
import { Dog as DogIcon, Loader2, Send } from 'lucide-react'

const GameScene = dynamic(
  () => import('@/components/game/game-scene').then((mod) => mod.GameScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-muted">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    ),
  }
)

export default function DogGamePage() {
  const { isAuthenticated, isLoading: authLoading, login, user } = useAuth()
  const [happiness, setHappiness] = useState(50)
  const [totalPets, setTotalPets] = useState(0)
  const [level, setLevel] = useState(1)
  const [walkMode, setWalkMode] = useState(false)
  
  // States for Minting and Chat
  const [isMinting, setIsMinting] = useState(false)
  const [chatText, setChatText] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [messages, setMessages] = useState<{role: 'user' | 'buddy', text: string}[]>([])
  
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll chat window
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // NFT Minting Logic
  const mintMoment = useCallback(async () => {
    if (isMinting) return
    const canvas = document.querySelector('canvas')
    if (!canvas) return
    setIsMinting(true)

    try {
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'))
      if (!blob) throw new Error("Capture failed")

      const formData = new FormData()
      formData.append('image', blob, 'campuspup.png')
      formData.append('recipientWallet', user?.walletAddress || "4XQUxCBZ7njW2Zw5SVWL199SfVn5xrHENpr4KagzYM3d")
      formData.append('petName', 'Buddy')
      formData.append('happinessLevel', happiness.toString())

      const res = await fetch('/api/mint-pup', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.ok) alert(`NFT Minted! Check Explorer: ${data.explorer}`)
    } catch (e) {
      console.error(e)
    } finally {
      setIsMinting(false)
    }
  }, [isMinting, happiness, user])

  // AI Chat + TTS Logic
  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault()
    const input = chatText.trim()
    if (!input || isSpeaking) return

    setChatText('')
    setIsSpeaking(true)
    setMessages(prev => [...prev, { role: 'user', text: input }])

    try {
      // 1. Get Gemma Response
      const gemmaRes = await fetch('/api/chat-pup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      })
      const gemmaData = await gemmaRes.json()
      const buddyText = gemmaData.text

      if (!buddyText) throw new Error("Buddy has no words...")

      // 2. Add to Chat UI
      setMessages(prev => [...prev, { role: 'buddy', text: buddyText }])

      // 3. Trigger TTS
      const ttsRes = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: buddyText }),
      })

      if (!ttsRes.ok) {
        const err = await ttsRes.json()
        throw new Error(err.error || "TTS failed")
      }

      const audioBlob = await ttsRes.blob()
      const audio = new Audio(URL.createObjectURL(audioBlob))
      audio.play()

    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'buddy', text: `(Whimper) ${error.message}` }])
    } finally {
      setIsSpeaking(false)
    }
  }

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return
      if (e.key.toLowerCase() === 'm') mintMoment()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mintMoment])

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>
  if (!isAuthenticated) return <div className="flex h-screen items-center justify-center"><Button onClick={login}>Sign In to Play</Button></div>

  return (
    <div className="flex h-screen w-full pt-16 overflow-hidden bg-background">
      <div className="flex-grow relative">
        <GameUI happiness={happiness} totalPets={totalPets} level={level} walkMode={walkMode} onToggleWalkMode={() => setWalkMode(!walkMode)} />
        {isMinting && <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center text-white font-bold">Minting...</div>}
        <div className="h-full w-full">
          <GameScene onPet={() => { setHappiness(h => Math.min(100, h + 10)); setTotalPets(t => t + 1) }} happiness={happiness} walkMode={walkMode} />
        </div>
      </div>

      <aside className="w-80 border-l flex flex-col bg-card shadow-xl">
        <div className="p-4 border-b bg-muted/50 font-bold flex items-center gap-2">
          <DogIcon className="h-5 w-5" /> Buddy's Support
        </div>

        <div ref={scrollRef} className="flex-grow p-4 overflow-y-auto space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`p-3 rounded-lg text-sm max-w-[90%] ${m.role === 'user' ? 'bg-primary text-white self-end ml-auto rounded-br-none' : 'bg-muted self-start mr-auto rounded-bl-none'}`}>
              {m.text}
            </div>
          ))}
          {isSpeaking && <div className="text-[10px] animate-pulse">Buddy is barking...</div>}
        </div>

        <form onSubmit={handleChat} className="p-4 border-t flex gap-2">
          <input 
            type="text" 
            value={chatText} 
            onChange={(e) => setChatText(e.target.value)} 
            placeholder="Tell Buddy anything..." 
            className="flex-grow bg-muted rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
          <Button type="submit" size="icon" disabled={isSpeaking || !chatText}><Send className="h-4 w-4" /></Button>
        </form>
      </aside>
    </div>
  )
}