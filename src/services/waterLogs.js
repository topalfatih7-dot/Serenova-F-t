import { supabase } from './supabaseClient'
import { pushMemberNotification, buildMemberNotification } from './memberNotifications'
import {
  WATER_COPY,
  clampAmountMl,
  clampGoalMl,
  localDateStr,
  mapWaterLogRow,
} from '../utils/waterTracking'

function fromError(error, fallback) {
  return { success: false, error: error?.message || fallback }
}

export async function listWaterLogs(memberId, { fromDate, toDate } = {}) {
  if (!supabase || !memberId) return { success: false, logs: [], error: 'Bağlantı yok' }
  const from = fromDate || localDateStr(new Date(Date.now() - 45 * 24 * 60 * 60 * 1000))
  const to = toDate || localDateStr()
  const { data, error } = await supabase
    .from('member_water_logs')
    .select('id, member_id, local_date, amount_ml, logged_at, source')
    .eq('member_id', memberId)
    .gte('local_date', from)
    .lte('local_date', to)
    .order('logged_at', { ascending: true })
  if (error) return { success: false, logs: [], error: error.message }
  return { success: true, logs: (data || []).map(mapWaterLogRow).filter(Boolean) }
}

export async function insertWaterLog({ memberId, localDate, amountMl }) {
  if (!supabase || !memberId) return fromError(null, 'Bağlantı yok')
  const amount = clampAmountMl(amountMl)
  if (amount == null) return fromError(null, WATER_COPY.amountInvalid)
  const dateStr = localDate || localDateStr()
  const today = localDateStr()
  if (dateStr > today) return fromError(null, 'İleri tarihli kayıt yapılamaz')
  const { data, error } = await supabase
    .from('member_water_logs')
    .insert({
      member_id: memberId,
      local_date: dateStr,
      amount_ml: amount,
      source: 'member',
    })
    .select('id, member_id, local_date, amount_ml, logged_at, source')
    .single()
  if (error) return fromError(error, 'Kayıt eklenemedi')
  return { success: true, log: mapWaterLogRow(data) }
}

export async function deleteWaterLog(id) {
  if (!supabase || !id) return fromError(null, 'Kayıt yok')
  const { error } = await supabase.from('member_water_logs').delete().eq('id', id)
  if (error) return fromError(error, 'Kayıt silinemedi')
  return { success: true }
}

export async function setMemberWaterGoal(memberId, goalMl) {
  if (!supabase || !memberId) return fromError(null, 'Bağlantı yok')
  const goal = clampGoalMl(goalMl)
  if (goal == null) return fromError(null, WATER_COPY.goalInvalid)
  const { data, error } = await supabase.rpc('set_member_water_goal', {
    p_member_id: memberId,
    p_goal_ml: goal,
  })
  if (error) return fromError(error, 'Hedef kaydedilemedi')

  const notify = await pushMemberNotification(memberId, buildMemberNotification({
    type: 'reminder',
    action: 'water_goal_updated',
    title: WATER_COPY.goalNotifyTitle,
    message: `Yeni günlük hedefiniz ${goal} ml.`,
  }))
  if (!notify.success) {
    /* hedef yazıldı; bildirim başarısız olsa da devam */
  }
  return { success: true, waterTracking: data }
}
