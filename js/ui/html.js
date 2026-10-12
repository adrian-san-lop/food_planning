const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Encode dynamic values before inserting them into HTML text or quoted attributes. */
export function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);
}

/** HTML escaping is also the correct encoding for quoted attribute values. */
export function escapeAttribute(value) {
  return escapeHTML(value);
}

/** Return a serialized HTTPS URL only when its exact origin is explicitly allowed. */
export function safeURL(value, allowedOrigins = []) {
  try {
    const url = new URL(String(value));
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    if (!allowedOrigins.includes(url.origin)) return null;
    return url.href;
  } catch {
    return null;
  }
}
