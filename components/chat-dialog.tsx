"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, Send, X, User, ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

interface Message {
  id: string
  content: string
  sender_id: string
  read_at: string | null
  created_at: string
  sender?: {
    id: string
    name: string
    avatar_url?: string
  }
}

interface ChatDialogProps {
  itemId: string
  itemTitle: string
  recipientId: string
  recipientName: string
  recipientAvatar?: string
  trigger?: React.ReactNode
}

export default function ChatDialog({
  itemId,
  itemTitle,
  recipientId,
  recipientName,
  recipientAvatar,
  trigger,
}: ChatDialogProps) {
  const { session, user } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Start or get conversation when dialog opens
  useEffect(() => {
    if (isOpen && session) {
      startOrGetConversation()
    }
  }, [isOpen, session])

  // Poll for new messages every 5 seconds when dialog is open
  useEffect(() => {
    if (!isOpen || !conversationId) return

    const pollMessages = setInterval(() => {
      fetchMessages()
    }, 5000)

    return () => clearInterval(pollMessages)
  }, [isOpen, conversationId])

  const startOrGetConversation = async () => {
    if (!session) return
    
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          itemId,
          recipientId,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Failed to start conversation")
      }

      const { conversation } = await response.json()
      setConversationId(conversation.id)
      
      // Fetch messages
      await fetchMessages(conversation.id)
    } catch (err) {
      console.error("Error starting conversation:", err)
      setError(err instanceof Error ? err.message : "Failed to start conversation")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMessages = async (convId?: string) => {
    const id = convId || conversationId
    if (!id || !session) return

    try {
      const response = await fetch(`/api/conversations/${id}/messages`, {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const { messages: fetchedMessages } = await response.json()
        setMessages(fetchedMessages || [])
      }
    } catch (err) {
      console.error("Error fetching messages:", err)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !session || isSending) return

    setIsSending(true)
    const messageContent = newMessage.trim()
    setNewMessage("")

    // Optimistically add message
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      sender_id: user?.id || "",
      read_at: null,
      created_at: new Date().toISOString(),
      sender: {
        id: user?.id || "",
        name: user?.name || "You",
        avatar_url: undefined,
      },
    }
    setMessages(prev => [...prev, optimisticMessage])

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ content: messageContent }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      const { message } = await response.json()
      
      // Replace optimistic message with real one
      setMessages(prev => prev.map(m => 
        m.id === optimisticMessage.id ? message : m
      ))
    } catch (err) {
      console.error("Error sending message:", err)
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
      setNewMessage(messageContent)
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleOpen = () => {
    if (!session) {
      router.push("/login")
      return
    }
    setIsOpen(true)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            className="w-full bg-[#2B2B2B] hover:bg-[#2B2B2B]/90 text-[#FFFFFF]"
            onClick={handleOpen}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Contact Poster
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-4 border-b border-[#D4D4D4] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F5F5F5] flex items-center justify-center overflow-hidden">
              {recipientAvatar ? (
                <img src={recipientAvatar} alt={recipientName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-[#2B2B2B]/60" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-semibold text-[#2B2B2B]">
                {recipientName}
              </DialogTitle>
              <p className="text-xs text-[#2B2B2B]/60 truncate">
                Re: {itemTitle}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F5F5F5]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2B2B2B]"></div>
                <p className="mt-2 text-sm text-[#2B2B2B]/60">Loading...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-red-500 text-sm">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={startOrGetConversation}
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center px-8">
                <div className="w-16 h-16 rounded-full bg-[#2B2B2B]/10 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-[#2B2B2B]/40" />
                </div>
                <p className="text-[#2B2B2B]/60 text-sm">
                  Start the conversation! Send a message about the {itemTitle}.
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                const isOwn = message.sender_id === user?.id
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                        isOwn
                          ? "bg-[#2B2B2B] text-white rounded-br-md"
                          : "bg-white text-[#2B2B2B] rounded-bl-md shadow-sm"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      <p className={`text-xs mt-1 ${isOwn ? "text-white/60" : "text-[#2B2B2B]/40"}`}>
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-[#D4D4D4] flex-shrink-0 bg-white">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 border-[#D4D4D4] focus:border-[#2B2B2B]"
              disabled={isLoading || !conversationId}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isSending || isLoading || !conversationId}
              className="bg-[#2B2B2B] hover:bg-[#2B2B2B]/90 px-3"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
