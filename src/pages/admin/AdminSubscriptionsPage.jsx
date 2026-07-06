import { Navigate } from 'react-router-dom'

/** Abonelik özeti artık /admin/payments içinde birleşik finans ekranında. */
export default function AdminSubscriptionsPage() {
  return <Navigate to="/admin/payments" replace />
}
