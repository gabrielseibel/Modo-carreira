/* =========================================================
   App: roteamento, layout, ações globais
   ========================================================= */
(function (global) {
  'use strict';
  const MC = (global.MC = global.MC || {});
  const U = MC.U, UI = MC.UI, S = MC.Store, E = MC.Engine;
  MC.Views = MC.Views || {};
  MC.A = MC.A || {};

  const NAV = [
    { group: 'Principal' },
    { id: 'dashboard', icon: '🏠', label: 'Central' },
    { id: 'news', icon: '📰', label: 'Notícias' },
    { id: 'inbox', icon: '📨', label: 'Caixa de entrada' },
    { group: 'Time' },
    { id: 'squad', icon: '👥', label: 'Elenco' },
    { id: 'tactics', icon: '📋', label: 'Tática' },
    { id: 'youth', icon: '🌱', label: 'Categoria de base' },
    { group: 'Temporada' },
    { id: 'matches', icon: '⚽', label: 'Partidas' },
    { id: 'competitions', icon: '🏟️', label: 'Competições' },
    { id: 'stats', icon: '📊', label: 'Estatísticas' },
    { group: 'Clube' },
    { id: 'transfers', icon: '🔄', label: 'Transferências' },
    { id: 'scouting', icon: '🔭', label: 'Observação' },
    { id: 'finances', icon: '💶', label: 'Finanças' },
    { id: 'board', icon: '🏛️', label: 'Diretoria' },
    { group: 'Legado' },
    { id: 'trophies', icon: '🏆', label: 'Sala de troféus' },
    { id: 'history', icon: '📜', label: 'História' },
    { id: 'manager', icon: '🧑‍💼', label: 'Treinador' },
    { id: 'journal', icon: '📓', label: 'Diário' },
    { group: 'Sistema' },
    { id: 'saves', icon: '💾', label: 'Saves e backup' },
  ];

  const App = (MC.App = { route: 'dashboard', params: [] });

  App.parseHash = function () {
    const h = (location.hash || '#/dashboard').replace(/^#\/?/, '');
    const [route, ...params] = h.split('/').map(decodeURIComponent);
    return { route: route || 'dashboard', params };
  };

  App.go = function (route, ...params) {
    const h = '#/' + [route, ...params].map(encodeURIComponent).join('/');
    if (location.hash === h) App.render();
    else location.hash = h;
  };

  App.commit = function (msg, type = 'success') {
    S.save();
    App.render();
    if (msg) UI.toast(msg, type);
  };

  App.applyTheme = function () {
    const c = S.career();
    const root = document.documentElement;
    const theme = S.state.settings.theme || 'dark';
    root.dataset.theme = theme;
    const accent = S.state.settings.accent || (c && c.club.colorA) || '#22c55e';
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--club-b', (c && c.club.colorB) || '#0f172a');
  };

  App.renderShell = function () {
    const c = S.career();
    const app = document.getElementById('app');
    if (!c) {
      app.className = 'welcome-mode';
      app.innerHTML = MC.Views.welcome.render();
      MC.Views.welcome.mount && MC.Views.welcome.mount(app);
      return false;
    }
    app.className = '';
    if (!document.getElementById('main')) {
      app.innerHTML = `
        <aside id="sidebar" class="sidebar">
          <div class="side-club" id="side-club"></div>
          <nav id="nav"></nav>
          <div class="side-foot">
            <button class="btn ghost sm block" data-act="switchCareer">🔁 Trocar carreira</button>
          </div>
        </aside>
        <div class="side-scrim" data-act="toggleNav"></div>
        <div class="main-wrap">
          <header class="topbar">
            <button class="icon-btn only-mobile" data-act="toggleNav" aria-label="Menu">☰</button>
            <div class="top-title" id="top-title"></div>
            <div class="top-meta" id="top-meta"></div>
            <button class="save-status" id="save-status" data-act="saveStatusClick"></button>
            <button class="btn primary sm" data-act="newMatch">＋ Partida</button>
          </header>
          <main id="main" class="main"></main>
        </div>`;
    }
    document.getElementById('side-club').innerHTML = `
      <a href="#/dashboard" class="side-club-in">
        ${UI.badge(c.club, 44)}
        <div><strong>${U.esc(c.club.name)}</strong><small>${U.esc(c.manager.name)} · ${U.seasonLabel(c.seasonYear)}</small></div>
      </a>`;
    const unread = (c.inbox || []).filter((m) => !m.read).length;
    document.getElementById('nav').innerHTML = NAV.map((n) =>
      n.group
        ? `<div class="nav-group">${n.group}</div>`
        : `<a href="#/${n.id}" class="nav-item ${App.route === n.id || (App.route === 'player' && n.id === 'squad') || (App.route === 'match' && n.id === 'matches') ? 'active' : ''}"><span class="nav-ico">${n.icon}</span><span>${n.label}</span>${n.id === 'inbox' && unread ? `<b class="pill">${unread}</b>` : ''}</a>`
    ).join('');
    document.getElementById('top-meta').innerHTML = `
      <span class="chip" title="Temporada">📅 ${U.seasonLabel(c.seasonYear)}</span>
      <button class="chip chip-btn" data-act="setGameDate" title="Data no jogo">🗓️ ${U.fmtDate(c.gameDate)}</button>
      <span class="chip hide-sm" title="Saldo">💶 ${U.money(c.finances.balance)}</span>`;
    UI.refreshSaveStatus();
    return true;
  };

  App.render = function () {
    const { route, params } = App.parseHash();
    App.route = route;
    App.params = params;
    App.applyTheme();
    if (!App.renderShell()) return;
    const c = S.career();
    const view = MC.Views[route] || MC.Views.dashboard;
    const main = document.getElementById('main');
    const tt = typeof view.title === 'function' ? view.title(c, params) : view.title;
    document.getElementById('top-title').innerHTML = `<h1>${U.esc(tt || '')}</h1>`;
    document.title = `${tt} · ${c.club.name} — Modo Carreira Manager`;
    try {
      main.innerHTML = view.render(c, params);
      view.mount && view.mount(main, c, params);
    } catch (e) {
      console.error(e);
      main.innerHTML = `<div class="card"><h3>Ops! Algo deu errado nesta tela.</h3><p class="muted">${U.esc(e.message)}</p><button class="btn" data-act="go" data-to="dashboard">Voltar para a Central</button></div>`;
    }
    document.body.classList.remove('nav-open');
    if (App._lastRoute !== route) { main.scrollTop = 0; window.scrollTo(0, 0); }
    App._lastRoute = route;
  };

  /* ---------------- Delegação de eventos ---------------- */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const fn = MC.A[el.dataset.act];
    if (fn) {
      e.preventDefault();
      try {
        const r = fn(el, e);
        if (r && r.catch) r.catch((err) => { console.error(err); if (err && err.name !== 'AbortError') UI.toast(err.message || String(err), 'error'); });
      } catch (err) {
        console.error(err);
        UI.toast(err.message || String(err), 'error');
      }
    }
  });
  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-change]');
    if (!el) return;
    const fn = MC.A[el.dataset.change];
    fn && fn(el, e);
  });
  document.addEventListener('input', (e) => {
    const el = e.target.closest('[data-input]');
    if (!el) return;
    const fn = MC.A[el.dataset.input];
    fn && fn(el, e);
  });

  /* ---------------- Ações globais ---------------- */
  const A = MC.A;
  A.go = (el) => App.go(el.dataset.to, ...(el.dataset.p ? [el.dataset.p] : []));
  A.toggleNav = () => document.body.classList.toggle('nav-open');
  A.switchCareer = () => {
    S.state.activeCareerId = null;
    S.persist();
    document.getElementById('app').innerHTML = '';
    App.render();
  };
  A.saveStatusClick = async () => {
    if (S.fileHandle && S.needsPermission) {
      const ok = await S.writeFile(true);
      UI.toast(ok ? 'Gravado no arquivo do PC!' : 'Permissão negada.', ok ? 'success' : 'error');
    } else App.go('saves');
  };
  A.setGameDate = async () => {
    const c = S.career();
    const m = UI.modal({
      title: 'Data no jogo', size: 'sm',
      body: `<p class="muted">Acompanhe a data do calendário do EA FC para manter notícias e registros sincronizados.</p>${UI.field('Data', `<input type="date" id="gd" value="${c.gameDate}">`)}`,
      actions: `<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="gd-ok">Salvar</button>`,
    });
    m.$('#gd-ok').onclick = () => { c.gameDate = m.$('#gd').value || c.gameDate; m.close(); App.commit('Data atualizada'); };
  };

  /* ---------------- Inicialização ---------------- */
  App.init = async function () {
    S.load();
    await S.restoreFileHandle();
    if (S.fileHandle) {
      const ok = await S.ensurePermission(false).catch(() => false);
      S.needsPermission = !ok;
    }
    window.addEventListener('hashchange', () => { UI.closeAll(); App.render(); });
    App.render();
    // Atalhos de teclado
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (S.fileHandle) S.writeFile(true).then((ok) => UI.toast(ok ? 'Salvo no PC!' : 'Não foi possível gravar no arquivo', ok ? 'success' : 'error'));
        else S.exportFile(false);
      }
    });
    // Service worker (offline) — só funciona em http(s)
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
    // Persistência mais forte no navegador
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  };

  document.addEventListener('DOMContentLoaded', App.init);
})(window);
