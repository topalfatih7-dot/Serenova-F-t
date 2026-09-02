/**
 * Stripe webhook — bekleyen kayıt metadata'sından üye oluşturur.
 */

const today = () => new Date().toISOString().split('T')[0]
const nowISO = () => new Date().toISOString()

function memberDataPayload(member, data = {}) {
  const {
    id: _id,
    name: _name,
    email: _email,
    membership: _m,
    membershipStatus: _ms,
    assignedCoachId: _c,
    assignedDietitianId: _d,
    ...rest
  } = member
  return { ...data, ...rest }
}

export async function createMemberFromPendingRegistration(admin, userId) {
  const { data: authData, error: authErr } = await admin.auth.admin.getUserById(userId)
  if (authErr || !authData?.user) {
    return { ok: false, error: 'Kullanıcı bulunamadı' }
  }

  const user = authData.user
  const pending = user.user_metadata?.pending_registration
  const name = (pending?.name || user.user_metadata?.full_name || user.user_metadata?.name || '').trim()
  const phone = pending?.phone || ''
  const gender = pending?.gender || ''
  const email = (user.email || '').toLowerCase()

  if (!name || !phone || !gender) {
    return { ok: false, error: 'Bekleyen kayıt bilgisi eksik' }
  }

  const joined = today()
  const member = {
    id: userId,
    email,
    name,
    phone,
    gender,
    membership: 'free',
    membershipStatus: 'active',
    fitnessLevel: pending?.fitnessLevel || 'beginner',
    goals: [],
    nutritionPrefs: [],
    packageConfig: {
      coachMeetingsPerMonth: 0,
      dietitianMeetingsPerMonth: 0,
      coachMeetingsPerWeek: 0,
      durationMonths: 0,
      durationWeeks: 0,
      addOns: [],
    },
    joinedAt: joined,
    lastActiveAt: joined,
    coachSessions: [],
    dietitianSessions: [],
    notifications: [
      {
        id: `n-welcome-${Date.now()}`,
        type: 'reminder',
        title: 'Yeni Form’a hoş geldiniz!',
        message: 'Profiliniz hazır. Günlük görevlerinizi tamamlayarak serinizi büyütmeye başlayın.',
        read: false,
        createdAt: nowISO(),
      },
      {
        id: `n-avail-${Date.now() + 1}`,
        type: 'availability',
        title: 'Antrenman günlerinizi paylaşın',
        message: 'Koçunuz size doğru antrenman programı hazırlayabilsin diye antrenman yapabileceğiniz gün ve saatleri lütfen doldurun.',
        action: 'availability',
        read: false,
        createdAt: nowISO(),
      },
    ],
    tasks: [
      { id: `t1-${Date.now()}`, type: 'checkin', title: 'Günlük check-in', done: false, due: 'Bugün' },
      { id: `t2-${Date.now()}`, type: 'workout', title: 'Program takviminden bugünkü hareketi tamamla', done: false, due: 'Bugün' },
    ],
    progress: { weight: [], workouts: [], mood: [] },
    settings: { theme: 'light', language: 'tr', emailNotifs: true, pushNotifs: true, soundNotifs: true, reminderNotifs: true },
    profileComplete: true,
    streak: 0,
  }

  const data = memberDataPayload(member, { phoneCountry: pending?.phoneCountry || '' })
  const { error: insErr } = await admin.from('members').insert({
    id: userId,
    email,
    name,
    phone,
    role: 'member',
    membership: 'free',
    membership_status: 'active',
    assigned_coach_id: null,
    assigned_dietitian_id: null,
    data,
    updated_at: nowISO(),
  })
  if (insErr) return { ok: false, error: insErr.message }

  await admin.from('activities').insert({
    member_id: userId,
    data: {
      type: 'signup',
      text: `${name} yeni kayıt`,
      createdAt: nowISO(),
    },
  })

  const meta = { ...(user.user_metadata || {}), pending_registration: null }
  await admin.auth.admin.updateUserById(userId, { user_metadata: meta })

  return { ok: true, member: { ...member, name } }
}
