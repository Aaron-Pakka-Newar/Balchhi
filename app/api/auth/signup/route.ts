import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  console.log('=== SIGNUP API CALLED ===')
  
  try {
    const body = await request.json()
    console.log('Request body:', JSON.stringify(body, null, 2))
    
    const { email, password, name, role, phone } = body

    console.log('Signup request received:', { email, name, role, phone: phone ? 'provided' : 'not provided' })

    // Validate input
    if (!email || !password || !name || !role) {
      console.log('Missing required fields:', { email: !!email, password: !!password, name: !!name, role: !!role })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('Creating admin client...')
    console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    const adminClient = createAdminClient()

    // Map the role to valid database enum values
    // Database accepts: 'individual', 'user', 'verified_user', 'organization', 'admin'
    const dbRole = role === 'organization' ? 'organization' : 'individual'
    console.log('Mapped role:', role, '->', dbRole)

    try {
      // Create auth user with email confirmed
      // The database trigger 'on_auth_user_created' will automatically create the profile
      // using the values from user_metadata
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          name,
          role: dbRole,
          phone: phone || null,
        },
        email_confirm: true, // Auto-confirm email for admin-created users
      })

      if (authError) {
        console.error('Auth error:', authError)
        return NextResponse.json(
          { error: authError.message },
          { status: 400 }
        )
      }

      console.log('Auth user created:', authData.user.id)
      console.log('User metadata stored:', authData.user.user_metadata)

      // Wait a bit for the trigger to potentially create the profile
      await new Promise(resolve => setTimeout(resolve, 300))

      // Check if profile exists (trigger might have created it)
      const { data: existingProfile } = await adminClient
        .from('profiles')
        .select('id')
        .eq('id', authData.user.id)
        .single()

      if (existingProfile) {
        // Profile exists, update it with the correct role and phone
        console.log('Profile exists, updating...')
        const { error: updateError } = await adminClient
          .from('profiles')
          .update({ 
            role: dbRole,
            phone: phone || null,
            name: name,
          })
          .eq('id', authData.user.id)
        
        if (updateError) {
          console.error('Profile update error:', updateError)
        } else {
          console.log('Profile updated successfully')
        }
      } else {
        // Profile doesn't exist, create it explicitly
        console.log('Profile does not exist, creating...')
        const { error: insertError } = await adminClient
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: authData.user.email!,
            name,
            role: dbRole,
            phone: phone || null,
          })
        
        if (insertError) {
          console.error('Profile insert error:', insertError)
          // If insert fails, try upsert as a last resort
          const { error: upsertError } = await adminClient
            .from('profiles')
            .upsert({
              id: authData.user.id,
              email: authData.user.email!,
              name,
              role: dbRole,
              phone: phone || null,
            })
          if (upsertError) {
            console.error('Profile upsert error:', upsertError)
          } else {
            console.log('Profile created via upsert')
          }
        } else {
          console.log('Profile created successfully')
        }
      }

      // Verify profile was created
      const { data: profile, error: profileCheckError } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profileCheckError) {
        console.error('Profile check error:', profileCheckError)
        // Last ditch effort - force create the profile
        console.log('Attempting final profile creation...')
        await adminClient
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: authData.user.email!,
            name,
            role: dbRole,
            phone: phone || null,
          })
      } else {
        console.log('Profile verified:', profile)
      }

      return NextResponse.json(
        {
          success: true,
          user: {
            id: authData.user.id,
            email: authData.user.email,
            name,
            role: dbRole,
          },
        },
        { status: 201 }
      )
    } catch (innerError) {
      console.error('Inner error:', innerError)
      throw innerError
    }
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create account' },
      { status: 500 }
    )
  }
}
