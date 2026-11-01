/* =========================================================
   Views: partidas, competições, tática, estatísticas
   ========================================================= */
(function (global) {
  'use strict';
  const MC = global.MC;
  const U = MC.U, UI = MC.UI, S = MC.Store, E = MC.Engine, A = MC.A;
  const V = MC.Views;
  const App = () => MC.App;

  /* =============== PARTIDAS =============== */
  const mState = { season: null, comp: '', tab: 'played' };

  V.matches = {
    title: 'Partidas',
    render(c) {
      const season = mState.season || c.seasonYear;
      const seasons = Array.from(new Set([c.seasonYear, ...c.matches.map((m) => m.season)])).sort((a, b) => b - a);
      const comps = c.competitions.filter((x) => x.season === season);
      let list = c.matches.filter((m) => m.season === season && (mState.tab === 'played' ? m.played : !m.played));
      if (mState.comp) list = list.filter((m) => m.compId === mState.comp);
      list.sort((a, b) => (mState.tab === 'played' ? (b.date || '').localeCompare(a.date || '') : (a.date || '').localeCompare(b.date || '')));
      const rec = E.record(c.matches.filter((m) => m.season === season && (!mState.comp || m.compId === mState.comp)));
      const home = E.record(c.matches.filter((m) => m.season === season && m.venue === 'C' && (!mState.comp || m.compId === mState.comp)));
      const away = E.record(c.matches.filter((m) => m.season === season && m.venue === 'F' && (!mState.comp || m.compId === mState.comp)));
      return `
      <div class="toolbar">
        <div class="tabs">
          <button class="tab ${mState.tab === 'played' ? 'on' : ''}" data-act="mTab" data-k="played">Resultados <small>${c.matches.filter((m) => m.season === season && m.played).length}</small></button>
          <button class="tab ${mState.tab === 'upcoming' ? 'on' : ''}" data-act="mTab" data-k="upcoming">Calendário <small>${c.matches.filter((m) => m.season === season && !m.played).length}</small></button>
        </div>
        <div class="row gap wrap">
          <select data-change="mSeason">${UI.options(seasons.map((y) => ({ v: y, l: 'Temporada ' + U.seasonLabel(y) })), season)}</select>
          <select data-change="mComp"><option value="">Todas as competições</option>${UI.options(comps.map((x) => ({ v: x.id, l: x.name })), mState.comp)}</select>
          <button class="btn" data-act="scheduleMatch">🗓️ Agendar</button>
          <button class="btn primary" data-act="newMatch">＋ Registrar partida</button>
        </div>
      </div>
      <div class="summary-strip">
        <div><small>Jogos</small><b>${rec.p}</b></div>
        <div><small>Vitórias</small><b class="good-txt">${rec.w}</b></div>
        <div><small>Empates</small><b>${rec.d}</b></div>
        <div><small>Derrotas</small><b class="bad-txt">${rec.l}</b></div>
        <div><small>Gols</small><b>${rec.gf}:${rec.ga}</b></div>
        <div><small>Aproveitamento</small><b>${rec.p ? Math.round(((rec.w * 3 + rec.d) / (rec.p * 3)) * 100) : 0}%</b></div>
        <div class="hide-sm"><small>Casa / Fora</small><b>${home.w}-${home.d}-${home.l} / ${away.w}-${away.d}-${away.l}</b></div>
      </div>
      ${!list.length ? UI.empty(mState.tab === 'played' ? '⚽' : '🗓️', mState.tab === 'played' ? 'Nenhum resultado registrado' : 'Calendário vazio', mState.tab === 'played' ? 'Depois de cada jogo no EA FC, registre o placar, escalação, gols e notas. As estatísticas, notícias e o clima do clube se atualizam sozinhos.' : 'Agende os próximos jogos para acompanhar o calendário e preparar coletivas.', `<button class="btn primary" data-act="${mState.tab === 'played' ? 'newMatch' : 'scheduleMatch'}">${mState.tab === 'played' ? 'Registrar partida' : 'Agendar jogo'}</button>`) : `
      <div class="match-list">
        ${list.map((m) => {
          const comp = E.comp(c, m.compId);
          const r = E.result(m);
          const scorers = {};
          m.goals.forEach((g) => { if (g.pid && !g.og) scorers[g.pid] = (scorers[g.pid] || 0) + 1; });
          const sc = Object.entries(scorers).map(([id, n]) => { const p = E.player(c, id); return p ? U.esc(p.name.split(' ').slice(-1)[0]) + (n > 1 ? ` ×${n}` : '') : ''; }).filter(Boolean).join(', ');
          return `<div class="match-row ${r ? 'r-' + r : 'upcoming'}">
            <a class="mr-main" href="${m.played ? '#/match/' + m.id : '#'}" ${m.played ? '' : `data-act="playMatch" data-id="${m.id}"`}>
              <div class="mr-date"><b>${U.fmtDate(m.date)}</b><small>${U.esc(comp ? comp.name : m.compName || '—')}${m.round ? ' · ' + U.esc(m.round) : ''}</small></div>
              <div class="mr-score">
                <span class="mr-venue">${m.venue === 'F' ? 'F' : m.venue === 'N' ? 'N' : 'C'}</span>
                <span class="mr-opp">${E.isRival(c, m.opponent) ? '⚔️ ' : ''}${U.esc(m.opponent)}</span>
                ${m.played ? `<b class="mr-res">${m.gf} - ${m.ga}${m.pens && m.pens.gf != null && m.gf === m.ga ? ` <small>(${m.pens.gf}-${m.pens.ga} p)</small>` : ''}</b>${UI.res(r)}` : '<span class="tag">A jogar</span>'}
              </div>
              <div class="mr-extra muted">${sc ? '⚽ ' + sc : ''}${m.motm && E.player(c, m.motm) ? ` · ⭐ ${U.esc(E.player(c, m.motm).name)}` : ''}</div>
            </a>
            <div class="mr-actions">
              ${m.played ? '' : `<button class="btn sm primary" data-act="playMatch" data-id="${m.id}">Resultado</button>`}
              <button class="icon-btn" data-act="editMatch" data-id="${m.id}" title="Editar">✏️</button>
              <button class="icon-btn" data-act="deleteMatch" data-id="${m.id}" title="Excluir">🗑️</button>
            </div>
          </div>`;
        }).join('')}
      </div>`}`;
    },
  };
  A.mTab = (el) => { mState.tab = el.dataset.k; App().render(); };
  A.mSeason = (el) => { mState.season = Number(el.value); mState.comp = ''; App().render(); };
  A.mComp = (el) => { mState.comp = el.value; App().render(); };

  A.deleteMatch = async (el) => {
    if (!(await UI.confirm('Excluir esta partida? As estatísticas e efeitos serão revertidos.', { danger: true, ok: 'Excluir' }))) return;
    E.deleteMatch(S.career(), el.dataset.id);
    App().commit('Partida excluída');
    if (App().route === 'match') App().go('matches');
  };

  function opponentsList(c) {
    const set = new Set();
    c.competitions.forEach((x) => (x.table || []).forEach((t) => !t.isUser && set.add(t.name)));
    c.matches.forEach((m) => set.add(m.opponent));
    return Array.from(set).filter(Boolean).sort();
  }

  /* -------- Agendar -------- */
  A.scheduleMatch = () => {
    const c = S.career();
    const comps = c.competitions.filter((x) => x.season === c.seasonYear);
    const m = UI.modal({
      title: 'Agendar partidas', size: 'md',
      body: `<form id="sm" class="grid-2">
        ${UI.field('Competição', `<select name="compId">${UI.options(comps.map((x) => ({ v: x.id, l: x.name })))}<option value="__amistoso">Amistoso</option></select>`)}
        ${UI.field('Rodada / fase', '<input name="round" placeholder="Rodada 1">')}
        ${UI.field('Data', `<input type="date" name="date" value="${c.gameDate}">`)}
        ${UI.field('Local', `<select name="venue">${UI.options([{ v: 'C', l: 'Casa' }, { v: 'F', l: 'Fora' }, { v: 'N', l: 'Neutro' }])}</select>`)}
        ${UI.field('Adversário(s) — um por linha agenda vários jogos semanais', `<textarea name="opps" rows="5" list="opps"></textarea>`, 'span-2')}
      </form><p class="hint">Times conhecidos: ${opponentsList(c).slice(0, 25).map(U.esc).join(', ') || '—'}</p>`,
      actions: `<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="sm-ok">Agendar</button>`,
    });
    m.$('#sm-ok').onclick = () => {
      const f = UI.formData(m.$('#sm'));
      const opps = f.opps.split('\n').map((s) => s.trim()).filter(Boolean);
      if (!opps.length) return UI.toast('Informe ao menos um adversário', 'error');
      let compId = f.compId;
      if (compId === '__amistoso') compId = ensureFriendly(c).id;
      const base = new Date((f.date || c.gameDate) + 'T12:00:00');
      const roundNum = parseInt((f.round.match(/\d+/) || [])[0], 10);
      opps.forEach((o, i) => {
        const d = new Date(base.getTime() + i * 7 * 864e5);
        c.matches.push({
          id: U.uid('m_'), season: c.seasonYear, date: d.toISOString().slice(0, 10), compId, opponent: o,
          round: opps.length > 1 && roundNum ? f.round.replace(/\d+/, roundNum + i) : f.round,
          venue: opps.length > 1 ? (i % 2 ? (f.venue === 'C' ? 'F' : 'C') : f.venue) : f.venue,
          played: false, gf: 0, ga: 0, lineup: [], subs: [], goals: [], ratings: {}, yellows: [], reds: [], injuries: [], stats: {}, createdAt: new Date().toISOString(),
        });
      });
      m.close();
      App().commit(`${opps.length} jogo(s) agendado(s)`);
    };
  };

  function ensureFriendly(c) {
    let f = c.competitions.find((x) => x.season === c.seasonYear && x.type === 'amistoso');
    if (!f) { f = E.newCompetition(c, { name: 'Amistosos', type: 'amistoso' }); c.competitions.push(f); }
    return f;
  }

  /* -------- Formulário de partida -------- */
  A.newMatch = () => openMatchForm(null);
  A.playMatch = (el) => openMatchForm(el.dataset.id, true);
  A.editMatch = (el) => openMatchForm(el.dataset.id);

  function openMatchForm(id, markPlayed) {
    const c = S.career();
    const orig = id ? c.matches.find((x) => x.id === id) : null;
    const m = orig
      ? U.deepClone(orig)
      : { season: c.seasonYear, date: c.gameDate, compId: '', round: '', opponent: '', venue: 'C', gf: 0, ga: 0, played: true, lineup: [], subs: [], goals: [], ratings: {}, yellows: [], reds: [], injuries: [], stats: {}, notes: '', motm: '' };
    if (markPlayed) m.played = true;
    if (!m.lineup.length && m.played) {
      const xi = Object.values(c.tactics.slots).filter((pid) => { const p = E.player(c, pid); return p && p.status === 'elenco' && !p.injury.active; });
      m.lineup = xi;
    }
    const comps = c.competitions.filter((x) => x.season === m.season);
    if (!m.compId && comps[0]) m.compId = comps[0].id;
    const pool = E.sortPlayers(c.players.filter((p) => p.status === 'elenco' || m.lineup.includes(p.id) || m.subs.includes(p.id)));

    const modal = UI.modal({
      title: orig ? (orig.played ? 'Editar partida' : `Resultado vs ${U.esc(orig.opponent)}`) : 'Registrar partida',
      size: 'xl',
      body: `
      <form id="mf" autocomplete="off">
        <div class="grid-4">
          ${UI.field('Competição', `<select name="compId">${UI.options(comps.map((x) => ({ v: x.id, l: x.name })), m.compId)}<option value="__amistoso" ${!comps.length ? 'selected' : ''}>Amistoso</option><option value="__new">＋ Nova competição…</option></select>`)}
          ${UI.field('Rodada / fase', `<input name="round" value="${U.esc(m.round || '')}" placeholder="Rodada 5 / Semifinal">`)}
          ${UI.field('Data', `<input type="date" name="date" value="${U.esc(m.date || c.gameDate)}">`)}
          ${UI.field('Local', `<select name="venue">${UI.options([{ v: 'C', l: '🏠 Casa' }, { v: 'F', l: '✈️ Fora' }, { v: 'N', l: '⚖️ Neutro' }], m.venue)}</select>`)}
        </div>
        <div class="score-box">
          <div class="sb-team">${UI.badge(c.club, 48)}<b>${U.esc(c.club.name)}</b></div>
          <input class="sb-goal" type="number" min="0" max="30" name="gf" value="${m.gf}">
          <span class="sb-x">×</span>
          <input class="sb-goal" type="number" min="0" max="30" name="ga" value="${m.ga}">
          <div class="sb-team"><input name="opponent" list="mf-opps" value="${U.esc(m.opponent)}" placeholder="Adversário*" required><datalist id="mf-opps">${opponentsList(c).map((o) => `<option value="${U.esc(o)}">`).join('')}</datalist></div>
        </div>
        <div class="row gap wrap center">
          <label class="check"><input type="checkbox" name="played" ${m.played ? 'checked' : ''}> Partida já disputada</label>
          <label class="check"><input type="checkbox" id="mf-haspens" ${m.pens && m.pens.gf != null ? 'checked' : ''}> Decidida nos pênaltis</label>
          <span id="mf-pens" class="${m.pens && m.pens.gf != null ? '' : 'hidden'}">Pênaltis: <input type="number" class="mini" name="pgf" min="0" value="${m.pens ? m.pens.gf ?? '' : ''}"> × <input type="number" class="mini" name="pga" min="0" value="${m.pens ? m.pens.ga ?? '' : ''}"></span>
        </div>

        <div id="mf-played">
        <h4 class="sec">Escalação e desempenho <small class="muted" id="mf-count"></small></h4>
        <div class="row gap wrap"><button type="button" class="btn sm" id="mf-xi">Usar XI da tática</button><button type="button" class="btn sm ghost" id="mf-clear">Limpar</button><button type="button" class="btn sm ghost" id="mf-autor">Notas automáticas (6,5)</button></div>
        <div class="table-wrap lineup-wrap">
          <table class="tbl compact lineup-tbl">
            <thead><tr><th>Jogador</th><th>Participação</th><th class="num">Nota</th><th title="Amarelo">🟨</th><th title="Vermelho">🟥</th><th title="Lesão">🚑</th></tr></thead>
            <tbody>
            ${pool.map((p) => {
              const role = m.lineup.includes(p.id) ? 'T' : m.subs.includes(p.id) ? 'R' : '';
              return `<tr data-pid="${p.id}" class="${role ? 'in' : ''}">
                <td>${UI.pos(p.pos)} ${U.esc(p.name)} <small class="muted">${p.ovr}</small>${p.injury.active ? ' 🚑' : ''}</td>
                <td><div class="seg sm part">${[['', '—'], ['T', 'Titular'], ['R', 'Entrou']].map(([k, l]) => `<button type="button" data-role="${k}" class="${role === k ? 'on' : ''}">${l}</button>`).join('')}</div></td>
                <td class="num"><input type="number" class="mini rt" step="0.1" min="1" max="10" value="${m.ratings[p.id] || ''}"></td>
                <td><input type="checkbox" class="yc" ${m.yellows.includes(p.id) ? 'checked' : ''}></td>
                <td><input type="checkbox" class="rc" ${m.reds.includes(p.id) ? 'checked' : ''}></td>
                <td><input type="checkbox" class="ic" ${m.injuries.includes(p.id) ? 'checked' : ''}></td>
              </tr>`;
            }).join('')}
            </tbody>
          </table>
        </div>

        <h4 class="sec">Gols do ${U.esc(c.club.short || c.club.name)}</h4>
        <div id="mf-goals"></div>

        <div class="grid-4">
          ${UI.field('Melhor em campo', `<select name="motm" id="mf-motm"></select>`)}
          ${UI.field('Posse (%)', `<input type="number" name="possession" min="0" max="100" value="${m.stats.possession || ''}">`)}
          ${UI.field('Finalizações (nós × eles)', `<div class="row gap"><input type="number" class="mini" name="shots" value="${m.stats.shots ?? ''}"> × <input type="number" class="mini" name="shotsOpp" value="${m.stats.shotsOpp ?? ''}"></div>`)}
          ${UI.field('xG (nós × eles)', `<div class="row gap"><input type="number" step="0.1" class="mini" name="xg" value="${m.stats.xg ?? ''}"> × <input type="number" step="0.1" class="mini" name="xgOpp" value="${m.stats.xgOpp ?? ''}"></div>`)}
        </div>
        </div>
        ${UI.field('Notas da partida / análise', `<textarea name="notes" rows="2" placeholder="Como foi o jogo? Momentos marcantes, decisões táticas…">${U.esc(m.notes || '')}</textarea>`)}
      </form>`,
      actions: `<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="mf-ok">Salvar partida</button>`,
    });

    const $ = (s) => modal.$(s);
    const form = $('#mf');
    const rows = () => modal.$$('.lineup-tbl tbody tr');
    const participants = () => rows().filter((r) => r.querySelector('.part .on') && r.querySelector('.part .on').dataset.role);
    const pname = (id) => { const p = E.player(c, id); return p ? p.name : '?'; };

    function updateCount() {
      const t = rows().filter((r) => r.querySelector('.part .on[data-role="T"]')).length;
      const s = rows().filter((r) => r.querySelector('.part .on[data-role="R"]')).length;
      $('#mf-count').textContent = `${t}/11 titulares · ${s} reservas utilizados`;
      $('#mf-count').className = t === 11 ? 'good-txt' : 'muted';
      // MOTM options
      const cur = $('#mf-motm').value || m.motm;
      const parts = participants().map((r) => r.dataset.pid);
      $('#mf-motm').innerHTML = `<option value="">—</option>` + parts.map((id) => `<option value="${id}" ${id === cur ? 'selected' : ''}>${U.esc(pname(id))}</option>`).join('');
      renderGoals();
    }

    function renderGoals() {
      const gf = U.clamp(U.num(form.gf.value, 0), 0, 30);
      // sincroniza quantidade
      while (m.goals.length < gf) m.goals.push({ pid: '', assist: '', minute: '' });
      if (m.goals.length > gf) m.goals.length = gf;
      const parts = participants().map((r) => r.dataset.pid);
      const opts = (sel, withOg) => `<option value="">—</option>${withOg ? `<option value="__og" ${sel === '__og' ? 'selected' : ''}>Gol contra (adversário)</option>` : ''}${(parts.length ? parts : pool.map((p) => p.id)).map((id) => `<option value="${id}" ${id === sel ? 'selected' : ''}>${U.esc(pname(id))}</option>`).join('')}`;
      $('#mf-goals').innerHTML = gf ? m.goals.map((g, i) => `
        <div class="goal-row" data-i="${i}">
          <span class="goal-n">⚽ ${i + 1}</span>
          <select class="g-pid">${opts(g.og ? '__og' : g.pid, true)}</select>
          <select class="g-ast"><option value="">Sem assistência</option>${(parts.length ? parts : pool.map((p) => p.id)).map((id) => `<option value="${id}" ${id === g.assist ? 'selected' : ''}>🅰️ ${U.esc(pname(id))}</option>`).join('')}</select>
          <input class="mini g-min" type="number" min="1" max="130" placeholder="min" value="${g.minute || ''}">
          <select class="g-type">${UI.options([{ v: '', l: 'Normal' }, { v: 'pen', l: 'Pênalti' }, { v: 'fk', l: 'Falta' }, { v: 'head', l: 'Cabeça' }, { v: 'long', l: 'De longe' }], g.type || '')}</select>
        </div>`).join('') : '<p class="muted">Sem gols marcados.</p>';
      modal.$$('.goal-row').forEach((row) => {
        const i = Number(row.dataset.i);
        row.querySelector('.g-pid').onchange = (e) => { const v = e.target.value; m.goals[i].og = v === '__og'; m.goals[i].pid = v === '__og' ? '' : v; };
        row.querySelector('.g-ast').onchange = (e) => (m.goals[i].assist = e.target.value);
        row.querySelector('.g-min').oninput = (e) => (m.goals[i].minute = e.target.value);
        row.querySelector('.g-type').onchange = (e) => (m.goals[i].type = e.target.value);
      });
    }

    modal.root.addEventListener('click', (e) => {
      const b = e.target.closest('.part button');
      if (!b) return;
      const seg = b.parentElement;
      seg.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      const tr = b.closest('tr');
      tr.classList.toggle('in', !!b.dataset.role);
      if (b.dataset.role && !tr.querySelector('.rt').value) tr.querySelector('.rt').placeholder = '6.5';
      updateCount();
    });
    form.gf.addEventListener('input', renderGoals);
    $('#mf-haspens').onchange = (e) => $('#mf-pens').classList.toggle('hidden', !e.target.checked);
    form.played.onchange = () => $('#mf-played').classList.toggle('hidden', !form.played.checked);
    $('#mf-played').classList.toggle('hidden', !m.played);
    form.compId.onchange = async () => {
      if (form.compId.value === '__new') {
        const name = await UI.prompt('Nome da competição', '', { title: 'Nova competição' });
        if (name) {
          const nc = E.newCompetition(c, { name, type: /liga|league|série|serie|division/i.test(name) ? 'liga' : 'copa', season: m.season });
          c.competitions.push(nc);
          form.compId.insertAdjacentHTML('afterbegin', `<option value="${nc.id}">${U.esc(name)}</option>`);
          form.compId.value = nc.id;
        } else form.compId.selectedIndex = 0;
      }
    };
    $('#mf-xi').onclick = () => {
      const xi = Object.values(c.tactics.slots);
      rows().forEach((r) => {
        const role = xi.includes(r.dataset.pid) ? 'T' : '';
        r.querySelectorAll('.part button').forEach((x) => x.classList.toggle('on', x.dataset.role === role));
        r.classList.toggle('in', !!role);
      });
      updateCount();
    };
    $('#mf-clear').onclick = () => {
      rows().forEach((r) => { r.querySelectorAll('.part button').forEach((x) => x.classList.toggle('on', x.dataset.role === '')); r.classList.remove('in'); });
      updateCount();
    };
    $('#mf-autor').onclick = () => participants().forEach((r) => { const i = r.querySelector('.rt'); if (!i.value) i.value = '6.5'; });
    updateCount();

    $('#mf-ok').onclick = () => {
      const f = UI.formData(form);
      if (!f.opponent.trim()) { form.opponent.focus(); return UI.toast('Informe o adversário', 'error'); }
      let compId = f.compId;
      if (compId === '__amistoso' || compId === '__new' || !compId) compId = ensureFriendly(c).id;
      const out = Object.assign({}, m, {
        compId, round: f.round, date: f.date || c.gameDate, venue: f.venue, opponent: f.opponent.trim(),
        gf: U.clamp(U.num(f.gf), 0, 99), ga: U.clamp(U.num(f.ga), 0, 99), played: f.played, notes: f.notes,
        pens: $('#mf-haspens').checked && f.pgf !== '' ? { gf: U.num(f.pgf), ga: U.num(f.pga) } : null,
      });
      if (out.played) {
        out.lineup = []; out.subs = []; out.ratings = {}; out.yellows = []; out.reds = []; out.injuries = [];
        rows().forEach((r) => {
          const pid = r.dataset.pid;
          const on = r.querySelector('.part .on');
          const role = on ? on.dataset.role : '';
          if (role === 'T') out.lineup.push(pid);
          if (role === 'R') out.subs.push(pid);
          if (role) {
            const rt = U.num(r.querySelector('.rt').value, 0);
            if (rt) out.ratings[pid] = U.clamp(rt, 1, 10);
            if (r.querySelector('.yc').checked) out.yellows.push(pid);
            if (r.querySelector('.rc').checked) out.reds.push(pid);
            if (r.querySelector('.ic').checked) out.injuries.push(pid);
          }
        });
        out.goals = m.goals.filter((g) => g.pid || g.og).map((g) => ({ pid: g.og ? '' : g.pid, og: !!g.og, assist: g.og ? '' : g.assist || '', minute: g.minute ? U.num(g.minute) : '', type: g.type || '' }));
        out.motm = f.motm || '';
        if (!out.motm) {
          const best = Object.entries(out.ratings).sort((a, b) => b[1] - a[1])[0];
          if (best) out.motm = best[0];
        }
        out.stats = { possession: f.possession ? U.num(f.possession) : '', shots: f.shots === '' ? '' : U.num(f.shots), shotsOpp: f.shotsOpp === '' ? '' : U.num(f.shotsOpp), xg: f.xg === '' ? '' : U.num(f.xg), xgOpp: f.xgOpp === '' ? '' : U.num(f.xgOpp) };
      }
      if (orig) { out._wasPlayed = orig.played; out._prev = orig; }
      E.saveMatch(c, out, !orig);
      modal.close();
      const res = E.result(out);
      App().commit(out.played ? (res === 'V' ? 'Vitória registrada! 🎉' : res === 'D' ? 'Derrota registrada' : 'Empate registrado') : 'Partida salva');
      if (out.played && !orig?.played) setTimeout(() => offerPostMatch(c, out), 350);
    };
  }

  function offerPostMatch(c, m) {
    const res = E.result(m);
    const md = UI.modal({
      title: 'Pós-jogo', size: 'sm',
      body: `<div class="center-txt"><div class="big-res res-${res}">${m.gf} × ${m.ga}</div><p>${res === 'V' ? 'Vitória! O vestiário está em festa.' : res === 'D' ? 'Derrota dura. A imprensa aguarda suas palavras.' : 'Empate. Hora de analisar o que faltou.'}</p></div>`,
      actions: `<button class="btn ghost" data-close>Fechar</button><a class="btn" href="#/match/${m.id}" data-close>Ver súmula</a><button class="btn primary" id="pm-press">🎙️ Coletiva</button>`,
    });
    md.$('#pm-press').onclick = () => { md.close(); A.pressConference(); };
  }

  /* -------- Súmula da partida -------- */
  V.match = {
    title: 'Súmula',
    render(c, [id]) {
      const m = c.matches.find((x) => x.id === id);
      if (!m) return UI.empty('🤷', 'Partida não encontrada', '', '<a class="btn" href="#/matches">Voltar</a>');
      const comp = E.comp(c, m.compId);
      const r = E.result(m);
      const pl = (pid) => E.player(c, pid);
      const row = (pid, sub) => {
        const p = pl(pid);
        if (!p) return '';
        const g = m.goals.filter((x) => x.pid === pid && !x.og).length;
        const a = m.goals.filter((x) => x.assist === pid).length;
        return `<tr><td>${UI.pos(p.pos)}</td><td><a href="#/player/${p.id}">${U.esc(p.name)}</a>${sub ? ' <small class="muted">(entrou)</small>' : ''}</td><td>${'⚽'.repeat(g)}${'🅰️'.repeat(a)}${m.yellows.includes(pid) ? '🟨' : ''}${m.reds.includes(pid) ? '🟥' : ''}${m.injuries.includes(pid) ? '🚑' : ''}${m.motm === pid ? '⭐' : ''}</td><td class="num">${UI.rating(m.ratings[pid])}</td></tr>`;
      };
      const st = m.stats || {};
      const bar = (l, a, b, fmt = (x) => x) => (a === '' || a == null || b === '' || b == null ? '' : `<div class="cmp-bar"><span>${fmt(a)}</span><div><small>${l}</small><div class="cb"><i style="width:${(a / (a + b || 1)) * 100}%"></i></div></div><span>${fmt(b)}</span></div>`);
      const home = m.venue !== 'F';
      return `
      <div class="match-hero res-bg-${r}">
        <small>${U.esc(comp ? comp.name : '')}${m.round ? ' · ' + U.esc(m.round) : ''} · ${U.fmtDate(m.date)} · ${m.venue === 'F' ? 'Fora' : m.venue === 'N' ? 'Campo neutro' : U.esc(c.club.stadium || 'Casa')}</small>
        <div class="mh-score">
          <div class="mh-team">${home ? UI.badge(c.club, 64) : UI.avatar(m.opponent, '#64748b', 64)}<b>${U.esc(home ? c.club.name : m.opponent)}</b></div>
          <div class="mh-num">${home ? m.gf : m.ga}<span>–</span>${home ? m.ga : m.gf}${m.pens && m.pens.gf != null && m.gf === m.ga ? `<small>Pênaltis ${home ? m.pens.gf : m.pens.ga}–${home ? m.pens.ga : m.pens.gf}</small>` : ''}</div>
          <div class="mh-team">${home ? UI.avatar(m.opponent, '#64748b', 64) : UI.badge(c.club, 64)}<b>${U.esc(home ? m.opponent : c.club.name)}</b></div>
        </div>
        <div class="mh-goals">${m.goals.slice().sort((a, b) => (a.minute || 99) - (b.minute || 99)).map((g) => `<span>⚽ ${g.og ? 'Gol contra' : U.esc((pl(g.pid) || {}).name || '?')}${g.minute ? ` ${g.minute}'` : ''}${g.type === 'pen' ? ' (pên.)' : ''}${g.assist && pl(g.assist) ? ` <small>(${U.esc(pl(g.assist).name)})</small>` : ''}</span>`).join('')}</div>
        <div class="row gap center"><button class="btn sm" data-act="editMatch" data-id="${m.id}">✏️ Editar</button><button class="btn sm" data-act="shareMatch" data-id="${m.id}">📸 Card do resultado</button><button class="btn sm ghost" data-act="deleteMatch" data-id="${m.id}">🗑️</button></div>
      </div>
      <div class="grid-2">
        <div class="card">
          <div class="card-head"><h3>Escalação</h3></div>
          <div class="table-wrap"><table class="tbl compact"><tbody>${m.lineup.map((p) => row(p)).join('')}${m.subs.map((p) => row(p, true)).join('')}</tbody></table></div>
          ${!m.lineup.length ? '<p class="muted">Escalação não registrada.</p>' : ''}
        </div>
        <div class="card">
          <div class="card-head"><h3>Estatísticas</h3></div>
          ${bar('Posse de bola', st.possession, st.possession !== '' && st.possession != null ? 100 - st.possession : '', (x) => x + '%')}
          ${bar('Finalizações', st.shots, st.shotsOpp)}
          ${bar('xG', st.xg, st.xgOpp, (x) => Number(x).toFixed(1))}
          ${!st.possession && st.shots === '' ? '<p class="muted">Sem estatísticas registradas.</p>' : ''}
          ${m.notes ? `<h4 class="mt">Análise</h4><p class="prewrap">${U.esc(m.notes)}</p>` : ''}
        </div>
      </div>`;
    },
  };

  /* -------- Card de resultado (imagem para compartilhar) -------- */
  A.shareMatch = (el) => {
    const c = S.career();
    const m = c.matches.find((x) => x.id === el.dataset.id);
    const comp = E.comp(c, m.compId);
    const cv = document.createElement('canvas');
    cv.width = 1080; cv.height = 1080;
    const g = cv.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 1080, 1080);
    grd.addColorStop(0, c.club.colorB || '#0f172a');
    grd.addColorStop(1, c.club.colorA || '#22c55e');
    g.fillStyle = grd; g.fillRect(0, 0, 1080, 1080);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(60, 60, 960, 960);
    g.fillStyle = '#fff'; g.textAlign = 'center';
    g.font = '600 38px system-ui, sans-serif';
    g.fillText(((comp ? comp.name : '') + (m.round ? ' · ' + m.round : '')).toUpperCase(), 540, 170);
    g.font = '400 30px system-ui, sans-serif'; g.globalAlpha = 0.8;
    g.fillText(U.fmtDate(m.date), 540, 220); g.globalAlpha = 1;
    const res = E.result(m);
    g.font = '800 70px system-ui, sans-serif';
    g.fillText(res === 'V' ? 'VITÓRIA' : res === 'D' ? 'DERROTA' : 'EMPATE', 540, 340);
    const home = m.venue !== 'F';
    g.font = '900 260px system-ui, sans-serif';
    g.fillText(`${home ? m.gf : m.ga} - ${home ? m.ga : m.gf}`, 540, 620);
    g.font = '700 46px system-ui, sans-serif';
    g.textAlign = 'left'; g.fillText((home ? c.club.name : m.opponent).slice(0, 18), 110, 730);
    g.textAlign = 'right'; g.fillText((home ? m.opponent : c.club.name).slice(0, 18), 970, 730);
    g.textAlign = 'center'; g.font = '400 34px system-ui, sans-serif';
    const sc = m.goals.filter((x) => x.pid || x.og).map((x) => (x.og ? 'GC' : (E.player(c, x.pid) || {}).name || '?') + (x.minute ? ` ${x.minute}'` : ''));
    for (let i = 0; i < Math.min(sc.length, 5); i++) g.fillText('⚽ ' + sc[i], 540, 810 + i * 44);
    if (m.motm && E.player(c, m.motm)) { g.font = '600 32px system-ui, sans-serif'; g.fillText('⭐ Melhor em campo: ' + E.player(c, m.motm).name, 540, 1000 - 20); }
    cv.toBlob((b) => U.download(`resultado-${U.slug(m.opponent)}-${m.date}.png`, b, 'image/png'));
  };

  /* =============== COMPETIÇÕES =============== */
  const cState = { season: null };
  V.competitions = {
    title: 'Competições',
    render(c) {
      const season = cState.season || c.seasonYear;
      const seasons = Array.from(new Set([c.seasonYear, ...c.competitions.map((x) => x.season)])).sort((a, b) => b - a);
      const comps = c.competitions.filter((x) => x.season === season);
      return `
      <div class="toolbar">
        <select data-change="cSeason">${UI.options(seasons.map((y) => ({ v: y, l: 'Temporada ' + U.seasonLabel(y) })), season)}</select>
        <button class="btn primary" data-act="editComp">＋ Competição</button>
      </div>
      ${!comps.length ? UI.empty('🏟️', 'Nenhuma competição', 'Adicione a liga, copas e torneios continentais que você disputa.') : comps.map((x) => {
        const rec = E.record(c.matches.filter((m) => m.compId === x.id));
        const table = x.type === 'liga' ? E.leagueTable(c, x) : [];
        const pts = x.type === 'liga' ? E.cumulativePoints(c, x) : [];
        return `<div class="card comp-card">
          <div class="card-head">
            <h3>${x.type === 'liga' ? '🏟️' : x.type === 'continental' ? '🌍' : x.type === 'amistoso' ? '🤝' : '🏆'} ${U.esc(x.name)} <small class="tag">${U.esc(E.COMP_TYPES[x.type] || x.type)}</small> <small class="tag ${x.status === 'Campeão' ? 'gold' : x.status === 'Eliminado' ? 'hot' : ''}">${U.esc(x.status)}${x.stage ? ' · ' + U.esc(x.stage) : ''}</small></h3>
            <div class="row gap">
              ${x.type === 'liga' && x.table.length > 2 ? `<button class="btn sm" data-act="simRound" data-id="${x.id}" title="Simula resultados aleatórios entre os outros times">🎲 Simular rodada dos rivais</button><button class="btn sm" data-act="editTable" data-id="${x.id}">✏️ Editar tabela</button>` : ''}
              ${x.status !== 'Campeão' && season === c.seasonYear ? `<button class="btn sm primary" data-act="winComp" data-id="${x.id}">🏆 Campeão!</button>` : ''}
              <button class="icon-btn" data-act="editComp" data-id="${x.id}" title="Editar">⚙️</button>
            </div>
          </div>
          <p class="muted">${rec.p} jogos · ${rec.w}V ${rec.d}E ${rec.l}D · ${rec.gf} gols marcados, ${rec.ga} sofridos</p>
          ${x.type === 'liga' ? (table.length > 1 ? `
            <div class="table-wrap"><table class="tbl compact league">
              <thead><tr><th class="num">#</th><th>Clube</th><th class="num">P</th><th class="num">J</th><th class="num">V</th><th class="num">E</th><th class="num">D</th><th class="num hide-sm">GP</th><th class="num hide-sm">GC</th><th class="num">SG</th></tr></thead>
              <tbody>${table.map((t, i) => `<tr class="${t.isUser ? 'me' : ''} ${i < (x.zones?.top ?? 4) ? 'zone-top' : ''} ${i >= table.length - (x.zones?.bottom ?? 3) && table.length > 8 ? 'zone-bottom' : ''}"><td class="num">${t.pos}</td><td>${U.esc(t.name)}</td><td class="num"><b>${t.pts}</b></td><td class="num">${t.p}</td><td class="num">${t.w}</td><td class="num">${t.d}</td><td class="num">${t.l}</td><td class="num hide-sm">${t.gf}</td><td class="num hide-sm">${t.ga}</td><td class="num">${t.gd > 0 ? '+' : ''}${t.gd}</td></tr>`).join('')}</tbody>
            </table></div>
            ${pts.length > 1 ? `<h4 class="mt">Pontos acumulados</h4>${UI.lineChart([{ name: 'Pontos', color: 'var(--accent)', points: pts, area: true }], { height: 150, yMin: 0 })}` : ''}
          ` : `<p class="muted">Adicione os outros clubes da liga em ⚙️ para acompanhar a tabela.</p>`) : ''}
          ${x.notes ? `<p class="prewrap muted">${U.esc(x.notes)}</p>` : ''}
        </div>`;
      }).join('')}`;
    },
  };
  A.cSeason = (el) => { cState.season = Number(el.value); App().render(); };

  A.editComp = (el) => {
    const c = S.career();
    const x = el && el.dataset.id ? E.comp(c, el.dataset.id) : null;
    const d = x || { name: '', type: 'copa', status: 'Em andamento', stage: '', notes: '', table: [] };
    const m = UI.modal({
      title: x ? `Editar ${U.esc(x.name)}` : 'Nova competição', size: 'md',
      body: `<form id="cf" class="grid-2">
        ${UI.field('Nome', `<input name="name" value="${U.esc(d.name)}" required>`)}
        ${UI.field('Tipo', `<select name="type">${UI.options(Object.entries(E.COMP_TYPES).map(([v, l]) => ({ v, l })), d.type)}</select>`)}
        ${UI.field('Situação', `<select name="status">${UI.options(E.COMP_STATUS, d.status)}</select>`)}
        ${UI.field('Fase atual / observação', `<input name="stage" value="${U.esc(d.stage || '')}" placeholder="Quartas de final">`)}
        ${UI.field('Posição final (liga)', `<input type="number" name="finalPos" value="${d.finalPos || ''}" placeholder="auto">`)}
        ${UI.field('Zonas (classif. / rebaixamento)', `<div class="row gap"><input class="mini" type="number" name="ztop" value="${d.zones?.top ?? 4}"> / <input class="mini" type="number" name="zbot" value="${d.zones?.bottom ?? 3}"></div>`)}
        ${UI.field('Clubes participantes (liga) — um por linha', `<textarea name="teams" rows="6">${U.esc((d.table || []).filter((t) => !t.isUser).map((t) => t.name).join('\n'))}</textarea>`, 'span-2')}
        ${UI.field('Notas', `<textarea name="notes" rows="2">${U.esc(d.notes || '')}</textarea>`, 'span-2')}
      </form>`,
      actions: `${x ? '<button class="btn danger ghost" id="cf-del">Excluir</button>' : ''}<span class="grow"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="cf-ok">Salvar</button>`,
    });
    m.$('#cf-ok').onclick = () => {
      const f = UI.formData(m.$('#cf'));
      if (!f.name.trim()) return UI.toast('Informe o nome', 'error');
      const comp = x || E.newCompetition(c, { name: f.name, type: f.type, season: cState.season || c.seasonYear });
      Object.assign(comp, { name: f.name.trim(), type: f.type, status: f.status, stage: f.stage, notes: f.notes, finalPos: f.finalPos ? U.num(f.finalPos) : '', zones: { top: U.num(f.ztop, 4), bottom: U.num(f.zbot, 3) } });
      if (comp.type === 'liga') {
        if (!comp.table.find((t) => t.isUser)) comp.table.unshift({ id: 'user', name: c.club.name, isUser: true, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, str: 75 });
        const names = f.teams.split('\n').map((s) => s.trim()).filter(Boolean);
        const keep = comp.table.filter((t) => t.isUser || names.includes(t.name));
        names.forEach((n) => { if (!keep.find((t) => t.name === n)) keep.push({ id: U.uid('tm_'), name: n, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, str: 72 }); });
        comp.table = keep;
      }
      if (!x) c.competitions.push(comp);
      m.close();
      App().commit('Competição salva');
    };
    if (x) m.$('#cf-del').onclick = async () => {
      const n = c.matches.filter((mm) => mm.compId === x.id).length;
      if (!(await UI.confirm(`Excluir ${U.esc(x.name)}?${n ? ` ${n} partida(s) ficarão sem competição.` : ''}`, { danger: true, ok: 'Excluir' }))) return;
      c.competitions = c.competitions.filter((y) => y.id !== x.id);
      m.close();
      App().commit('Competição excluída');
    };
  };

  A.simRound = (el) => {
    const c = S.career();
    const comp = E.comp(c, el.dataset.id);
    const lines = E.simulateRound(c, comp);
    S.save(); App().render();
    UI.modal({ title: 'Resultados da rodada (simulados)', size: 'sm', body: `<ul class="plain">${lines.map((l) => `<li>${U.esc(l)}</li>`).join('')}</ul><p class="hint">Prefere precisão? Use “Editar tabela” e copie os números do jogo.</p>`, actions: '<button class="btn primary" data-close>OK</button>' });
  };

  A.editTable = (el) => {
    const c = S.career();
    const comp = E.comp(c, el.dataset.id);
    const m = UI.modal({
      title: `Tabela — ${U.esc(comp.name)}`, size: 'lg',
      body: `<p class="hint">Copie os números da tabela do EA FC. Sua linha é calculada automaticamente pelas partidas registradas (você pode ajustar pontos extras/punições). “Força” influencia a simulação.</p>
      <div class="table-wrap"><table class="tbl compact edit-tbl"><thead><tr><th>Clube</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>±Pts</th><th>Força</th></tr></thead><tbody>
      ${comp.table.map((t) => `<tr data-id="${t.id}"><td>${t.isUser ? '<b>' + U.esc(c.club.name) + '</b>' : `<input name="name" value="${U.esc(t.name)}">`}</td>${['p', 'w', 'd', 'l', 'gf', 'ga'].map((k) => `<td><input class="mini" type="number" name="${k}" value="${t[k] || 0}" ${t.isUser ? 'disabled' : ''}></td>`).join('')}<td><input class="mini" type="number" name="ptsAdj" value="${t.ptsAdj || 0}"></td><td><input class="mini" type="number" name="str" min="40" max="99" value="${t.str || 72}"></td></tr>`).join('')}
      </tbody></table></div>`,
      actions: `<button class="btn ghost" id="et-reset">Zerar rivais</button><span class="grow"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="et-ok">Salvar</button>`,
    });
    m.$('#et-reset').onclick = () => m.$$('tbody tr').forEach((tr) => tr.querySelectorAll('input:not([disabled])').forEach((i) => { if (['p', 'w', 'd', 'l', 'gf', 'ga', 'ptsAdj'].includes(i.name)) i.value = 0; }));
    m.$('#et-ok').onclick = () => {
      m.$$('tbody tr').forEach((tr) => {
        const t = comp.table.find((x) => x.id === tr.dataset.id);
        tr.querySelectorAll('input').forEach((i) => { if (i.disabled) return; t[i.name] = i.name === 'name' ? i.value : U.num(i.value); });
        if (!t.isUser) t.p = Math.max(t.p, t.w + t.d + t.l);
      });
      m.close();
      App().commit('Tabela atualizada');
    };
  };

  A.winComp = (el) => {
    const c = S.career();
    const comp = E.comp(c, el.dataset.id);
    const m = UI.modal({
      title: `🏆 Campeão — ${U.esc(comp.name)}`, size: 'sm',
      body: `${UI.field('Final / detalhe (opcional)', '<input id="wc-f" placeholder="Ex.: 2x1 sobre o Flamengo na final">')}${UI.field('Notas', '<textarea id="wc-n" rows="2"></textarea>')}`,
      actions: `<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="wc-ok">Levantar a taça!</button>`,
    });
    m.$('#wc-ok').onclick = () => {
      E.addTrophy(c, { name: comp.name, type: comp.type, compId: comp.id, final: m.$('#wc-f').value, notes: m.$('#wc-n').value, season: comp.season });
      m.close();
      App().commit();
      celebrate(comp.name);
    };
  };

  function celebrate(name) {
    const el = document.createElement('div');
    el.className = 'celebrate';
    el.innerHTML = `<div class="cel-in"><div class="cel-trophy">🏆</div><h2>CAMPEÃO!</h2><p>${U.esc(name)}</p></div>`;
    for (let i = 0; i < 60; i++) {
      const s = document.createElement('i');
      s.style.left = Math.random() * 100 + '%';
      s.style.animationDelay = Math.random() * 1.2 + 's';
      s.style.background = ['#fbbf24', '#f59e0b', '#fff', 'var(--accent)'][i % 4];
      el.appendChild(s);
    }
    document.body.appendChild(el);
    el.onclick = () => el.remove();
    setTimeout(() => el.remove(), 4200);
  }
  MC.celebrate = celebrate;

  /* =============== TÁTICA =============== */
  V.tactics = {
    title: 'Tática e escalação',
    render(c) {
      const t = c.tactics;
      const f = E.FORMATIONS[t.formation] || E.FORMATIONS['4-3-3'];
      const squad = E.sortPlayers(E.squad(c));
      const used = new Set(Object.values(t.slots));
      return `
      <div class="toolbar">
        <div class="row gap wrap">
          <select data-change="setFormation">${UI.options(Object.keys(E.FORMATIONS), t.formation)}</select>
          <button class="btn" data-act="autoXI">🤖 Escalar melhor XI</button>
          <button class="btn ghost" data-act="clearXI">Limpar</button>
        </div>
        <div class="muted">OVR médio do XI: <b>${(() => { const ps = Object.values(t.slots).map((id) => E.player(c, id)).filter(Boolean); return ps.length ? (U.sum(ps, (p) => p.ovr) / ps.length).toFixed(1) : '—'; })()}</b></div>
      </div>
      <div class="tactics-layout">
        <div class="pitch">
          <div class="pitch-lines"><i class="half"></i><i class="circle"></i><i class="box top"></i><i class="box bottom"></i></div>
          ${f.map(([pos, x, y], i) => {
            const p = E.player(c, t.slots[i]);
            return `<button class="slot ${p ? 'filled' : ''}" style="left:${x}%;top:${y}%" data-act="pickSlot" data-i="${i}">
              ${p ? `<span class="slot-ovr ${UI.ovrClass(p.ovr)}">${p.ovr}</span>${UI.avatar(p.name, c.club.colorA, 44)}<span class="slot-name">${U.esc(p.name.split(' ').slice(-1)[0])}</span>${p.pos !== pos ? `<span class="slot-warn" title="Fora de posição">${U.esc(p.pos)}</span>` : ''}${p.injury.active ? '<span class="slot-inj">🚑</span>' : ''}` : `<span class="slot-empty">＋</span>`}
              <span class="slot-pos">${pos}</span>
            </button>`;
          }).join('')}
        </div>
        <div class="card bench">
          <div class="card-head"><h3>Banco e disponíveis</h3></div>
          <ul class="bench-list">
            ${squad.filter((p) => !used.has(p.id)).map((p) => `<li class="${p.injury.active ? 'injured' : ''}">${UI.pos(p.pos)} <a href="#/player/${p.id}">${U.esc(p.name)}</a> ${UI.ovr(p.ovr)} <span title="${UI.moraleLabel(p.morale)}">${UI.moraleIcon(p.morale)}</span>${p.injury.active ? ' 🚑' : ''}</li>`).join('') || '<li class="muted">Todos escalados.</li>'}
          </ul>
          ${UI.field('Instruções / plano de jogo', `<textarea rows="4" data-change="tacticNotes" placeholder="Ex.: Pressão alta, laterais apoiando, bola longa no 9…">${U.esc(t.notes || '')}</textarea>`)}
          ${UI.field('Estilo', `<select data-change="tacticStyle">${UI.options(['Equilibrado', 'Ofensivo', 'Contra-ataque', 'Posse de bola', 'Pressão alta', 'Defensivo', 'Jogo direto'], t.style)}</select>`)}
        </div>
      </div>`;
    },
  };
  A.setFormation = (el) => {
    const c = S.career();
    const old = Object.values(c.tactics.slots);
    c.tactics.formation = el.value;
    c.tactics.slots = {};
    // redistribui mantendo jogadores por posição
    const f = E.FORMATIONS[el.value];
    const pool = old.map((id) => E.player(c, id)).filter(Boolean);
    f.forEach(([pos], i) => {
      let idx = pool.findIndex((p) => p.pos === pos);
      if (idx < 0) idx = pool.findIndex((p) => E.POS_GROUP[p.pos] === E.POS_GROUP[pos]);
      if (idx >= 0) { c.tactics.slots[i] = pool[idx].id; pool.splice(idx, 1); }
    });
    App().commit();
  };
  A.autoXI = () => {
    const c = S.career();
    const f = E.FORMATIONS[c.tactics.formation];
    const avail = E.squad(c).filter((p) => !p.injury.active);
    const used = new Set();
    c.tactics.slots = {};
    // primeiro posições exatas
    f.forEach(([pos], i) => {
      const best = avail.filter((p) => !used.has(p.id) && (p.pos === pos || (p.altPos || '').toUpperCase().split(/[ ,/]+/).includes(pos))).sort((a, b) => b.ovr - a.ovr)[0];
      if (best) { used.add(best.id); c.tactics.slots[i] = best.id; }
    });
    f.forEach(([pos], i) => {
      if (c.tactics.slots[i]) return;
      const best = avail.filter((p) => !used.has(p.id) && E.POS_GROUP[p.pos] === E.POS_GROUP[pos]).sort((a, b) => b.ovr - a.ovr)[0] || avail.filter((p) => !used.has(p.id) && p.pos !== 'GOL').sort((a, b) => b.ovr - a.ovr)[0];
      if (best) { used.add(best.id); c.tactics.slots[i] = best.id; }
    });
    App().commit('XI montado pelo auxiliar');
  };
  A.clearXI = () => { S.career().tactics.slots = {}; App().commit(); };
  A.tacticNotes = (el) => { S.career().tactics.notes = el.value; S.save(); };
  A.tacticStyle = (el) => { S.career().tactics.style = el.value; S.save(); };
  A.pickSlot = (el) => {
    const c = S.career();
    const i = el.dataset.i;
    const pos = E.FORMATIONS[c.tactics.formation][i][0];
    const cur = c.tactics.slots[i];
    const list = E.squad(c).sort((a, b) => (b.pos === pos) - (a.pos === pos) || (E.POS_GROUP[b.pos] === E.POS_GROUP[pos]) - (E.POS_GROUP[a.pos] === E.POS_GROUP[pos]) || b.ovr - a.ovr);
    const slotOf = (id) => Object.keys(c.tactics.slots).find((k) => c.tactics.slots[k] === id);
    const m = UI.modal({
      title: `Escolher ${pos}`, size: 'sm',
      body: `<ul class="pick-list">${cur ? '<li><button class="pick" data-id="">— Deixar vazio</button></li>' : ''}${list.map((p) => `<li><button class="pick ${p.id === cur ? 'on' : ''}" data-id="${p.id}">${UI.pos(p.pos)} <span class="grow">${U.esc(p.name)}${slotOf(p.id) != null ? ' <small class="muted">(escalado)</small>' : ''}${p.injury.active ? ' 🚑' : ''}</span> ${UI.ovr(p.ovr)}</button></li>`).join('')}</ul>`,
    });
    m.$$('.pick').forEach((b) => (b.onclick = () => {
      const id = b.dataset.id;
      const prev = id && slotOf(id);
      if (prev != null) { if (cur) c.tactics.slots[prev] = cur; else delete c.tactics.slots[prev]; }
      if (id) c.tactics.slots[i] = id; else delete c.tactics.slots[i];
      m.close();
      App().commit();
    }));
  };

  /* =============== ESTATÍSTICAS =============== */
  const stState = { season: null, sort: 'goals', all: false };
  V.stats = {
    title: 'Estatísticas',
    render(c) {
      const season = stState.all ? 'all' : stState.season || c.seasonYear;
      const seasons = Array.from(new Set([c.seasonYear, ...c.matches.map((m) => m.season)])).sort((a, b) => b - a);
      const rows = E.allPlayerStats(c, season, true).filter((x) => x.s.apps > 0);
      const keys = { apps: 'J', goals: 'G', assists: 'A', ga: 'G+A', avg: 'Nota', motm: 'MOTM', cs: 'CS', yellow: '🟨', red: '🟥' };
      rows.sort((a, b) => b.s[stState.sort] - a.s[stState.sort] || b.s.apps - a.s.apps);
      const ms = E.seasonMatches(c, season);
      const rec = E.record(ms);
      const goalsBy = { '1-15': 0, '16-30': 0, '31-45': 0, '46-60': 0, '61-75': 0, '76-90+': 0 };
      ms.forEach((m) => m.goals.forEach((g) => { const mi = Number(g.minute); if (!mi) return; const k = mi <= 15 ? '1-15' : mi <= 30 ? '16-30' : mi <= 45 ? '31-45' : mi <= 60 ? '46-60' : mi <= 75 ? '61-75' : '76-90+'; goalsBy[k]++; }));
      const byComp = c.competitions.filter((x) => season === 'all' || x.season === season).map((x) => ({ x, r: E.record(c.matches.filter((m) => m.compId === x.id)) })).filter((y) => y.r.p);
      const opps = {};
      ms.forEach((m) => { const k = m.opponent; opps[k] = opps[k] || []; opps[k].push(m); });
      const h2h = Object.entries(opps).map(([k, l]) => ({ k, r: E.record(l) })).sort((a, b) => b.r.p - a.r.p).slice(0, 10);
      const ratingSeries = ms.map((m) => { const r = Object.values(m.ratings).map(Number).filter(Boolean); return { y: r.length ? +(U.sum(r) / r.length).toFixed(2) : 0, label: m.opponent }; }).filter((x) => x.y);
      return `
      <div class="toolbar">
        <div class="row gap">
          <select data-change="stSeason" ${stState.all ? 'disabled' : ''}>${UI.options(seasons.map((y) => ({ v: y, l: 'Temporada ' + U.seasonLabel(y) })), stState.season || c.seasonYear)}</select>
          <label class="check"><input type="checkbox" data-change="stAll" ${stState.all ? 'checked' : ''}> Toda a carreira</label>
        </div>
      </div>
      <div class="summary-strip">
        <div><small>Jogos</small><b>${rec.p}</b></div><div><small>V/E/D</small><b>${rec.w}/${rec.d}/${rec.l}</b></div>
        <div><small>Gols pró</small><b>${rec.gf}</b></div><div><small>Gols contra</small><b>${rec.ga}</b></div>
        <div><small>Média gols</small><b>${rec.p ? (rec.gf / rec.p).toFixed(2) : '—'}</b></div><div><small>Jogos sem sofrer</small><b>${rec.cs}</b></div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Jogadores</h3></div>
        ${rows.length ? `<div class="table-wrap"><table class="tbl">
          <thead><tr><th>#</th><th>Jogador</th>${Object.entries(keys).map(([k, l]) => `<th class="num sortable ${stState.sort === k ? 'sorted' : ''}" data-act="stSort" data-k="${k}">${l}</th>`).join('')}</tr></thead>
          <tbody>${rows.map((x, i) => `<tr><td class="muted">${i + 1}</td><td>${UI.pos(x.p.pos)} <a href="#/player/${x.p.id}">${U.esc(x.p.name)}</a>${x.p.status !== 'elenco' ? ` <small class="muted">(${U.esc(E.STATUS_LABEL[x.p.status])})</small>` : ''}</td>${Object.keys(keys).map((k) => `<td class="num">${k === 'avg' ? UI.rating(x.s.avg) : x.s[k]}</td>`).join('')}</tr>`).join('')}</tbody>
        </table></div>` : '<p class="muted">Registre partidas com escalação para ver estatísticas.</p>'}
      </div>
      <div class="grid-2">
        <div class="card"><div class="card-head"><h3>Gols por período</h3></div>${UI.barChart(Object.entries(goalsBy).map(([label, value]) => ({ label, value })))}</div>
        <div class="card"><div class="card-head"><h3>Nota média do time</h3></div>${UI.lineChart([{ name: 'Nota', color: '#38bdf8', points: ratingSeries, area: true }], { yMin: 5, yMax: 9, height: 170 })}</div>
        <div class="card"><div class="card-head"><h3>Por competição</h3></div>
          ${byComp.length ? `<table class="tbl compact"><thead><tr><th>Competição</th><th class="num">J</th><th class="num">V</th><th class="num">E</th><th class="num">D</th><th class="num">Gols</th></tr></thead><tbody>${byComp.map(({ x, r }) => `<tr><td>${U.esc(x.name)} ${season === 'all' ? `<small class="muted">${U.seasonLabel(x.season)}</small>` : ''}</td><td class="num">${r.p}</td><td class="num">${r.w}</td><td class="num">${r.d}</td><td class="num">${r.l}</td><td class="num">${r.gf}:${r.ga}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">—</p>'}
        </div>
        <div class="card"><div class="card-head"><h3>Confrontos</h3></div>
          ${h2h.length ? `<table class="tbl compact"><thead><tr><th>Adversário</th><th class="num">J</th><th class="num">V</th><th class="num">E</th><th class="num">D</th><th class="num">Gols</th></tr></thead><tbody>${h2h.map(({ k, r }) => `<tr><td>${E.isRival(c, k) ? '⚔️ ' : ''}${U.esc(k)}</td><td class="num">${r.p}</td><td class="num">${r.w}</td><td class="num">${r.d}</td><td class="num">${r.l}</td><td class="num">${r.gf}:${r.ga}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">—</p>'}
        </div>
      </div>`;
    },
  };
  A.stSeason = (el) => { stState.season = Number(el.value); App().render(); };
  A.stAll = (el) => { stState.all = el.checked; App().render(); };
  A.stSort = (el) => { stState.sort = el.dataset.k; App().render(); };
})(window);
