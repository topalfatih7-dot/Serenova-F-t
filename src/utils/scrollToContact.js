export const CONTACT_SECTION_ID = 'bize-ulasin'

export function scrollToContactSection() {
  const el = document.getElementById(CONTACT_SECTION_ID)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return true
  }
  return false
}
