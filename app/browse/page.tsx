"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import SearchBar from "@/components/search-bar"
import SearchFiltersComponent from "@/components/search-filters"
import { useSearch, type SearchFilters } from "@/contexts/search-context"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { MapPin, Calendar, Shield, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function BrowsePage() {
  const searchParams = useSearchParams()
  const { results, isLoading, search } = useSearch()
  const [filters, setFilters] = useState<SearchFilters>({})
  const [activeTab, setActiveTab] = useState<'all' | 'lost' | 'found'>('all')
  const query = searchParams.get("q") || ""

  useEffect(() => {
    // Initial load - get all items
    search(query, filters)
  }, [query])

  const handleFilter = (newFilters: SearchFilters) => {
    setFilters(newFilters)
    search(query, newFilters)
  }

  const handleTabChange = (tab: 'all' | 'lost' | 'found') => {
    setActiveTab(tab)
    const newFilters = { ...filters, type: tab === 'all' ? undefined : tab }
    setFilters(newFilters)
    search(query, newFilters)
  }

  const filteredResults = activeTab === 'all' 
    ? results 
    : results.filter(item => item.type === activeTab)

  return (
    <main className="min-h-screen flex flex-col bg-[#e0e2d5]">
      <Header />

      {/* Hero section */}
      <div className="bg-[#6db8bb] pt-32 pb-12 px-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-[#10375d] mb-4">
            Browse Items
          </h1>
          <p className="text-[#10375d]/80 text-lg mb-8">
            Search through lost and found items across Nepal
          </p>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchBar />
            </div>
            <Link href="/listing/create">
              <Button 
                size="lg"
                className="bg-[#10375d] hover:bg-[#10375d]/90 text-[#e0e2d5] whitespace-nowrap"
              >
                <Plus className="w-5 h-5 mr-2" />
                Report Item
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#869684]/20 sticky top-16 z-40">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="flex gap-1">
            {[
              { id: 'all', label: 'All Items' },
              { id: 'lost', label: 'Lost Items' },
              { id: 'found', label: 'Found Items' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as 'all' | 'lost' | 'found')}
                className={`px-6 py-4 font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'text-[#10375d] border-[#10375d]'
                    : 'text-[#869684] border-transparent hover:text-[#10375d]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 py-8 px-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Filters */}
            <div className="md:w-64 flex-shrink-0">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-[#869684]/20 sticky top-36">
                <h3 className="font-bold text-[#10375d] mb-4">Filters</h3>
                <SearchFiltersComponent onFilter={handleFilter} isLoading={isLoading} />
              </div>
            </div>

            {/* Results */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <p className="text-[#869684]">
                  {filteredResults.length} item{filteredResults.length !== 1 ? 's' : ''} found
                  {query && ` for "${query}"`}
                </p>
              </div>

              {isLoading ? (
                <div className="text-center py-16">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#10375d]"></div>
                  <p className="mt-4 text-[#869684]">Searching...</p>
                </div>
              ) : filteredResults.length === 0 ? (
                <Card className="bg-white border-[#869684]/20">
                  <CardContent className="pt-6 text-center py-16">
                    <div className="w-16 h-16 bg-[#6db8bb]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-8 h-8 text-[#05647a]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#10375d] mb-2">No items found</h3>
                    <p className="text-[#869684] mb-6">
                      {query ? `No items match "${query}"` : 'Start by searching for an item'}
                    </p>
                    <Link href="/listing/create">
                      <Button className="bg-[#10375d] hover:bg-[#10375d]/90 text-[#e0e2d5]">
                        Report a lost or found item
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredResults.map((item) => (
                    <Link key={item.id} href={`/listing/${item.id}`}>
                      <Card className="bg-white border-[#869684]/20 hover:shadow-lg hover:border-[#6db8bb] transition-all duration-300 cursor-pointer group">
                        <CardContent className="p-0">
                          <div className="flex gap-0">
                            {/* Image */}
                            <div className="h-36 w-36 flex-shrink-0 bg-[#e0e2d5] overflow-hidden">
                              <img
                                src={item.image || "/placeholder.svg"}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-5 min-w-0">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <h3 className="font-bold text-lg text-[#10375d] truncate group-hover:text-[#05647a] transition-colors">
                                  {item.title}
                                </h3>
                                <Badge 
                                  className={`flex-shrink-0 ${
                                    item.type === 'lost' 
                                      ? 'bg-red-100 text-red-700 hover:bg-red-100' 
                                      : 'bg-green-100 text-green-700 hover:bg-green-100'
                                  }`}
                                >
                                  {item.type === 'lost' ? 'Lost' : 'Found'}
                                </Badge>
                              </div>

                              <p className="text-sm text-[#05647a] font-medium mb-2">{item.category}</p>
                              <p className="text-sm text-[#869684] line-clamp-2 mb-3">{item.description}</p>

                              <div className="flex flex-wrap items-center gap-4 text-sm text-[#869684]">
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-4 h-4" />
                                  <span>{item.location}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-4 h-4" />
                                  <span>{new Date(item.date).toLocaleDateString('en-NP')}</span>
                                </div>
                                {item.isVerified && (
                                  <div className="flex items-center gap-1.5 text-[#05647a]">
                                    <Shield className="w-4 h-4" />
                                    <span className="font-medium">Verified</span>
                                  </div>
                                )}
                                {item.matchScore && item.matchScore > 0 && (
                                  <div className="flex items-center gap-1.5 text-[#10375d]">
                                    <span className="font-bold">{Math.round(item.matchScore)}% match</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
