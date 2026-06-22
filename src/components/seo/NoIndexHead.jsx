import SeoHead from './SeoHead'

/** Üye, personel ve admin panelleri arama motorlarından gizlenir. */
export default function NoIndexHead() {
  return (
    <SeoHead
      title="Panel"
      description="Yeni Form üye paneli"
      noindex
    />
  )
}
