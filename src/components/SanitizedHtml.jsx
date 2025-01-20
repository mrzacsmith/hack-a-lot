import DOMPurify from 'dompurify'

const SanitizedHtml = ({ html, className = '' }) => {
  const sanitizedHtml = DOMPurify.sanitize(html || '')

  return (
    <div
      className={`prose max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  )
}

export default SanitizedHtml 