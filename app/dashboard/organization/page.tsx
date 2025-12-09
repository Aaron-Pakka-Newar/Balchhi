"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useOrganization } from "@/contexts/organization-context"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import CreateOrgDialog from "@/components/create-org-dialog"
import TeamManagement from "@/components/team-management"
import OrgAnalytics from "@/components/org-analytics"
import OrgVerificationStatus from "@/components/org-verification-status"
import OrgVerificationForm from "@/components/org-verification-form"
import { Building, Settings, Users, BarChart3, Shield } from "lucide-react"

export default function OrganizationPage() {
  const { user, isLoading } = useAuth()
  const { organizations, currentOrganization, isLoading: orgLoading } = useOrganization()
  const router = useRouter()

  // Verification state management
  const [verificationStatus, setVerificationStatus] = useState<string>('draft')
  const [verificationData, setVerificationData] = useState<any>(null)
  const [showVerificationForm, setShowVerificationForm] = useState(false)
  const [loadingVerification, setLoadingVerification] = useState(true)

  const userOrganizations = user ? organizations.filter((org) => org.ownerId === user.id) : []
  const organization = currentOrganization || userOrganizations[0]
  const organizationId = organization?.id

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
    // Redirect non-organization users to dashboard
    if (!isLoading && user && user.role !== 'organization') {
      router.push("/dashboard")
    }
  }, [user, isLoading, router])

  // Fetch verification status
  useEffect(() => {
    if (!organizationId) {
      setVerificationData(null)
      setVerificationStatus('draft')
      setLoadingVerification(false)
      return
    }

    const fetchVerification = async () => {
      try {
        setLoadingVerification(true)
        const response = await fetch(`/api/organizations/${organizationId}/verification`)
        if (response.ok) {
          const data = await response.json()
          if (data.verification) {
            setVerificationData(data.verification)
            setVerificationStatus(data.verification.verification_status || 'draft')
          }
        }
      } catch (error) {
        console.error('Failed to fetch verification:', error)
      } finally {
        setLoadingVerification(false)
      }
    }

    fetchVerification()
  }, [organizationId])

  const persistVerification = async (payload: any) => {
    const response = await fetch(`/api/organizations/${organization.id}/verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error('Failed to save verification')
    }

    const result = await response.json()
    setVerificationData(result.verification)
    setVerificationStatus(result.verification.verification_status || 'draft')
    return result.verification
  }

  const handleSaveVerification = async (data: any) => {
    try {
      await persistVerification(data)
    } catch (error) {
      console.error('Failed to save verification:', error)
    }
  }

  const handleSubmitVerification = async (data: any) => {
    try {
      await persistVerification(data)
      const response = await fetch(`/api/organizations/${organization.id}/verification`, {
        method: 'PUT'
      })
      
      if (response.ok) {
        const result = await response.json()
        setVerificationData(result.verification)
        setVerificationStatus(result.verification.verification_status || 'submitted')
        setShowVerificationForm(false)
      }
    } catch (error) {
      console.error('Failed to submit verification:', error)
    }
  }

  if (isLoading || orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#D4D4D4]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#FFFFFF] border-t-[#2B2B2B]"></div>
          <p className="mt-4 text-[#2B2B2B] font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#D4D4D4]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#FFFFFF] border-t-[#2B2B2B]"></div>
          <p className="mt-4 text-[#2B2B2B] font-medium">Redirecting...</p>
        </div>
      </div>
    )
  }

  if (userOrganizations.length === 0) {
    return (
      <main className="min-h-screen flex flex-col bg-[#FFFFFF]">
        <Header />

        <div className="flex-1 pt-24 pb-8 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-2xl bg-[#D4D4D4]/20 flex items-center justify-center mx-auto mb-6">
                <Building className="w-10 h-10 text-[#2B2B2B]" />
              </div>
              <h1 className="text-2xl font-bold text-[#2B2B2B] mb-2">No Organizations Yet</h1>
              <p className="text-[#2B2B2B] mb-8 max-w-md mx-auto">
                Create an organization to manage multiple listings, staff members, and access analytics
              </p>
              <CreateOrgDialog />
            </div>
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
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#D4D4D4]/20 flex items-center justify-center flex-shrink-0">
              <Building className="w-8 h-8 text-[#2B2B2B]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#2B2B2B]">{organization.name}</h1>
              <p className="text-[#2B2B2B] mt-1">{organization.description}</p>
            </div>
          </div>

          <Tabs defaultValue="analytics" className="space-y-6">
            <TabsList className="bg-white p-1 rounded-xl shadow-sm border-0">
              <TabsTrigger 
                value="analytics"
                className="data-[state=active]:bg-[#2B2B2B] data-[state=active]:text-[#FFFFFF] rounded-lg px-6 py-2 flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="team"
                className="data-[state=active]:bg-[#2B2B2B] data-[state=active]:text-[#FFFFFF] rounded-lg px-6 py-2 flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Team
              </TabsTrigger>
              <TabsTrigger 
                value="settings"
                className="data-[state=active]:bg-[#2B2B2B] data-[state=active]:text-[#FFFFFF] rounded-lg px-6 py-2 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Settings
              </TabsTrigger>
              <TabsTrigger 
                value="verification"
                className="data-[state=active]:bg-[#2B2B2B] data-[state=active]:text-[#FFFFFF] rounded-lg px-6 py-2 flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Verification
                {verificationStatus === 'approved' && (
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                )}
                {verificationStatus === 'draft' && (
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analytics">
              <OrgAnalytics organization={organization} />
            </TabsContent>

            <TabsContent value="team">
              <TeamManagement organization={organization} />
            </TabsContent>

            <TabsContent value="settings">
              <Card className="bg-white border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-[#2B2B2B]">Organization Settings</CardTitle>
                  <CardDescription className="text-[#2B2B2B]">Manage your organization details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-full bg-[#D4D4D4]/20 flex items-center justify-center mx-auto mb-3">
                      <Settings className="w-6 h-6 text-[#2B2B2B]" />
                    </div>
                    <p className="text-sm text-[#2B2B2B]">Settings coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="verification">
              {loadingVerification ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#D4D4D4] border-t-[#2B2B2B]"></div>
                  <p className="mt-4 text-[#2B2B2B]">Loading verification status...</p>
                </div>
              ) : showVerificationForm ? (
                <div className="space-y-4">
                  <button
                    onClick={() => setShowVerificationForm(false)}
                    className="text-sm text-[#2B2B2B] hover:underline flex items-center gap-1"
                  >
                    Back to status
                  </button>
                  <OrgVerificationForm
                    organizationId={organization.id}
                    initialData={verificationData}
                    onSave={handleSaveVerification}
                    onSubmit={handleSubmitVerification}
                  />
                </div>
              ) : (
                <OrgVerificationStatus
                  status={verificationStatus as any}
                  submittedAt={verificationData?.submitted_at}
                  approvedAt={verificationData?.approved_at}
                  rejectionReason={verificationData?.rejection_reason}
                  onStartVerification={() => setShowVerificationForm(true)}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </main>
  )
}
