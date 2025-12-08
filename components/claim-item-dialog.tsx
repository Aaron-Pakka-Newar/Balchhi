"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Shield, CheckCircle, ArrowRight, Edit } from "lucide-react"

const claimSchema = z.object({
  description: z.string().min(20, "Please provide details about why this is your item (min 20 characters)"),
})

type ClaimFormValues = z.infer<typeof claimSchema>

interface ExistingClaim {
  id: string
  secret_info: string
  proof_description: string
  status: string
}

interface ClaimItemDialogProps {
  listingId: string
  listingTitle: string
}

export default function ClaimItemDialog({ listingId, listingTitle }: ClaimItemDialogProps) {
  const { user, session } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [existingClaim, setExistingClaim] = useState<ExistingClaim | null>(null)
  const [isCheckingClaim, setIsCheckingClaim] = useState(false)

  const form = useForm<ClaimFormValues>({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      description: "",
    },
  })

  // Check for existing claim when component mounts or user changes
  useEffect(() => {
    async function checkExistingClaim() {
      if (!user || !session?.access_token) {
        console.log("No user or session, skipping claim check")
        return
      }

      console.log("Checking for existing claim for item:", listingId)
      setIsCheckingClaim(true)
      try {
        const response = await fetch(`/api/claims?itemId=${listingId}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        })

        console.log("Claim check response status:", response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log("Claims data:", data)
          
          // Find a claim by current user that is pending
          const myClaim = data.claims?.find(
            (c: any) => c.claimant_id === user.id && c.status === "pending"
          )
          console.log("My claim found:", myClaim)
          
          if (myClaim) {
            setExistingClaim(myClaim)
            form.setValue("description", myClaim.secret_info || myClaim.proof_description || "")
          }
        }
      } catch (error) {
        console.error("Error checking existing claim:", error)
      } finally {
        setIsCheckingClaim(false)
      }
    }

    checkExistingClaim()
  }, [user, session, listingId, form])

  async function onSubmit(values: ClaimFormValues) {
    if (!user || !session?.access_token) {
      toast({
        title: "Error",
        description: "Please log in to submit a claim.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      let response: Response

      if (existingClaim) {
        // Edit existing claim
        response = await fetch(`/api/claims/${existingClaim.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            secret_info: values.description,
            proof_description: values.description,
          }),
        })
      } else {
        // Create new claim
        response = await fetch("/api/claims", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            item_id: listingId,
            secret_info: values.description,
            proof_description: values.description,
          }),
        })
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit claim")
      }

      // Update existing claim reference if this was a new claim
      if (!existingClaim && data.claim) {
        setExistingClaim(data.claim)
      }

      // Show success state
      setIsSuccess(true)
    } catch (error: any) {
      console.error("Claim error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to submit claim. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    // Reset success state after dialog closes
    setTimeout(() => {
      setIsSuccess(false)
    }, 300)
  }

  if (!user) return null

  const isEditing = !!existingClaim
  const buttonLabel = isEditing ? "Edit My Claim" : "This is my item"
  const ButtonIcon = isEditing ? Edit : Shield

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleClose()
      } else {
        setOpen(true)
      }
    }}>
      <DialogTrigger asChild>
        <Button 
          className={`w-full font-semibold ${
            isEditing 
              ? "bg-amber-600 hover:bg-amber-700 text-white" 
              : "bg-[#2B2B2B] hover:bg-[#2B2B2B] text-[#FFFFFF]"
          }`}
          disabled={isCheckingClaim}
        >
          <ButtonIcon className="w-4 h-4 mr-2" />
          {isCheckingClaim ? "Checking..." : buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-0 shadow-xl">
        {isSuccess ? (
          // Success confirmation state
          <div className="py-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-[#2B2B2B] mb-2">
              {isEditing ? "Claim Updated!" : "Claim Submitted!"}
            </h2>
            <p className="text-gray-600 mb-6">
              {isEditing 
                ? `Your claim for "${listingTitle}" has been updated successfully.`
                : `Your claim for "${listingTitle}" has been submitted successfully. The poster will review it and get back to you.`
              }
            </p>
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <h3 className="font-semibold text-[#2B2B2B] mb-2">What happens next?</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  The item poster will be notified of your claim
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  They may contact you for verification questions
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  You&apos;ll receive a notification when they respond
                </li>
              </ul>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleClose}
                className="flex-1 border-[#D4D4D4]"
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  handleClose()
                  window.location.href = "/dashboard"
                }}
                className="flex-1 bg-[#2B2B2B] hover:bg-[#2B2B2B]/90"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          // Claim form state
          <>
            <DialogHeader>
              <DialogTitle className="text-[#2B2B2B] text-xl">
                {isEditing ? "Edit Your Claim" : "Claim This Item"}
              </DialogTitle>
              <DialogDescription className="text-[#2B2B2B]">
                {isEditing 
                  ? `Update your claim details for "${listingTitle}"`
                  : `Help us verify that "${listingTitle}" belongs to you`
                }
              </DialogDescription>
            </DialogHeader>

            {isEditing && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <strong>Note:</strong> You already have a pending claim for this item. 
                You can update your description below.
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#2B2B2B] font-medium">Why is this your item?</FormLabel>
                      <FormControl>
                        <textarea
                          placeholder="Describe specific details that prove this is your item (color, marks, where you lost it, etc.)"
                          className="flex min-h-28 w-full rounded-xl border-2 border-[#D4D4D4] bg-transparent px-4 py-3 text-base text-[#2B2B2B] placeholder:text-[#2B2B2B] focus-visible:outline-none focus-visible:border-[#2B2B2B] focus-visible:ring-[#2B2B2B]/20 focus-visible:ring-4 transition-all"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />

                <div className="space-y-2 p-4 bg-[#D4D4D4]/10 rounded-xl text-sm border border-[#D4D4D4]/30">
                  <p className="font-semibold text-[#2B2B2B]">Before you {isEditing ? "update" : "claim"}:</p>
                  <ul className="list-disc list-inside space-y-1 text-[#2B2B2B]">
                    <li>Be honest and specific in your description</li>
                    <li>Provide details only you would know</li>
                    <li>Be prepared for verification questions</li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleClose} 
                    className="flex-1 border-[#D4D4D4] text-[#2B2B2B] hover:bg-[#D4D4D4]/10"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading} 
                    className={`flex-1 text-[#FFFFFF] ${
                      isEditing 
                        ? "bg-amber-600 hover:bg-amber-700" 
                        : "bg-[#2B2B2B] hover:bg-[#2B2B2B]"
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {isEditing ? "Updating..." : "Submitting..."}
                      </span>
                    ) : (
                      isEditing ? "Update Claim" : "Submit Claim"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

