"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Header from "@/components/header"
import Footer from "@/components/footer"
import MyListings from "@/components/my-listings"
import CreateListingButton from "@/components/create-listing-button"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#6db8bb]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#e0e2d5] border-t-[#10375d]"></div>
          <p className="mt-4 text-[#10375d] font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push("/login")
    return null
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#e0e2d5]">
      <Header />

      <div className="flex-1 pt-20 py-8 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#10375d]">Dashboard</h1>
              <p className="text-[#05647a] mt-2">Welcome back, {user.name}</p>
            </div>
            <CreateListingButton />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-white border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#6db8bb]/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#05647a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#10375d]">0</p>
                    <p className="text-sm text-[#869684]">Active Listings</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#6db8bb]/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#05647a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#10375d]">0</p>
                    <p className="text-sm text-[#869684]">Potential Matches</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#6db8bb]/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#05647a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#10375d]">0</p>
                    <p className="text-sm text-[#869684]">Items Reunited</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="active" className="space-y-6">
            <TabsList className="bg-white p-1 rounded-xl shadow-sm border-0">
              <TabsTrigger 
                value="active" 
                className="data-[state=active]:bg-[#10375d] data-[state=active]:text-[#e0e2d5] rounded-lg px-6 py-2"
              >
                My Listings
              </TabsTrigger>
              <TabsTrigger 
                value="matches"
                className="data-[state=active]:bg-[#10375d] data-[state=active]:text-[#e0e2d5] rounded-lg px-6 py-2"
              >
                Matches
              </TabsTrigger>
              <TabsTrigger 
                value="claims"
                className="data-[state=active]:bg-[#10375d] data-[state=active]:text-[#e0e2d5] rounded-lg px-6 py-2"
              >
                Claims
              </TabsTrigger>
              <TabsTrigger 
                value="messages"
                className="data-[state=active]:bg-[#10375d] data-[state=active]:text-[#e0e2d5] rounded-lg px-6 py-2"
              >
                Messages
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              <MyListings status="active" />
            </TabsContent>

            <TabsContent value="matches">
              <Card className="bg-white border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-[#10375d]">Potential Matches</CardTitle>
                  <CardDescription className="text-[#869684]">
                    Items that might match your lost/found listings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-[#6db8bb]/20 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-[#05647a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <p className="text-[#10375d] font-medium">No matches yet</p>
                    <p className="text-[#869684] text-sm mt-1">We'll notify you when we find potential matches</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="claims">
              <Card className="bg-white border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-[#10375d]">Claims</CardTitle>
                  <CardDescription className="text-[#869684]">
                    Track claims on your found items or your own claims
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-[#6db8bb]/20 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-[#05647a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <p className="text-[#10375d] font-medium">No claims yet</p>
                    <p className="text-[#869684] text-sm mt-1">Claims will appear here when someone claims your item</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages">
              <Card className="bg-white border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-[#10375d]">Messages</CardTitle>
                  <CardDescription className="text-[#869684]">
                    Conversations about your items
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-[#6db8bb]/20 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-[#05647a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-[#10375d] font-medium">No messages yet</p>
                    <p className="text-[#869684] text-sm mt-1">Start a conversation when you find a match</p>
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
