"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, Edit2, Trash2, Eye, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

interface Listing {
  id: string
  title: string
  type: "lost" | "found"
  category: { name: string } | null
  location: { district?: string; province?: string; address?: string } | null
  created_at: string
  media: { url: string }[]
  view_count: number
  status: string
}

interface MyListingsProps {
  status: "active" | "closed" | "archived"
}

export default function MyListings({ status }: MyListingsProps) {
  const { user, session } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMyListings() {
      if (!user || !session) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('items')
          .select(`
            id,
            title,
            type,
            status,
            created_at,
            location,
            view_count,
            category:categories(name),
            media:item_media(url)
          `)
          .eq('user_id', user.id)
          .eq('status', status)
          .order('created_at', { ascending: false })

        if (fetchError) {
          console.error('Error fetching listings:', fetchError)
          setError('Failed to load listings')
          return
        }

        setListings(data || [])
      } catch (err) {
        console.error('Error:', err)
        setError('Failed to load listings')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMyListings()
  }, [user, session, status])

  const handleDelete = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return

    try {
      const { error: deleteError } = await supabase
        .from('items')
        .delete()
        .eq('id', listingId)
        .eq('user_id', user?.id)

      if (deleteError) {
        console.error('Error deleting listing:', deleteError)
        alert('Failed to delete listing')
        return
      }

      setListings(listings.filter(l => l.id !== listingId))
    } catch (err) {
      console.error('Error:', err)
      alert('Failed to delete listing')
    }
  }

  const getLocationString = (location: Listing['location']) => {
    if (!location) return 'Unknown location'
    const parts = []
    if (location.address) parts.push(location.address)
    if (location.district) parts.push(location.district)
    if (location.province) parts.push(location.province)
    return parts.length > 0 ? parts.join(', ') : 'Unknown location'
  }

  if (isLoading) {
    return (
      <Card className="bg-white border-0 shadow-md">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#2B2B2B]" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-white border-0 shadow-md">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  if (listings.length === 0) {
    return (
      <Card className="bg-white border-0 shadow-md">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-[#D4D4D4]/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#2B2B2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-[#2B2B2B] font-medium mb-2">No {status} listings yet</p>
            <p className="text-[#2B2B2B] text-sm mb-4">Start by posting a lost or found item</p>
            <Link href="/listing/create">
              <Button className="bg-[#2B2B2B] hover:bg-[#2B2B2B] text-[#FFFFFF]">Create Your First Listing</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {listings.map((listing) => (
        <Card key={listing.id} className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="h-32 w-32 flex-shrink-0 bg-[#D4D4D4]/10 rounded-xl overflow-hidden">
                <img
                  src={listing.media?.[0]?.url || "/placeholder.svg"}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg truncate text-[#2B2B2B]">{listing.title}</h3>
                      <Badge 
                        className={`flex-shrink-0 ${
                          listing.type === "lost" 
                            ? "bg-red-100 text-red-700 border-0" 
                            : "bg-[#D4D4D4]/30 text-[#2B2B2B] border-0"
                        }`}
                      >
                        {listing.type === "lost" ? "Lost" : "Found"}
                      </Badge>
                    </div>

                    <p className="text-sm text-[#2B2B2B] mb-3">{listing.category?.name || 'Uncategorized'}</p>

                    <div className="space-y-1 text-sm text-[#2B2B2B]">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{getLocationString(listing.location)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(listing.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        <span>{listing.view_count || 0} views</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Link href={`/listing/${listing.id}`}>
                      <Button variant="outline" size="sm" className="border-[#D4D4D4] text-[#2B2B2B] hover:bg-[#D4D4D4]/10">
                        View
                      </Button>
                    </Link>
                    <Button variant="outline" size="icon" className="border-[#D4D4D4] text-[#2B2B2B] hover:bg-[#D4D4D4]/10">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleDelete(listing.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

