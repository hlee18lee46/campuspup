'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Dog, Sparkles, Shield, Zap, Heart } from 'lucide-react'
import Image from "next/image"


export default function HomePage() {
  const { isAuthenticated, isLoading, login } = useAuth()

  const [form, setForm] = useState({
    name: '',
    email: '',
    reason: '',
  })

  const [applyLoading, setApplyLoading] = useState(false)

  const handleApply = async () => {
    if (!form.name || !form.email) {
      alert('Name and email are required')
      return
    }

    setApplyLoading(true)

    try {
      const res = await fetch('/api/apply-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          role: 'user',
          reason: form.reason,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Failed to submit application')
        return
      }

      alert('Application submitted successfully!')
      setForm({
        name: '',
        email: '',
        reason: '',
      })
    } catch (error) {
      console.error(error)
      alert('Error submitting application')
    } finally {
      setApplyLoading(false)
    }
  }

  return (
    <main className="min-h-screen pt-16">
      <section className="relative overflow-hidden bg-gradient-to-b from-muted/50 to-background py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <div className="mx-auto max-w-3xl">
            
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Welcome to Campus Pup
            </div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Chat with AI & Pet the Cutest Campus Pup
            </h1>

            <p className="mb-8 text-lg text-muted-foreground text-pretty">
              Experience the joy of interacting with AI and explore our beautiful campus while petting an adorable virtual dog. Sign in to unlock all features!
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              {isLoading ? (
                <Button size="lg" disabled className="min-w-[160px]">
                  Loading...
                </Button>
              ) : isAuthenticated ? (
                <>
                  <Link href="/chat">
                    <Button size="lg" className="gap-2 min-w-[160px]">
                      <MessageSquare className="h-5 w-5" />
                      Start Chatting
                    </Button>
                  </Link>

                  <Link href="/dog-game">
                    <Button size="lg" variant="outline" className="gap-2 min-w-[160px]">
                      <Dog className="h-5 w-5" />
                      Pet the Pup
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Button size="lg" onClick={login} className="gap-2 min-w-[160px]">
                    <Shield className="h-5 w-5" />
                    Sign in with Auth0
                  </Button>

                  <Button size="lg" variant="outline" className="gap-2 min-w-[160px]" disabled>
                    <Dog className="h-5 w-5" />
                    Sign in to Play
                  </Button>
                </>
              )}
            </div>

            {!isAuthenticated && !isLoading && (
              <Card className="mx-auto mt-10 max-w-md text-left">
                <CardHeader>
                  <CardTitle>Apply to be User</CardTitle>
                  <CardDescription>
                    Request access before signing in.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <input
                    type="text"
                    placeholder="Your name"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />

                  <input
                    type="email"
                    placeholder="Your email"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />

                  <textarea
                    placeholder="Why do you want access?"
                    className="min-h-[90px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  />

                  <Button className="w-full" onClick={handleApply} disabled={applyLoading}>
                    {applyLoading ? 'Submitting...' : 'Apply to be User'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Features</h2>
            <p className="text-lg text-muted-foreground">
              Everything you need for a delightful experience
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard icon={MessageSquare} title="AI Chat" description="Have engaging conversations with our AI assistant. Ask questions about dogs, pets, campus life, or anything else!" />
            <FeatureCard icon={Dog} title="Pet the Pup" description="Interact with an adorable virtual dog in a beautiful 3D campus setting. The more you pet, the happier they get!" />
            <FeatureCard icon={Sparkles} title="Gamification" description="Track your petting stats, level up, and watch your pup&apos;s happiness grow as you interact with them." />
            <FeatureCard icon={Shield} title="Secure Auth" description="Your account is protected with Auth0, providing secure and reliable authentication." />
            <FeatureCard icon={Zap} title="Fast & Responsive" description="Built with Next.js for lightning-fast performance and smooth interactions across all devices." />
            <FeatureCard icon={Heart} title="Made with Love" description="Crafted with care to bring joy to your day. Every interaction is designed to make you smile." />
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
                    <Image
  src="/logo.png"
  alt="Campus Pup Logo"
  width={120}
  height={120}
  className="mx-auto mb-6"
/>
          <h2 className="mb-4 text-3xl font-bold">Ready to Get Started?</h2>

          <p className="mb-8 text-lg text-muted-foreground">
            Sign in now to chat with AI and meet your new virtual campus companion!
          </p>

          {!isAuthenticated && !isLoading && (
            <Button size="lg" onClick={login} className="gap-2">
              <Shield className="h-5 w-5" />
              Sign in with Auth0
            </Button>
          )}

          {isAuthenticated && (
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/chat">
                <Button size="lg" className="gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Go to Chat
                </Button>
              </Link>

              <Link href="/dog-game">
                <Button size="lg" variant="outline" className="gap-2">
                  <Dog className="h-5 w-5" />
                  Play Now
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          <p>Built with Next.js, Auth0, AI SDK, and React Three Fiber</p>
        </div>
      </footer>
    </main>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardContent>
    </Card>
  )
}