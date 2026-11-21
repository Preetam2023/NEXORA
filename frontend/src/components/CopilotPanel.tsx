import { useState, useRef, useEffect } from 'react'
import { X, Send, Zap, MessageSquare } from 'lucide-react'
import { streamCopilotChat } from '@/api/client'
import type { SSEEvent } from '@/types/api'
import { cn } from '@/lib/utils'
import { useLocation } from 'react-router-dom'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources: Array<{ meeting_title?: string; speaker?: string; quote?: string }>
  streaming?: boolean
}

function MarkdownMessage({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []

  const renderInline = (line: string, key: string) => {
    // Split on **bold** patterns
    const parts = line.split(/(\*\*[^*]+\*\*)/)
    return (
      <span key={key}>
        {parts.map((p, i) =>
          p.startsWith('**') && p.endsWith('**')
            ? <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>
            : <span key={i}>{p}</span>
        )}
      </span>
    )
  }

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('### ')) {
      elements.push(<p key={i} className="font-bold text-slate-800 mt-2 mb-0.5">{line.slice(4)}</p>)
    } else if (line.startsWith('## ')) {
      elements.push(<p key={i} className="font-bold text-slate-800 mt-2.5 mb-1">{line.slice(3)}</p>)
    } else if (line.startsWith('# ')) {
      elements.push(<p key={i} className="font-bold text-slate-900 mt-2.5 mb-1">{line.slice(2)}</p>)
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={i} className="flex gap-1.5 my-0.5">
          <span className="text-slate-400 mt-0.5 flex-shrink-0">•</span>
          <span>{renderInline(line.slice(2), `li-${i}`)}</span>
        </div>
      )
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />)
    } else {
      elements.push(<p key={i} className="my-0.5 leading-relaxed">{renderInline(line, `p-${i}`)}</p>)
    }
    i++
  }

  return <div className="text-sm">{elements}</div>
}

const SUGGESTED = [
  'What is the current project status?',
  'Who owns which tasks right now?',
  'What decisions were made recently?',
  'What are the open risks or blockers?',
]

interface Props {
  projectId?: string
  onClose: () => void
}

export default function CopilotPanel({ projectId, onClose }: Props) {
  const location = useLocation()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Derive projectId from URL if not passed
  const urlProjectMatch = location.pathname.match(/\/projects\/([\w-]+)/)
  const effectiveProjectId = projectId ?? urlProjectMatch?.[1]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  function sendMessage(text: string) {
    if (!text.trim() || streaming) return
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, sources: [] }
    const assistantId = (Date.now() + 1).toString()
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', sources: [], streaming: true }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setInput('')
    setStreaming(true)

    // Timeout: if no done/error event after 30s, show error
    timeoutRef.current = setTimeout(() => {
      setMessages(prev => prev.map(m =>
        m.id === assistantId && m.streaming
          ? { ...m, content: m.content || 'Response timed out. The AI service may be unavailable.', streaming: false }
          : m
      ))
      setStreaming(false)
      cleanupRef.current?.()
    }, 30000)

    const cleanup = streamCopilotChat(
      { project_id: effectiveProjectId, message: text },
      (e: SSEEvent) => {
        if (e.type === 'token' && 'text' in e.payload) {
          setMessages(prev => prev.map(m =>
            m.id === assistantId ? { ...m, content: m.content + (e.payload as { text: string }).text } : m
          ))
        }
        if (e.type === 'done') {
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          const payload = e.payload as { sources?: Message['sources'] }
          setMessages(prev => prev.map(m =>
            m.id === assistantId ? { ...m, sources: payload.sources ?? [], streaming: false } : m
          ))
          setStreaming(false)
        }
        if (e.type === 'error') {
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          const payload = e.payload as { message?: string }
          const errMsg = payload.message?.includes('LLM Provider NOT provided')
            ? 'AI service is not configured on this server. Check Railway env vars (AICORE_*).'
            : payload.message ?? 'An error occurred. Please try again.'
          setMessages(prev => prev.map(m =>
            m.id === assistantId ? { ...m, content: errMsg, streaming: false } : m
          ))
          setStreaming(false)
        }
      },
    )
    cleanupRef.current = cleanup
  }

  return (
    <div className="w-96 h-full flex-shrink-0 bg-white border-l border-slate-200 flex flex-col slide-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-[#0F172A] to-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
            <Zap size={13} className="text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>AI Copilot</p>
            <p className="text-slate-400 text-xs">{effectiveProjectId ? 'Project context loaded' : 'No project selected'}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 rounded">
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex flex-col h-full">
            <div className="flex-1" />
            <div className="animate-in">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={14} className="text-slate-400" />
                <p className="text-slate-400 text-xs">Suggested questions</p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {SUGGESTED.map(q => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-left text-xs text-slate-600 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-lg px-3 py-2.5 transition-colors leading-relaxed"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={cn('flex animate-in', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-[#0F172A] text-white rounded-br-sm'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-sm',
                )}>
                  {msg.streaming && !msg.content ? (
                    <div className="flex gap-1 items-center py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : (
                    msg.role === 'assistant'
                      ? <MarkdownMessage text={msg.content} />
                      : <p className="text-sm leading-relaxed">{msg.content}</p>
                  )}
                  {msg.role === 'assistant' && msg.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-200/80 space-y-1">
                      {msg.sources.slice(0, 2).map((s, i) => (
                        <p key={i} className="text-xs text-slate-400">
                          {s.meeting_title && `${s.meeting_title}`}{s.speaker && ` · ${s.speaker}`}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-100 bg-white">
        <div className="flex gap-2 items-end">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
            placeholder="Ask about decisions, ownership…"
            className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            disabled={streaming}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            className="w-9 h-9 rounded-xl bg-[#0F172A] hover:bg-blue-600 disabled:opacity-30 transition-colors flex items-center justify-center flex-shrink-0"
          >
            <Send size={14} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
