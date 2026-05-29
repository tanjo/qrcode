import './history.css'
import QRCode from 'qrcode'
import {
  clearQrHistory,
  deleteQrHistoryEntry,
  exportQrHistoryData,
  getQrHistory,
  importQrHistoryData,
  updateQrHistoryEntryName,
} from './history-store'

document.querySelector('#history-app').innerHTML = `
  <main class="history-shell">
    <header class="history-hero">
      <p class="kicker">QR Activity</p>
      <h1>読み取り・生成の履歴</h1>
      <p class="subtitle">この端末のブラウザに保存されたQRコード結果の一覧です。</p>
    </header>

    <section class="history-panel">
      <div class="panel-head">
        <h2>結果一覧</h2>
        <button id="clearAllButton" class="button danger" type="button">履歴を全消去</button>
      </div>
      <div class="sync-actions">
        <button id="exportButton" class="button ghost" type="button">履歴を書き出し</button>
        <button id="importButton" class="button ghost" type="button">履歴を読み込み</button>
        <input id="importInput" type="file" accept="application/json,.json" hidden />
      </div>
      <p id="syncStatus" class="sync-status" aria-live="polite"></p>
      <p id="countText" class="count-text"></p>
      <ul id="historyList" class="history-list" aria-live="polite"></ul>
      <p id="emptyText" class="empty-text" hidden>履歴はまだありません。読み取りまたは生成するとここに追加されます。</p>
    </section>

    <footer class="page-footer" aria-label="ページ移動">
      <a class="footer-link" href="./index.html">QR読み取りページへ移動</a>
      <a class="footer-link" href="./generator.html">QR生成ページへ移動</a>
    </footer>
  </main>

  <div id="qrOverlay" class="qr-overlay" hidden>
    <button id="closeOverlayButton" class="overlay-close" type="button" aria-label="閉じる">閉じる</button>
    <img id="overlayQrImage" class="overlay-qr" alt="履歴QRコード拡大表示" />
  </div>
`

const historyList = document.querySelector('#historyList')
const emptyText = document.querySelector('#emptyText')
const countText = document.querySelector('#countText')
const clearAllButton = document.querySelector('#clearAllButton')
const exportButton = document.querySelector('#exportButton')
const importButton = document.querySelector('#importButton')
const importInput = document.querySelector('#importInput')
const syncStatus = document.querySelector('#syncStatus')
const qrOverlay = document.querySelector('#qrOverlay')
const closeOverlayButton = document.querySelector('#closeOverlayButton')
const overlayQrImage = document.querySelector('#overlayQrImage')

const setSyncStatus = (message, tone = 'normal') => {
  syncStatus.textContent = message
  syncStatus.dataset.tone = tone
}

const escapeHtml = (text) => {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

const formatDate = (timestamp) => {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(timestamp))
}

const typeToLabel = (type) => {
  return type === 'generate' ? '作成' : '読取'
}

const getDisplayName = (entry) => {
  if (entry.name && entry.name.trim()) {
    return entry.name
  }
  return `${typeToLabel(entry.type)} ${formatDate(entry.createdAt)}`
}

const openOverlay = (src) => {
  if (!src) {
    return
  }
  overlayQrImage.src = src
  qrOverlay.hidden = false
}

const closeOverlay = () => {
  qrOverlay.hidden = true
  overlayQrImage.removeAttribute('src')
}

const renderQrPreview = async (entry, imageElement) => {
  const fallback = imageElement.nextElementSibling

  if (entry.type === 'read') {
    if (entry.imageDataUrl) {
      imageElement.src = entry.imageDataUrl
      imageElement.hidden = false
      if (fallback?.classList.contains('qr-fallback')) {
        fallback.hidden = true
      }
      return
    }

    imageElement.hidden = true
    if (fallback?.classList.contains('qr-fallback')) {
      fallback.textContent = 'この履歴には元画像データがありません。'
      fallback.hidden = false
    }
    return
  }

  try {
    const qrOptions = entry.qrOptions || {
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#112236',
        light: '#f7f7f2',
      },
    }

    const qrDataUrl = await QRCode.toDataURL(entry.text, {
      ...qrOptions,
      width: 180,
    })

    imageElement.src = qrDataUrl
    imageElement.hidden = false
    if (fallback?.classList.contains('qr-fallback')) {
      fallback.hidden = true
    }
  } catch {
    imageElement.hidden = true
    if (fallback?.classList.contains('qr-fallback')) {
      fallback.textContent = 'この履歴はQRコードへ再生成できませんでした。'
      fallback.hidden = false
    }
  }
}

const hydrateQrPreviews = async (entries) => {
  await Promise.all(
    entries.map(async (entry) => {
      const imageElement = historyList.querySelector(`[data-qr-id="${entry.id}"]`)
      if (!imageElement) {
        return
      }

      await renderQrPreview(entry, imageElement)
    }),
  )
}

const renderHistory = async () => {
  const entries = getQrHistory()

  historyList.innerHTML = entries
    .map((entry) => {
      return `
        <li class="history-item" data-id="${entry.id}">
          <div class="meta-row">
            <span class="badge badge-${entry.type}">${typeToLabel(entry.type)}</span>
            <time class="time">${formatDate(entry.createdAt)}</time>
          </div>
          <div class="name-row">
            <label class="name-label" for="name-${entry.id}">名前</label>
            <input
              id="name-${entry.id}"
              class="name-input"
              type="text"
              maxlength="60"
              value="${escapeHtml(entry.name || '')}"
              placeholder="${escapeHtml(getDisplayName(entry))}"
              data-name-id="${entry.id}"
            />
          </div>
          <div class="qr-preview-wrap">
            <img class="qr-preview" data-qr-id="${entry.id}" alt="履歴から再生成したQRコード" hidden />
            <p class="qr-fallback" hidden>この文字列はQRコードへ再生成できませんでした。</p>
          </div>
          <pre class="value">${escapeHtml(entry.text)}</pre>
          <div class="item-actions">
            <button class="button mini copy-item" type="button">コピー</button>
            <button class="button mini delete-item" type="button">削除</button>
          </div>
        </li>
      `
    })
    .join('')

  const hasEntries = entries.length > 0
  emptyText.hidden = hasEntries
  clearAllButton.disabled = !hasEntries
  countText.textContent = hasEntries ? `${entries.length}件の履歴` : '0件の履歴'

  if (hasEntries) {
    await hydrateQrPreviews(entries)
  }
}

const getEntryById = (entryId) => {
  return getQrHistory().find((entry) => entry.id === entryId)
}

historyList.addEventListener('click', async (event) => {
  const previewImage = event.target.closest('.qr-preview')
  if (previewImage && previewImage.getAttribute('src')) {
    openOverlay(previewImage.getAttribute('src'))
    return
  }

  const button = event.target.closest('button')
  if (!button) {
    return
  }

  const item = event.target.closest('.history-item')
  const entryId = item?.dataset.id
  if (!entryId) {
    return
  }

  if (button.classList.contains('copy-item')) {
    const entry = getEntryById(entryId)
    if (!entry) {
      return
    }

    try {
      await navigator.clipboard.writeText(entry.text)
      button.textContent = 'コピー済み'
      setTimeout(() => {
        button.textContent = 'コピー'
      }, 900)
    } catch {
      button.textContent = '失敗'
      setTimeout(() => {
        button.textContent = 'コピー'
      }, 900)
    }
    return
  }

  if (button.classList.contains('delete-item')) {
    deleteQrHistoryEntry(entryId)
    await renderHistory()
  }
})

historyList.addEventListener('change', (event) => {
  const input = event.target.closest('.name-input')
  if (!input) {
    return
  }

  const entryId = input.dataset.nameId
  if (!entryId) {
    return
  }

  updateQrHistoryEntryName(entryId, input.value)
})

historyList.addEventListener('keydown', (event) => {
  const input = event.target.closest('.name-input')
  if (!input) {
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    input.blur()
  }
})

clearAllButton.addEventListener('click', () => {
  const shouldDelete = window.confirm('履歴をすべて削除しますか？')
  if (!shouldDelete) {
    return
  }

  clearQrHistory()
  void renderHistory()
})

exportButton.addEventListener('click', () => {
  try {
    const payload = exportQrHistoryData()
    const fileNameDate = new Date().toISOString().replaceAll(':', '-').slice(0, 19)
    const blob = new Blob([payload], { type: 'application/json' })
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = `qr-history-${fileNameDate}.json`
    link.click()
    URL.revokeObjectURL(objectUrl)
    setSyncStatus('履歴ファイルを書き出しました。別デバイスで「履歴を読み込み」を使って取り込めます。', 'success')
  } catch {
    setSyncStatus('履歴の書き出しに失敗しました。', 'error')
  }
})

importButton.addEventListener('click', () => {
  importInput.click()
})

importInput.addEventListener('change', async () => {
  const file = importInput.files?.[0]
  importInput.value = ''
  if (!file) {
    return
  }

  try {
    const fileText = await file.text()
    const importedCount = importQrHistoryData(fileText)
    await renderHistory()
    setSyncStatus(`${importedCount}件の履歴を読み込みました。`, 'success')
  } catch (error) {
    setSyncStatus(error?.message || '履歴の読み込みに失敗しました。', 'error')
  }
})

closeOverlayButton.addEventListener('click', closeOverlay)

qrOverlay.addEventListener('click', (event) => {
  if (event.target === qrOverlay) {
    closeOverlay()
  }
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !qrOverlay.hidden) {
    closeOverlay()
  }
})

setSyncStatus('サーバーなしで使う場合は、履歴を書き出しして別デバイスで読み込んでください。')
void renderHistory()
