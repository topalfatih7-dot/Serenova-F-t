import { Fragment } from 'react'
import { Link } from 'react-router-dom'

function joinLinks(links, linkClassName) {
  return links.map((link, i) => (
    <Fragment key={link.slug}>
      {i > 0 && (i === links.length - 1 ? ' ve ' : ', ')}
      <Link
        to={`/legal/${link.slug}`}
        className={linkClassName}
      >
        {link.label}
      </Link>
    </Fragment>
  ))
}

export function LegalFooterParagraph({ intro, outro, links, linkClassName, className = '' }) {
  return (
    <p className={`text-sm leading-relaxed ${className}`}>
      {intro}{' '}
      {joinLinks(links, linkClassName)}
      {outro ? ` ${outro}` : null}
    </p>
  )
}
