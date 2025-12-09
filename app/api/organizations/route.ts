import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServerClientWithAuth, createAdminClient } from '@/lib/supabase'
import { validateOrgEmail } from '@/lib/org-rbac'

// GET /api/organizations - List organizations
export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  
  const type = searchParams.get('type')
  const verified = searchParams.get('verified')
  const approved = searchParams.get('approved')
  const search = searchParams.get('search')

  try {
    let query = supabase
      .from('organizations')
      .select('*')
      .eq('is_active', true)

    if (type) {
      query = query.eq('type', type as any)
    }

    if (verified === 'true') {
      query = query.eq('is_verified', true)
    }

    // Filter by verification status (approved organizations only)
    if (approved === 'true') {
      query = query.eq('verification_status', 'approved')
    }

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ organizations: data })
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    )
  }
}

// POST /api/organizations - Register organization
export async function POST(request: NextRequest) {
  const adminClient = createAdminClient()

  try {
    // Get authenticated user from request
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createServerClientWithAuth(token)

    const body = await request.json()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      name,
      type,
      description,
      contact_email,
      contact_phone,
      location,
      address,
    } = body

    if (!name || !type || !contact_email || !contact_phone || !location || !address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email domain for organization
    const emailValidation = await validateOrgEmail(contact_email)

    // Check if user already has an organization
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('admin_id', user.id)
      .single() as { data: any }

    if (existingOrg) {
      return NextResponse.json(
        { error: 'You already have an organization registered' },
        { status: 400 }
      )
    }

    // Create organization with new verification fields
    const { data: org, error } = await (adminClient.from('organizations') as any)
      .insert({
        name,
        type,
        description,
        contact_email,
        contact_phone,
        location,
        address,
        admin_id: user.id,
        // New verification fields
        verification_status: 'draft',
        can_post_items: false,
        can_manage_claims: false,
        trust_score: 0,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Add admin as member with enhanced role
    await (adminClient.from('organization_members') as any).insert({
      organization_id: org.id,
      user_id: user.id,
      role: 'admin',
      member_role: 'org_owner',
      invited_by: user.id,
      invited_at: new Date().toISOString(),
      accepted_at: new Date().toISOString(),
      is_active: true,
    })

    // Update user role
    await (adminClient.from('profiles') as any)
      .update({ role: 'organization' })
      .eq('id', user.id)

    // Log activity
    await (adminClient.from('activity_logs') as any).insert({
      user_id: user.id,
      action: 'create',
      entity_type: 'organization',
      entity_id: org.id,
      details: { name, type },
    })

    return NextResponse.json({ 
      organization: org,
      email_validation: emailValidation,
      next_steps: [
        'Complete verification details',
        'Add primary contact person',
        'Upload registration documents',
        'Verify email domain',
        'Submit for review'
      ]
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating organization:', error)
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    )
  }
}
