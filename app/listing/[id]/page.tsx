"use client"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, User, MessageCircle, Shield, Share2, Flag } from "lucide-react"
import ClaimItemDialog from "@/components/claim-item-dialog"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

interface ListingData {
  id: string
  title: string
  type: "lost" | "found"
  description: string
  location: {
    province?: string
    district?: string
    municipality?: string
    landmark?: string
  } | null
  date_lost_found: string
  status: string
  view_count: number
  is_verified_listing: boolean
  user_id: string
  category?: { name: string } | null
  user?: { id: string; name: string; avatar_url?: string; is_verified?: boolean } | null
  media?: { url: string; is_primary?: boolean }[]
}

export default function ListingDetailPage() {
  const params = useParams()
  const listingId = params.id as string
  const { user } = useAuth()
  const [listing, setListing] = useState<ListingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchListing() {
      if (!listingId) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        const { data, error: fetchError } = await supabase
          .from('items')
          .select(`
            *,
            category:categories(name),
            user:profiles(id, name, avatar_url, is_verified),
            media:item_media(url, is_primary)
          `)
          .eq('id', listingId)
          .single()

        if (fetchError) {
          console.error('Error fetching listing:', fetchError)
          setError('Failed to load listing')
          return
        }

        setListing(data as ListingData)
        
        // Increment view count
        await supabase
          .from('items')
          .update({ view_count: (data?.view_count || 0) + 1 })
          .eq('id', listingId)
          
      } catch (err) {
        console.error('Error:', err)
        setError('Failed to load listing')
      } finally {
        setIsLoading(false)
      }
    }

    fetchListing()
  }, [listingId])

  // Format location for display
  const formatLocation = (location: ListingData['location']) => {
    if (!location) return "Unknown location"
    const parts = [location.municipality, location.district, location.province].filter(Boolean)
    return parts.join(", ") || "Unknown location"
  }

  // Get primary image
  const getImage = () => {
    if (!listing?.media?.length) return "/placeholder.svg"
    const primary = listing.media.find(m => m.is_primary)
    return primary?.url || listing.media[0]?.url || "/placeholder.svg"
  }

  const isOwner = user?.id === listing?.user_id

  if (isLoading) {
    return (
      <main className="min-h-screen flex flex-col bg-[#FFFFFF]">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#2B2B2B]"></div>
            <p className="mt-4 text-[#2B2B2B]/60">Loading listing...</p>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  if (error || !listing) {
    return (
      <main className="min-h-screen flex flex-col bg-[#FFFFFF]">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#2B2B2B] mb-2">Listing not found</h2>
            <p className="text-[#2B2B2B]/60">{error || "This listing may have been removed or doesn't exist."}</p>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#FFFFFF]">
      <Header />

      <div className="flex-1 pt-24 pb-8 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="md:col-span-2 space-y-6">
              <div className="relative rounded-2xl overflow-hidden bg-[#D4D4D4]/10 h-96 shadow-lg">
                <img
                  src={getImage()}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
                <Badge 
                  className={`absolute top-4 right-4 px-4 py-1.5 text-sm font-semibold ${
                    listing.type === "lost" 
                      ? "bg-red-500 text-white border-0" 
                      : "bg-[#2B2B2B] text-[#FFFFFF] border-0"
                  }`}
                >
                  {listing.type === "lost" ? "Lost Item" : "Found Item"}
                </Badge>
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <Button size="icon" variant="secondary" className="bg-white/90 hover:bg-white text-[#2B2B2B]">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="secondary" className="bg-white/90 hover:bg-white text-[#2B2B2B]">
                    <Flag className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Card className="bg-white border-0 shadow-md">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl text-[#2B2B2B]">{listing.title}</CardTitle>
                      <CardDescription className="text-[#2B2B2B] mt-1">{listing.category?.name || "Other"}</CardDescription>
                    </div>
                    <span className="text-sm text-[#2B2B2B]">{listing.view_count || 0} views</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-[#2B2B2B] leading-relaxed">{listing.description}</p>

                  <div className="space-y-3 pt-4 border-t border-[#FFFFFF]">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-[#D4D4D4]/20 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-[#2B2B2B]" />
                      </div>
                      <span className="text-[#2B2B2B]">{formatLocation(listing.location)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-[#D4D4D4]/20 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-[#2B2B2B]" />
                      </div>
                      <span className="text-[#2B2B2B]">{new Date(listing.date_lost_found).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card className="bg-white border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-[#2B2B2B]">Posted by</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#D4D4D4]/20 flex items-center justify-center overflow-hidden">
                      {listing.user?.avatar_url ? (
                        <img src={listing.user.avatar_url} alt={listing.user.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-[#2B2B2B]" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-[#2B2B2B]">{listing.user?.name || "Anonymous"}</p>
                      {listing.user?.is_verified && (
                        <div className="flex items-center gap-1 text-xs text-[#2B2B2B]">
                          <Shield className="w-3 h-3" />
                          <span>Verified Member</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button className="w-full bg-[#2B2B2B] hover:bg-[#2B2B2B] text-[#FFFFFF]">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contact Poster
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-[#2B2B2B]">
                    {isOwner ? "Claims & Verification" : "Is this your item?"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isOwner ? (
                    <div className="space-y-3">
                      <div className="text-center py-6">
                        <div className="w-12 h-12 rounded-full bg-[#D4D4D4]/20 flex items-center justify-center mx-auto mb-3">
                          <Shield className="w-6 h-6 text-[#2B2B2B]" />
                        </div>
                        <p className="text-sm text-[#2B2B2B]">
                          No claims yet. We'll notify you when someone claims this item.
                        </p>
                      </div>
                      <Button variant="outline" className="w-full border-[#D4D4D4] text-[#2B2B2B]" disabled>
                        No Active Claims
                      </Button>
                    </div>
                  ) : (
                    <ClaimItemDialog listingId={listing.id as string} listingTitle={listing.title} />
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[#F5F5F5] border-[#D4D4D4] shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-[#2B2B2B] flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#2B2B2B]/70" />
                    Safety Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-[#2B2B2B]/80">
                  <p className="flex items-start gap-2">
                    <span className="text-[#2B2B2B]">•</span>
                    Meet in public, well-lit places
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-[#2B2B2B]">•</span>
                    Verify the item with specific details
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-[#2B2B2B]">•</span>
                    Never share personal info upfront
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-[#2B2B2B]">•</span>
                    Report suspicious activity
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
