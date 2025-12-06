"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import CreateListingForm from "@/components/create-listing-form"
import { Button } from "@/components/ui/button"
import { Search, Eye } from "lucide-react"

export default function CreateListingPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [listingType, setListingType] = useState<'lost' | 'found' | null>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [isLoading, user, router])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#D4D4D4]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#2B2B2B]"></div>
          <p className="mt-4 text-[#2B2B2B]">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#FFFFFF]">
      <Header />

      {/* Hero section */}
      <div className="bg-[#D4D4D4] pt-24 pb-12 px-6 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-[#2B2B2B] mb-4">
            Report an Item
          </h1>
          <p className="text-[#2B2B2B]/80 text-lg max-w-2xl mx-auto">
            Help reunite items with their owners by sharing details about what you've lost or found
          </p>
        </div>
      </div>

      <div className="flex-1 py-12 px-6 md:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Type selection */}
          {!listingType ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-[#2B2B2B] text-center mb-8">
                What would you like to report?
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <button
                  onClick={() => setListingType('lost')}
                  className="bg-white rounded-2xl p-8 border-2 border-[#2B2B2B]/20 hover:border-[#2B2B2B] hover:shadow-lg transition-all duration-300 group text-left"
                >
                  <div className="w-16 h-16 rounded-xl bg-red-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Search className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-[#2B2B2B] mb-2">
                    I lost something
                  </h3>
                  <p className="text-[#2B2B2B]">
                    Report an item you've lost and let others help you find it
                  </p>
                </button>

                <button
                  onClick={() => setListingType('found')}
                  className="bg-white rounded-2xl p-8 border-2 border-[#2B2B2B]/20 hover:border-[#2B2B2B] hover:shadow-lg transition-all duration-300 group text-left"
                >
                  <div className="w-16 h-16 rounded-xl bg-green-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Eye className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-[#2B2B2B] mb-2">
                    I found something
                  </h3>
                  <p className="text-[#2B2B2B]">
                    Report an item you've found and help reunite it with its owner
                  </p>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#2B2B2B]/20">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-[#2B2B2B]">
                    {listingType === 'lost' ? 'Report Lost Item' : 'Report Found Item'}
                  </h2>
                  <p className="text-[#2B2B2B] mt-1">
                    Fill in the details below to create your listing
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setListingType(null)}
                  className="border-[#2B2B2B] text-[#2B2B2B] hover:bg-[#FFFFFF]"
                >
                  Change type
                </Button>
              </div>

              <CreateListingForm type={listingType} />
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}

