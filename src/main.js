import jsQR from 'jsqr'
import './style.css'

document.querySelector('#app').innerHTML = `
  <main class="shell">
    <header class="hero">
      <p class="eyebrow">QR Image Scanner</p>
      <h1>画像アップロード・貼り付けで QR 読み取り</h1>
      <p class="lead">画像ファイルの選択、ドラッグ&ドロップ、クリップボード貼り付けに対応しています。</p>
    </header>

    <section class="panel">
      <div id="dropZone" class="drop-zone" tabindex="0" aria-label="画像ドロップエリア">
        <p class="drop-title">ここに画像をドロップ</p>
        <p class="drop-sub">または Ctrl/Cmd + V で貼り付け</p>
      </div>

      <div class="actions">
        <label class="button primary" for="fileInput">画像を選択</label>
        <button id="readClipboardButton" class="button ghost" type="button">クリップボード画像を読み込む</button>
        <input id="fileInput" type="file" accept="image/*" hidden />
      </div>

      <p id="status" class="status" aria-live="polite">画像を選択するか、貼り付けてください。</p>

      <div class="preview-wrap">
        <canvas id="previewCanvas" class="preview" aria-label="画像プレビュー"></canvas>
      </div>
    </section>

    <section class="panel result-panel">
      <div class="result-head">
        <h2>読み取り結果</h2>
        <button id="copyButton" class="button ghost" type="button" disabled>結果をコピー</button>
      </div>
      <textarea id="result" class="result" readonly placeholder="QRコードを読み取ると内容が表示されます"></textarea>
    </section>

    <footer class="page-footer" aria-label="ページ移動">
      <a class="footer-link" href="./generator.html">QR生成ページへ移動</a>
    </footer>
  </main>
`

const fileInput = document.querySelector('#fileInput')
const dropZone = document.querySelector('#dropZone')
const status = document.querySelector('#status')
const readClipboardButton = document.querySelector('#readClipboardButton')
const previewCanvas = document.querySelector('#previewCanvas')
const result = document.querySelector('#result')
const copyButton = document.querySelector('#copyButton')
const context = previewCanvas.getContext('2d', { willReadFrequently: true })

const setStatus = (message, tone = 'normal') => {
  status.textContent = message
  status.dataset.tone = tone
}

const setResult = (text) => {
  result.value = text
  copyButton.disabled = !text
}

const drawPreview = (image) => {
  const maxSize = 1200
  const ratio = Math.min(maxSize / image.width, maxSize / image.height, 1)
  const width = Math.round(image.width * ratio)
  const height = Math.round(image.height * ratio)

  previewCanvas.width = width
  previewCanvas.height = height
  context.clearRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)
}

const decodeWithBarcodeDetector = async () => {
  if (!('BarcodeDetector' in window)) {
    return null
  }

  try {
    const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
    const barcodes = await detector.detect(previewCanvas)
    return barcodes[0]?.rawValue ?? null
  } catch {
    return null
  }
}

const decodeWithJsQr = () => {
  const { width, height } = previewCanvas
  const imageData = context.getImageData(0, 0, width, height)
  const decoded = jsQR(imageData.data, width, height, {
    inversionAttempts: 'attemptBoth',
  })
  return decoded?.data ?? null
}

const decodeCurrentCanvas = async () => {
  const fromBarcodeDetector = await decodeWithBarcodeDetector()
  if (fromBarcodeDetector) {
    return fromBarcodeDetector
  }
  return decodeWithJsQr()
}

const loadImageFromBlob = (blob) => {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(blob)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('画像の読み込みに失敗しました。'))
    }

    image.src = objectUrl
  })
}

const processBlob = async (blob) => {
  if (!blob) {
    setStatus('画像データが見つかりませんでした。', 'error')
    return
  }

  try {
    setStatus('画像を解析中です...', 'normal')
    const image = await loadImageFromBlob(blob)
    drawPreview(image)

    const decodedText = await decodeCurrentCanvas()
    if (!decodedText) {
      setResult('')
      setStatus('QRコードを検出できませんでした。別の画像を試してください。', 'error')
      return
    }

    setResult(decodedText)
    setStatus('QRコードを読み取りました。', 'success')
  } catch (error) {
    setResult('')
    setStatus(error.message || '処理中にエラーが発生しました。', 'error')
  }
}

const processFile = async (file) => {
  if (!file || !file.type.startsWith('image/')) {
    setStatus('画像ファイルを選択してください。', 'error')
    return
  }

  await processBlob(file)
}

fileInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0]
  await processFile(file)
  fileInput.value = ''
})

dropZone.addEventListener('dragover', (event) => {
  event.preventDefault()
  dropZone.classList.add('is-over')
})

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('is-over')
})

dropZone.addEventListener('drop', async (event) => {
  event.preventDefault()
  dropZone.classList.remove('is-over')

  const file = event.dataTransfer?.files?.[0]
  await processFile(file)
})

document.addEventListener('paste', async (event) => {
  const items = Array.from(event.clipboardData?.items ?? [])
  const imageItem = items.find((item) => item.type.startsWith('image/'))
  if (!imageItem) {
    return
  }

  event.preventDefault()
  const blob = imageItem.getAsFile()
  await processBlob(blob)
})

readClipboardButton.addEventListener('click', async () => {
  if (!navigator.clipboard?.read) {
    setStatus('このブラウザは clipboard.read() に対応していません。貼り付け操作を使ってください。', 'error')
    return
  }

  try {
    setStatus('クリップボード画像を取得中です...', 'normal')
    const clipboardItems = await navigator.clipboard.read()

    for (const item of clipboardItems) {
      const imageType = item.types.find((type) => type.startsWith('image/'))
      if (imageType) {
        const blob = await item.getType(imageType)
        await processBlob(blob)
        return
      }
    }

    setStatus('クリップボードに画像が見つかりませんでした。', 'error')
  } catch {
    setStatus('クリップボードの読み取りに失敗しました。権限を確認してください。', 'error')
  }
})

copyButton.addEventListener('click', async () => {
  if (!result.value) {
    return
  }

  try {
    await navigator.clipboard.writeText(result.value)
    setStatus('読み取り結果をクリップボードへコピーしました。', 'success')
  } catch {
    setStatus('コピーに失敗しました。結果テキストを手動でコピーしてください。', 'error')
  }
})
