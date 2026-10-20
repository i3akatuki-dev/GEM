/* 大埃及博物馆 · 随身讲解 */
(function () {
  'use strict';

  var D = window.GEM_DATA || { galleries: [], items: [] };
  var ITEMS = D.items || [];
  var GALS = D.galleries || [];
  var BYID = {};
  var BYGAL = {};
  ITEMS.forEach(function (it) {
    BYID[it.id] = it;
    (BYGAL[it.g] = BYGAL[it.g] || []).push(it);
  });

  var app = document.getElementById('app');
  var toastTimer = null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function img(id, n, thumb) {
    return 'img/' + id + '/' + (thumb ? 't' : '') + n + '.webp';
  }
  function galName(key) {
    for (var i = 0; i < GALS.length; i++) if (GALS[i].key === key) return GALS[i].cn;
    return '其他藏品';
  }
  function galEn(key) {
    for (var i = 0; i < GALS.length; i++) if (GALS[i].key === key) return GALS[i].en;
    return '';
  }
  function toast(msg) {
    var el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    document.body.appendChild(el);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 2200);
  }

  /* ---------------- 顶栏 ---------------- */
  function topbar(title, sub, backHash) {
    var back = backHash
      ? '<a class="back" href="' + backHash + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>返回</a>'
      : '<span class="spacer"></span>';
    return '<header class="topbar">' + back +
      '<div class="ttl">' + esc(title) + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div>' +
      '<a class="back" href="#/about" style="justify-content:flex-end">关于</a></header>';
  }

  /* ---------------- 首页 ---------------- */
  function viewHome() {
    var star = ITEMS.filter(function (x) { return x.star; });
    var html = '<header class="topbar"><span class="spacer"></span>' +
      '<div class="ttl">大埃及博物馆<small>GRAND EGYPTIAN MUSEUM</small></div>' +
      '<a class="back" href="#/about" style="justify-content:flex-end">关于</a></header>' +
      '<main>' +
      '<div class="hero">' +
      '<div class="kicker">随身讲解</div>' +
      '<h1>在<em>大埃及博物馆</em><br>读懂每一件展品</h1>' +
      '<p>' + ITEMS.length + ' 件馆藏图文与讲解，全部离线可用。在展厅里输入展签上的编号，立刻找到眼前这一件。</p>' +
      '</div>' +
      '<div class="searchwrap"><label class="search">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/></svg>' +
      '<input id="q" type="search" inputmode="search" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="输入 GEM 编号 / 中文名 / 英文名">' +
      '<button class="clear" id="clr" hidden>×</button></label></div>' +
      '<div id="searchres"></div>' +
      '<div id="homebody">' +
      '<div class="gal-grid">';
    GALS.forEach(function (g) {
      html += '<a class="gal-card" href="#/g/' + g.key + '">' +
        '<span class="glyph">' + esc(g.cn.charAt(0)) + '</span>' +
        '<span class="gi"><b>' + esc(g.cn) + '</b><span>' + esc(g.en) + '</span></span>' +
        '<span class="cnt">' + g.count + ' <i>件</i></span></a>';
    });
    html += '</div>';
    if (star.length) {
      html += '<div class="section"><h2>必看的 ' + star.length + ' 件</h2></div>' +
        '<div class="list">' + star.map(rowHtml).join('') + '</div>';
    }
    html += '</div></main>';
    app.innerHTML = html;
    bindSearch();
  }

  function rowHtml(it) {
    return '<a class="row" href="#/a/' + it.id + '">' +
      '<span class="th"><img loading="lazy" src="' + img(it.id, 1, true) + '" alt="">' +
      (it.cn ? '' : '<span class="ph">器</span>') + '</span>' +
      '<span class="ri"><b>' + esc(it.cn || it.en) + (it.star ? '<span class="star">✦</span>' : '') + '</b>' +
      '<small>' + esc(it.en || '') + '</small></span>' +
      '<span class="no">' + esc(it.no) + '</span></a>';
  }

  /* ---------------- 搜索 ---------------- */
  function bindSearch() {
    var q = document.getElementById('q');
    var clr = document.getElementById('clr');
    var res = document.getElementById('searchres');
    var body = document.getElementById('homebody');
    if (!q) return;

    function run() {
      var s = q.value.trim().toLowerCase();
      clr.hidden = !s;
      if (!s) {
        res.innerHTML = '';
        body.hidden = false;
        return;
      }
      body.hidden = true;
      var hits = ITEMS.filter(function (it) {
        return (it.no && String(it.no).indexOf(s) > -1) ||
          (it.cn && it.cn.toLowerCase().indexOf(s) > -1) ||
          (it.en && it.en.toLowerCase().indexOf(s) > -1) ||
          (it.p && it.p.toLowerCase().indexOf(s) > -1);
      });
      // 编号完全命中的排最前
      hits.sort(function (a, b) {
        var ea = String(a.no) === s ? 0 : 1, eb = String(b.no) === s ? 0 : 1;
        if (ea !== eb) return ea - eb;
        return a.i - b.i;
      });
      if (!hits.length) {
        res.innerHTML = '<div class="empty"><b>没有找到</b>换个关键词，或试着只输入编号数字</div>';
        return;
      }
      res.innerHTML = '<div class="section"><h2>找到 ' + hits.length + ' 件</h2></div>' +
        '<div class="list">' + hits.slice(0, 60).map(rowHtml).join('') + '</div>';
    }
    q.addEventListener('input', run);
    clr.addEventListener('click', function () { q.value = ''; run(); q.focus(); });
    if (q.value) run();
  }

  /* ---------------- 展厅列表 ---------------- */
  function viewGallery(key) {
    var list = BYGAL[key] || [];
    if (!list.length) { location.hash = '#/'; return; }
    var html = topbar(galName(key), galEn(key), '#/') +
      '<main><div class="section"><h2>' + list.length + ' 件藏品</h2></div>' +
      '<div class="list">' + list.map(rowHtml).join('') + '</div></main>';
    app.innerHTML = html;
  }

  /* ---------------- 详情 ---------------- */
  function viewArtefact(id) {
    var it = BYID[id];
    if (!it) { location.hash = '#/'; return; }
    var gal = BYGAL[it.g] || [];
    var idx = gal.indexOf(it);
    var prev = idx > 0 ? gal[idx - 1] : null;
    var next = idx < gal.length - 1 ? gal[idx + 1] : null;

    var figs = '';
    for (var k = 1; k <= it.n; k++) {
      figs += '<img src="' + img(it.id, k) + '" alt="' + esc(it.en) + '"' + (k > 1 ? ' hidden' : '') + ' data-k="' + k + '">';
    }
    var dots = it.n > 1
      ? '<span class="dots">' + Array.apply(null, { length: it.n }).map(function (_, i) {
        return '<i class="' + (i === 0 ? 'on' : '') + '"></i>';
      }).join('') + '</span>'
      : '';

    var chips = '';
    function chip(label, val) {
      if (val) chips += '<span class="chip"><b>' + label + '</b>' + esc(val) + '</span>';
    }
    chip('年代', it.p);
    if (it.d) chip('王朝', it.d);
    chip('材质', it.m);
    chip('尺寸', it.dim);
    chip('出土地', it.prov);

    var paras = (it.body || '').split(/\n+/).filter(Boolean)
      .map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
    if (!paras) paras = '<p class="lead">讲解整理中。</p>' + (it.src ? '<p>' + esc(it.src) + '</p>' : '');

    var html = topbar(galName(it.g), '', '#/g/' + it.g) +
      '<main><div class="detail">' +
      '<figure class="figure">' + figs + dots +
      '<span class="zoom">点击放大</span></figure>' +
      '<div class="dhead">' +
      '<span class="no-badge">GEM 编号 <b>' + esc(it.no) + '</b></span>' +
      '<h1>' + esc(it.cn || it.en) + '</h1>' +
      '<div class="en">' + esc(it.en || '') + '</div>' +
      '</div>' +
      (chips ? '<div class="chips">' + chips + '</div>' : '') +
      '<div class="body">' + paras + '</div>' +
      '<div class="pager">' +
      (prev ? '<a href="#/a/' + prev.id + '"><span>上一件</span><b>' + esc(prev.cn || prev.en) + '</b></a>' : '<span style="flex:1"></span>') +
      (next ? '<a class="next" href="#/a/' + next.id + '"><span>下一件</span><b>' + esc(next.cn || next.en) + '</b></a>' : '<span style="flex:1"></span>') +
      '</div></div></main>';
    app.innerHTML = html;
    window.scrollTo(0, 0);

    var fig = app.querySelector('.figure');
    if (it.n > 1) {
      var cur = 0, imgs = fig.querySelectorAll('img'), ds = fig.querySelectorAll('.dots i');
      var x0 = null;
      fig.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      fig.addEventListener('touchend', function (e) {
        if (x0 == null) return;
        var dx = e.changedTouches[0].clientX - x0;
        x0 = null;
        if (Math.abs(dx) < 40) return;
        var nx = cur + (dx < 0 ? 1 : -1);
        if (nx < 0 || nx >= imgs.length) return;
        imgs[cur].hidden = true; ds[cur].classList.remove('on');
        cur = nx;
        imgs[cur].hidden = false; ds[cur].classList.add('on');
      });
    }
    fig.addEventListener('click', function (e) {
      if (e.target.closest('.dots')) return;
      openLightbox(fig.querySelectorAll('img'), 0);
    });
  }

  function openLightbox(imgs, start) {
    var box = document.createElement('div');
    box.className = 'lightbox';
    box.innerHTML = '<img src="' + imgs[start].src + '" alt=""><button class="close">×</button>';
    box.addEventListener('click', function () { box.remove(); });
    document.body.appendChild(box);
  }

  /* ---------------- 关于 / 离线 ---------------- */
  function viewAbout() {
    var html = topbar('关于与版权', '', '#/') +
      '<main><div class="about">' +
      '<h1>关于这个站点</h1>' +
      '<p>这是一个私人的随身讲解工具：把大埃及博物馆（Grand Egyptian Museum）官网公开的 ' + ITEMS.length +
      ' 件藏品资料整理成中文，配上一段可以直接读下去的讲解。不联网也能用，在展厅里输入展签上的 GEM 编号就能找到眼前这一件。</p>' +

      '<h2>先把它加到主屏幕</h2>' +
      '<div class="box"><p class="note">用 Safari 打开本页 → 点底部的「分享」按钮 → 选「添加到主屏幕」。之后从主屏幕图标进入，界面更干净，离线缓存也不会被系统清掉。</p></div>' +

      '<h2>离线下载</h2>' +
      '<div class="box">' +
      '<p class="note" id="offnote">文字和界面已经缓存好了。图片会在你浏览时逐张存下来；想在博物馆里完全断网使用，可以现在一次下完（约 ' +
      Math.round(ITEMS.reduce(function (a, b) { return a + b.n; }, 0) * 27 / 1024) + ' MB，建议在 Wi-Fi 下进行）。</p>' +
      '<button class="btn" id="dlbtn">下载全部图片以便离线</button>' +
      '<div class="progress"><i id="dlbar"></i></div>' +
      '</div>' +

      '<h2>数据来源</h2>' +
      '<p>藏品的名称、GEM 编号、所属展厅、年代、材质、尺寸、出土地等字段，均取自大埃及博物馆官网 gem.eg 的公开藏品页面。中文名称与讲解文稿由本站整理撰写，其中关于历史背景的补充说明来自公开的埃及学通识资料，不再逐条标注。</p>' +

      '<h2>版权</h2>' +
      '<div class="box"><p class="note">本页全部藏品图片的著作权归大埃及博物馆（Grand Egyptian Museum）所有，此处仅用于非商业性的个人导览用途，未获授权不得转载或商用。如权利人认为使用不妥，请通过 GitHub 仓库的 Issue 告知，我将立即删除相关图片。</p></div>' +

      '<h2>免责</h2>' +
      '<p class="note">本站与埃及旅游和文物部、大埃及博物馆均无隶属关系，内容仅供参观参考。展陈位置可能调整，讲解内容如有疏漏，以馆方说明为准。</p>' +
      '</div></main>';
    app.innerHTML = html;
    document.getElementById('dlbtn').addEventListener('click', downloadAll);
  }

  function downloadAll() {
    var btn = document.getElementById('dlbtn');
    var bar = document.getElementById('dlbar');
    var note = document.getElementById('offnote');
    var urls = [];
    ITEMS.forEach(function (it) {
      for (var k = 1; k <= it.n; k++) urls.push(img(it.id, k));
    });
    var done = 0, fail = 0, i = 0, CONC = 6;
    btn.disabled = true;
    btn.textContent = '正在下载…';
    window.__offlineAll = true;
    function worker() {
      if (i >= urls.length) return Promise.resolve();
      var u = urls[i++];
      return fetch(u, { cache: 'force-cache' })
        .then(function (r) { if (!r.ok) fail++; })
        .catch(function () { fail++; })
        .then(function () {
          done++;
          if (done % 6 === 0 || done === urls.length) {
            var pct = Math.round(done / urls.length * 100);
            bar.style.width = pct + '%';
            btn.textContent = '下载中 ' + pct + '%（' + done + '/' + urls.length + '）';
          }
          return worker();
        });
    }
    var pool = [];
    for (var c = 0; c < CONC; c++) pool.push(worker());
    Promise.all(pool).then(function () {
      bar.style.width = '100%';
      btn.textContent = '已完成下载';
      btn.disabled = false;
      note.textContent = '全部 ' + urls.length + ' 张图片已存入本地缓存，现在断网也能正常使用' +
        (fail ? '（有 ' + fail + ' 张失败，可稍后重试）' : '') + '。';
      window.__offlineAll = false;
    });
  }

  /* ---------------- 路由 ---------------- */
  function route() {
    var h = location.hash.replace(/^#\/?/, '');
    var seg = h.split('/').filter(Boolean);
    var top = seg[0] || '';
    if (top === 'a' && seg[1]) return viewArtefact(decodeURIComponent(seg[1]));
    if (top === 'g' && seg[1]) return viewGallery(decodeURIComponent(seg[1]));
    if (top === 'about') return viewAbout();
    return viewHome();
  }

  window.addEventListener('hashchange', route);
  route();

  /* ---------------- Service Worker ---------------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { });
    });
  }
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(function () { });
  }
})();
