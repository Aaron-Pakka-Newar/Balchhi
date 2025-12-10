"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Shield, 
  Check, 
  X, 
  User, 
  FileText, 
  Image as ImageIcon,
  Calendar,
  ExternalLink,
  AlertTriangle
} from "lucide-react"

interface Evidence {
  id: string
  type: string
  url: string
  description?: string
  created_at: string
}

interface Claim {
  id: string
  status: "pending" | "approved" | "rejected" | "withdrawn"
  secret_info: string
  proof_description?: string
  created_at: string
  updated_at?: string
  item: {
    id: string
    title: string
    type: "lost" | "found"
    status: string
  }
  claimant: {
    id: string
    name: string
    avatar_url?: string
    is_verified: boolean
    email?: string
  }
  evidence?: Evidence[]
}

interface ClaimReviewDialogProps {
  claim: Claim
  open: boolean
  onOpenChange: (open: boolean) => void
  onClaimUpdated: () => void
}

export default function ClaimReviewDialog({ 
  claim, 
  open, 
  onOpenChange, 
  onClaimUpdated 
}: ClaimReviewDialogProps) {
  const { session } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const handleAction = async (action: "approve" | "reject") => {
    if (!session?.access_token) return

    if (action === "reject" && !showRejectForm) {
      setShowRejectForm(true)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/claims/${claim.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          status: action === "approve" ? "approved" : "rejected",
          rejection_reason: action === "reject" ? rejectionReason : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update claim")
      }

      toast({
        title: action === "approve" ? "Claim Approved!" : "Claim Rejected",
        description: action === "approve" 
          ? "The claimant has been notified. You can now arrange the handover."
          : "The claimant has been notified of your decision.",
      })

      onClaimUpdated()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update claim",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getEvidenceIcon = (type: string) => {
    if (type === 'image') {
      return <ImageIcon className="w-4 h-4" />
    }
    return <FileText className="w-4 h-4" />
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#2B2B2B] text-xl flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Review Claim
            </DialogTitle>
            <DialogDescription className="text-[#2B2B2B]">
              Review the claim details and evidence before making your decision
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Claimant Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-[#2B2B2B] mb-3 text-sm uppercase tracking-wide">
                Claimant Information
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#2B2B2B] flex items-center justify-center">
                  {claim.claimant?.avatar_url ? (
                    <img
                      src={claim.claimant.avatar_url}
                      alt={claim.claimant.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#2B2B2B]">{claim.claimant?.name}</span>
                    {claim.claimant?.is_verified && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        <Check className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <Calendar className="w-3 h-3" />
                    Claimed on {formatDate(claim.created_at)}
                  </div>
                </div>
              </div>
            </div>

            {/* Claim Description */}
            <div>
              <h3 className="font-semibold text-[#2B2B2B] mb-2 text-sm uppercase tracking-wide">
                Their Description
              </h3>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-[#2B2B2B] whitespace-pre-wrap">
                  {claim.proof_description || claim.secret_info}
                </p>
              </div>
            </div>

            {/* Evidence Section */}
            {claim.evidence && claim.evidence.length > 0 && (
              <div>
                <h3 className="font-semibold text-[#2B2B2B] mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Evidence Provided ({claim.evidence.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {claim.evidence.map((evidence) => (
                    <div 
                      key={evidence.id} 
                      className="relative group bg-gray-50 rounded-lg overflow-hidden border hover:border-[#2B2B2B] transition-colors cursor-pointer"
                      onClick={() => {
                        if (evidence.type === 'image') {
                          setSelectedImage(evidence.url)
                        } else {
                          window.open(evidence.url, '_blank')
                        }
                      }}
                    >
                      {evidence.type === 'image' ? (
                        <div className="aspect-video relative">
                          <img 
                            src={evidence.url} 
                            alt={evidence.description || 'Evidence'}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video flex flex-col items-center justify-center bg-gray-100 p-4">
                          <FileText className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-xs text-gray-500 text-center truncate w-full">
                            {evidence.description || 'Document'}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Evidence Warning */}
            {(!claim.evidence || claim.evidence.length === 0) && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">No evidence provided</p>
                  <p className="text-sm text-amber-600 mt-1">
                    The claimant hasn&apos;t uploaded any supporting documents or images. 
                    Consider asking for proof before approving.
                  </p>
                </div>
              </div>
            )}

            {/* Rejection Reason Form */}
            {showRejectForm && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h4 className="font-medium text-red-800 mb-2">Rejection Reason</h4>
                <textarea
                  placeholder="Explain why you're rejecting this claim (optional but helpful)"
                  className="w-full min-h-24 rounded-lg border border-red-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            )}

            {/* Action Buttons */}
            {claim.status === "pending" && (
              <div className="flex gap-3 pt-2">
                {showRejectForm ? (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowRejectForm(false)}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => handleAction("reject")}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Rejecting...
                        </span>
                      ) : (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          Confirm Rejection
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleAction("reject")}
                      disabled={isLoading}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject Claim
                    </Button>
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleAction("approve")}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Approving...
                        </span>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Approve Claim
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Already decided message */}
            {claim.status !== "pending" && (
              <div className={`rounded-xl p-4 text-center ${
                claim.status === 'approved' 
                  ? 'bg-green-50 text-green-800' 
                  : 'bg-red-50 text-red-800'
              }`}>
                <p className="font-medium">
                  This claim has already been {claim.status}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="sm:max-w-4xl p-2">
            <img 
              src={selectedImage} 
              alt="Evidence" 
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
