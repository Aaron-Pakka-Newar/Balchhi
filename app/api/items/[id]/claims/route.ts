import { NextRequest, NextResponse } from 'next/server'
import { createServerClientWithAuth, createAdminClient } from '@/lib/supabase'

// GET /api/items/[id]/claims - Get claims for a specific item (for item owner)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = createServerClientWithAuth(token) as any
  const { id: itemId } = await params

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use admin client to bypass RLS for fetching item and claims
    // We still verify ownership at the application level
    const adminClient = createAdminClient() as any

    // Check if user owns this item
    const { data: item, error: itemError } = await adminClient
      .from('items')
      .select('id, user_id, organization_id')
      .eq('id', itemId)
      .single()

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Verify the user is the owner of this item
    if (item.user_id !== user.id) {
      // Check if user is part of the organization
      if (item.organization_id) {
        const { data: member } = await adminClient
          .from('organization_members')
          .select('id')
          .eq('organization_id', item.organization_id)
          .eq('user_id', user.id)
          .single()

        if (!member) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      } else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Fetch claims for this item using admin client to bypass RLS
    // We've already verified the user is authorized above
    const { data: claims, error } = await adminClient
      .from('claims')
      .select(`
        *,
        claimant:profiles!claims_claimant_id_fkey(id, name, avatar_url, is_verified),
        evidence:claim_evidence(*)
      `)
      .eq('item_id', itemId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching claims:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ claims: claims || [] })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to fetch claims' }, { status: 500 })
  }
}
