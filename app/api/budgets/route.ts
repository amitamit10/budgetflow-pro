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
  let query = supabase.from('budgets').select('*, budget_categories(*)').eq('user_id', session.user.id)

  if (month) query = query.eq('month', month)
  if (year) query = query.eq('year', year)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { budget, categories } = await req.json()
  const supabase = await createClient()

  const { data: budgetData, error: budgetError } = await supabase
    .from('budgets')
    .upsert({ ...budget, user_id: session.user.id }, { onConflict: 'user_id,month,year' })
    .select()
    .single()

  if (budgetError) return NextResponse.json({ error: budgetError.message }, { status: 500 })

  if (categories?.length) {
    await supabase.from('budget_categories').delete().eq('budget_id', budgetData.id)
    const { error: catError } = await supabase.from('budget_categories').insert(
      categories.map((c: { category: string; limit_amount: number }) => ({
        ...c,
        budget_id: budgetData.id,
      }))
    )
    if (catError) return NextResponse.json({ error: catError.message }, { status: 500 })
  }

  return NextResponse.json(budgetData)
}
