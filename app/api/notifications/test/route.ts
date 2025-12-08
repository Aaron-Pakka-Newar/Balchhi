import { NextRequest, NextResponse } from 'next/server'
import { createServerClientWithAuth } from '@/lib/supabase'

// POST /api/notifications/test - Create a test notification (for debugging)
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
    // Insert a test notification
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'new_message',
        title: 'Test Notification',
        body: 'This is a test notification to verify the system works.',
        message: 'This is a test notification to verify the system works.',
        data: { test: true },
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating test notification:', error)
      return NextResponse.json({ 
        error: error.message, 
        code: error.code,
        details: error.details,
        hint: error.hint
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, notification: data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to create test notification' }, { status: 500 })
  }
}
