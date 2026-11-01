/* =========================================================
   UI: modal, toasts, confirmações, gráficos SVG, helpers
   ========================================================= */
(function (global) {
  'use strict';
  const MC = (global.MC = global.MC || {});
  const U = MC.U;
  const UI = (MC.UI = {});

  /* ---------------- Toasts ---------------- */
  UI.toast = function (msg, type = 'info', ms = 3200) {
    const host = document.getElementById('toasts');
    if (!host) return alert(msg);
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.setAttribute('role', 'status');
    el.innerHTML = `<span>${U.esc(msg)}</span>`;
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    }, ms);
  };

  UI.achievementToast = function (a) {
    const host = document.getElementById('toasts');
    if (!host) return;
    const el = document.createElement('div');
    el.className = 'toast toast-achievement';
    el.innerHTML = `<div class="ach-ico">${a.icon}</div><div><small>Conquista desbloqueada</small><strong>${U.esc(a.name)}</strong><span>${U.esc(a.desc)}</span></div>`;
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    }, 5000);
  };

  /* ---------------- Modal ---------------- */
  let modalStack = [];
  UI.modal = function ({ title, body, actions, size = 'md', onOpen, onClose, dismissible = true }) {
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `
      <div class="modal modal-${size}" role="dialog" aria-modal="true" aria-label="${U.esc(title || '')}">
        <header class="modal-head">
          <h3>${title || ''}</h3>
          ${dismissible ? '<button class="icon-btn" data-close aria-label="Fechar">✕</button>' : ''}
        </header>
        <div class="modal-body">${body || ''}</div>
        ${actions ? `<footer class="modal-foot">${actions}</footer>` : ''}
      </div>`;
    document.body.appendChild(wrap);
    document.body.classList.add('no-scroll');
    const api = {
      el: wrap,
      root: wrap.querySelector('.modal'),
      close() {
        wrap.classList.remove('show');
        setTimeout(() => wrap.remove(), 180);
        modalStack = modalStack.filter((m) => m !== api);
        if (!modalStack.length) document.body.classList.remove('no-scroll');
        onClose && onClose();
      },
      $(sel) { return wrap.querySelector(sel); },
      $$(sel) { return Array.from(wrap.querySelectorAll(sel)); },
    };
    modalStack.push(api);
    wrap.addEventListener('mousedown', (e) => {
      if (e.target === wrap && dismissible) api.close();
    });
    wrap.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => api.close()));
    requestAnimationFrame(() => wrap.classList.add('show'));
    onOpen && onOpen(api);
    const first = wrap.querySelector('input:not([type=hidden]):not([readonly]),select,textarea');
    if (first && window.innerWidth > 700) setTimeout(() => first.focus(), 60);
    return api;
  };

  UI.closeAll = () => modalStack.slice().forEach((m) => m.close());

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalStack.length) {
      const top = modalStack[modalStack.length - 1];
      if (top.root.parentElement.querySelector('[data-close]')) top.close();
    }
  });

  UI.confirm = function (msg, { title = 'Confirmar', ok = 'Confirmar', danger = false } = {}) {
    return new Promise((resolve) => {
      let done = false;
      const m = UI.modal({
        title,
        size: 'sm',
        body: `<p>${msg}</p>`,
        actions: `<button class="btn ghost" data-close>Cancelar</button><button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${ok}</button>`,
        onClose: () => { if (!done) resolve(false); },
      });
      m.$('[data-ok]').addEventListener('click', () => { done = true; resolve(true); m.close(); });
    });
  };

  UI.prompt = function (msg, value = '', { title = 'Informar' } = {}) {
    return new Promise((resolve) => {
      let done = false;
      const m = UI.modal({
        title, size: 'sm',
        body: `<label class="field"><span>${msg}</span><input id="ui-prompt" value="${U.esc(value)}"></label>`,
        actions: `<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" data-ok>OK</button>`,
        onClose: () => { if (!done) resolve(null); },
      });
      const go = () => { done = true; resolve(m.$('#ui-prompt').value); m.close(); };
      m.$('[data-ok]').addEventListener('click', go);
      m.$('#ui-prompt').addEventListener('keydown', (e) => e.key === 'Enter' && go());
    });
  };

  /* ---------------- Form helpers ---------------- */
  UI.formData = function (root) {
    const o = {};
    root.querySelectorAll('[name]').forEach((el) => {
      if (el.type === 'checkbox') o[el.name] = el.checked;
      else if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; }
      else o[el.name] = el.value;
    });
    return o;
  };

  UI.options = (list, sel) =>
    list
      .map((x) => {
        const v = typeof x === 'object' ? x.v : x;
        const l = typeof x === 'object' ? x.l : x;
        return `<option value="${U.esc(v)}" ${String(v) === String(sel) ? 'selected' : ''}>${U.esc(l)}</option>`;
      })
      .join('');

  UI.field = (label, inner, cls = '') => `<label class="field ${cls}"><span>${label}</span>${inner}</label>`;

  /* ---------------- Visual helpers ---------------- */
  UI.ovrClass = (v) => (v >= 85 ? 'ovr-elite' : v >= 80 ? 'ovr-gold' : v >= 75 ? 'ovr-good' : v >= 65 ? 'ovr-mid' : 'ovr-low');
  UI.ovr = (v) => `<span class="ovr ${UI.ovrClass(v)}">${v}</span>`;
  UI.pos = (p) => `<span class="pos pos-${MC.Engine.POS_GROUP[p] || 'MEI'}">${U.esc(p)}</span>`;
  UI.res = (r) => (r ? `<span class="res res-${r}">${r}</span>` : '<span class="res res-x">–</span>');
  UI.form = (arr) => `<span class="form-row">${arr.map(UI.res).join('')}</span>`;
  UI.rating = (r) => {
    r = Number(r);
    if (!r) return '<span class="muted">—</span>';
    const cls = r >= 8 ? 'r-great' : r >= 7 ? 'r-good' : r >= 6 ? 'r-ok' : 'r-bad';
    return `<span class="rating ${cls}">${r.toFixed(1)}</span>`;
  };
  UI.avatar = (name, color = 'var(--accent)', size = 36) =>
    `<span class="avatar" style="--av:${color};width:${size}px;height:${size}px;font-size:${Math.round(size * 0.38)}px">${U.esc(U.initials(name))}</span>`;

  UI.meter = (val, label, { color, suffix = '%' } = {}) => {
    val = Math.round(Number(val) || 0);
    const c = color || (val >= 70 ? 'var(--good)' : val >= 45 ? 'var(--warn)' : 'var(--bad)');
    return `<div class="meter"><div class="meter-head"><span>${label}</span><strong>${val}${suffix}</strong></div><div class="meter-bar"><i style="width:${U.clamp(val, 0, 100)}%;background:${c}"></i></div></div>`;
  };

  UI.moraleLabel = (m) => (m >= 85 ? 'Muito feliz' : m >= 70 ? 'Feliz' : m >= 50 ? 'Satisfeito' : m >= 35 ? 'Insatisfeito' : 'Muito insatisfeito');
  UI.moraleIcon = (m) => (m >= 85 ? '😁' : m >= 70 ? '🙂' : m >= 50 ? '😐' : m >= 35 ? '🙁' : '😠');

  UI.boardLabel = (v) => (v >= 85 ? 'Excelente' : v >= 70 ? 'Muito boa' : v >= 55 ? 'Boa' : v >= 40 ? 'Instável' : v >= 25 ? 'Sob pressão' : 'Demissão iminente');

  UI.empty = (icon, title, text, action = '') =>
    `<div class="empty"><div class="empty-ico">${icon}</div><h4>${title}</h4><p>${text}</p>${action}</div>`;

  UI.badge = (club, size = 40) => {
    if (club.badge) return `<img class="badge-img" src="${U.esc(club.badge)}" alt="" style="width:${size}px;height:${size}px">`;
    return `<span class="crest" style="--ca:${U.esc(club.colorA)};--cb:${U.esc(club.colorB)};width:${size}px;height:${size}px;font-size:${Math.round(size * 0.3)}px">${U.esc((club.short || club.name || '?').slice(0, 3))}</span>`;
  };

  /* ---------------- Gráficos SVG simples ---------------- */
  UI.lineChart = function (series, { height = 180, yMin, yMax, labels = [], valueFmt = (v) => v, invert = false } = {}) {
    const all = series.flatMap((s) => s.points.map((p) => p.y));
    if (!all.length) return '<div class="chart-empty">Sem dados suficientes ainda.</div>';
    const w = 600, h = height, pad = { l: 36, r: 12, t: 12, b: 24 };
    let lo = yMin != null ? yMin : Math.min(...all);
    let hi = yMax != null ? yMax : Math.max(...all);
    if (lo === hi) { lo -= 1; hi += 1; }
    const n = Math.max(...series.map((s) => s.points.length));
    const x = (i) => pad.l + (n <= 1 ? (w - pad.l - pad.r) / 2 : (i * (w - pad.l - pad.r)) / (n - 1));
    const y = (v) => {
      const t = (v - lo) / (hi - lo);
      return invert ? pad.t + t * (h - pad.t - pad.b) : h - pad.b - t * (h - pad.t - pad.b);
    };
    const ticks = 4;
    let grid = '';
    for (let i = 0; i <= ticks; i++) {
      const v = lo + ((hi - lo) * i) / ticks;
      grid += `<line x1="${pad.l}" x2="${w - pad.r}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${pad.l - 6}" y="${y(v) + 4}" text-anchor="end" class="axis">${U.esc(valueFmt(Math.round(v * 10) / 10))}</text>`;
    }
    const xl = labels.length
      ? labels.map((l, i) => (n > 12 && i % Math.ceil(n / 10) !== 0 ? '' : `<text x="${x(i)}" y="${h - 6}" text-anchor="middle" class="axis">${U.esc(l)}</text>`)).join('')
      : '';
    const paths = series
      .map((s, si) => {
        const pts = s.points.map((p, i) => `${x(i)},${y(p.y)}`).join(' ');
        const area = s.area ? `<polygon points="${x(0)},${invert ? pad.t : h - pad.b} ${pts} ${x(s.points.length - 1)},${invert ? pad.t : h - pad.b}" fill="${s.color}" opacity=".12"/>` : '';
        const dots = s.points.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.y)}" r="3.5" fill="${s.color}"><title>${U.esc(p.label || '')} ${U.esc(valueFmt(p.y))}</title></circle>`).join('');
        return `${area}<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${dots}`;
      })
      .join('');
    const legend = series.length > 1 ? `<div class="legend">${series.map((s) => `<span><i style="background:${s.color}"></i>${U.esc(s.name)}</span>`).join('')}</div>` : '';
    return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img">${grid}${xl}${paths}</svg>${legend}`;
  };

  UI.barChart = function (items, { height = 180, valueFmt = (v) => v, color = 'var(--accent)' } = {}) {
    if (!items.length) return '<div class="chart-empty">Sem dados suficientes ainda.</div>';
    const max = Math.max(...items.map((i) => Math.abs(i.value)), 1);
    return `<div class="bars" style="height:${height}px">${items
      .map((i) => `<div class="bar" title="${U.esc(i.label)}: ${U.esc(valueFmt(i.value))}"><span class="bar-val">${U.esc(valueFmt(i.value))}</span><i style="height:${(Math.abs(i.value) / max) * 100}%;background:${i.color || color}"></i><span class="bar-lbl">${U.esc(i.label)}</span></div>`)
      .join('')}</div>`;
  };

  UI.donut = function (parts, { size = 120, center = '' } = {}) {
    const total = U.sum(parts, (p) => p.value) || 1;
    const r = 15.915;
    let off = 25;
    const segs = parts
      .map((p) => {
        const pct = (p.value / total) * 100;
        const s = `<circle r="${r}" cx="21" cy="21" fill="transparent" stroke="${p.color}" stroke-width="5" stroke-dasharray="${pct} ${100 - pct}" stroke-dashoffset="${off}"><title>${U.esc(p.label)}: ${p.value}</title></circle>`;
        off -= pct;
        return s;
      })
      .join('');
    return `<div class="donut-wrap"><svg viewBox="0 0 42 42" width="${size}" height="${size}" class="donut"><circle r="${r}" cx="21" cy="21" fill="transparent" stroke="var(--line)" stroke-width="5"/>${segs}<text x="21" y="23.5" text-anchor="middle" class="donut-center">${U.esc(center)}</text></svg><div class="legend col">${parts.map((p) => `<span><i style="background:${p.color}"></i>${U.esc(p.label)} <b>${p.value}</b></span>`).join('')}</div></div>`;
  };

  /* ---------------- Status de salvamento ---------------- */
  UI.refreshSaveStatus = function () {
    const el = document.getElementById('save-status');
    if (!el) return;
    const S = MC.Store;
    let txt, cls;
    if (S.fileHandle) {
      if (S.needsPermission) { txt = `Clique para autorizar gravação em ${S.fileName}`; cls = 'warn'; }
      else if (S.dirtyFile) { txt = `Gravando em ${S.fileName}…`; cls = 'busy'; }
      else { txt = `Salvo no PC · ${S.fileName}`; cls = 'ok'; }
    } else {
      txt = 'Salvo no navegador';
      cls = 'ok';
    }
    el.className = `save-status ${cls}`;
    el.innerHTML = `<i></i><span>${U.esc(txt)}</span>`;
    el.title = S.lastSaved ? 'Último salvamento: ' + S.lastSaved.toLocaleTimeString('pt-BR') : '';
  };
})(window);
