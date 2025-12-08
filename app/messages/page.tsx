"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MessageCircle, ArrowLeft, Send, User } from "lucide-react"
import { TransitionLink } from "@/components/page-transition"

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  sender?: {
    id: string
    name: string
    avatar_url?: string
  }
}

interface Conversation {
  id: string
  item: {
    id: string
    title: string
    type: string
    media?: { url: string; is_primary: boolean }[]
  }
  otherUser: {
    id: string
    name: string
    avatar_url?: string
  }
  lastMessage?: {
    content: string
    created_at: string
  }
  unreadCount: number
  lastMessageAt: string
}

export default function MessagesPage() {
  const { user, session } = useAuth()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!session?.access_token) return

    try {
      const response = await fetch("/api/conversations", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error("Error fetching conversations:", error)
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!session?.access_token) return

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }, [session?.access_token])

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !session?.access_token) return

    setSendingMessage(true)
    try {
      const response = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ content: newMessage.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages((prev) => [...prev, data.message])
        setNewMessage("")
        // Update conversation's last message
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConversation.id
              ? {
                  ...c,
                  lastMessage: { content: newMessage.trim(), created_at: new Date().toISOString() },
                  lastMessageAt: new Date().toISOString(),
                }
              : c
          )
        )
      }
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSendingMessage(false)
    }
  }

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    fetchConversations()
  }, [user, router, fetchConversations])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
    }
  }, [selectedConversation, fetchMessages])

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!selectedConversation) return
    const interval = setInterval(() => {
      fetchMessages(selectedConversation.id)
    }, 5000)
    return () => clearInterval(interval)
  }, [selectedConversation, fetchMessages])

  if (!user) {
    return null
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (days === 1) {
      return "Yesterday"
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: "short" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <TransitionLink href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </TransitionLink>
          <h1 className="text-2xl font-bold text-[#2B2B2B]">Messages</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="md:col-span-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-white">
              <h2 className="font-semibold text-[#2B2B2B]">Conversations</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2B2B2B]"></div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-gray-500">No conversations yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Start a conversation by contacting a poster
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedConversation?.id === conv.id ? "bg-gray-100" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#2B2B2B] flex items-center justify-center flex-shrink-0">
                          {conv.otherUser?.avatar_url ? (
                            <img
                              src={conv.otherUser.avatar_url}
                              alt={conv.otherUser.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-[#2B2B2B] truncate">
                              {conv.otherUser?.name || "Unknown User"}
                            </span>
                            {conv.lastMessage && (
                              <span className="text-xs text-gray-400">
                                {formatTime(conv.lastMessageAt)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            {conv.item?.title}
                          </p>
                          {conv.lastMessage && (
                            <p className="text-sm text-gray-400 truncate mt-1">
                              {conv.lastMessage.content}
                            </p>
                          )}
                          {conv.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-[#2B2B2B] rounded-full mt-1">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Messages Panel */}
          <Card className="md:col-span-2 overflow-hidden flex flex-col">
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="p-4 border-b bg-white flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden p-1 hover:bg-gray-100 rounded"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-[#2B2B2B] flex items-center justify-center">
                    {selectedConversation.otherUser?.avatar_url ? (
                      <img
                        src={selectedConversation.otherUser.avatar_url}
                        alt={selectedConversation.otherUser.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#2B2B2B]">
                      {selectedConversation.otherUser?.name || "Unknown User"}
                    </h3>
                    <TransitionLink
                      href={`/listing/${selectedConversation.item?.id}`}
                      className="text-sm text-gray-500 hover:text-[#2B2B2B] hover:underline"
                    >
                      Re: {selectedConversation.item?.title}
                    </TransitionLink>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.sender_id === user.id
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              isOwn
                                ? "bg-[#2B2B2B] text-white rounded-br-md"
                                : "bg-white text-[#2B2B2B] rounded-bl-md shadow-sm"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isOwn ? "text-white/60" : "text-gray-400"
                              }`}
                            >
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Input */}
                <div className="p-4 border-t bg-white">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      sendMessage()
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#2B2B2B]/20 focus:border-[#2B2B2B]"
                    />
                    <Button
                      type="submit"
                      disabled={!newMessage.trim() || sendingMessage}
                      className="rounded-full bg-[#2B2B2B] hover:bg-[#2B2B2B]/90"
                      size="icon"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-gray-50">
                <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-[#2B2B2B]">Select a conversation</h3>
                <p className="text-gray-500 mt-1">
                  Choose a conversation from the list to view messages
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
