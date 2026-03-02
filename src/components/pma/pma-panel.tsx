import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Robot, PaperPlaneTilt, Calendar, Warning, TrendUp, CheckCircle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { generateDailyBrief, analyzeProjectWithPMA } from '@/lib/functions/pma'
import { toast } from 'sonner'
import type { DailyBriefing } from '@/lib/functions/pma'

interface PMAMessage {
  role: 'user' | 'assistant'
  content: string
}

interface PMAPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId?: string
}

export function PMAPanel({ open, onOpenChange, projectId }: PMAPanelProps) {
  const params = useParams()
  const currentProjectId = projectId || params.projectId
  const [messages, setMessages] = useState<PMAMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [dailyBrief, setDailyBrief] = useState<DailyBriefing | null>(null)
  const [briefLoading, setBriefLoading] = useState(false)

  useEffect(() => {
    if (open && currentProjectId && !dailyBrief) {
      loadDailyBrief()
    }
  }, [open, currentProjectId])

  const loadDailyBrief = async () => {
    if (!currentProjectId) return
    setBriefLoading(true)
    try {
      const brief = await generateDailyBrief(currentProjectId)
      setDailyBrief(brief)
    } catch (error) {
      console.error('Failed to load daily brief:', error)
      toast.error('Failed to load daily brief')
    } finally {
      setBriefLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      let response: string
      if (currentProjectId) {
        response = await analyzeProjectWithPMA(currentProjectId, userMessage)
      } else {
        const prompt = spark.llmPrompt`You are PMA (Project Management Assistant), an AI assistant for steel erection and fabrication contractors. You help with project planning, cost estimation, schedule analysis, and construction best practices.

User question: ${userMessage}

Provide a helpful, concise response focused on steel construction project management.`
        response = await spark.llm(prompt, 'gpt-4o-mini')
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: response }])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Robot size={24} weight="duotone" />
            Project Management Assistant
          </SheetTitle>
          <SheetDescription>
            Daily brief, risk analysis, and project insights
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue={currentProjectId ? "brief" : "chat"} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="brief" disabled={!currentProjectId}>Daily Brief</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="brief" className="space-y-4">
            {briefLoading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Generating daily brief...</p>
                </CardContent>
              </Card>
            ) : dailyBrief ? (
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-4 pr-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Executive Summary</CardTitle>
                        <Badge variant="outline" className="gap-1">
                          <Calendar size={14} />
                          {new Date(dailyBrief.date).toLocaleDateString()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{dailyBrief.summary}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Schedule Health</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Overall Health</span>
                        <Badge variant={dailyBrief.scheduleHealth.score >= 75 ? 'default' : 'destructive'}>
                          {dailyBrief.scheduleHealth.score}%
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>• {dailyBrief.scheduleHealth.overdueTasks.length} overdue tasks</p>
                        <p>• {dailyBrief.scheduleHealth.criticalPathTasks.length} critical path tasks</p>
                        <p>• {dailyBrief.scheduleHealth.upcomingMilestones.length} upcoming milestones</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Cost Health</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Budget Status</span>
                        <Badge variant={dailyBrief.costHealth.budgetStatus === 'on-track' ? 'default' : 'destructive'}>
                          {dailyBrief.costHealth.budgetStatus}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>• Variance: ${dailyBrief.costHealth.variance.toLocaleString()}</p>
                        <p>• {dailyBrief.costHealth.atRiskCostCodes.length} at-risk cost codes</p>
                        <p>• Burn rate: ${Math.round(dailyBrief.costHealth.burnRate).toLocaleString()}/day</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">RFI Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>• {dailyBrief.rfiStatus.openCount} open RFIs</p>
                        <p>• {dailyBrief.rfiStatus.agingRFIs.length} aging (7+ days)</p>
                        <p>• Avg response: {Math.round(dailyBrief.rfiStatus.avgResponseTime)} days</p>
                      </div>
                    </CardContent>
                  </Card>

                  {dailyBrief.topActions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Top Actions Required</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {dailyBrief.topActions.map((action, idx) => (
                          <div key={idx} className="flex items-start gap-3 border-l-2 border-primary pl-3">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant={getSeverityColor(action.priority)} className="text-xs">
                                  {action.priority}
                                </Badge>
                                <a href={action.link} className="text-sm font-medium hover:underline">
                                  {action.action}
                                </a>
                              </div>
                              <p className="text-xs text-muted-foreground">{action.reason}</p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {dailyBrief.risks.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Risk Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {dailyBrief.risks.slice(0, 5).map((risk, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <Warning size={16} className="text-destructive mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium">{risk.description}</span>
                              <span className="text-muted-foreground"> - {risk.impact}</span>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex justify-center">
                    <Button onClick={loadDailyBrief} variant="outline" size="sm">
                      Refresh Brief
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Select a project to view daily brief</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="chat" className="h-[calc(100vh-280px)]">
            <div className="flex flex-col h-full">
              <ScrollArea className="flex-1 pr-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <Robot size={64} weight="duotone" className="text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Hi, I'm PMA</h3>
                    <p className="text-muted-foreground max-w-md">
                      I can help you with project insights, schedule analysis, cost estimation, and
                      construction best practices for steel erection and fabrication.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <Card
                          className={`max-w-[80%] ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <div className="p-3 text-sm whitespace-pre-wrap">{message.content}</div>
                        </Card>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <Card className="bg-muted">
                          <div className="p-3 text-sm text-muted-foreground">PMA is thinking...</div>
                        </Card>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask PMA anything about your projects..."
                  className="min-h-[60px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e)
                    }
                  }}
                />
                <Button type="submit" size="icon" className="h-[60px] w-[60px]" disabled={loading || !input.trim()}>
                  <PaperPlaneTilt size={20} />
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
