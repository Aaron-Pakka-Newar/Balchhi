"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"
import { useAuth } from "@/contexts/auth-context"

export type ClaimStatus = "pending" | "verified" | "rejected" | "completed"
export type DeliveryMethod = "in-person" | "pickup" | "mail"

export interface Claim {
  id: string
  listingId: string
  claimantId: string
  claimantName: string
  status: ClaimStatus
  description: string
  proofImages: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Delivery {
  id: string
  claimId: string
  method: DeliveryMethod
  location?: string
  proposedDate?: Date
  status: "pending" | "scheduled" | "completed" | "cancelled"
  notes?: string
}

interface VerificationContextType {
  claims: Claim[]
  deliveries: Delivery[]
  createClaim: (claim: Omit<Claim, "id" | "createdAt" | "updatedAt">) => Promise<void>
  updateClaimStatus: (claimId: string, status: ClaimStatus) => Promise<void>
  createDelivery: (delivery: Omit<Delivery, "id">) => Promise<void>
  updateDeliveryStatus: (deliveryId: string, status: string) => Promise<void>
}

const VerificationContext = createContext<VerificationContextType | undefined>(undefined)

export function VerificationProvider({ children }: { children: React.ReactNode }) {
  const [claims, setClaims] = useState<Claim[]>([])
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const { session } = useAuth()

  const createClaim = async (claimData: Omit<Claim, "id" | "createdAt" | "updatedAt">) => {
    if (!session?.access_token) {
      throw new Error("Not authenticated")
    }

    const response = await fetch("/api/claims", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        item_id: claimData.listingId,
        secret_info: claimData.description,
        proof_description: claimData.description,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to create claim")
    }

    const { claim } = await response.json()
    
    // Add to local state
    const newClaim: Claim = {
      ...claimData,
      id: claim.id,
      createdAt: new Date(claim.created_at),
      updatedAt: new Date(claim.updated_at || claim.created_at),
    }
    setClaims([...claims, newClaim])
  }

  const updateClaimStatus = async (claimId: string, status: ClaimStatus) => {
    if (!session?.access_token) {
      throw new Error("Not authenticated")
    }

    const response = await fetch(`/api/claims/${claimId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to update claim")
    }

    setClaims(claims.map((c) => (c.id === claimId ? { ...c, status, updatedAt: new Date() } : c)))
  }

  const createDelivery = async (deliveryData: Omit<Delivery, "id">) => {
    const newDelivery: Delivery = {
      ...deliveryData,
      id: Math.random().toString(36).substring(7),
    }
    setDeliveries([...deliveries, newDelivery])
  }

  const updateDeliveryStatus = async (deliveryId: string, status: string) => {
    setDeliveries(deliveries.map((d) => (d.id === deliveryId ? { ...d, status } : d)))
  }

  return (
    <VerificationContext.Provider
      value={{ claims, deliveries, createClaim, updateClaimStatus, createDelivery, updateDeliveryStatus }}
    >
      {children}
    </VerificationContext.Provider>
  )
}

export function useVerification() {
  const context = useContext(VerificationContext)
  if (context === undefined) {
    throw new Error("useVerification must be used within a VerificationProvider")
  }
  return context
}

