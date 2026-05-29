import QRCode from "qrcode";
import "./generator.css";
import { addQrHistoryEntry } from "./history-store";

document.querySelector("#generator-app").innerHTML = `
  <main class="generator-shell">
    <header class="generator-hero">
      <p class="kicker">QR Code Generator</p>
      <h1>テキストから QR コードを作成</h1>
      <p class="subtitle">このページは生成専用です。既存の読み取りページとは独立しています。</p>
    </header>

    <section class="generator-card">
      <label class="field-label" for="inputText">テキスト</label>
      <textarea id="inputText" class="text-input" rows="6" placeholder="ここにQR化したい文字列を入力"></textarea>

      <div class="row">
        <div class="field">
          <label class="field-label" for="sizeInput">サイズ</label>
          <input id="sizeInput" class="number-input" type="number" min="128" max="1024" step="32" value="320" />
        </div>

        <div class="field">
          <label class="field-label" for="marginInput">余白</label>
          <input id="marginInput" class="number-input" type="number" min="0" max="10" step="1" value="2" />
        </div>

        <div class="field">
          <label class="field-label" for="ecLevel">誤り訂正</label>
          <select id="ecLevel" class="select-input">
            <option value="L">L (7%)</option>
            <option value="M" selected>M (15%)</option>
            <option value="Q">Q (25%)</option>
            <option value="H">H (30%)</option>
          </select>
        </div>
      </div>

      <div class="actions">
        <button id="generateButton" class="button primary" type="button">生成</button>
        <button id="downloadButton" class="button ghost" type="button" disabled>PNG ダウンロード</button>
      </div>

      <p id="status" class="status" aria-live="polite">テキストを入力して「生成」を押してください。</p>
    </section>

    <section id="previewCard" class="preview-card" hidden>
      <canvas id="qrCanvas" class="qr-canvas" width="320" height="320" aria-label="生成されたQRコード"></canvas>
      <img id="qrImage" class="qr-image" alt="生成されたQRコード" hidden />
    </section>

    <footer class="page-footer" aria-label="ページ移動">
      <a class="footer-link" href="./index.html">QR読み取りページへ移動</a>
      <a class="footer-link" href="./history.html">履歴ページへ移動</a>
    </footer>
  </main>

  <div id="qrOverlay" class="qr-overlay" hidden>
    <button id="closeOverlayButton" class="overlay-close" type="button" aria-label="閉じる">閉じる</button>
    <img id="overlayQrImage" class="overlay-qr" alt="QRコード拡大表示" />
  </div>
`;

const inputText = document.querySelector("#inputText");
const sizeInput = document.querySelector("#sizeInput");
const marginInput = document.querySelector("#marginInput");
const ecLevel = document.querySelector("#ecLevel");
const generateButton = document.querySelector("#generateButton");
const downloadButton = document.querySelector("#downloadButton");
const status = document.querySelector("#status");
const qrCanvas = document.querySelector("#qrCanvas");
const qrImage = document.querySelector("#qrImage");
const previewCard = document.querySelector("#previewCard");
const qrOverlay = document.querySelector("#qrOverlay");
const closeOverlayButton = document.querySelector("#closeOverlayButton");
const overlayQrImage = document.querySelector("#overlayQrImage");

const setStatus = (message, tone = "normal") => {
  status.textContent = message;
  status.dataset.tone = tone;
};

const clearGeneratedPreview = () => {
  previewCard.hidden = true;
  qrImage.hidden = true;
  qrImage.removeAttribute("src");
  overlayQrImage.removeAttribute("src");
  qrOverlay.hidden = true;
};

const renderQrCode = async () => {
  const text = inputText.value.trim();
  const width = Number(sizeInput.value) || 320;
  const margin = Number(marginInput.value) || 2;

  if (!text) {
    clearGeneratedPreview();
    setStatus("テキストを入力してください。", "error");
    downloadButton.disabled = true;
    return;
  }

  try {
    setStatus("QRコードを生成中です...", "normal");

    await QRCode.toCanvas(qrCanvas, text, {
      width,
      margin,
      errorCorrectionLevel: ecLevel.value,
      color: {
        dark: "#112236",
        light: "#f7f7f2",
      },
    });

    const dataUrl = qrCanvas.toDataURL("image/png");
    previewCard.hidden = false;
    qrImage.src = dataUrl;
    qrImage.hidden = false;
    overlayQrImage.src = dataUrl;
    downloadButton.disabled = false;
    addQrHistoryEntry({
      type: "generate",
      text,
      qrOptions: {
        width,
        margin,
        errorCorrectionLevel: ecLevel.value,
        color: {
          dark: "#112236",
          light: "#f7f7f2",
        },
      },
    });
    setStatus("QRコードを生成しました。", "success");
  } catch (error) {
    clearGeneratedPreview();
    downloadButton.disabled = true;
    setStatus(error?.message || "QRコード生成に失敗しました。", "error");
  }
};

const openOverlay = () => {
  if (downloadButton.disabled) {
    return;
  }
  overlayQrImage.src = qrCanvas.toDataURL("image/png");
  qrOverlay.hidden = false;
};

const closeOverlay = () => {
  qrOverlay.hidden = true;
};

const downloadQrPng = () => {
  const text = inputText.value.trim();
  if (!text) {
    return;
  }

  const link = document.createElement("a");
  link.href = qrCanvas.toDataURL("image/png");
  link.download = "qrcode.png";
  link.click();
};

generateButton.addEventListener("click", renderQrCode);
downloadButton.addEventListener("click", downloadQrPng);

qrCanvas.addEventListener("click", openOverlay);
qrImage.addEventListener("click", openOverlay);
closeOverlayButton.addEventListener("click", closeOverlay);
qrOverlay.addEventListener("click", (event) => {
  if (event.target === qrOverlay) {
    closeOverlay();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !qrOverlay.hidden) {
    closeOverlay();
  }
});

inputText.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    renderQrCode();
  }
});
