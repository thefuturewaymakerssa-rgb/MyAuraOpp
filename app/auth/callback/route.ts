import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // If "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id || '')
        .maybeSingle<{ role: string | null }>()

      // If no role, intercept them to choose their path, but pass the next param
      if (!profile?.role) {
        return NextResponse.redirect(`${origin}/role-select?next=${encodeURIComponent(next)}`)
      }

      // If the user is an employer and tries to go to a generic dashboard, send to hub
      if (profile.role === 'employer' && (next === '/' || next === '/dashboard')) {
        return NextResponse.redirect(`${origin}/employer/hub`)
      }

      // Otherwise proceed to intended next
      return NextResponse.redirect(`${origin}${next === '/' ? '/dashboard' : next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
