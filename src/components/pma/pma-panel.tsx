import { useState } from 'react'
import { Robot, PaperPlaneTilt } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'

interface PMAMessage {
  role: 'user' | 'assistant'
  content: string
}

interface PMAPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PMAPanel({ open, onOpenChange }: PMAPanelProps) {
  const [messages, setMessages] = useState<PMAMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const prompt = spark.llmPrompt`You are PMA (Project Management Assistant), an AI assistant for steel erection and fabrication contractors. You help with project planning, cost estimation, schedule analysis, and construction best practices.

User question: ${userMessage}

Provide a helpful, concise response focused on steel construction project management.`

      const response = await spark.llm(prompt, 'gpt-4o-mini')
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Robot size={24} weight="duotone" />
            Project Management Assistant
          </SheetTitle>
          <SheetDescription>
            Ask PMA about project planning, costs, schedules, and best practices
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100vh-180px)] mt-6">
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
      </SheetContent>
    </Sheet>
  )
}
