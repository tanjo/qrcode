import{l as e,t}from"./history-store-CYBcU2Aq.js";import{t as n}from"./browser-DYZ9pjw-.js";var r=e(n(),1);document.querySelector(`#generator-app`).innerHTML=`
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
`;var i=document.querySelector(`#inputText`),a=document.querySelector(`#sizeInput`),o=document.querySelector(`#marginInput`),s=document.querySelector(`#ecLevel`),c=document.querySelector(`#generateButton`),l=document.querySelector(`#downloadButton`),u=document.querySelector(`#status`),d=document.querySelector(`#qrCanvas`),f=document.querySelector(`#qrImage`),p=document.querySelector(`#previewCard`),m=document.querySelector(`#qrOverlay`),h=document.querySelector(`#closeOverlayButton`),g=document.querySelector(`#overlayQrImage`),_=(e,t=`normal`)=>{u.textContent=e,u.dataset.tone=t},v=()=>{p.hidden=!0,f.hidden=!0,f.removeAttribute(`src`),g.removeAttribute(`src`),m.hidden=!0},y=async()=>{let e=i.value.trim(),n=Number(a.value)||320,c=Number(o.value)||2;if(!e){v(),_(`テキストを入力してください。`,`error`),l.disabled=!0;return}try{_(`QRコードを生成中です...`,`normal`),await r.toCanvas(d,e,{width:n,margin:c,errorCorrectionLevel:s.value,color:{dark:`#112236`,light:`#f7f7f2`}});let i=d.toDataURL(`image/png`);p.hidden=!1,f.src=i,f.hidden=!1,g.src=i,l.disabled=!1,t({type:`generate`,text:e,qrOptions:{width:n,margin:c,errorCorrectionLevel:s.value,color:{dark:`#112236`,light:`#f7f7f2`}}}),_(`QRコードを生成しました。`,`success`)}catch(e){v(),l.disabled=!0,_(e?.message||`QRコード生成に失敗しました。`,`error`)}},b=()=>{l.disabled||(g.src=d.toDataURL(`image/png`),m.hidden=!1)},x=()=>{m.hidden=!0};c.addEventListener(`click`,y),l.addEventListener(`click`,()=>{if(!i.value.trim())return;let e=document.createElement(`a`);e.href=d.toDataURL(`image/png`),e.download=`qrcode.png`,e.click()}),d.addEventListener(`click`,b),f.addEventListener(`click`,b),h.addEventListener(`click`,x),m.addEventListener(`click`,e=>{e.target===m&&x()}),document.addEventListener(`keydown`,e=>{e.key===`Escape`&&!m.hidden&&x()}),i.addEventListener(`keydown`,e=>{(e.metaKey||e.ctrlKey)&&e.key===`Enter`&&y()});