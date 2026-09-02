/** Panel sohbet rotaları — kabuk overflow / padding için. */

export function isPanelChatPath(pathname = '') {
  if (pathname === '/messages' || pathname.startsWith('/messages/')) return true
  if (pathname === '/staff/messages' || pathname.startsWith('/staff/messages/')) return true
  if (pathname === '/staff/admin-messages') return true
  if (pathname === '/staff/collab-messages' || pathname.startsWith('/staff/collab-messages/')) return true
  if (pathname === '/admin/messages' || pathname.startsWith('/admin/messages/')) return true
  return false
}

/** Mobilde tam ekran sohbet (inbox değil). */
export function isPanelChatThreadPath(pathname = '') {
  if (/^\/messages\/(coach|dietitian)\/?$/.test(pathname)) return true
  if (/^\/staff\/messages\/[^/]+\/?$/.test(pathname)) return true
  if (pathname === '/staff/admin-messages') return true
  if (/^\/staff\/collab-messages\/[^/]+\/?$/.test(pathname)) return true
  if (/^\/admin\/messages\/staff\/[^/]+\/?$/.test(pathname)) return true
  if (/^\/admin\/messages\/audit\/[^/]+\/?$/.test(pathname)) return true
  if (/^\/admin\/messages\/collab\/[^/]+\/?$/.test(pathname)) return true
  return false
}
