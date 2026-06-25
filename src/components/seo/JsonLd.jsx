/** Yapılandırılmış veri (JSON-LD) — SeoHead meta etiketlerinden bağımsız kullanılabilir. */
export default function JsonLd({ data }) {
  const schemas = (Array.isArray(data) ? data : [data]).filter(Boolean)
  if (!schemas.length) return null

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={`jsonld-${i}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  )
}
