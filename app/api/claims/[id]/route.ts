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

    // Use admin client to bypass RLS for fetching and updating claims
    const adminClient = createAdminClient() as any

    // Get claim with item details
    const { data: claim } = await adminClient
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

    const { status, rejection_reason, secret_info, proof_description, evidence } = body

    // If claimant is editing their claim description
    if (isClaimant && (secret_info || proof_description || evidence) && !status) {
      const updateData: any = {}
      if (secret_info) updateData.secret_info = secret_info
      if (proof_description) updateData.proof_description = proof_description
      updateData.updated_at = new Date().toISOString()

      const { data: updatedClaim, error } = await (adminClient.from('claims') as any)
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Add new evidence if provided
      if (evidence && Array.isArray(evidence) && evidence.length > 0) {
        const evidenceData = evidence.map((e: any) => ({
          claim_id: id,
          type: e.type,
          url: e.url,
          description: e.description,
        }))

        const { error: evidenceError } = await (adminClient.from('claim_evidence') as any).insert(evidenceData)
        if (evidenceError) {
          console.error('Failed to save evidence:', evidenceError)
        }
      }

      // Notify item owner about updated claim
      try {
        // Get claimant and item details for notification
        const { data: claimantProfile } = await adminClient
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single()

        const { data: itemDetails } = await adminClient
          .from('items')
          .select('title')
          .eq('id', claim.item_id)
          .single()

        const hasNewEvidence = evidence && Array.isArray(evidence) && evidence.length > 0

        await (adminClient.from('notifications') as any).insert({
          user_id: claim.item?.user_id,
          type: 'claim_updated',
          title: 'Claim Updated',
          body: `${claimantProfile?.name || 'A claimant'} has updated their claim for "${itemDetails?.title || 'your item'}"${hasNewEvidence ? ' with new evidence' : ''}. Review it now.`,
          message: `${claimantProfile?.name || 'A claimant'} has updated their claim for "${itemDetails?.title || 'your item'}"${hasNewEvidence ? ' with new evidence' : ''}. Review it now.`,
          data: { claim_id: id, item_id: claim.item_id },
        })
      } catch (notifError) {
        console.error('Failed to create notification:', notifError)
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

    const { data: updatedClaim, error } = await (adminClient.from('claims') as any)
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
      await (adminClient
        .from('items') as any)
        .update({ status: 'resolved' })
        .eq('id', claim.item_id)

      // Create handover record
      await (adminClient.from('handovers') as any).insert({
        claim_id: id,
        method: 'meetup', // default, can be changed later
      })

      // Notify claimant
      await (adminClient.from('notifications') as any).insert({
        user_id: claim.claimant_id,
        type: 'claim_approved',
        title: 'Claim Approved!',
        body: 'Your claim has been approved. Arrange the handover now.',
        data: { claim_id: id },
      })

      // Reject other pending claims
      await (adminClient
        .from('claims') as any)
        .update({ status: 'rejected', rejection_reason: 'Another claim was approved' })
        .eq('item_id', claim.item_id)
        .neq('id', id)
        .eq('status', 'pending')
    }

    if (status === 'rejected') {
      // Notify claimant
      await (adminClient.from('notifications') as any).insert({
        user_id: claim.claimant_id,
        type: 'claim_rejected',
        title: 'Claim Rejected',
        body: rejection_reason || 'Your claim was not approved.',
        data: { claim_id: id },
      })

      // Check if there are other pending claims
      const { count } = await adminClient
        .from('claims')
        .select('*', { count: 'exact', head: true })
        .eq('item_id', claim.item_id)
        .eq('status', 'pending')

      // If no more pending claims, revert item to active
      if (count === 0) {
        await (adminClient
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
