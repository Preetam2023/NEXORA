// Copilot — streaming chat interface
// Owner: Saikat (FE-8)
import { useParams } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { Send, Zap } from 'lucide-react'
import { streamCopilotChat } from '@/api/client'
import type { SSEEvent } from '@/types/api'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources: Array<{ meeting_title: string; speaker: string; quote: string }>
  streaming?: boolean
}

const SUGGESTED = [
  'Who is currently handling database implementation?',
  'Why did we move from MongoDB to PostgreSQL?',
  'What changed in this project this week?',
  'What are the remaining risks?',
]

export default function Copilot() {
  const { projectId } = useParams<{ projectId: string }>()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function sendMessage(text: string) {
    if (!text.trim() || streaming) return
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, sources: [] }
    const assistantId = (Date.now() + 1).toString()
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', sources: [], streaming: true }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setInput('')
    setStreaming(true)

    const cleanup = streamCopilotChat(
      { project_id: projectId, message: text },
      (e: SSEEvent) => {
        if (e.type === 'token' && 'text' in e.payload) {
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: m.content + e.payload.text } : m))
        }
        if (e.type === 'done' && 'sources' in e.payload) {
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, sources: e.payload.sources as Message['sources'], streaming: false } : m))
          setStreaming(false)
        }
        if (e.type === 'error') {
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: 'Sorry, an error occurred. Please try again.', streaming: false } : m))
          setStreaming(false)
        }
      },
    )
    cleanupRef.current = cleanup
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-slate-900 text-base">Project AI Copilot</h1>
            <p className="text-slate-500 text-xs">Ask anything about this project's history and decisions</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {messages.length === 0 && (
          <div className="max-w-2xl mx-auto">
            <p className="text-center text-slate-400 text-sm mb-6">Start by asking a question about the project</p>
            <div className="grid grid-cols-2 gap-3">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-left bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-600 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'max-w-lg rounded-2xl px-4 py-3 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm',
              )}>
                {msg.content || (msg.streaming && <span className="inline-block w-2 h-4 bg-slate-400 rounded animate-pulse" />)}
                {msg.role === 'assistant' && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                    <p className="text-xs font-medium text-slate-500">Sources</p>
                    {msg.sources.slice(0, 2).map((s, i) => (
                      <p key={i} className="text-xs text-slate-400">· {s.meeting_title} — {s.speaker}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 bg-white px-6 py-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
            placeholder="Ask about decisions, ownership, risks..."
            className="flex-1 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={streaming}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
