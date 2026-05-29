const STORAGE_KEY = 'qr-history-v1'
const MAX_ENTRIES = 200

const createFallbackId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const safeParse = (value) => {
  if (!value) {
    return []
  }

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const readEntries = () => {
  return safeParse(window.localStorage.getItem(STORAGE_KEY))
}

const writeEntries = (entries) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

const normalizeQrOptions = (input) => {
  if (!input || typeof input !== 'object') {
    return null
  }

  const width = Number(input.width)
  const margin = Number(input.margin)
  const errorCorrectionLevel = ['L', 'M', 'Q', 'H'].includes(input.errorCorrectionLevel)
    ? input.errorCorrectionLevel
    : 'M'

  const dark = typeof input.color?.dark === 'string' ? input.color.dark : '#112236'
  const light = typeof input.color?.light === 'string' ? input.color.light : '#f7f7f2'

  return {
    width: Number.isFinite(width) && width > 0 ? width : 320,
    margin: Number.isFinite(margin) && margin >= 0 ? margin : 2,
    errorCorrectionLevel,
    color: { dark, light },
  }
}

const normalizeEntry = (entry) => {
  if (!entry || typeof entry !== 'object') {
    return null
  }

  const text = typeof entry.text === 'string' ? entry.text : String(entry.text ?? '')
  if (!text.length) {
    return null
  }

  const type = entry.type === 'generate' ? 'generate' : 'read'
  const id = typeof entry.id === 'string' && entry.id ? entry.id : createFallbackId()
  const createdAt = Number.isFinite(entry.createdAt) ? Number(entry.createdAt) : Date.now()
  const name = typeof entry.name === 'string' ? entry.name.trim().slice(0, 60) : ''
  const imageDataUrl = typeof entry.imageDataUrl === 'string' ? entry.imageDataUrl : ''
  const qrOptions = normalizeQrOptions(entry.qrOptions)

  return {
    id,
    type,
    name,
    text,
    imageDataUrl,
    qrOptions,
    createdAt,
  }
}

export const getQrHistory = () => {
  return readEntries()
}

export const addQrHistoryEntry = ({ type, text, imageDataUrl = '', qrOptions = null }) => {
  const normalizedText = typeof text === 'string' ? text : String(text ?? '')
  if (!normalizedText.length) {
    return
  }

  const normalizedImageDataUrl = typeof imageDataUrl === 'string' ? imageDataUrl : ''

  const normalizedType = type === 'generate' ? 'generate' : 'read'
  const normalizedQrOptions = normalizedType === 'generate' ? normalizeQrOptions(qrOptions) : null
  const entries = readEntries()
  const latest = entries[0]

  if (latest && latest.type === normalizedType && latest.text === normalizedText) {
    if (normalizedType === 'generate') {
      const latestOptions = JSON.stringify(normalizeQrOptions(latest.qrOptions))
      const currentOptions = JSON.stringify(normalizedQrOptions)
      if (latestOptions !== currentOptions) {
        // Different generation parameters should be saved as a separate history entry.
      } else {
        return
      }
    }

    if (!latest.imageDataUrl && normalizedImageDataUrl) {
      const [first, ...rest] = entries
      writeEntries([{ ...first, imageDataUrl: normalizedImageDataUrl }, ...rest])
      return
    }

    if (normalizedType === 'read') {
      return
    }
  }

  const nextEntry = {
    id: createFallbackId(),
    type: normalizedType,
    name: '',
    text: normalizedText,
    imageDataUrl: normalizedImageDataUrl,
    qrOptions: normalizedQrOptions,
    createdAt: Date.now(),
  }

  const nextEntries = [nextEntry, ...entries].slice(0, MAX_ENTRIES)
  writeEntries(nextEntries)
}

export const deleteQrHistoryEntry = (entryId) => {
  const entries = readEntries()
  const nextEntries = entries.filter((entry) => entry.id !== entryId)
  writeEntries(nextEntries)
}

export const updateQrHistoryEntryName = (entryId, name) => {
  const normalizedName = String(name || '').trim().slice(0, 60)
  const entries = readEntries()
  const nextEntries = entries.map((entry) => {
    if (entry.id !== entryId) {
      return entry
    }
    return { ...entry, name: normalizedName }
  })
  writeEntries(nextEntries)
}

export const clearQrHistory = () => {
  window.localStorage.removeItem(STORAGE_KEY)
}

export const exportQrHistoryData = () => {
  const payload = {
    version: 1,
    exportedAt: Date.now(),
    entries: readEntries(),
  }
  return JSON.stringify(payload, null, 2)
}

export const importQrHistoryData = (jsonText) => {
  const parsed = JSON.parse(jsonText)
  const rawEntries = Array.isArray(parsed) ? parsed : parsed?.entries

  if (!Array.isArray(rawEntries)) {
    throw new Error('読み込みファイルの形式が不正です。')
  }

  const importedEntries = rawEntries
    .map((entry) => normalizeEntry(entry))
    .filter((entry) => Boolean(entry))

  if (!importedEntries.length) {
    throw new Error('読み込める履歴データが見つかりませんでした。')
  }

  const existingEntries = readEntries().map((entry) => normalizeEntry(entry)).filter((entry) => Boolean(entry))
  const mergedById = new Map(existingEntries.map((entry) => [entry.id, entry]))
  for (const entry of importedEntries) {
    mergedById.set(entry.id, entry)
  }

  const mergedEntries = Array.from(mergedById.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, MAX_ENTRIES)

  writeEntries(mergedEntries)
  return importedEntries.length
}
