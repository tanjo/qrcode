import{a as e,i as t,l as n,n as r,o as i,r as a,s as o}from"./history-store-CYBcU2Aq.js";import{t as s}from"./browser-DYZ9pjw-.js";var c=n(s(),1);document.querySelector(`#history-app`).innerHTML=`
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
`;var l=document.querySelector(`#historyList`),u=document.querySelector(`#emptyText`),d=document.querySelector(`#countText`),f=document.querySelector(`#clearAllButton`),p=document.querySelector(`#exportButton`),m=document.querySelector(`#importButton`),h=document.querySelector(`#importInput`),g=document.querySelector(`#syncStatus`),_=document.querySelector(`#qrOverlay`),v=document.querySelector(`#closeOverlayButton`),y=document.querySelector(`#overlayQrImage`),b=(e,t=`normal`)=>{g.textContent=e,g.dataset.tone=t},x=e=>e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`),S=e=>new Intl.DateTimeFormat(`ja-JP`,{year:`numeric`,month:`2-digit`,day:`2-digit`,hour:`2-digit`,minute:`2-digit`,second:`2-digit`}).format(new Date(e)),C=e=>e===`generate`?`作成`:`読取`,w=e=>e.name&&e.name.trim()?e.name:`${C(e.type)} ${S(e.createdAt)}`,T=e=>{e&&(y.src=e,_.hidden=!1)},E=()=>{_.hidden=!0,y.removeAttribute(`src`)},D=async(e,t)=>{let n=t.nextElementSibling;if(e.type===`read`){if(e.imageDataUrl){t.src=e.imageDataUrl,t.hidden=!1,n?.classList.contains(`qr-fallback`)&&(n.hidden=!0);return}t.hidden=!0,n?.classList.contains(`qr-fallback`)&&(n.textContent=`この履歴には元画像データがありません。`,n.hidden=!1);return}try{let r=e.qrOptions||{width:320,margin:2,errorCorrectionLevel:`M`,color:{dark:`#112236`,light:`#f7f7f2`}};t.src=await c.toDataURL(e.text,{...r,width:180}),t.hidden=!1,n?.classList.contains(`qr-fallback`)&&(n.hidden=!0)}catch{t.hidden=!0,n?.classList.contains(`qr-fallback`)&&(n.textContent=`この履歴はQRコードへ再生成できませんでした。`,n.hidden=!1)}},O=async e=>{await Promise.all(e.map(async e=>{let t=l.querySelector(`[data-qr-id="${e.id}"]`);t&&await D(e,t)}))},k=async()=>{let t=e();l.innerHTML=t.map(e=>`
        <li class="history-item" data-id="${e.id}">
          <div class="meta-row">
            <span class="badge badge-${e.type}">${C(e.type)}</span>
            <time class="time">${S(e.createdAt)}</time>
          </div>
          <div class="name-row">
            <label class="name-label" for="name-${e.id}">名前</label>
            <input
              id="name-${e.id}"
              class="name-input"
              type="text"
              maxlength="60"
              value="${x(e.name||``)}"
              placeholder="${x(w(e))}"
              data-name-id="${e.id}"
            />
          </div>
          <div class="qr-preview-wrap">
            <img class="qr-preview" data-qr-id="${e.id}" alt="履歴から再生成したQRコード" hidden />
            <p class="qr-fallback" hidden>この文字列はQRコードへ再生成できませんでした。</p>
          </div>
          <pre class="value">${x(e.text)}</pre>
          <div class="item-actions">
            <button class="button mini copy-item" type="button">コピー</button>
            <button class="button mini delete-item" type="button">削除</button>
          </div>
        </li>
      `).join(``);let n=t.length>0;u.hidden=n,f.disabled=!n,d.textContent=n?`${t.length}件の履歴`:`0件の履歴`,n&&await O(t)},A=t=>e().find(e=>e.id===t);l.addEventListener(`click`,async e=>{let t=e.target.closest(`.qr-preview`);if(t&&t.getAttribute(`src`)){T(t.getAttribute(`src`));return}let n=e.target.closest(`button`);if(!n)return;let r=e.target.closest(`.history-item`)?.dataset.id;if(r){if(n.classList.contains(`copy-item`)){let e=A(r);if(!e)return;try{await navigator.clipboard.writeText(e.text),n.textContent=`コピー済み`,setTimeout(()=>{n.textContent=`コピー`},900)}catch{n.textContent=`失敗`,setTimeout(()=>{n.textContent=`コピー`},900)}return}n.classList.contains(`delete-item`)&&(a(r),await k())}}),l.addEventListener(`change`,e=>{let t=e.target.closest(`.name-input`);if(!t)return;let n=t.dataset.nameId;n&&o(n,t.value)}),l.addEventListener(`keydown`,e=>{let t=e.target.closest(`.name-input`);t&&e.key===`Enter`&&(e.preventDefault(),t.blur())}),f.addEventListener(`click`,()=>{window.confirm(`履歴をすべて削除しますか？`)&&(r(),k())}),p.addEventListener(`click`,()=>{try{let e=t(),n=new Date().toISOString().replaceAll(`:`,`-`).slice(0,19),r=new Blob([e],{type:`application/json`}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=`qr-history-${n}.json`,a.click(),URL.revokeObjectURL(i),b(`履歴ファイルを書き出しました。別デバイスで「履歴を読み込み」を使って取り込めます。`,`success`)}catch{b(`履歴の書き出しに失敗しました。`,`error`)}}),m.addEventListener(`click`,()=>{h.click()}),h.addEventListener(`change`,async()=>{let e=h.files?.[0];if(h.value=``,e)try{let t=i(await e.text());await k(),b(`${t}件の履歴を読み込みました。`,`success`)}catch(e){b(e?.message||`履歴の読み込みに失敗しました。`,`error`)}}),v.addEventListener(`click`,E),_.addEventListener(`click`,e=>{e.target===_&&E()}),document.addEventListener(`keydown`,e=>{e.key===`Escape`&&!_.hidden&&E()}),b(`サーバーなしで使う場合は、履歴を書き出しして別デバイスで読み込んでください。`),k();