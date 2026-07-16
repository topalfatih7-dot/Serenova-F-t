/** Personel hakediş UI mock — gerçek modül gelene kadar (§40 / açık checklist P2) */

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
