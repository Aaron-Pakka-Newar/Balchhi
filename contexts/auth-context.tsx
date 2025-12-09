"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Session } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

export type UserRole = "individual" | "organization" | "admin"

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type DbUserRole = Database['public']['Tables']['profiles']['Row']['role']

// Map database role to auth context role
function mapDbRoleToUserRole(dbRole: DbUserRole): UserRole {
  switch (dbRole) {
    case 'organization':
      return 'organization'
    case 'admin':
      return 'admin'
    case 'user':
    case 'verified_user':
    default:
      return 'individual'
  }
}

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: Date
}

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  isEmailConfirmed: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string, role: UserRole, phone?: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper function to fetch user profile from appropriate table
async function fetchUserProfile(userId: string): Promise<User | null> {
  try {
    // Check profiles table (all users are stored here)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle() // Use maybeSingle instead of single to avoid error when no rows
    
    if (error) {
      console.error('Error fetching profile:', error.message, error.code, error.details)
      return null
    }
    
    if (profile) {
      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: mapDbRoleToUserRole(profile.role),
        createdAt: new Date(profile.created_at || Date.now()),
      }
    }
    
    console.log('No profile found for userId:', userId)
    return null
  } catch (err) {
    console.error('Exception fetching profile:', err)
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEmailConfirmed, setIsEmailConfirmed] = useState(false)

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Get current session
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        setSession(currentSession)
        
        if (currentSession) {
          // Fetch user profile from appropriate table
          const userProfile = await fetchUserProfile(currentSession.user.id)
          if (userProfile) {
            setUser(userProfile)
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession)
      
      if (currentSession?.user) {
        const userProfile = await fetchUserProfile(currentSession.user.id)
        if (userProfile) {
          setUser(userProfile)
        }
      } else {
        setUser(null)
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        console.error('Supabase auth error:', error)
        throw error
      }
      
      if (!data.session || !data.user) {
        throw new Error('Login failed - no session returned')
      }
      
      setSession(data.session)
      
      // Fetch user profile from appropriate table
      let userProfile = await fetchUserProfile(data.user.id)
      
      if (!userProfile) {
        console.log('No profile found, attempting to create one...')
        // Try to create profile from user metadata
        const metadata = data.user.user_metadata
        const profileData = {
          id: data.user.id,
          email: data.user.email!,
          name: metadata?.name || data.user.email?.split('@')[0] || 'User',
          role: metadata?.role || 'individual',
          phone: metadata?.phone || null,
        }
        
        // Call API to create missing profile
        try {
          const response = await fetch('/api/auth/fix-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData),
          })
          
          if (response.ok) {
            // Retry fetching the profile
            userProfile = await fetchUserProfile(data.user.id)
          }
        } catch (err) {
          console.error('Failed to create missing profile:', err)
        }
      }
      
      if (userProfile) {
        setUser(userProfile)
      } else {
        console.error('No profile found for user:', data.user.id)
        // Create a temporary user object from auth data
        const metadata = data.user.user_metadata
        setUser({
          id: data.user.id,
          email: data.user.email!,
          name: metadata?.name || data.user.email?.split('@')[0] || 'User',
          role: mapDbRoleToUserRole(metadata?.role || 'individual'),
          createdAt: new Date(),
        })
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (email: string, password: string, name: string, role: UserRole, phone?: string) => {
    setIsLoading(true)
    try {
      // Call our API endpoint to handle signup
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
          role,
          phone,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        // If user already exists, try to log them in instead
        if (error.error?.includes('already registered') || error.error?.includes('already been')) {
          await login(email, password)
          return
        }
        throw new Error(error.error || 'Failed to create account')
      }

      const { user: newUserData } = await response.json()
      console.log('Signup successful, user data:', newUserData)

      // Automatically log in
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (loginError) {
        console.error('Auto-login error:', loginError)
        throw loginError
      }

      console.log('Auto-login successful:', loginData.session?.user?.id)

      if (loginData.session) {
        setSession(loginData.session)
        setIsEmailConfirmed(true)

        // Use the role from API response to ensure consistency
        const newUser: User = {
          id: newUserData.id,
          email: newUserData.email,
          name: newUserData.name,
          role: role, // Use the role passed to signup, not from API
          createdAt: new Date(),
        }
        setUser(newUser)
        console.log('User state set:', newUser)
      }
    } catch (error) {
      console.error('Signup error in context:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isEmailConfirmed, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

