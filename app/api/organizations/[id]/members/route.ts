/**
 * Organization Members API Routes
 * Nepal Lost & Found Platform - KhojPayo
 * 
 * Endpoints for managing organization members
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClientWithAuth, createAdminClient } from '@/lib/supabase'

// ============================================
// GET /api/organizations/[id]/members
// List all members for an organization
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: organizationId } = await params
  
  // Get authenticated user from request
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = createServerClientWithAuth(token)

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const adminClient = createAdminClient()
  
  try {
    // Verify user is a member of this organization
    const { data: membership, error: membershipError } = await adminClient
      .from('organization_members')
      .select('id, role, member_role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (membershipError) {
      console.error('Error checking membership:', membershipError)
    }

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 })
    }

    // Get all members with user profiles
    const { data: members, error } = await adminClient
      .from('organization_members')
      .select(`
        id,
        user_id,
        role,
        member_role,
        created_at,
        is_active,
        invited_at,
        accepted_at,
        permissions,
        profiles:user_id (id, name, email, avatar_url)
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('Error fetching members from DB:', error)
      throw error
    }
    
    return NextResponse.json({ members: members || [] })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Error fetching members:', errorMessage)
    return NextResponse.json(
      { error: errorMessage || 'Failed to fetch members' },
      { status: 500 }
    )
  }
}

// ============================================
// POST /api/organizations/[id]/members
// Add a new member to the organization
// ============================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: organizationId } = await params
  
  // Get authenticated user from request
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = createServerClientWithAuth(token)

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const adminClient = createAdminClient()
  
  try {
    // Check if the requester has permission to add members (org_owner or org_admin)
    const { data: requesterMembership, error: membershipError } = await adminClient
      .from('organization_members')
      .select('id, role, member_role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    console.log('Requester membership check:', { userId: user.id, organizationId, requesterMembership, membershipError })

    if (!requesterMembership) {
      return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 })
    }

    const allowedRoles = ['org_owner', 'org_admin']
    if (!allowedRoles.includes(requesterMembership.member_role || '')) {
      return NextResponse.json({ error: `Insufficient permissions. Your role: ${requesterMembership.member_role}` }, { status: 403 })
    }

    const body = await request.json()
    const {
      user_id,
      email,
      role = 'staff',
      member_role = 'org_staff',
      permissions
    } = body

    console.log('Add member request:', { user_id, email, role, member_role, organizationId })

    // Find user by email if user_id not provided
    let targetUserId = user_id
    if (!targetUserId && email) {
      const { data: userProfile, error: profileError } = await adminClient
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()
      
      if (profileError) {
        console.error('Error looking up user by email:', profileError)
      }

      if (!userProfile) {
        return NextResponse.json({ error: `User not found with email: ${email}` }, { status: 404 })
      }
      targetUserId = userProfile.id
      console.log('Found user by email:', targetUserId)
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'user_id or email is required' }, { status: 400 })
    }

    // Check if user is already a member
    const { data: existingMember } = await adminClient
      .from('organization_members')
      .select('id, is_active')
      .eq('organization_id', organizationId)
      .eq('user_id', targetUserId)
      .single()

    if (existingMember) {
      if (existingMember.is_active) {
        return NextResponse.json({ error: 'User is already a member of this organization' }, { status: 400 })
      }
      
      // Reactivate the member
      const { data: updatedMember, error: updateError } = await adminClient
        .from('organization_members')
        .update({
          is_active: true,
          role,
          member_role,
          permissions,
          deactivated_at: null,
          deactivated_by: null,
          invited_by: user.id,
          invited_at: new Date().toISOString(),
          accepted_at: new Date().toISOString(),
        })
        .eq('id', existingMember.id)
        .select(`
          id,
          user_id,
          role,
          member_role,
          created_at,
          is_active,
          profiles:user_id (id, name, email, avatar_url)
        `)
        .single()

      if (updateError) throw updateError

      return NextResponse.json({ member: updatedMember }, { status: 200 })
    }

    // Validate member_role
    const validMemberRoles = ['org_owner', 'org_admin', 'org_manager', 'org_staff', 'org_volunteer']
    if (!validMemberRoles.includes(member_role)) {
      return NextResponse.json({ error: 'Invalid member role' }, { status: 400 })
    }

    // Create new member
    const { data: newMember, error: insertError } = await adminClient
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        user_id: targetUserId,
        role,
        member_role,
        permissions,
        invited_by: user.id,
        invited_at: new Date().toISOString(),
        accepted_at: new Date().toISOString(),
        is_active: true,
      })
      .select(`
        id,
        user_id,
        role,
        member_role,
        created_at,
        is_active,
        profiles:user_id (id, name, email, avatar_url)
      `)
      .single()

    if (insertError) throw insertError

    // Log activity
    await adminClient.from('activity_logs').insert({
      user_id: user.id,
      action: 'create',
      entity_type: 'organization_member',
      entity_id: newMember.id,
      details: { 
        organization_id: organizationId,
        added_user_id: targetUserId,
        role,
        member_role
      },
    })

    return NextResponse.json({ member: newMember }, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Error adding member:', errorMessage, error)
    return NextResponse.json(
      { error: errorMessage || 'Failed to add member' },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE /api/organizations/[id]/members
// Remove a member from the organization
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: organizationId } = await params
  
  // Get authenticated user from request
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = createServerClientWithAuth(token)

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const adminClient = createAdminClient()
  
  try {
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')
    const userId = searchParams.get('userId')

    if (!memberId && !userId) {
      return NextResponse.json({ error: 'memberId or userId is required' }, { status: 400 })
    }

    // Check if the requester has permission to remove members
    const { data: requesterMembership } = await adminClient
      .from('organization_members')
      .select('id, role, member_role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!requesterMembership) {
      return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 })
    }

    const allowedRoles = ['org_owner', 'org_admin']
    if (!allowedRoles.includes(requesterMembership.member_role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions to remove members' }, { status: 403 })
    }

    // Find the member to remove
    let memberQuery = adminClient
      .from('organization_members')
      .select('id, user_id, member_role')
      .eq('organization_id', organizationId)
      .eq('is_active', true)

    if (memberId) {
      memberQuery = memberQuery.eq('id', memberId)
    } else if (userId) {
      memberQuery = memberQuery.eq('user_id', userId)
    }

    const { data: targetMember } = await memberQuery.single()

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Prevent removing the owner
    if (targetMember.member_role === 'org_owner') {
      return NextResponse.json({ error: 'Cannot remove the organization owner' }, { status: 400 })
    }

    // Deactivate the member (soft delete)
    const { error: updateError } = await adminClient
      .from('organization_members')
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
        deactivated_by: user.id,
      })
      .eq('id', targetMember.id)

    if (updateError) throw updateError

    // Log activity
    await adminClient.from('activity_logs').insert({
      user_id: user.id,
      action: 'delete',
      entity_type: 'organization_member',
      entity_id: targetMember.id,
      details: { 
        organization_id: organizationId,
        removed_user_id: targetMember.user_id
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    )
  }
}

// ============================================
// PATCH /api/organizations/[id]/members
// Update a member's role or permissions
// ============================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: organizationId } = await params
  
  // Get authenticated user from request
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = createServerClientWithAuth(token)

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const adminClient = createAdminClient()
  
  try {
    const body = await request.json()
    const { member_id, user_id, role, member_role, permissions } = body

    if (!member_id && !user_id) {
      return NextResponse.json({ error: 'member_id or user_id is required' }, { status: 400 })
    }

    // Check if the requester has permission to update members
    const { data: requesterMembership } = await adminClient
      .from('organization_members')
      .select('id, role, member_role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!requesterMembership) {
      return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 })
    }

    const allowedRoles = ['org_owner', 'org_admin']
    if (!allowedRoles.includes(requesterMembership.member_role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions to update members' }, { status: 403 })
    }

    // Find the member to update
    let memberQuery = adminClient
      .from('organization_members')
      .select('id, user_id, member_role')
      .eq('organization_id', organizationId)
      .eq('is_active', true)

    if (member_id) {
      memberQuery = memberQuery.eq('id', member_id)
    } else if (user_id) {
      memberQuery = memberQuery.eq('user_id', user_id)
    }

    const { data: targetMember } = await memberQuery.single()

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Prevent changing owner's role unless you're the owner
    if (targetMember.member_role === 'org_owner' && requesterMembership.member_role !== 'org_owner') {
      return NextResponse.json({ error: 'Only the owner can modify owner permissions' }, { status: 403 })
    }

    // Validate member_role if provided
    if (member_role) {
      const validMemberRoles = ['org_owner', 'org_admin', 'org_manager', 'org_staff', 'org_volunteer']
      if (!validMemberRoles.includes(member_role)) {
        return NextResponse.json({ error: 'Invalid member role' }, { status: 400 })
      }

      // Only owner can promote someone to owner
      if (member_role === 'org_owner' && requesterMembership.member_role !== 'org_owner') {
        return NextResponse.json({ error: 'Only the owner can promote to owner' }, { status: 403 })
      }
    }

    // Build update object
    const updateData: any = {}
    if (role !== undefined) updateData.role = role
    if (member_role !== undefined) updateData.member_role = member_role
    if (permissions !== undefined) updateData.permissions = permissions

    // Update the member
    const { data: updatedMember, error: updateError } = await adminClient
      .from('organization_members')
      .update(updateData)
      .eq('id', targetMember.id)
      .select(`
        id,
        user_id,
        role,
        member_role,
        created_at,
        is_active,
        permissions,
        profiles:user_id (id, name, email, avatar_url)
      `)
      .single()

    if (updateError) throw updateError

    // Log activity
    await adminClient.from('activity_logs').insert({
      user_id: user.id,
      action: 'update',
      entity_type: 'organization_member',
      entity_id: targetMember.id,
      details: { 
        organization_id: organizationId,
        updated_user_id: targetMember.user_id,
        changes: updateData
      },
    })

    return NextResponse.json({ member: updatedMember })
  } catch (error) {
    console.error('Error updating member:', error)
    return NextResponse.json(
      { error: 'Failed to update member' },
      { status: 500 }
    )
  }
}
