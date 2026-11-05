export function download(name: string, content: string | Uint8Array, type = 'application/json') {
  const url = URL.createObjectURL(
    new Blob([typeof content === 'string' ? content : new Uint8Array(content).buffer], { type }),
  )
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function stamp(prefix: string, value: unknown) {
  let hash = 2166136261
  for (const character of JSON.stringify(value)) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return `${prefix}-${(hash >>> 0).toString(16).toUpperCase().padStart(8, '0')}`
}
