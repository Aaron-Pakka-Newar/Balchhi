"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/lib/database.types"

export type StaffRole = "admin" | "manager" | "staff"
export type OrgMemberRole = Database["public"]["Enums"]["org_member_role"]

type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"]
type OrganizationMemberRow = Database["public"]["Tables"]["organization_members"]["Row"]

export interface OrgMember {
  id: string
  userId: string
  name: string
  email: string
  role: StaffRole
  memberRole: OrgMemberRole | null
  joinedAt: Date
  isActive: boolean
}

export interface Organization {
  id: string
  name: string
  description: string | null
  logo?: string | null
  ownerId: string
  type: Database["public"]["Enums"]["organization_type"]
  contactEmail: string
  contactPhone: string
  address: string
  location: any
  isVerified: boolean
  verificationStatus: Database["public"]["Enums"]["org_verification_status"] | null
  members: OrgMember[]
  listingsCount: number
  recoveredCount: number
  createdAt: Date
  isActive: boolean
}

interface OrganizationContextType {
  organizations: Organization[]
  currentOrganization: Organization | null
  isLoading: boolean
  error: string | null
  fetchOrganizations: () => Promise<void>
  fetchUserOrganizations: (userId: string) => Promise<void>
  setCurrentOrganization: (org: Organization | null) => void
  createOrganization: (
    org: {
      name: string
      description?: string
      type: Database["public"]["Enums"]["organization_type"]
      contact_email: string
      contact_phone: string
      location: any
      address: string
    },
  ) => Promise<Organization | null>
  addMember: (orgId: string, member: Omit<OrgMember, "id" | "joinedAt" | "isActive">) => Promise<void>
  removeMember: (orgId: string, memberId: string) => Promise<void>
  updateMemberRole: (orgId: string, memberId: string, role: StaffRole) => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

// Helper function to map database organization to context organization
function mapOrganization(org: OrganizationRow, members: OrgMember[] = []): Organization {
  return {
    id: org.id,
    name: org.name,
    description: org.description,
    logo: org.logo_url,
    ownerId: org.admin_id,
    type: org.type,
    contactEmail: org.contact_email,
    contactPhone: org.contact_phone,
    address: org.address,
    location: org.location,
    isVerified: org.is_verified ?? false,
    verificationStatus: org.verification_status,
    members,
    listingsCount: 0, // Will be populated from items count
    recoveredCount: 0, // Will be populated from resolved claims
    createdAt: new Date(org.created_at || Date.now()),
    isActive: org.is_active ?? true,
  }
}

// Helper to map member role from database
function mapMemberRole(role: string | null): StaffRole {
  switch (role) {
    case "admin":
      return "admin"
    case "manager":
      return "manager"
    default:
      return "staff"
  }
}

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch all organizations (for public listing)
  const fetchOrganizations = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/organizations?approved=true')
      if (!response.ok) {
        throw new Error('Failed to fetch organizations')
      }
      const data = await response.json()
      const mappedOrgs = data.organizations.map((org: OrganizationRow) => mapOrganization(org))
      setOrganizations(mappedOrgs)
    } catch (err) {
      console.error('Error fetching organizations:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch organizations')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch organizations for a specific user (their owned + member orgs)
  const fetchUserOrganizations = useCallback(async (userId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      // Fetch organizations where user is admin
      const { data: ownedOrgs, error: ownedError } = await supabase
        .from('organizations')
        .select('*')
        .eq('admin_id', userId)
        .eq('is_active', true)

      if (ownedError) throw ownedError

      // Fetch organizations where user is a member
      const { data: memberOrgs, error: memberError } = await supabase
        .from('organization_members')
        .select(`
          organization_id,
          role,
          member_role,
          organizations (*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)

      if (memberError) throw memberError

      // Combine and deduplicate organizations
      const allOrgs: Organization[] = []
      const orgIds = new Set<string>()

      // Add owned organizations
      if (ownedOrgs) {
        for (const org of ownedOrgs) {
          if (!orgIds.has(org.id)) {
            orgIds.add(org.id)
            // Fetch members for this org
            const members = await fetchOrgMembers(org.id)
            allOrgs.push(mapOrganization(org, members))
          }
        }
      }

      // Add member organizations
      if (memberOrgs) {
        for (const membership of memberOrgs) {
          const org = (membership as any).organizations as OrganizationRow
          if (org && !orgIds.has(org.id)) {
            orgIds.add(org.id)
            const members = await fetchOrgMembers(org.id)
            allOrgs.push(mapOrganization(org, members))
          }
        }
      }

      setOrganizations(allOrgs)

      // Set current organization to the first one if not already set
      if (allOrgs.length > 0 && !currentOrganization) {
        setCurrentOrganization(allOrgs[0])
      }
    } catch (err) {
      console.error('Error fetching user organizations:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch organizations')
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization])

  // Helper to fetch members for an organization
  const fetchOrgMembers = async (orgId: string): Promise<OrgMember[]> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.warn('No session available for fetching members')
        return []
      }

      const response = await fetch(`/api/organizations/${orgId}/members`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to fetch members: ${response.status}`)
      }

      return (data.members || []).map((m: any) => ({
        id: m.id,
        userId: m.user_id,
        name: m.profiles?.name || 'Unknown',
        email: m.profiles?.email || '',
        role: mapMemberRole(m.role),
        memberRole: m.member_role,
        joinedAt: new Date(m.created_at || Date.now()),
        isActive: m.is_active ?? true,
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('Error fetching org members:', errorMessage)
      return []
    }
  }

  // Listen for auth changes and fetch user organizations
  useEffect(() => {
    const initializeOrganizations = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await fetchUserOrganizations(session.user.id)
      }
    }

    initializeOrganizations()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserOrganizations(session.user.id)
      } else {
        setOrganizations([])
        setCurrentOrganization(null)
      }
    })

    return () => subscription?.unsubscribe()
  }, [fetchUserOrganizations])

  const createOrganization = async (
    orgData: {
      name: string
      description?: string
      type: Database["public"]["Enums"]["organization_type"]
      contact_email: string
      contact_phone: string
      location: any
      address: string
    },
  ): Promise<Organization | null> => {
    setIsLoading(true)
    setError(null)
    try {
      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(orgData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create organization')
      }

      const { organization } = await response.json()
      const newOrg = mapOrganization(organization)
      
      setOrganizations(prev => [...prev, newOrg])
      setCurrentOrganization(newOrg)
      
      return newOrg
    } catch (err) {
      console.error('Error creating organization:', err)
      setError(err instanceof Error ? err.message : 'Failed to create organization')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const addMember = async (orgId: string, memberData: Omit<OrgMember, "id" | "joinedAt" | "isActive">) => {
    setIsLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`/api/organizations/${orgId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: memberData.userId,
          email: memberData.email,
          role: memberData.role,
          member_role: memberData.memberRole || 'org_staff',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to add member: ${response.status}`)
      }

      // Refresh organization data
      await fetchUserOrganizations(session.user.id)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('Error adding member:', errorMessage)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const removeMember = async (orgId: string, memberId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`/api/organizations/${orgId}/members?memberId=${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to remove member: ${response.status}`)
      }

      // Refresh organization data
      await fetchUserOrganizations(session.user.id)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('Error removing member:', errorMessage)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const updateMemberRole = async (orgId: string, memberId: string, role: StaffRole) => {
    setIsLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`/api/organizations/${orgId}/members`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          member_id: memberId,
          role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to update member role: ${response.status}`)
      }

      // Refresh organization data
      await fetchUserOrganizations(session.user.id)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('Error updating member role:', errorMessage)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        currentOrganization,
        isLoading,
        error,
        fetchOrganizations,
        fetchUserOrganizations,
        setCurrentOrganization,
        createOrganization,
        addMember,
        removeMember,
        updateMemberRole,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error("useOrganization must be used within an OrganizationProvider")
  }
  return context
}

