// ==UserScript==
// @name         Facebook 广告资料库助手 · Ad Library Helper (33.ci)
// @namespace    https://33.ci/
// @version      1.0.0
// @description  在 Facebook 广告资料库页面显示当前搜索条件、主页编号，并收集页面上所有广告的资料库编号：一键复制、打开、查投放状态。Shows the current Ad Library filters and Page ID, collects every Library ID on the page with copy / open / status-check links.
// @author       33.ci
// @homepage     https://github.com/zlaouaywhuyasdlaouaysh-ui/facebook-ad-library-tools
// @supportURL   https://github.com/zlaouaywhuyasdlaouaysh-ui/facebook-ad-library-tools/issues
// @downloadURL  https://raw.githubusercontent.com/zlaouaywhuyasdlaouaysh-ui/facebook-ad-library-tools/main/userscript/fb-ad-library-helper.user.js
// @updateURL    https://raw.githubusercontent.com/zlaouaywhuyasdlaouaysh-ui/facebook-ad-library-tools/main/userscript/fb-ad-library-helper.user.js
// @match        https://www.facebook.com/ads/library*
// @grant        GM_setClipboard
// @run-at       document-idle
// @license      MIT
// ==/UserScript==

(() => {
  'use strict';

  const ID_RE = /(?:Library ID|资料库编号|資料庫編號)\s*[:：#]?\s*(\d{6,25})/gi;
  const STATUS = { all: '全部', active: '投放中', inactive: '已停投' };
  const MEDIA = { all: '全部', image: '图片', video: '视频', meme: '梗图', image_and_meme: '图片和梗图', none: '无图片和视频' };
  const LIB = 'https://www.facebook.com/ads/library/?id=';
  const checker = (id) => `https://33.ci/tools/ad-status-checker?id=${id}&utm_source=github&utm_medium=userscript`;

  const copy = (text) => {
    if (typeof GM_setClipboard === 'function') GM_setClipboard(text, 'text');
    else navigator.clipboard.writeText(text);
  };

  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483647';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
    <style>
      :host { all: initial; }
      .box { font: 13px/1.5 system-ui, sans-serif; color: #1c1e21; background: #fff; border: 1px solid #ccd0d5;
             border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,.15); width: 320px; max-height: 60vh; display: flex; flex-direction: column; }
      .head { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; border-bottom: 1px solid #e4e6eb; cursor: pointer; }
      .head b { font-size: 13px; }
      .body { overflow: auto; padding: 8px 10px; }
      .collapsed .body { display: none; }
      table { border-collapse: collapse; width: 100%; margin-bottom: 8px; }
      td { padding: 2px 4px; vertical-align: top; word-break: break-all; }
      td:first-child { color: #65676b; white-space: nowrap; }
      ul { list-style: none; margin: 0; padding: 0; }
      li { display: flex; gap: 6px; align-items: center; padding: 3px 0; border-top: 1px solid #f0f2f5; }
      li code { flex: 1; font-size: 12px; }
      a, button { font: inherit; font-size: 12px; color: #0866ff; background: none; border: 0; padding: 0; cursor: pointer; text-decoration: none; }
      .muted { color: #65676b; font-size: 12px; }
      .foot { padding: 6px 10px; border-top: 1px solid #e4e6eb; font-size: 12px; color: #65676b; }
    </style>
    <div class="box">
      <div class="head"><b>广告资料库助手</b><span class="muted" data-count></span></div>
      <div class="body">
        <table data-params></table>
        <div class="muted" style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span>本页广告编号</span><button data-copy-all>复制全部</button>
        </div>
        <ul data-ids></ul>
      </div>
      <div class="foot">要长期盯新广告和停投？<a href="https://33.ci/?utm_source=github&utm_medium=userscript" target="_blank" rel="noopener">33.ci 广告监控</a></div>
    </div>`;
  document.body.appendChild(host);

  const box = root.querySelector('.box');
  root.querySelector('.head').addEventListener('click', () => box.classList.toggle('collapsed'));

  const ids = new Set();

  function renderParams() {
    const p = new URLSearchParams(location.search);
    const rows = [];
    const id = p.get('id');
    if (id) rows.push(['单条广告', id]);
    const page = p.get('view_all_page_id');
    if (page) rows.push(['主页编号', `${page} <button data-copy="${page}">复制</button>`]);
    const q = p.get('q');
    if (q) rows.push([p.get('search_type') === 'keyword_exact_phrase' ? '精确短语' : '关键词', q.replace(/</g, '&lt;')]);
    if (p.get('country')) rows.push(['投放国家', p.get('country') === 'ALL' ? '全部国家 / 地区' : p.get('country')]);
    if (p.get('active_status')) rows.push(['投放状态', STATUS[p.get('active_status')] ?? p.get('active_status')]);
    if (p.get('media_type')) rows.push(['素材类型', MEDIA[p.get('media_type')] ?? p.get('media_type')]);
    const platforms = [...p].filter(([k]) => k.startsWith('publisher_platforms[')).map(([, v]) => v);
    if (platforms.length) rows.push(['平台', platforms.join(', ')]);
    const min = p.get('start_date[min]');
    const max = p.get('start_date[max]');
    if (min || max) rows.push(['开始投放日期', `${min || '…'} ~ ${max || '…'}`]);
    root.querySelector('[data-params]').innerHTML = rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('');
  }

  function scan() {
    const before = ids.size;
    for (const m of document.body.innerText.matchAll(ID_RE)) ids.add(m[1]);
    if (ids.size === before && before > 0) return;
    root.querySelector('[data-count]').textContent = `${ids.size} 条`;
    root.querySelector('[data-ids]').innerHTML = [...ids].map((id) => `
      <li><code>${id}</code>
        <button data-copy="${id}">复制</button>
        <a href="${LIB}${id}" target="_blank" rel="noopener">打开</a>
        <a href="${checker(id)}" target="_blank" rel="noopener">查状态</a></li>`).join('')
      || '<li class="muted">还没找到。往下滚动加载更多广告后会自动收集。</li>';
  }

  root.addEventListener('click', (event) => {
    const target = event.target;
    if (target.matches('[data-copy]')) {
      copy(target.dataset.copy);
      target.textContent = '已复制';
    } else if (target.matches('[data-copy-all]')) {
      copy([...ids].join('\n'));
      target.textContent = `已复制 ${ids.size} 条`;
    }
  });

  let timer = 0;
  const schedule = () => {
    if (!timer) timer = setTimeout(() => { timer = 0; scan(); }, 1500);
  };
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });

  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      ids.clear();
      renderParams();
      scan();
    }
  }, 1000);

  renderParams();
  scan();
})();
