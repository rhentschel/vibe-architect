import { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { useProjectStore } from '@/lib/store/useProjectStore'
import { useChatLogic } from '@/hooks/useChatLogic'

export function ChatInterface() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { messages, isSending, currentProject } = useProjectStore()
  const { sendMessage } = useChatLogic()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  if (!currentProject) {
    return (
      <div className="flex h-full items-center justify-center bg-background p-8">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Willkommen bei VibeArchitect</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Erstelle ein neues Projekt oder wähle ein existierendes aus, um zu beginnen.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold">{currentProject.name}</h2>
        {currentProject.description && (
          <p className="text-sm text-muted-foreground">{currentProject.description}</p>
        )}
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center max-w-md">
              <p className="text-muted-foreground">
                Beschreibe deine Software-Architektur, und ich werde dir helfen, sie zu visualisieren.
              </p>
              <div className="mt-4 space-y-2 text-left text-sm text-muted-foreground">
                <p>Du kannst mir zum Beispiel sagen:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>"Ich baue eine E-Commerce-Plattform mit React und Node.js"</li>
                  <li>"Ich brauche eine Microservices-Architektur für eine Banking-App"</li>
                  <li>"Erkläre mir die beste Architektur für eine Chat-Anwendung"</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isSending && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <ChatInput onSend={sendMessage} isLoading={isSending} />
    </div>
  )
}
