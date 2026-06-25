import { auth } from '@/auth'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const month = searchParams.get('month')
  const year = searchParams.get('year')

  const supabase = await createClient()
  let query = supabase
    .from('expenses')
    .select('*')
    .eq('user_id', session.user.id)
    .order('date', { ascending: false })

  if (month && year) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const end = new Date(parseInt(year), parseInt(month), 0)
      .toISOString()
      .split('T')[0]
    query = query.gte('date', start).lte('date', end)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('expenses')
    .insert({ ...body, user_id: session.user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
