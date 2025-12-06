"use client"
import { useParams } from "next/navigation"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, User, MessageCircle, Shield, Share2, Flag } from "lucide-react"
import ClaimItemDialog from "@/components/claim-item-dialog"
import { useAuth } from "@/contexts/auth-context"

export default function ListingDetailPage() {
  const params = useParams()
  const listingId = params.id
  const { user } = useAuth()

  const listing = {
    id: listingId,
    title: "Silver Wedding Ring",
    type: "lost",
    category: "Jewelry",
    location: "Thamel, Kathmandu",
    date: "2025-12-01",
    description: "Lost near Swayambhunath on Monday evening. Gold band with small diamond. Very sentimental value.",
    image: "/placeholder.svg?key=2s1np",
    status: "active",
    postedBy: "Ramesh Sharma",
    posterId: "user123",
    contact: "ramesh@example.com",
    views: 245,
  }

  const isOwner = user?.id === listing.posterId

  return (
    <main className="min-h-screen flex flex-col bg-[#e0e2d5]">
      <Header />

      <div className="flex-1 pt-16 py-8 px-4 md:px-8">
        <div className="max-w-full mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="md:col-span-2 space-y-6">
              <div className="relative rounded-2xl shadow-lg overflow-hidden group">
                <img
                  src={listing.image || "/placeholder.svg"}
                  alt={listing.title}
                  className="w-full aspect-video object-cover rounded-2xl"
                />
                <Badge 
                  className={`absolute top-4 right-4 px-4 py-1.5 text-sm font-semibold z-20 ${
                    listing.type === "lost" 
                      ? "bg-red-500 text-white border-0" 
                      : "bg-[#05647a] text-[#e0e2d5] border-0"
                  }`}
                >
                  {listing.type === "lost" ? "Lost Item" : "Found Item"}
                </Badge>
                <div className="absolute bottom-4 right-4 flex gap-2 z-20">
                  <Button size="icon" variant="secondary" className="bg-white/90 hover:bg-white text-[#10375d]">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="secondary" className="bg-white/90 hover:bg-white text-[#10375d]">
                    <Flag className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Card className="bg-white border-0 shadow-md">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl text-[#10375d]">{listing.title}</CardTitle>
                      <CardDescription className="text-[#05647a] mt-1">{listing.category}</CardDescription>
                    </div>
                    <span className="text-sm text-[#869684]">{listing.views} views</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-[#10375d] leading-relaxed">{listing.description}</p>

                  <div className="space-y-3 pt-4 border-t border-[#e0e2d5]">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-[#6db8bb]/20 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-[#05647a]" />
                      </div>
                      <span className="text-[#10375d]">{listing.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-[#6db8bb]/20 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-[#05647a]" />
                      </div>
                      <span className="text-[#10375d]">{new Date(listing.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card className="bg-white border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-[#10375d]">Posted by</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#6db8bb]/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-[#05647a]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#10375d]">{listing.postedBy}</p>
                      <div className="flex items-center gap-1 text-xs text-[#05647a]">
                        <Shield className="w-3 h-3" />
                        <span>Verified Member</span>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full bg-[#10375d] hover:bg-[#05647a] text-[#e0e2d5]">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contact Poster
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-[#10375d]">
                    {isOwner ? "Claims & Verification" : "Is this your item?"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isOwner ? (
                    <div className="space-y-3">
                      <div className="text-center py-6">
                        <div className="w-12 h-12 rounded-full bg-[#6db8bb]/20 flex items-center justify-center mx-auto mb-3">
                          <Shield className="w-6 h-6 text-[#05647a]" />
                        </div>
                        <p className="text-sm text-[#869684]">
                          No claims yet. We'll notify you when someone claims this item.
                        </p>
                      </div>
                      <Button variant="outline" className="w-full border-[#6db8bb] text-[#05647a]" disabled>
                        No Active Claims
                      </Button>
                    </div>
                  ) : (
                    <ClaimItemDialog listingId={listing.id as string} listingTitle={listing.title} />
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[#6db8bb]/10 border-[#6db8bb]/30 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-[#10375d] flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#05647a]" />
                    Safety Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-[#05647a]">
                  <p className="flex items-start gap-2">
                    <span className="text-[#10375d]">•</span>
                    Meet in public, well-lit places
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-[#10375d]">•</span>
                    Verify the item with specific details
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-[#10375d]">•</span>
                    Never share personal info upfront
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-[#10375d]">•</span>
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
