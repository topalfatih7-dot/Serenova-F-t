/**
 * Korunan API istekleri için oturum token'ı ile header üretir.
 */
import { supabase } from './supabaseClient'

export async function getApiAuthHeaders(extra = {}) {
  const headers = { 'Content-Type': 'application/json', ...extra }
  if (!supabase) return headers

  let { data } = await supabase.auth.getSession()
  if (!data?.session) {
    await supabase.auth.getUser()
    ;({ data } = await supabase.auth.getSession())
  }
  const token = data?.session?.access_token
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}
