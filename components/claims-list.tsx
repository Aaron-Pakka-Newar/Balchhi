"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, Check, X, Clock, User, ChevronRight } from "lucide-react"
import { TransitionLink } from "@/components/page-transition"

interface Claim {
  id: string
  status: "pending" | "approved" | "rejected" | "withdrawn"
  secret_info: string
  proof_description?: string
  created_at: string
  item: {
    id: string
    title: string
    type: "lost" | "found"
    status: string
    user?: {
      id: string
      name: string
      avatar_url?: string
    }
  }
  claimant: {
    id: string
    name: string
    avatar_url?: string
    is_verified: boolean
  }
}

interface ClaimsListProps {
  type?: "received" | "sent" | "all"
}

export default function ClaimsList({ type = "all" }: ClaimsListProps) {
  const { user, session } = useAuth()
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)

  const fetchClaims = useCallback(async () => {
    if (!session?.access_token) return

    try {
      const response = await fetch("/api/claims", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        let filteredClaims = data.claims || []

        // Filter based on type
        if (type === "received") {
          filteredClaims = filteredClaims.filter(
            (c: Claim) => c.item?.user?.id === user?.id
          )
        } else if (type === "sent") {
          filteredClaims = filteredClaims.filter(
            (c: Claim) => c.claimant?.id === user?.id
          )
        }

        setClaims(filteredClaims)
      }
    } catch (error) {
      console.error("Error fetching claims:", error)
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, user?.id, type])

  useEffect(() => {
    fetchClaims()
  }, [fetchClaims])

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <Check className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <X className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <Card className="bg-white border-0 shadow-md">
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2B2B2B]"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (claims.length === 0) {
    return (
      <Card className="bg-white border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-[#2B2B2B]">Claims & Verification</CardTitle>
          <CardDescription className="text-[#2B2B2B]">
            Track claims on your found items or your own claims
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-[#D4D4D4]/20 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-[#2B2B2B]" />
            </div>
            <p className="text-[#2B2B2B] font-medium">No claims yet</p>
            <p className="text-[#2B2B2B] text-sm mt-1">
              We&apos;ll notify you when someone claims this item.
            </p>
          </div>
          <div className="text-center text-sm text-gray-500 mt-4 border-t pt-4">
            No Active Claims
          </div>
        </CardContent>
      </Card>
    )
  }

  // Separate claims into received and sent
  const receivedClaims = claims.filter((c) => c.item?.user?.id === user?.id)
  const sentClaims = claims.filter((c) => c.claimant?.id === user?.id)

  return (
    <Card className="bg-white border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-[#2B2B2B]">Claims & Verification</CardTitle>
        <CardDescription className="text-[#2B2B2B]">
          Track claims on your found items or your own claims
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Claims Received (on my items) */}
        {receivedClaims.length > 0 && (
          <div>
            <h3 className="font-semibold text-[#2B2B2B] mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Claims on Your Items ({receivedClaims.length})
            </h3>
            <div className="space-y-3">
              {receivedClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <TransitionLink
                          href={`/listing/${claim.item?.id}`}
                          className="font-medium text-[#2B2B2B] hover:underline"
                        >
                          {claim.item?.title}
                        </TransitionLink>
                        {getStatusBadge(claim.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <div className="w-6 h-6 rounded-full bg-[#2B2B2B] flex items-center justify-center">
                          {claim.claimant?.avatar_url ? (
                            <img
                              src={claim.claimant.avatar_url}
                              alt={claim.claimant.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span>{claim.claimant?.name}</span>
                        {claim.claimant?.is_verified && (
                          <Badge variant="outline" className="text-xs">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        Claimed on {formatDate(claim.created_at)}
                      </p>
                      {claim.proof_description && (
                        <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                          &quot;{claim.proof_description}&quot;
                        </p>
                      )}
                    </div>
                    {claim.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleClaimAction(claim.id, "approve")}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleClaimAction(claim.id, "reject")}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Claims Sent (my claims on others' items) */}
        {sentClaims.length > 0 && (
          <div>
            <h3 className="font-semibold text-[#2B2B2B] mb-3 flex items-center gap-2">
              <ChevronRight className="w-4 h-4" />
              Your Claims ({sentClaims.length})
            </h3>
            <div className="space-y-3">
              {sentClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <TransitionLink
                          href={`/listing/${claim.item?.id}`}
                          className="font-medium text-[#2B2B2B] hover:underline"
                        >
                          {claim.item?.title}
                        </TransitionLink>
                        {getStatusBadge(claim.status)}
                      </div>
                      <p className="text-sm text-gray-500">
                        Submitted on {formatDate(claim.created_at)}
                      </p>
                      {claim.status === "rejected" && (
                        <p className="text-sm text-red-600 mt-2">
                          Your claim was not approved. Contact the item owner for more details.
                        </p>
                      )}
                      {claim.status === "approved" && (
                        <p className="text-sm text-green-600 mt-2">
                          🎉 Congratulations! Your claim has been verified.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
