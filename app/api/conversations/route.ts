import { NextRequest, NextResponse } from 'next/server'
import { createServerClientWithAuth } from '@/lib/supabase'

// GET /api/conversations - Get user's conversations
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = createServerClientWithAuth(token) as any

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        item:items(id, title, type, media:item_media(url, is_primary)),
        participant_1_profile:profiles!conversations_participant_1_fkey(id, name, avatar_url),
        participant_2_profile:profiles!conversations_participant_2_fkey(id, name, avatar_url),
        messages:conversation_messages(
          id, content, sender_id, read_at, created_at
        )
      `)
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order('last_message_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform to include last message and other user info
    const transformedConversations = conversations?.map((conv: any) => {
      const otherUser = conv.participant_1 === user.id 
        ? conv.participant_2_profile 
        : conv.participant_1_profile
      
      const lastMessage = conv.messages?.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]

      const unreadCount = conv.messages?.filter((m: any) => 
        m.sender_id !== user.id && !m.read_at
      ).length || 0

      return {
        id: conv.id,
        item: conv.item,
        otherUser,
        lastMessage,
        unreadCount,
        lastMessageAt: conv.last_message_at,
        createdAt: conv.created_at,
      }
    })

    return NextResponse.json({ conversations: transformedConversations })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}

// POST /api/conversations - Create or get existing conversation
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = createServerClientWithAuth(token) as any

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { itemId, recipientId } = body

    if (!itemId || !recipientId) {
      return NextResponse.json({ error: 'Missing itemId or recipientId' }, { status: 400 })
    }

    if (recipientId === user.id) {
      return NextResponse.json({ error: 'Cannot start conversation with yourself' }, { status: 400 })
    }

    // Check if conversation already exists (in either direction)
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('item_id', itemId)
      .or(`and(participant_1.eq.${user.id},participant_2.eq.${recipientId}),and(participant_1.eq.${recipientId},participant_2.eq.${user.id})`)
      .single()

    if (existing) {
      return NextResponse.json({ conversation: existing, isNew: false })
    }

    // Create new conversation
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        item_id: itemId,
        participant_1: user.id,
        participant_2: recipientId,
      })
      .select('id')
      .single()

    if (createError) {
      console.error('Error creating conversation:', createError)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    return NextResponse.json({ conversation: newConversation, isNew: true }, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
  }
}
