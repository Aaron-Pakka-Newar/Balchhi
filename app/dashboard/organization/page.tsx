"use client"

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
import { Building, Settings, Users, BarChart3 } from "lucide-react"

export default function OrganizationPage() {
  const { user, isLoading } = useAuth()
  const { organizations } = useOrganization()
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#6db8bb]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#e0e2d5] border-t-[#10375d]"></div>
          <p className="mt-4 text-[#10375d] font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push("/login")
    return null
  }

  const userOrganizations = organizations.filter((org) => org.ownerId === user.id)

  if (userOrganizations.length === 0) {
    return (
      <main className="min-h-screen flex flex-col bg-[#e0e2d5]">
        <Header />

        <div className="flex-1 pt-20 py-8 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-2xl bg-[#6db8bb]/20 flex items-center justify-center mx-auto mb-6">
                <Building className="w-10 h-10 text-[#05647a]" />
              </div>
              <h1 className="text-2xl font-bold text-[#10375d] mb-2">No Organizations Yet</h1>
              <p className="text-[#869684] mb-8 max-w-md mx-auto">
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

  const organization = userOrganizations[0]

  return (
    <main className="min-h-screen flex flex-col bg-[#e0e2d5]">
      <Header />

      <div className="flex-1 pt-20 py-8 px-4 md:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#6db8bb]/20 flex items-center justify-center flex-shrink-0">
              <Building className="w-8 h-8 text-[#05647a]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#10375d]">{organization.name}</h1>
              <p className="text-[#869684] mt-1">{organization.description}</p>
            </div>
          </div>

          <Tabs defaultValue="analytics" className="space-y-6">
            <TabsList className="bg-white p-1 rounded-xl shadow-sm border-0">
              <TabsTrigger 
                value="analytics"
                className="data-[state=active]:bg-[#10375d] data-[state=active]:text-[#e0e2d5] rounded-lg px-6 py-2 flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="team"
                className="data-[state=active]:bg-[#10375d] data-[state=active]:text-[#e0e2d5] rounded-lg px-6 py-2 flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Team
              </TabsTrigger>
              <TabsTrigger 
                value="settings"
                className="data-[state=active]:bg-[#10375d] data-[state=active]:text-[#e0e2d5] rounded-lg px-6 py-2 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Settings
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
                  <CardTitle className="text-[#10375d]">Organization Settings</CardTitle>
                  <CardDescription className="text-[#869684]">Manage your organization details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-full bg-[#6db8bb]/20 flex items-center justify-center mx-auto mb-3">
                      <Settings className="w-6 h-6 text-[#05647a]" />
                    </div>
                    <p className="text-sm text-[#869684]">Settings coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </main>
  )
}
