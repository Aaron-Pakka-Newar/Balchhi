"use client"
import { useParams, useSearchParams } from "next/navigation"
import { useEffect, useState, useCallback, useRef } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, User, MessageCircle, Shield, Share2, Flag, Check, X, Eye, FileText, Clock } from "lucide-react"
import ClaimItemDialog from "@/components/claim-item-dialog"
import ChatDialog from "@/components/chat-dialog"
import ClaimReviewDialog from "@/components/claim-review-dialog"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

interface Evidence {
  id: string
  type: string
  url: string
  description?: string
}

interface Claim {
  id: string
  status: "pending" | "approved" | "rejected" | "withdrawn"
  secret_info: string
  proof_description?: string
  created_at: string
  claimant: {
    id: string
    name: string
    avatar_url?: string
    is_verified: boolean
  }
  evidence?: Evidence[]
}

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
  const searchParams = useSearchParams()
  const listingId = params.id as string
  const tabParam = searchParams.get('tab')
  const claimIdParam = searchParams.get('claim')
  const { user, session } = useAuth()
  const [listing, setListing] = useState<ListingData | null>(null)
  const [claims, setClaims] = useState<Claim[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [highlightClaims, setHighlightClaims] = useState(false)
  const claimsSectionRef = useRef<HTMLDivElement>(null)

  // Fetch claims for this listing (for the owner)
  const fetchClaims = useCallback(async () => {
    if (!session?.access_token || !listingId) {
      return
    }

    try {
      const response = await fetch(`/api/items/${listingId}/claims`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setClaims(data.claims || [])
      }
    } catch (error) {
      console.error("Error fetching claims:", error)
    }
  }, [session?.access_token, listingId])

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

  // Fetch claims when listing is loaded and user is the owner
  useEffect(() => {
    if (listing && user?.id === listing.user_id && session?.access_token) {
      fetchClaims()
    }
  }, [listing, user?.id, session?.access_token, fetchClaims])

  // Handle URL params for claims tab and specific claim
  useEffect(() => {
    if (tabParam === 'claims' && claims.length > 0) {
      // Scroll to claims section
      setTimeout(() => {
        claimsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setHighlightClaims(true)
        // Remove highlight after animation
        setTimeout(() => setHighlightClaims(false), 2000)
      }, 500)

      // If a specific claim is requested, open the review dialog
      if (claimIdParam) {
        const claim = claims.find(c => c.id === claimIdParam)
        if (claim) {
          setSelectedClaim(claim)
          setReviewDialogOpen(true)
        }
      }
    }
  }, [tabParam, claimIdParam, claims])

  // Handle claim actions
  const handleClaimAction = async (claimId: string, action: "approve" | "reject") => {
    if (!session?.access_token) return

    try {
      const response = await fetch(`/api/claims/${claimId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          status: action === "approve" ? "approved" : "rejected",
        }),
      })

      if (response.ok) {
        fetchClaims()
      }
    } catch (error) {
      console.error("Error updating claim:", error)
    }
  }

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

                  {isOwner ? (
                    <Button className="w-full bg-[#D4D4D4] text-[#2B2B2B] cursor-not-allowed" disabled>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      This is your listing
                    </Button>
                  ) : listing.user?.id ? (
                    <ChatDialog
                      itemId={listing.id}
                      itemTitle={listing.title}
                      recipientId={listing.user.id}
                      recipientName={listing.user.name || "Anonymous"}
                      recipientAvatar={listing.user.avatar_url}
                    />
                  ) : (
                    <Button className="w-full bg-[#2B2B2B] hover:bg-[#2B2B2B]/90 text-[#FFFFFF]" disabled>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Contact Unavailable
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card 
                ref={claimsSectionRef}
                className={`bg-white border-0 shadow-md transition-all duration-500 ${
                  highlightClaims ? 'ring-2 ring-yellow-400 ring-offset-2' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-[#2B2B2B] flex items-center gap-2">
                    {isOwner ? "Claims & Verification" : "Is this your item?"}
                    {isOwner && claims.filter(c => c.status === "pending").length > 0 && (
                      <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                        {claims.filter(c => c.status === "pending").length} new
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isOwner ? (
                    <div className="space-y-3">
                      {claims.length === 0 ? (
                        <>
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
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-gray-500 mb-2">
                            {claims.filter(c => c.status === "pending").length} pending claim(s)
                          </p>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {claims.map((claim) => (
                              <div
                                key={claim.id}
                                className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-full bg-[#2B2B2B] flex items-center justify-center flex-shrink-0">
                                    {claim.claimant?.avatar_url ? (
                                      <img
                                        src={claim.claimant.avatar_url}
                                        alt={claim.claimant.name}
                                        className="w-full h-full rounded-full object-cover"
                                      />
                                    ) : (
                                      <User className="w-4 h-4 text-white" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-sm text-[#2B2B2B] truncate">
                                        {claim.claimant?.name || "Anonymous"}
                                      </span>
                                      {claim.claimant?.is_verified && (
                                        <Badge variant="outline" className="text-xs px-1 py-0">
                                          <Shield className="w-2 h-2 mr-0.5" />
                                          Verified
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    {/* Status badge */}
                                    <div className="mb-2">
                                      {claim.status === "pending" && (
                                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                          <Clock className="w-3 h-3 mr-1" />
                                          Pending Review
                                        </Badge>
                                      )}
                                      {claim.status === "approved" && (
                                        <Badge className="bg-green-100 text-green-800 text-xs">
                                          <Check className="w-3 h-3 mr-1" />
                                          Approved
                                        </Badge>
                                      )}
                                      {claim.status === "rejected" && (
                                        <Badge className="bg-red-100 text-red-800 text-xs">
                                          <X className="w-3 h-3 mr-1" />
                                          Rejected
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    {/* Claim description preview */}
                                    {claim.proof_description && (
                                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                        "{claim.proof_description}"
                                      </p>
                                    )}
                                    
                                    {/* Evidence indicator */}
                                    {claim.evidence && claim.evidence.length > 0 && (
                                      <div className="flex items-center gap-1 mb-2">
                                        <FileText className="w-3 h-3 text-blue-500" />
                                        <span className="text-xs text-blue-600">
                                          {claim.evidence.length} evidence file(s)
                                        </span>
                                      </div>
                                    )}
                                    
                                    {/* Actions for pending claims */}
                                    {claim.status === "pending" && (
                                      <div className="flex gap-2 mt-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="flex-1 text-xs h-7"
                                          onClick={() => {
                                            setSelectedClaim(claim)
                                            setReviewDialogOpen(true)
                                          }}
                                        >
                                          <Eye className="w-3 h-3 mr-1" />
                                          Review
                                        </Button>
                                        <Button
                                          size="sm"
                                          className="bg-green-600 hover:bg-green-700 h-7 px-2"
                                          onClick={() => handleClaimAction(claim.id, "approve")}
                                        >
                                          <Check className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-red-600 border-red-200 hover:bg-red-50 h-7 px-2"
                                          onClick={() => handleClaimAction(claim.id, "reject")}
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <ClaimItemDialog listingId={listing.id as string} listingTitle={listing.title} />
                  )}
                </CardContent>
              </Card>

              {/* Claim Review Dialog */}
              {selectedClaim && (
                <ClaimReviewDialog
                  claim={{
                    ...selectedClaim,
                    item: {
                      id: listing.id,
                      title: listing.title,
                      type: listing.type,
                      status: listing.status,
                    }
                  }}
                  open={reviewDialogOpen}
                  onOpenChange={(open) => {
                    setReviewDialogOpen(open)
                    if (!open) setSelectedClaim(null)
                  }}
                  onClaimUpdated={fetchClaims}
                />
              )}

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
