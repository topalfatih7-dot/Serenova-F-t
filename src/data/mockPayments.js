/** Mock ödeme verileri — ileride Stripe / Supabase ile değiştirilecek */

export const MOCK_SAVED_CARDS = [
  {
    id: 'card-1',
    brand: 'visa',
    last4: '4242',
    expMonth: 12,
    expYear: 2028,
    holder: 'Ahmet Yılmaz',
    isDefault: true,
  },
  {
    id: 'card-2',
    brand: 'mastercard',
    last4: '8210',
    expMonth: 6,
    expYear: 2027,
    holder: 'Ahmet Yılmaz',
    isDefault: false,
  },
]

export const MOCK_MEMBER_PAYMENTS = [
  { id: 'pay-1', date: '2026-06-18T14:22:00Z', amount: 1299, plan: 'Altın', status: 'completed', method: '•••• 4242' },
  { id: 'pay-2', date: '2026-05-18T09:10:00Z', amount: 1299, plan: 'Altın', status: 'completed', method: '•••• 4242' },
  { id: 'pay-3', date: '2026-04-18T11:45:00Z', amount: 899, plan: 'Gümüş', status: 'completed', method: '•••• 8210' },
  { id: 'pay-4', date: '2026-03-20T16:00:00Z', amount: 1299, plan: 'Altın', status: 'refunded', method: '•••• 4242' },
]

export const MOCK_STAFF_EARNINGS = {
  coach: {
    pendingAmount: 4850,
    nextPayoutDate: '2026-07-01',
    sessionRate: 350,
    sessionsThisMonth: 14,
    totalEarned: 18200,
    history: [
      { id: 'e1', period: 'Haziran 2026', amount: 4850, status: 'pending', sessions: 14 },
      { id: 'e2', period: 'Mayıs 2026', amount: 4200, status: 'paid', sessions: 12, paidAt: '2026-06-05' },
      { id: 'e3', period: 'Nisan 2026', amount: 3850, status: 'paid', sessions: 11, paidAt: '2026-05-03' },
    ],
  },
  dietitian: {
    pendingAmount: 3200,
    nextPayoutDate: '2026-07-01',
    sessionRate: 400,
    sessionsThisMonth: 8,
    listsThisMonth: 12,
    totalEarned: 12400,
    history: [
      { id: 'e1', period: 'Haziran 2026', amount: 3200, status: 'pending', sessions: 8, lists: 12 },
      { id: 'e2', period: 'Mayıs 2026', amount: 2900, status: 'paid', sessions: 7, lists: 10, paidAt: '2026-06-05' },
    ],
  },
}

export const MOCK_ADMIN_PAYMENT_SUMMARY = {
  mrr: 42850,
  activeSubscriptions: 34,
  pendingStaffPayouts: 12450,
  platformFees: 2140,
  recentTransactions: [
    { id: 't1', member: 'Selin A.', amount: 1299, plan: 'Altın', date: '2026-06-22', status: 'completed' },
    { id: 't2', member: 'Mehmet K.', amount: 899, plan: 'Gümüş', date: '2026-06-21', status: 'completed' },
    { id: 't3', member: 'Ayşe D.', amount: 1999, plan: 'Platinum', date: '2026-06-20', status: 'completed' },
  ],
  staffPayouts: [
    { id: 'sp1', name: 'Koç Emre', role: 'coach', pending: 4850, sessions: 14 },
    { id: 'sp2', name: 'Dyt. Zeynep', role: 'dietitian', pending: 3200, lists: 12 },
    { id: 'sp3', name: 'Koç Can', role: 'coach', pending: 4400, sessions: 13 },
  ],
}
