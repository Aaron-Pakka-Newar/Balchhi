"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export interface SearchFilters {
  type?: "lost" | "found"
  category?: string
  location?: string
  dateRange?: {
    from: Date
    to: Date
  }
  distance?: number
  sortBy?: "recent" | "relevant" | "popular"
}

export interface SearchResult {
  id: string
  title: string
  type: "lost" | "found"
  category: string
  location: string
  date: string
  image: string
  matchScore?: number
  description: string
  isVerified?: boolean
}

interface SearchContextType {
  results: SearchResult[]
  isLoading: boolean
  search: (query: string, filters: SearchFilters) => Promise<void>
  getMatches: (listingId: string) => Promise<SearchResult[]>
  clearResults: () => void
  refreshItems: () => Promise<void>
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

// Helper function to format location from database format
function formatLocation(location: { province?: string; district?: string; municipality?: string; landmark?: string } | null | unknown): string {
  if (!location || typeof location !== 'object') return "Unknown location"
  const loc = location as { province?: string; district?: string; municipality?: string; landmark?: string }
  const parts = [loc.municipality, loc.district].filter(Boolean)
  return parts.join(", ") || "Unknown location"
}

// Helper function to transform database row to SearchResult
function transformItem(item: {
  id: string
  type: "lost" | "found"
  title: string
  description: string
  location: unknown
  date_lost_found: string
  is_verified_listing?: boolean
  category?: { name: string } | null
  media?: { url: string; is_primary?: boolean }[]
}): SearchResult {
  const primaryMedia = item.media?.find(m => m.is_primary) || item.media?.[0]
  return {
    id: item.id,
    title: item.title,
    type: item.type,
    category: item.category?.name || "Other",
    location: formatLocation(item.location),
    date: item.date_lost_found,
    image: primaryMedia?.url || "/placeholder.svg",
    description: item.description,
    isVerified: item.is_verified_listing || false,
  }
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [allItems, setAllItems] = useState<SearchResult[]>([])

  const calculateMatchScore = useCallback((listing: SearchResult, query: string, filters: SearchFilters) => {
    let score = 0

    // Title/description match
    const queryLower = query.toLowerCase()
    if (listing.title.toLowerCase().includes(queryLower)) score += 30
    if (listing.description.toLowerCase().includes(queryLower)) score += 20

    // Category match
    if (filters.category && listing.category.toLowerCase() === filters.category.toLowerCase()) {
      score += 25
    }

    // Type match
    if (filters.type && listing.type === filters.type) score += 15

    // Location match (simplified)
    if (filters.location && listing.location.toLowerCase().includes(filters.location.toLowerCase())) {
      score += 20
    }

    return score
  }, [])

  // Fetch items directly from Supabase
  const fetchItems = useCallback(async (filters: SearchFilters = {}, searchQuery: string = "") => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('items')
        .select(`
          *,
          category:categories(name),
          media:item_media(url, is_primary)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50)

      // Apply filters
      if (filters.type) {
        query = query.eq('type', filters.type)
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error("Supabase error:", error)
        return []
      }

      // Transform items to SearchResult format
      const transformedItems: SearchResult[] = (data || []).map((item: any) => transformItem(item))
      
      return transformedItems
    } catch (error) {
      console.error("Error fetching items:", error)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial load
  const refreshItems = useCallback(async () => {
    const items = await fetchItems()
    setAllItems(items)
    setResults(items)
  }, [fetchItems])

  // Load items on mount
  useEffect(() => {
    refreshItems()
  }, [refreshItems])

  const search = useCallback(async (query: string, filters: SearchFilters) => {
    setIsLoading(true)
    try {
      // Fetch fresh data from API with filters
      const items = await fetchItems(filters, query)
      
      // Apply additional client-side filtering and scoring
      let filtered = items

      if (query) {
        const queryLower = query.toLowerCase()
        filtered = filtered.filter((listing) => {
          return (
            listing.title.toLowerCase().includes(queryLower) ||
            listing.description.toLowerCase().includes(queryLower) ||
            listing.category.toLowerCase().includes(queryLower)
          )
        })
      }

      if (filters.location) {
        filtered = filtered.filter((listing) =>
          listing.location.toLowerCase().includes(filters.location!.toLowerCase())
        )
      }

      // Add match scores
      const withScores = filtered.map((listing) => ({
        ...listing,
        matchScore: calculateMatchScore(listing, query, filters),
      }))

      // Sort by filter preference
      if (filters.sortBy === "recent") {
        withScores.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      } else if (filters.sortBy === "relevant") {
        withScores.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      } else if (filters.sortBy === "popular") {
        withScores.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      }

      setResults(withScores)
      setAllItems(items)
    } catch (error) {
      console.error("Search error:", error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [fetchItems, calculateMatchScore])

  const getMatches = useCallback(async (listingId: string) => {
    setIsLoading(true)
    try {
      const listing = allItems.find((l) => l.id === listingId)
      if (!listing) {
        // Try fetching the specific item from Supabase
        const { data: itemData } = await supabase
          .from('items')
          .select(`
            *,
            category:categories(name),
            media:item_media(url, is_primary)
          `)
          .eq('id', listingId)
          .single()
        
        if (!itemData) return []
        
        // Fetch all items for comparison
        const items = await fetchItems()
        const currentItem = transformItem(itemData as any)
        
        // Find similar listings (opposite type, same category)
        const matches = items
          .filter((l) => l.id !== listingId && l.type !== currentItem.type && l.category === currentItem.category)
          .map((l) => ({
            ...l,
            matchScore: calculateMatchScore(l, currentItem.title, { category: currentItem.category }),
          }))
          .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
          .slice(0, 5)

        return matches
      }

      // Find similar listings (opposite type, same category, nearby location)
      const matches = allItems
        .filter((l) => l.id !== listingId && l.type !== listing.type && l.category === listing.category)
        .map((l) => ({
          ...l,
          matchScore: calculateMatchScore(l, listing.title, { category: listing.category }),
        }))
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
        .slice(0, 5)

      return matches
    } finally {
      setIsLoading(false)
    }
  }, [allItems, calculateMatchScore, fetchItems])

  const clearResults = useCallback(() => {
    setResults([])
  }, [])

  return (
    <SearchContext.Provider value={{ results, isLoading, search, getMatches, clearResults, refreshItems }}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider")
  }
  return context
}

