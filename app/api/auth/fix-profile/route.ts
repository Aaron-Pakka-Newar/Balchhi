import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// POST /api/auth/fix-profile - Create missing profile for authenticated user
export async function POST(request: NextRequest) {
  console.log('=== FIX-PROFILE API CALLED ===')
  
  try {
    const body = await request.json()
    const { id, email, name, role, phone } = body

    if (!id || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Map role to valid database enum values
    const dbRole = role === 'organization' ? 'organization' : 'individual'

    // Check if profile already exists
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('id', id)
      .single()

    if (existingProfile) {
      console.log('Profile already exists for user:', id)
      return NextResponse.json({ success: true, message: 'Profile already exists' })
    }

    // Create the missing profile
    const { data: profile, error } = await adminClient
      .from('profiles')
      .insert({
        id,
        email,
        name: name || email.split('@')[0],
        role: dbRole,
        phone: phone || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating profile:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    console.log('Profile created successfully:', profile)
    return NextResponse.json({ success: true, profile })
  } catch (error) {
    console.error('Fix-profile error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create profile' },
      { status: 500 }
    )
  }
}
