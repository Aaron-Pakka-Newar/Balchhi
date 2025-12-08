import { NextRequest, NextResponse } from 'next/server'
import { createServerClientWithAuth, createAdminClient } from '@/lib/supabase'
import { canUserPerformAction } from '@/lib/org-rbac'

// PATCH /api/claims/[id] - Update claim status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = createServerClientWithAuth(token) as any
  const { id } = await params

  try {
    const body = await request.json()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get claim with item details
    const { data: claim } = await supabase
      .from('claims')
      .select(`
        *,
        item:items(id, user_id, type, organization_id)
      `)
      .eq('id', id)
      .single() as { data: any }

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
    }

    // Check permissions
    const isOwner = claim.item?.user_id === user.id
    const isClaimant = claim.claimant_id === user.id
    
    // Check if user is org staff for org items
    let isOrgStaff = false
    if (claim.item?.organization_id) {
      const permResult = await canUserPerformAction(user.id, claim.item.organization_id, 'manage_claim')
      isOrgStaff = permResult.allowed
    }

    if (!isOwner && !isClaimant && !isOrgStaff) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { status, rejection_reason, secret_info, proof_description } = body

    // If claimant is editing their claim description
    if (isClaimant && (secret_info || proof_description) && !status) {
      const updateData: any = {}
      if (secret_info) updateData.secret_info = secret_info
      if (proof_description) updateData.proof_description = proof_description
      updateData.updated_at = new Date().toISOString()

      const { data: updatedClaim, error } = await (supabase.from('claims') as any)
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ claim: updatedClaim })
    }

    // Validate status transitions
    if (status === 'approved' || status === 'rejected') {
      if (!isOwner && !isOrgStaff) {
        return NextResponse.json(
          { error: 'Only item owner or organization staff can approve/reject claims' },
          { status: 403 }
        )
      }
    }

    if (status === 'withdrawn') {
      if (!isClaimant) {
        return NextResponse.json(
          { error: 'Only claimant can withdraw claim' },
          { status: 403 }
        )
      }
    }

    // Update claim
    const updateData: any = {
      status,
      reviewer_id: isOwner ? user.id : null,
      reviewed_at: ['approved', 'rejected'].includes(status) ? new Date().toISOString() : null,
    }

    if (status === 'rejected' && rejection_reason) {
      updateData.rejection_reason = rejection_reason
    }

    const { data: updatedClaim, error } = await (supabase.from('claims') as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Handle claim approval
    if (status === 'approved') {
      // Update item status to resolved
      await (supabase
        .from('items') as any)
        .update({ status: 'resolved' })
        .eq('id', claim.item_id)

      // Create handover record
      await (supabase.from('handovers') as any).insert({
        claim_id: id,
        method: 'meetup', // default, can be changed later
      })

      // Notify claimant
      await (supabase.from('notifications') as any).insert({
        user_id: claim.claimant_id,
        type: 'claim_approved',
        title: 'Claim Approved!',
        body: 'Your claim has been approved. Arrange the handover now.',
        data: { claim_id: id },
      })

      // Reject other pending claims
      await (supabase
        .from('claims') as any)
        .update({ status: 'rejected', rejection_reason: 'Another claim was approved' })
        .eq('item_id', claim.item_id)
        .neq('id', id)
        .eq('status', 'pending')
    }

    if (status === 'rejected') {
      // Notify claimant
      await (supabase.from('notifications') as any).insert({
        user_id: claim.claimant_id,
        type: 'claim_rejected',
        title: 'Claim Rejected',
        body: rejection_reason || 'Your claim was not approved.',
        data: { claim_id: id },
      })

      // Check if there are other pending claims
      const { count } = await supabase
        .from('claims')
        .select('*', { count: 'exact', head: true })
        .eq('item_id', claim.item_id)
        .eq('status', 'pending')

      // If no more pending claims, revert item to active
      if (count === 0) {
        await (supabase
          .from('items') as any)
          .update({ status: 'active' })
          .eq('id', claim.item_id)
      }
    }

    return NextResponse.json({ claim: updatedClaim })
  } catch (error) {
    console.error('Error updating claim:', error)
    return NextResponse.json(
      { error: 'Failed to update claim' },
      { status: 500 }
    )
  }
}
