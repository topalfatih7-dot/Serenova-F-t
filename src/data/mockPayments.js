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
    pendingAmount: 5000,
    nextPayoutDate: '2026-07-04',
    sessionRate: 500,
    sessionsThisMonth: 10,
    totalEarned: 15000,
    history: [
      { id: 'e1', period: '2026-W26', amount: 5000, status: 'pending', sessions: 10 },
      { id: 'e2', period: '2026-W25', amount: 4500, status: 'paid', sessions: 9, paidAt: '2026-06-27' },
      { id: 'e3', period: '2026-W24', amount: 5500, status: 'paid', sessions: 11, paidAt: '2026-06-20' },
    ],
  },
  dietitian: {
    pendingAmount: 2500,
    nextPayoutDate: '2026-07-04',
    sessionRate: 500,
    sessionsThisMonth: 5,
    totalEarned: 10000,
    history: [
      { id: 'e1', period: '2026-W26', amount: 2500, status: 'pending', sessions: 5 },
      { id: 'e2', period: '2026-W25', amount: 3000, status: 'paid', sessions: 6, paidAt: '2026-06-27' },
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
    { id: 'sp1', name: 'Koç Emre', role: 'coach', pending: 5000, sessions: 10 },
    { id: 'sp2', name: 'Dyt. Zeynep', role: 'dietitian', pending: 2500, sessions: 5 },
    { id: 'sp3', name: 'Koç Can', role: 'coach', pending: 4500, sessions: 9 },
  ],
}
