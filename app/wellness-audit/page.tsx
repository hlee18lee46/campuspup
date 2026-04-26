'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { ShieldCheck, Activity, AlertCircle, Loader2, Dog } from 'lucide-react'
import Link from 'next/link'

export default function WellnessAuditPage() {
  const { isAuthenticated, login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [auditData, setAuditData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runAudit = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/audit-pup')
      const data = await res.json()
      
      if (data.error) throw new Error(data.details || data.error)
      setAuditData(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Button onClick={login}>Sign In to View Audit</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8 pt-24">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            Buddy Behavior Audit
          </h1>
          <Link href="/play">
            <Button variant="outline" size="sm">Back to Play</Button>
          </Link>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-lg">Snowflake Cortex AI Analysis</CardTitle>
            <p className="text-sm text-muted-foreground">
              Mistral Large 2 is auditing your latest interactions with Buddy for wellness insights.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {!auditData && !loading && (
              <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <Dog className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                <p className="text-muted-foreground">No audit report generated yet.</p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center py-10 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-medium animate-pulse">Snowflake is calculating wellness scores...</p>
              </div>
            )}

            {auditData && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Your Last Message</p>
                  <p className="text-sm italic">"{auditData.lastMessage}"</p>
                </div>
                
                <div className="p-4 border-l-4 border-primary bg-primary/5">
                  <p className="text-xs font-bold uppercase text-primary mb-1">Cortex AI Report</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {auditData.cortexAudit}
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={runAudit} 
              disabled={loading}
            >
              {loading ? 'Running Audit...' : 'Start New Audit'}
            </Button>
          </CardFooter>
        </Card>

        <p className="text-[10px] text-center text-muted-foreground">
          Note: This audit is powered by Snowflake Cortex and is intended for hackathon demonstration purposes only.
        </p>
      </div>
    </div>
  )
}