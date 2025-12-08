"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Bell, MessageCircle, Shield, Check, X, Package } from "lucide-react"
import { TransitionLink } from "@/components/page-transition"

interface Notification {
  id: string
  type: string
  title: string
  body: string
  data: {
    claim_id?: string
    item_id?: string
    conversation_id?: string
    message_id?: string
  }
  read_at: string | null
  created_at: string
}

interface NotificationsDropdownProps {
  textColor: string
  hoverBg: string
}

export default function NotificationsDropdown({ textColor, hoverBg }: NotificationsDropdownProps) {
  const { session } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    if (!session?.access_token) {
      // Not authenticated, don't try to fetch
      return
    }

    try {
      const response = await fetch("/api/notifications?limit=10", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      } else if (response.status !== 401) {
        // Only log non-auth errors (401 is expected when not logged in)
        console.error("Failed to fetch notifications:", response.status)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }, [session?.access_token])

  // Fetch notifications on mount and periodically
  useEffect(() => {
    // Add a small delay to ensure auth state is settled
    if (session?.access_token) {
      const timeout = setTimeout(() => {
        fetchNotifications()
      }, 500)
      
      const interval = setInterval(fetchNotifications, 30000) // Every 30 seconds
      return () => {
        clearTimeout(timeout)
        clearInterval(interval)
      }
    }
  }, [session?.access_token, fetchNotifications])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const markAsRead = async (notificationIds?: string[]) => {
    if (!session?.access_token) return

    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(
          notificationIds ? { notificationIds } : { markAllRead: true }
        ),
      })

      fetchNotifications()
    } catch (error) {
      console.error("Error marking notifications as read:", error)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "new_message":
        return <MessageCircle className="w-4 h-4 text-blue-500" />
      case "claim_received":
        return <Shield className="w-4 h-4 text-yellow-500" />
      case "claim_approved":
        return <Check className="w-4 h-4 text-green-500" />
      case "claim_rejected":
        return <X className="w-4 h-4 text-red-500" />
      case "item_matched":
        return <Package className="w-4 h-4 text-purple-500" />
      default:
        return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  const getLink = (notification: Notification) => {
    switch (notification.type) {
      case "new_message":
        return "/messages"
      case "claim_received":
      case "claim_approved":
      case "claim_rejected":
        return notification.data?.item_id ? `/listing/${notification.data.item_id}` : "/dashboard"
      default:
        return "/dashboard"
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className={`${textColor} ${hoverBg} transition-colors duration-200 relative`}
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-[#2B2B2B]">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAsRead()}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2B2B2B]"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No notifications yet</p>
                {process.env.NODE_ENV === 'development' && (
                  <button
                    onClick={async () => {
                      if (!session?.access_token) return
                      try {
                        const res = await fetch('/api/notifications/test', {
                          method: 'POST',
                          headers: { Authorization: `Bearer ${session.access_token}` }
                        })
                        const data = await res.json()
                        console.log('Test notification result:', data)
                        if (res.ok) {
                          fetchNotifications()
                        } else {
                          alert(`Error: ${data.error}\nCode: ${data.code}\nHint: ${data.hint}`)
                        }
                      } catch (e) {
                        console.error('Test failed:', e)
                      }
                    }}
                    className="mt-3 text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Create test notification
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => {
                      if (!notification.read_at) {
                        markAsRead([notification.id])
                      }
                      setIsOpen(false)
                      const link = getLink(notification)
                      router.push(link)
                    }}
                    className={`block w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                      !notification.read_at ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.read_at ? "font-medium" : ""} text-[#2B2B2B]`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {notification.body}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                      {!notification.read_at && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t bg-gray-50">
            <button
              onClick={() => {
                setIsOpen(false)
                router.push("/dashboard")
              }}
              className="text-sm text-center block w-full text-blue-600 hover:text-blue-800"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
