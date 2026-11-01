/* =========================================================
   Views: boas-vindas, central, elenco, jogador
   ========================================================= */
(function (global) {
  'use strict';
  const MC = global.MC;
  const U = MC.U, UI = MC.UI, S = MC.Store, E = MC.Engine, A = MC.A;
  const V = MC.Views;
  const App = () => MC.App;

  /* =============== BOAS-VINDAS =============== */
  V.welcome = {
    render() {
      const list = S.careersList();
      return `
      <div class="welcome">
        <div class="welcome-hero">
          <div class="logo-big">⚽</div>
          <h1>Modo Carreira <span>Manager</span></h1>
          <p>O companheiro de imersão para o seu Modo Carreira no <b>EA SPORTS FC 27</b>. Registre partidas, elenco, transferências, finanças e construa a história do seu clube — com notícias, coletivas e dilemas gerados automaticamente.</p>
          <ul class="welcome-points">
            <li>🔒 Sem login e sem servidor — seus dados ficam só com você</li>
            <li>💾 Salvo no navegador <b>e</b> em arquivo no seu PC</li>
            <li>📴 Funciona offline · 100% grátis</li>
          </ul>
          <div class="welcome-actions">
            <button class="btn primary lg" data-act="newCareer">＋ Nova carreira</button>
            <label class="btn lg">📂 Importar save (.json)<input type="file" accept=".json,application/json" hidden data-change="importFileWelcome"></label>
            ${S.fileApiSupported() ? '<button class="btn lg" data-act="openLinkedFile">🔗 Abrir save do PC</button>' : ''}
            <button class="btn ghost lg" data-act="loadDemo">🎮 Explorar com carreira demo</button>
          </div>
        </div>
        ${list.length ? `
        <div class="welcome-list">
          <h3>Suas carreiras</h3>
          <div class="career-cards">
            ${list.map((c) => `
              <div class="career-card" style="--ca:${U.esc(c.club.colorA)}">
                <button class="career-open" data-act="openCareer" data-id="${c.id}">
                  ${UI.badge(c.club, 52)}
                  <div>
                    <strong>${U.esc(c.club.name)}</strong>
                    <small>${U.esc(c.manager.name)} · Temporada ${U.seasonLabel(c.seasonYear)}</small>
                    <small class="muted">${c.trophies.length} 🏆 · ${E.record(c.matches).p} jogos · atualizado ${U.fmtDateTime(c.updatedAt)}</small>
                  </div>
                </button>
                <button class="icon-btn" data-act="deleteCareer" data-id="${c.id}" title="Excluir">🗑️</button>
              </div>`).join('')}
          </div>
        </div>` : ''}
        <footer class="welcome-foot">Projeto independente de fãs, sem afiliação com a EA. Nenhum dado sai do seu dispositivo.</footer>
      </div>`;
    },
  };

  A.openCareer = (el) => { S.setActive(el.dataset.id); document.getElementById('app').innerHTML = ''; App().go('dashboard'); };
  A.deleteCareer = async (el) => {
    const c = S.state.careers[el.dataset.id];
    if (!c) return;
    if (!(await UI.confirm(`Excluir permanentemente a carreira <b>${U.esc(c.club.name)}</b>? Recomendamos exportar um backup antes.`, { danger: true, ok: 'Excluir' }))) return;
    S.snapshot('antes de excluir carreira');
    S.deleteCareer(c.id);
    S.state.activeCareerId = null; S.persist();
    App().render();
  };
  A.importFileWelcome = async (el) => {
    const f = el.files[0];
    if (!f) return;
    try {
      const n = S.importText(await f.text(), 'merge');
      UI.toast(`${n} carreira(s) importada(s)!`, 'success');
      document.getElementById('app').innerHTML = '';
      App().go('dashboard');
    } catch (e) { UI.toast(e.message, 'error'); }
    el.value = '';
  };
  A.openLinkedFile = async () => {
    const name = await S.openLinkedFile();
    UI.toast(`Save carregado e vinculado: ${name}`, 'success');
    document.getElementById('app').innerHTML = '';
    App().go('dashboard');
  };

  /* -------- Criação de carreira -------- */
  A.newCareer = () => {
    const m = UI.modal({
      title: 'Nova carreira', size: 'lg',
      body: `
      <div class="steps" id="nc-steps"><span class="on">1. Treinador</span><span>2. Clube</span><span>3. Temporada</span></div>
      <form id="nc-form" autocomplete="off">
        <section class="step on" data-step="1">
          <div class="grid-2">
            ${UI.field('Nome do treinador*', '<input name="managerName" required placeholder="Ex.: Carlos Andrade">')}
            ${UI.field('Nacionalidade', '<input name="managerNat" value="Brasil">')}
            ${UI.field('Idade', '<input name="managerAge" type="number" min="18" max="90" value="40">')}
            ${UI.field('Estilo de jogo', `<select name="style">${UI.options(['Equilibrado', 'Ofensivo', 'Contra-ataque', 'Posse de bola', 'Pressão alta', 'Defensivo', 'Jogo direto'])}</select>`)}
            ${UI.field('Dificuldade', `<select name="difficulty">${UI.options(['Iniciante', 'Amador', 'Semiprofissional', 'Profissional', 'Classe mundial', 'Lendário', 'Supercraque'], 'Profissional')}</select>`)}
          </div>
        </section>
        <section class="step" data-step="2">
          <div class="grid-2">
            ${UI.field('Nome do clube*', '<input name="clubName" required placeholder="Ex.: Santos">')}
            ${UI.field('Sigla (3 letras)', '<input name="clubShort" maxlength="3" placeholder="SAN">')}
            ${UI.field('País', '<input name="country" placeholder="Brasil">')}
            ${UI.field('Estádio', '<input name="stadium" placeholder="Vila Belmiro">')}
            ${UI.field('Cor principal', '<input type="color" name="colorA" value="#16a34a">')}
            ${UI.field('Cor secundária', '<input type="color" name="colorB" value="#0b1220">')}
            ${UI.field('Rivais (separados por vírgula)', '<input name="rivals" placeholder="Palmeiras, Corinthians">', 'span-2')}
          </div>
        </section>
        <section class="step" data-step="3">
          <div class="grid-3">
            ${UI.field('Temporada inicial', `<select name="seasonYear">${UI.options([2026, 2027, 2028].map((y) => ({ v: y, l: U.seasonLabel(y) })), 2026)}</select>`)}
            ${UI.field('Moeda', `<select name="currency">${UI.options([{ v: '€', l: '€ Euro' }, { v: 'R$', l: 'R$ Real' }, { v: '£', l: '£ Libra' }, { v: '$', l: '$ Dólar' }])}</select>`)}
            ${UI.field('Saldo do clube', '<input name="balance" placeholder="ex.: 80m">')}
            ${UI.field('Orçamento de transferências', '<input name="transferBudget" placeholder="ex.: 45m">')}
            ${UI.field('Orçamento salarial (semanal)', '<input name="wageBudget" placeholder="ex.: 1.2m">')}
          </div>
          <div class="grid-3">
            ${UI.field('Liga*', '<input name="league" required placeholder="Brasileirão Série A">')}
            ${UI.field('Copa nacional', '<input name="cup" placeholder="Copa do Brasil">')}
            ${UI.field('Competição continental', '<input name="continental" placeholder="Libertadores">')}
          </div>
          ${UI.field('Times da liga (um por linha — opcional, pode adicionar depois)', '<textarea name="leagueTeams" rows="4" placeholder="Flamengo&#10;Palmeiras&#10;..."></textarea>')}
          ${UI.field('Objetivos da diretoria (um por linha)', '<textarea name="objectives" rows="3" placeholder="Terminar entre os 4 primeiros&#10;Chegar às quartas da Copa"></textarea>')}
          <p class="hint">Dica: valores aceitam formatos como <code>45m</code>, <code>850k</code>, <code>12,5 mi</code>.</p>
        </section>
      </form>`,
      actions: `<button class="btn ghost" id="nc-back">Voltar</button><button class="btn primary" id="nc-next">Próximo</button>`,
    });
    let step = 1;
    const show = () => {
      m.$$('.step').forEach((s) => s.classList.toggle('on', Number(s.dataset.step) === step));
      m.$$('#nc-steps span').forEach((s, i) => s.classList.toggle('on', i < step));
      m.$('#nc-back').style.visibility = step === 1 ? 'hidden' : 'visible';
      m.$('#nc-next').textContent = step === 3 ? 'Começar carreira 🚀' : 'Próximo';
    };
    show();
    m.$('#nc-back').onclick = () => { step = Math.max(1, step - 1); show(); };
    m.$('#nc-next').onclick = () => {
      const sec = m.$(`.step[data-step="${step}"]`);
      const req = Array.from(sec.querySelectorAll('[required]')).find((i) => !i.value.trim());
      if (req) { req.focus(); req.classList.add('invalid'); UI.toast('Preencha os campos obrigatórios', 'error'); return; }
      if (step < 3) { step++; show(); return; }
      const d = UI.formData(m.$('#nc-form'));
      d.objectives = (d.objectives || '').split('\n').map((s) => s.trim()).filter(Boolean);
      const c = E.newCareer(d);
      S.addCareer(c);
      m.close();
      document.getElementById('app').innerHTML = '';
      App().go('dashboard');
      setTimeout(() => {
        UI.toast('Carreira criada! Agora cadastre seu elenco.', 'success', 4500);
      }, 300);
    };
  };

  /* -------- Demo -------- */
  A.loadDemo = () => {
    const c = E.newCareer({
      managerName: 'Rafael Moura', clubName: 'Atlético Aurora', clubShort: 'AUR', country: 'Brasil', stadium: 'Arena Aurora',
      league: 'Liga Nacional', cup: 'Copa Nacional', continental: 'Copa Continental', colorA: '#f59e0b', colorB: '#111827',
      rivals: 'Real Horizonte', balance: '60m', transferBudget: '25m', wageBudget: '900k', currency: '€',
      leagueTeams: 'Real Horizonte\nSporting Vale\nUnião Litoral\nEsporte Serrano\nNacional FC\nCidade Alta\nPorto Azul\nFerroviário\nIndependente',
      objectives: ['Terminar entre os 4 primeiros', 'Chegar às semifinais da Copa Nacional', 'Revelar jovens da base'],
    });
    c.name = 'Demo — Atlético Aurora';
    const plan = [['GOL', 2], ['LD', 2], ['ZAG', 4], ['LE', 2], ['VOL', 2], ['MC', 3], ['MEI', 2], ['PD', 2], ['PE', 2], ['ATA', 3]];
    let num = 1;
    plan.forEach(([pos, n]) => {
      for (let i = 0; i < n; i++) {
        const g = E.generateProspect(c, { pos, quality: 'alta' });
        const age = U.rand(18, 33);
        const ovr = U.rand(64, 82) - (i > 0 ? 4 : 0);
        const p = E.newPlayer(c, { name: g.name, pos, age, ovr, pot: Math.max(ovr, ovr + Math.max(0, 27 - age) * U.rand(1, 2)), nat: g.nat, number: num++, value: Math.round(ovr * ovr * ovr * 25), wage: ovr * 1000, contractUntil: c.seasonYear + U.rand(1, 4), role: i === 0 ? 'Titular' : 'Rotação' });
        if (age <= 19) p.youth = true;
        c.players.push(p);
      }
    });
    // Tática
    const used = new Set();
    E.FORMATIONS['4-3-3'].forEach(([pos], i) => {
      const best = E.squad(c).filter((p) => !used.has(p.id) && (p.pos === pos || E.POS_GROUP[p.pos] === E.POS_GROUP[pos])).sort((a, b) => (b.pos === pos) - (a.pos === pos) || b.ovr - a.ovr)[0];
      if (best) { used.add(best.id); c.tactics.slots[i] = best.id; }
    });
    const league = c.competitions[0];
    const xi = Object.values(c.tactics.slots);
    const bench = E.squad(c).filter((p) => !xi.includes(p.id));
    const opps = league.table.filter((t) => !t.isUser).map((t) => t.name);
    for (let i = 0; i < 6; i++) {
      const gf = U.rand(0, 4), ga = U.rand(0, 2);
      const goals = [];
      for (let g = 0; g < gf; g++) {
        const att = xi.map((id) => E.player(c, id)).filter((p) => p.pos !== 'GOL');
        const sc = U.pick(att.filter((p) => ['ATA', 'PD', 'PE', 'MEI'].includes(p.pos)));
        const as = U.pick(att.filter((p) => p.id !== sc.id));
        goals.push({ pid: sc.id, assist: Math.random() < 0.75 ? as.id : '', minute: U.rand(3, 90) });
      }
      const ratings = {};
      xi.forEach((id) => (ratings[id] = +(U.rand(60, 85) / 10).toFixed(1)));
      const subs = U.shuffle(bench).slice(0, 3).map((p) => p.id);
      subs.forEach((id) => (ratings[id] = +(U.rand(60, 75) / 10).toFixed(1)));
      const motm = Object.entries(ratings).sort((a, b) => b[1] - a[1])[0][0];
      const m = {
        season: c.seasonYear, date: new Date(Date.UTC(c.seasonYear, 7, 3 + i * 7)).toISOString().slice(0, 10), compId: league.id, round: `Rodada ${i + 1}`,
        opponent: opps[i], venue: i % 2 ? 'F' : 'C', gf, ga, played: true, lineup: xi.slice(), subs, goals, ratings, yellows: [], reds: [], motm, injuries: [], stats: { possession: U.rand(42, 64) }, notes: '',
      };
      E.saveMatch(c, m, true);
      E.simulateRound(c, league);
    }
    c.matches.push({ id: U.uid('m_'), season: c.seasonYear, date: `${c.seasonYear}-09-14`, compId: league.id, round: 'Rodada 7', opponent: opps[6], venue: 'C', played: false, gf: 0, ga: 0, lineup: [], subs: [], goals: [], ratings: {}, yellows: [], reds: [], injuries: [], stats: {} });
    c.gameDate = `${c.seasonYear}-09-10`;
    c.shortlist.push({ id: U.uid('sl_'), name: 'Diego Ferreira', pos: 'ATA', age: 21, ovr: 76, pot: 86, club: 'Porto Azul', value: 18e6, wage: 40000, priority: 'Alta', status: 'observando', notes: 'Finalizador nato.', nat: 'Brasil' });
    E.addTransaction(c, { type: 'in', category: 'Bilheteria', amount: 2.4e6, desc: 'Bilheteria — primeiros jogos em casa' });
    E.addTransaction(c, { type: 'out', category: 'Salários', amount: 3.2e6, desc: 'Folha salarial — agosto' });
    E.checkAchievements(c);
    S.addCareer(c);
    document.getElementById('app').innerHTML = '';
    App().go('dashboard');
    UI.toast('Carreira demo carregada! Explore à vontade.', 'success');
  };

  /* =============== CENTRAL (DASHBOARD) =============== */
  V.dashboard = {
    title: 'Central do treinador',
    render(c) {
      const rec = E.record(E.seasonMatches(c));
      const form = E.form(c, 5);
      const next = E.upcoming(c)[0];
      const last = E.seasonMatches(c).slice(-1)[0];
      const leaders = E.leaders(c);
      const squad = E.squad(c);
      const injured = squad.filter((p) => p.injury.active);
      const expiring = squad.filter((p) => p.contractUntil && p.contractUntil <= c.seasonYear + 1);
      const unhappy = squad.filter((p) => p.morale < 45);
      const objs = c.objectives.filter((o) => o.season === c.seasonYear);
      const league = c.competitions.find((x) => x.season === c.seasonYear && x.type === 'liga');
      const table = league ? E.leagueTable(c, league) : [];
      const userRow = table.find((r) => r.isUser);
      const avgMorale = squad.length ? Math.round(U.sum(squad, (p) => p.morale) / squad.length) : 0;
      const news = c.news.slice(0, 5);
      const nextComp = next && E.comp(c, next.compId);

      const tableMini = () => {
        if (!table.length || table.length < 2) return '';
        const ui = table.findIndex((r) => r.isUser);
        const from = Math.max(0, Math.min(ui - 2, table.length - 5));
        return `<table class="tbl compact">${table.slice(from, from + 5).map((r) => `<tr class="${r.isUser ? 'me' : ''}"><td class="num">${r.pos}</td><td>${U.esc(r.name)}</td><td class="num muted">${r.p}</td><td class="num"><b>${r.pts}</b></td></tr>`).join('')}</table>`;
      };

      return `
      <section class="hero-card" style="--ca:${U.esc(c.club.colorA)};--cb:${U.esc(c.club.colorB)}">
        <div class="hero-left">
          ${UI.badge(c.club, 72)}
          <div>
            <h2>${U.esc(c.club.name)}</h2>
            <p>${U.esc(c.club.league || '')} · ${U.esc(c.club.stadium || '')}</p>
            <p class="hero-sub">Treinador <b>${U.esc(c.manager.name)}</b> · Temporada ${U.seasonLabel(c.seasonYear)} · ${c.seasons.length + 1}ª no comando</p>
          </div>
        </div>
        <div class="hero-stats">
          <div><small>Jogos</small><b>${rec.p}</b></div>
          <div><small>V-E-D</small><b>${rec.w}-${rec.d}-${rec.l}</b></div>
          <div><small>Gols</small><b>${rec.gf}:${rec.ga}</b></div>
          <div><small>Liga</small><b>${userRow && userRow.p ? userRow.pos + 'º' : '—'}</b></div>
          <div><small>Forma</small>${UI.form(form.length ? form : ['', '', '', '', ''].map(() => null))}</div>
        </div>
      </section>

      <div class="grid-dash">
        <div class="card next-match">
          <div class="card-head"><h3>Próxima partida</h3>${next ? `<button class="btn sm primary" data-act="playMatch" data-id="${next.id}">Registrar resultado</button>` : `<button class="btn sm" data-act="scheduleMatch">Agendar</button>`}</div>
          ${next ? `
            <div class="vs">
              <div class="vs-team">${UI.badge(c.club, 54)}<span>${U.esc(c.club.short || c.club.name)}</span></div>
              <div class="vs-mid"><small>${U.esc(nextComp ? nextComp.name : '')}${next.round ? ' · ' + U.esc(next.round) : ''}</small><b>VS</b><small>${U.fmtDate(next.date)} · ${next.venue === 'F' ? 'Fora' : next.venue === 'N' ? 'Neutro' : 'Casa'}</small>${E.isRival(c, next.opponent) ? '<span class="tag hot">CLÁSSICO</span>' : ''}</div>
              <div class="vs-team">${UI.avatar(next.opponent, '#64748b', 54)}<span>${U.esc(next.opponent)}</span></div>
            </div>
            <div class="row gap"><button class="btn sm ghost" data-act="pressConference">🎙️ Coletiva pré-jogo</button><button class="btn sm ghost" data-act="go" data-to="tactics">📋 Escalação</button></div>
          ` : `<p class="muted">Nenhuma partida agendada. Agende os próximos jogos do calendário do EA FC para acompanhar aqui.</p>`}
          ${last ? `<div class="last-res">Último jogo: ${UI.res(E.result(last))} <a href="#/match/${last.id}">${U.esc(c.club.short)} ${last.gf} x ${last.ga} ${U.esc(last.opponent)}</a></div>` : ''}
        </div>

        <div class="card">
          <div class="card-head"><h3>Clima no clube</h3><a href="#/board" class="link">Diretoria →</a></div>
          ${UI.meter(c.board.confidence, `Confiança da diretoria · ${UI.boardLabel(c.board.confidence)}`)}
          ${UI.meter(c.board.fans, 'Apoio da torcida')}
          ${UI.meter(avgMorale, `Moral do elenco ${UI.moraleIcon(avgMorale)}`)}
          ${UI.meter(c.manager.reputation, 'Reputação do treinador', { color: 'var(--accent)', suffix: '' })}
        </div>

        <div class="card">
          <div class="card-head"><h3>Finanças</h3><a href="#/finances" class="link">Ver →</a></div>
          <div class="kpis">
            <div><small>Saldo</small><b class="${c.finances.balance < 0 ? 'neg' : ''}">${U.money(c.finances.balance)}</b></div>
            <div><small>Orç. transferências</small><b>${U.money(c.finances.transferBudget)}</b></div>
            <div><small>Folha semanal</small><b>${U.money(E.wageBill(c))}</b><small class="muted">de ${U.money(c.finances.wageBudget)}</small></div>
            <div><small>Valor do elenco</small><b>${U.money(E.squadValue(c))}</b></div>
          </div>
        </div>

        <div class="card">
          <div class="card-head"><h3>Destaques da temporada</h3><a href="#/stats" class="link">Estatísticas →</a></div>
          <div class="leaders">
            ${[['⚽', 'Artilheiro', leaders.goals, (x) => x.s.goals + ' gols'], ['🎯', 'Garçom', leaders.assists, (x) => x.s.assists + ' assist.'], ['⭐', 'Melhor nota', leaders.rating, (x) => x.s.avg.toFixed(2)], ['🏅', 'Mais MOTM', leaders.motm, (x) => x.s.motm + 'x']]
              .map(([ic, l, x, f]) => `<a class="leader" ${x ? `href="#/player/${x.p.id}"` : ''}><span class="leader-ico">${ic}</span><small>${l}</small><b>${x && (x.s.goals || x.s.assists || x.s.avg || x.s.motm) ? U.esc(x.p.name) : '—'}</b><span class="muted">${x && (x.s.goals || x.s.assists || x.s.avg || x.s.motm) ? f(x) : ''}</span></a>`).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-head"><h3>${league ? U.esc(league.name) : 'Liga'}</h3><a href="#/competitions" class="link">Tabela →</a></div>
          ${tableMini() || '<p class="muted">Adicione os times da liga em Competições para acompanhar a classificação.</p>'}
        </div>

        <div class="card">
          <div class="card-head"><h3>Objetivos ${U.seasonLabel(c.seasonYear)}</h3><a href="#/board" class="link">Gerenciar →</a></div>
          ${objs.length ? `<ul class="obj-list">${objs.slice(0, 5).map((o) => `<li class="obj-${o.status}"><button class="obj-check" data-act="cycleObjective" data-id="${o.id}" title="Alterar status">${o.status === 'concluido' ? '✔' : o.status === 'falhou' ? '✖' : ''}</button><span>${U.esc(o.text)}</span><small class="tag">${U.esc(o.priority)}</small></li>`).join('')}</ul>` : '<p class="muted">Nenhum objetivo definido.</p>'}
        </div>

        <div class="card span-2">
          <div class="card-head"><h3>Últimas notícias</h3><div class="row gap"><button class="btn sm ghost" data-act="genRumor">🗣️ Gerar rumor</button><a href="#/news" class="link">Todas →</a></div></div>
          ${news.length ? `<div class="news-mini">${news.map((n) => `<article><span class="news-ico">${n.icon}</span><div><b>${U.esc(n.title)}</b><small class="muted">${U.esc(n.source)} · ${U.fmtDate(n.date)}</small></div></article>`).join('')}</div>` : '<p class="muted">Sem notícias ainda.</p>'}
        </div>

        <div class="card">
          <div class="card-head"><h3>Alertas do auxiliar</h3></div>
          <ul class="alerts">
            ${!squad.length ? '<li class="warn">📝 Seu elenco está vazio. <a href="#/squad">Cadastre os jogadores</a> (pode colar uma lista CSV).</li>' : ''}
            ${injured.map((p) => `<li class="bad">🚑 <a href="#/player/${p.id}">${U.esc(p.name)}</a> lesionado${p.injury.note ? ' — ' + U.esc(p.injury.note) : ''}</li>`).join('')}
            ${expiring.slice(0, 4).map((p) => `<li class="warn">📄 Contrato de <a href="#/player/${p.id}">${U.esc(p.name)}</a> termina em ${p.contractUntil}</li>`).join('')}
            ${unhappy.slice(0, 4).map((p) => `<li class="warn">${UI.moraleIcon(p.morale)} <a href="#/player/${p.id}">${U.esc(p.name)}</a> está ${UI.moraleLabel(p.morale).toLowerCase()}</li>`).join('')}
            ${c.board.confidence < 35 ? '<li class="bad">🏛️ A diretoria está perdendo a paciência. Resultados são urgentes!</li>' : ''}
            ${c.finances.balance < 0 ? '<li class="bad">💸 Saldo negativo. Considere vender jogadores.</li>' : ''}
            ${squad.length && !injured.length && !expiring.length && !unhappy.length && c.board.confidence >= 35 ? '<li class="good">✅ Tudo sob controle por aqui, professor.</li>' : ''}
          </ul>
        </div>
      </div>`;
    },
  };

  A.cycleObjective = (el) => {
    const c = S.career();
    const o = c.objectives.find((x) => x.id === el.dataset.id);
    if (!o) return;
    const order = ['pendente', 'concluido', 'falhou'];
    o.status = order[(order.indexOf(o.status) + 1) % 3];
    if (o.status === 'concluido') {
      c.board.confidence = U.clamp(c.board.confidence + (o.priority === 'Crítica' ? 6 : o.priority === 'Alta' ? 4 : 2), 0, 100);
      E.addNews(c, { type: 'diretoria', icon: '🎯', title: `Objetivo cumprido: ${o.text}`, body: `A diretoria do ${c.club.name} elogiou o trabalho de ${c.manager.name}.` });
    }
    App().commit();
  };
  A.genRumor = () => { E.generateRumor(S.career()); App().commit('Novo rumor na imprensa', 'info'); };

  /* =============== ELENCO =============== */
  const squadState = { tab: 'elenco', q: '', pos: '', sort: 'pos', view: 'table' };

  V.squad = {
    title: 'Elenco',
    render(c) {
      const st = squadState;
      const tabs = [['elenco', 'Elenco principal'], ['base', 'Base'], ['emprestado', 'Emprestados'], ['saiu', 'Ex-jogadores']];
      let list = c.players.filter((p) => (st.tab === 'saiu' ? ['vendido', 'dispensado', 'aposentado'].includes(p.status) : p.status === st.tab));
      if (st.q) list = list.filter((p) => (p.name + ' ' + p.nat).toLowerCase().includes(st.q.toLowerCase()));
      if (st.pos) list = list.filter((p) => E.POS_GROUP[p.pos] === st.pos);
      const stats = {};
      list.forEach((p) => (stats[p.id] = E.playerStats(c, p.id)));
      const sorters = {
        pos: (a, b) => (E.POS_ORDER[a.pos] ?? 99) - (E.POS_ORDER[b.pos] ?? 99) || b.ovr - a.ovr,
        ovr: (a, b) => b.ovr - a.ovr,
        pot: (a, b) => b.pot - a.pot,
        age: (a, b) => a.age - b.age,
        value: (a, b) => b.value - a.value,
        wage: (a, b) => b.wage - a.wage,
        goals: (a, b) => stats[b.id].goals - stats[a.id].goals,
        apps: (a, b) => stats[b.id].apps - stats[a.id].apps,
        rating: (a, b) => stats[b.id].avg - stats[a.id].avg,
        morale: (a, b) => b.morale - a.morale,
        contract: (a, b) => a.contractUntil - b.contractUntil,
      };
      list.sort(sorters[st.sort] || sorters.pos);
      const sq = E.squad(c);
      const avg = sq.length ? (U.sum(sq, (p) => p.ovr) / sq.length).toFixed(1) : '—';
      const avgAge = sq.length ? (U.sum(sq, (p) => p.age) / sq.length).toFixed(1) : '—';
      const groups = ['GOL', 'DEF', 'MEI', 'ATA'].map((g) => ({ g, n: sq.filter((p) => E.POS_GROUP[p.pos] === g).length }));

      const sortTh = (k, l, cls = '') => `<th class="${cls} sortable ${st.sort === k ? 'sorted' : ''}" data-act="squadSort" data-k="${k}">${l}</th>`;

      return `
      <div class="toolbar">
        <div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${st.tab === k ? 'on' : ''}" data-act="squadTab" data-k="${k}">${l} <small>${c.players.filter((p) => (k === 'saiu' ? ['vendido', 'dispensado', 'aposentado'].includes(p.status) : p.status === k)).length}</small></button>`).join('')}</div>
        <div class="row gap wrap">
          <button class="btn primary" data-act="editPlayer">＋ Jogador</button>
          <button class="btn" data-act="bulkPlayers">📋 Adicionar em lote</button>
          <button class="btn ghost" data-act="exportSquadCSV" title="Exportar CSV">⬇️ CSV</button>
        </div>
      </div>
      <div class="summary-strip">
        <div><small>Jogadores</small><b>${sq.length}</b></div>
        <div><small>OVR médio</small><b>${avg}</b></div>
        <div><small>Idade média</small><b>${avgAge}</b></div>
        <div><small>Valor total</small><b>${U.money(E.squadValue(c))}</b></div>
        <div><small>Folha semanal</small><b>${U.money(E.wageBill(c))}</b></div>
        <div class="hide-sm"><small>GOL/DEF/MEI/ATA</small><b>${groups.map((x) => x.n).join(' / ')}</b></div>
      </div>
      <div class="filters">
        <input type="search" placeholder="Buscar jogador…" value="${U.esc(st.q)}" data-input="squadSearch" class="grow">
        <div class="seg">${[['', 'Todos'], ['GOL', 'GOL'], ['DEF', 'DEF'], ['MEI', 'MEI'], ['ATA', 'ATA']].map(([k, l]) => `<button class="${st.pos === k ? 'on' : ''}" data-act="squadPos" data-k="${k}">${l}</button>`).join('')}</div>
        <div class="seg"><button class="${st.view === 'table' ? 'on' : ''}" data-act="squadView" data-k="table" title="Tabela">☰</button><button class="${st.view === 'cards' ? 'on' : ''}" data-act="squadView" data-k="cards" title="Cartas">▦</button></div>
      </div>
      ${!list.length ? UI.empty('👥', 'Nenhum jogador aqui', st.tab === 'elenco' ? 'Cadastre os jogadores do seu clube no EA FC 27. Você pode colar uma lista de uma planilha.' : 'Nada para mostrar nesta aba.', st.tab === 'elenco' ? '<button class="btn primary" data-act="bulkPlayers">Adicionar em lote</button>' : '') :
      st.view === 'cards' ? `<div class="pcards">${list.map((p) => {
        const s = stats[p.id];
        return `<a class="pcard ${UI.ovrClass(p.ovr)}" href="#/player/${p.id}">
          <div class="pcard-top"><b class="pcard-ovr">${p.ovr}</b><span>${U.esc(p.pos)}</span>${p.captain ? '<span class="cap">C</span>' : ''}</div>
          <div class="pcard-av">${UI.avatar(p.name, c.club.colorA, 64)}</div>
          <div class="pcard-name">${U.esc(p.name)}</div>
          <div class="pcard-meta">${p.age} anos · POT ${p.pot}</div>
          <div class="pcard-stats"><span>${s.apps}<small>J</small></span><span>${s.goals}<small>G</small></span><span>${s.assists}<small>A</small></span><span>${s.avg ? s.avg.toFixed(1) : '—'}<small>NT</small></span></div>
          ${p.injury.active ? '<span class="inj-flag">🚑</span>' : ''}
        </a>`;
      }).join('')}</div>` : `
      <div class="table-wrap">
        <table class="tbl squad-tbl">
          <thead><tr>
            <th class="num">#</th>${sortTh('pos', 'Pos')}<th>Nome</th>${sortTh('age', 'Idade', 'num')}${sortTh('ovr', 'OVR', 'num')}${sortTh('pot', 'POT', 'num')}
            ${sortTh('apps', 'J', 'num')}${sortTh('goals', 'G', 'num hide-sm')}<th class="num hide-sm">A</th>${sortTh('rating', 'Nota', 'num hide-sm')}
            ${sortTh('morale', 'Moral', 'num hide-md')}${sortTh('value', 'Valor', 'num hide-md')}${sortTh('wage', 'Salário', 'num hide-lg')}${sortTh('contract', 'Contrato', 'num hide-lg')}<th></th>
          </tr></thead>
          <tbody>
          ${list.map((p) => {
            const s = stats[p.id];
            return `<tr class="${p.injury.active ? 'injured' : ''}">
              <td class="num muted">${p.number === '' ? '' : p.number}</td>
              <td>${UI.pos(p.pos)}</td>
              <td><a href="#/player/${p.id}" class="pname">${U.esc(p.name)}</a>${p.captain ? ' <span class="cap">C</span>' : ''}${p.injury.active ? ' 🚑' : ''}${p.youth ? ' <span title="Cria da base">🌱</span>' : ''}${p.transferListed ? ' <span class="tag">À venda</span>' : ''}${p.onLoanFrom ? ' <span class="tag">Emprestado</span>' : ''}<small class="sub">${U.esc(p.nat || '')}${p.role ? ' · ' + U.esc(p.role) : ''}${p.loanedTo ? ' · no ' + U.esc(p.loanedTo) : ''}${p.leftTo ? ' · → ' + U.esc(p.leftTo) : ''}</small></td>
              <td class="num">${p.age}</td>
              <td class="num">${UI.ovr(p.ovr)}</td>
              <td class="num">${UI.ovr(p.pot)}</td>
              <td class="num">${s.apps}</td>
              <td class="num hide-sm">${s.goals}</td>
              <td class="num hide-sm">${s.assists}</td>
              <td class="num hide-sm">${UI.rating(s.avg)}</td>
              <td class="num hide-md" title="${UI.moraleLabel(p.morale)}">${UI.moraleIcon(p.morale)}</td>
              <td class="num hide-md">${U.money(p.value)}</td>
              <td class="num hide-lg">${U.money(p.wage)}</td>
              <td class="num hide-lg ${p.contractUntil <= c.seasonYear + 1 ? 'warn-txt' : ''}">${p.contractUntil || '—'}</td>
              <td class="actions"><button class="icon-btn" data-act="editPlayer" data-id="${p.id}" title="Editar">✏️</button></td>
            </tr>`;
          }).join('')}
          </tbody>
        </table>
      </div>`}`;
    },
  };

  A.squadTab = (el) => { squadState.tab = el.dataset.k; App().render(); };
  A.squadPos = (el) => { squadState.pos = el.dataset.k; App().render(); };
  A.squadSort = (el) => { squadState.sort = el.dataset.k; App().render(); };
  A.squadView = (el) => { squadState.view = el.dataset.k; App().render(); };
  A.squadSearch = U.debounce((el) => {
    squadState.q = el.value;
    App().render();
    const i = document.querySelector('[data-input="squadSearch"]');
    if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
  }, 250);

  A.exportSquadCSV = () => {
    const c = S.career();
    const rows = [['Nome', 'Pos', 'Idade', 'OVR', 'POT', 'Nacionalidade', 'Numero', 'Valor', 'Salario', 'Contrato', 'Status', 'Jogos', 'Gols', 'Assistencias', 'Nota']];
    E.sortPlayers(c.players).forEach((p) => {
      const s = E.playerStats(c, p.id);
      rows.push([p.name, p.pos, p.age, p.ovr, p.pot, p.nat, p.number, p.value, p.wage, p.contractUntil, E.STATUS_LABEL[p.status], s.apps, s.goals, s.assists, s.avg ? s.avg.toFixed(2) : '']);
    });
    U.download(`elenco-${U.slug(c.club.name)}-${U.seasonLabel(c.seasonYear).replace('/', '-')}.csv`, '﻿' + rows.map((r) => r.map((x) => `"${String(x ?? '').replace(/"/g, '""')}"`).join(';')).join('\n'), 'text/csv');
  };

  /* -------- Formulário de jogador -------- */
  A.editPlayer = (el) => {
    const c = S.career();
    const p = el && el.dataset && el.dataset.id ? E.player(c, el.dataset.id) : null;
    const d = p || { pos: 'MC', age: 20, ovr: 65, pot: 75, status: 'elenco', role: 'Rotação', foot: 'Direito', contractUntil: c.seasonYear + 3, morale: 70 };
    const m = UI.modal({
      title: p ? `Editar ${U.esc(p.name)}` : 'Novo jogador', size: 'lg',
      body: `<form id="pf" class="grid-4" autocomplete="off">
        ${UI.field('Nome*', `<input name="name" required value="${U.esc(d.name || '')}">`, 'span-2')}
        ${UI.field('Posição', `<select name="pos">${UI.options(E.POSITIONS, d.pos)}</select>`)}
        ${UI.field('Pos. alternativas', `<input name="altPos" value="${U.esc(d.altPos || '')}" placeholder="MEI, PD">`)}
        ${UI.field('Idade', `<input name="age" type="number" min="14" max="50" value="${d.age}">`)}
        ${UI.field('OVR', `<input name="ovr" type="number" min="1" max="99" value="${d.ovr}">`)}
        ${UI.field('Potencial', `<input name="pot" type="number" min="1" max="99" value="${d.pot}">`)}
        ${UI.field('Número', `<input name="number" type="number" min="1" max="99" value="${d.number ?? ''}">`)}
        ${UI.field('Nacionalidade', `<input name="nat" value="${U.esc(d.nat || '')}">`)}
        ${UI.field('Pé', `<select name="foot">${UI.options(['Direito', 'Esquerdo', 'Ambidestro'], d.foot)}</select>`)}
        ${UI.field('Valor de mercado', `<input name="value" value="${U.moneyInput(d.value)}" placeholder="ex.: 25m">`)}
        ${UI.field('Salário semanal', `<input name="wage" value="${U.moneyInput(d.wage)}" placeholder="ex.: 45k">`)}
        ${UI.field('Contrato até', `<input name="contractUntil" type="number" min="2020" max="2060" value="${d.contractUntil}">`)}
        ${UI.field('Status', `<select name="status">${UI.options(Object.entries(E.STATUS_LABEL).map(([v, l]) => ({ v, l })), d.status)}</select>`)}
        ${UI.field('Papel no elenco', `<select name="role">${UI.options(E.ROLES, d.role)}</select>`)}
        ${UI.field('Moral (0-100)', `<input name="morale" type="range" min="0" max="100" value="${Math.round(d.morale)}">`)}
        ${UI.field('Chegou de', `<input name="joinedFrom" value="${U.esc(d.joinedFrom || '')}">`)}
        ${UI.field('Temporada de chegada', `<input name="joined" type="number" value="${d.joined || c.seasonYear}">`)}
        <label class="check"><input type="checkbox" name="youth" ${d.youth ? 'checked' : ''}> Cria da base</label>
        <label class="check"><input type="checkbox" name="captain" ${d.captain ? 'checked' : ''}> Capitão</label>
        <label class="check"><input type="checkbox" name="transferListed" ${d.transferListed ? 'checked' : ''}> Na lista de vendas</label>
        <label class="check"><input type="checkbox" name="injured" ${d.injury && d.injury.active ? 'checked' : ''}> Lesionado</label>
        ${UI.field('Detalhe da lesão', `<input name="injuryNote" value="${U.esc((d.injury && d.injury.note) || '')}" placeholder="Ex.: Lesão muscular — 3 semanas">`, 'span-2')}
        ${UI.field('Volta prevista', `<input name="injuryUntil" type="date" value="${U.esc((d.injury && d.injury.until) || '')}">`, 'span-2')}
        ${UI.field('Notas / scout', `<textarea name="notes" rows="2">${U.esc(d.notes || '')}</textarea>`, 'span-4')}
      </form>`,
      actions: `${p ? '<button class="btn danger ghost" id="pf-del">Excluir</button>' : ''}<span class="grow"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="pf-ok">Salvar</button>`,
    });
    m.$('#pf-ok').onclick = () => {
      const f = UI.formData(m.$('#pf'));
      if (!f.name.trim()) { UI.toast('Informe o nome', 'error'); return; }
      const target = p || E.newPlayer(c, f);
      const oldOvr = p ? p.ovr : null;
      Object.assign(target, {
        name: f.name.trim(), pos: f.pos, altPos: f.altPos, age: U.num(f.age, 20), ovr: U.clamp(U.num(f.ovr, 60), 1, 99), pot: U.clamp(U.num(f.pot, 60), 1, 99),
        number: f.number === '' ? '' : U.num(f.number), nat: f.nat, foot: f.foot, value: U.parseMoney(f.value), wage: U.parseMoney(f.wage),
        contractUntil: U.num(f.contractUntil, c.seasonYear + 1), status: f.status, role: f.role, morale: U.num(f.morale, 70),
        joinedFrom: f.joinedFrom, joined: U.num(f.joined, c.seasonYear), youth: f.youth, transferListed: f.transferListed, notes: f.notes,
        injury: { active: f.injured, note: f.injured ? f.injuryNote : '', until: f.injured ? f.injuryUntil : '' },
      });
      if (f.captain) c.players.forEach((x) => (x.captain = x === target));
      else target.captain = false;
      if (p && oldOvr !== target.ovr) {
        const h = target.ovrHistory;
        const lastH = h[h.length - 1];
        if (lastH && lastH.season === c.seasonYear && lastH.date === c.gameDate) lastH.ovr = target.ovr;
        else h.push({ season: c.seasonYear, ovr: target.ovr, date: c.gameDate });
        if (target.ovr - oldOvr >= 2) E.addNews(c, { type: 'destaque', icon: '📈', title: `${target.name} evolui e chega a ${target.ovr} de geral`, body: `Em grande fase, ${target.name} ganhou ${target.ovr - oldOvr} pontos de overall.` });
      }
      if (!p) c.players.push(target);
      m.close();
      App().commit(p ? 'Jogador atualizado' : 'Jogador adicionado');
    };
    if (p) m.$('#pf-del').onclick = async () => {
      const used = c.matches.some((x) => x.lineup.includes(p.id) || x.subs.includes(p.id));
      if (!(await UI.confirm(used ? `${U.esc(p.name)} tem partidas registradas. Excluir apagará suas estatísticas. Prefira registrar uma <b>saída</b> em Transferências. Excluir mesmo assim?` : `Excluir ${U.esc(p.name)}?`, { danger: true, ok: 'Excluir' }))) return;
      c.players = c.players.filter((x) => x.id !== p.id);
      Object.keys(c.tactics.slots).forEach((k) => c.tactics.slots[k] === p.id && delete c.tactics.slots[k]);
      m.close();
      App().commit('Jogador excluído');
      if (App().route === 'player') App().go('squad');
    };
  };

  A.bulkPlayers = () => {
    const c = S.career();
    const m = UI.modal({
      title: 'Adicionar jogadores em lote', size: 'lg',
      body: `<p>Cole uma lista (de uma planilha, do Excel ou digitada). Uma linha por jogador, separando colunas com <b>vírgula</b>, <b>ponto e vírgula</b> ou <b>tab</b>.</p>
      <p class="hint">Ordem padrão (sem cabeçalho): <code>Nome; Pos; Idade; OVR; POT; Valor; Salário; Contrato; Número; Nacionalidade</code><br>
      Ou use um cabeçalho com nomes de colunas (ex.: <code>nome;pos;idade;ovr;pot</code>). Posições em inglês (ST, CB, CAM…) também funcionam.</p>
      <textarea id="bulk" rows="10" placeholder="Neymar; PE; 35; 84; 84; 15m; 200k; 2028; 10; Brasil&#10;Guilherme Arana; LE; 29; 80; 80; 18m; 60k; 2027; 13; Brasil"></textarea>
      <div id="bulk-prev" class="hint"></div>
      ${UI.field('Adicionar como', `<select id="bulk-status">${UI.options([{ v: 'elenco', l: 'Elenco principal' }, { v: 'base', l: 'Categoria de base' }])}</select>`)}`,
      actions: `<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="bulk-ok">Importar</button>`,
    });
    const ta = m.$('#bulk');
    ta.addEventListener('input', U.debounce(() => {
      const list = E.parseSquadCSV(c, ta.value);
      m.$('#bulk-prev').innerHTML = list.length ? `Pré-visualização: <b>${list.length}</b> jogador(es) — ${list.slice(0, 6).map((p) => `${U.esc(p.name)} (${p.pos}, ${p.ovr})`).join(', ')}${list.length > 6 ? '…' : ''}` : '';
    }, 250));
    m.$('#bulk-ok').onclick = () => {
      const list = E.parseSquadCSV(c, ta.value);
      if (!list.length) { UI.toast('Nenhum jogador reconhecido', 'error'); return; }
      const st = m.$('#bulk-status').value;
      list.forEach((p) => { p.status = st; if (st === 'base') p.youth = true; c.players.push(p); });
      m.close();
      App().commit(`${list.length} jogador(es) adicionados`);
    };
  };

  /* =============== PERFIL DO JOGADOR =============== */
  V.player = {
    title: (c, [id]) => { const p = E.player(c, id); return p ? p.name : 'Jogador'; },
    render(c, [id]) {
      const p = E.player(c, id);
      if (!p) return UI.empty('🤷', 'Jogador não encontrado', '', '<a class="btn" href="#/squad">Voltar ao elenco</a>');
      const s = E.playerStats(c, p.id);
      const all = E.playerStats(c, p.id, 'all');
      const seasons = Array.from(new Set(c.matches.filter((m) => m.lineup.includes(p.id) || m.subs.includes(p.id)).map((m) => m.season).concat(Object.keys(p.statAdj || {}).map(Number)))).sort();
      const matches = c.matches.filter((m) => m.played && (m.lineup.includes(p.id) || m.subs.includes(p.id))).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      const ratingSeries = matches.slice(0, 20).reverse().filter((m) => m.ratings[p.id]).map((m) => ({ y: Number(m.ratings[p.id]), label: m.opponent }));
      const ovrSeries = p.ovrHistory.map((h) => ({ y: h.ovr, label: U.seasonLabel(h.season) }));
      const transfers = c.transfers.filter((t) => t.playerId === p.id);
      return `
      <div class="player-hero" style="--ca:${U.esc(c.club.colorA)}">
        <div class="ph-card ${UI.ovrClass(p.ovr)}">
          <b>${p.ovr}</b><span>${U.esc(p.pos)}</span>
          ${UI.avatar(p.name, c.club.colorA, 84)}
        </div>
        <div class="ph-info">
          <h2>${p.number !== '' ? `<span class="muted">#${p.number}</span> ` : ''}${U.esc(p.name)} ${p.captain ? '<span class="cap">C</span>' : ''}</h2>
          <p>${UI.pos(p.pos)} ${p.altPos ? `<small class="muted">(${U.esc(p.altPos)})</small>` : ''} · ${p.age} anos · ${U.esc(p.nat || '—')} · Pé ${U.esc(p.foot || '—').toLowerCase()} · ${U.esc(E.STATUS_LABEL[p.status])} ${p.youth ? '· 🌱 Cria da base' : ''}</p>
          <div class="ph-kpis">
            <div><small>Potencial</small>${UI.ovr(p.pot)}</div>
            <div><small>Valor</small><b>${U.money(p.value)}</b></div>
            <div><small>Salário</small><b>${U.money(p.wage)}/sem</b></div>
            <div><small>Contrato</small><b class="${p.contractUntil <= c.seasonYear + 1 ? 'warn-txt' : ''}">${p.contractUntil || '—'}</b></div>
            <div><small>Moral</small><b>${UI.moraleIcon(p.morale)} ${UI.moraleLabel(p.morale)}</b></div>
            <div><small>Papel</small><b>${U.esc(p.role)}</b></div>
          </div>
          ${p.injury.active ? `<div class="alert bad">🚑 Lesionado${p.injury.note ? ': ' + U.esc(p.injury.note) : ''}${p.injury.until ? ' · volta prevista ' + U.fmtDate(p.injury.until) : ''} <button class="btn sm" data-act="healPlayer" data-id="${p.id}">Recuperado</button></div>` : ''}
          <div class="row gap wrap">
            <button class="btn" data-act="editPlayer" data-id="${p.id}">✏️ Editar</button>
            <button class="btn" data-act="quickOvr" data-id="${p.id}" data-d="1">＋1 OVR</button>
            <button class="btn" data-act="quickOvr" data-id="${p.id}" data-d="-1">−1 OVR</button>
            <button class="btn" data-act="renewContract" data-id="${p.id}">📄 Renovar</button>
            ${p.status === 'elenco' ? `<button class="btn" data-act="sellPlayer" data-id="${p.id}">💰 Vender/Emprestar</button>` : ''}
            ${p.status === 'emprestado' ? `<button class="btn" data-act="returnLoan" data-id="${p.id}">↩️ Retornar do empréstimo</button>` : ''}
            ${p.status === 'base' ? `<button class="btn" data-act="promoteYouth" data-id="${p.id}">⬆️ Promover ao profissional</button>` : ''}
            <button class="btn ghost" data-act="statAdj" data-id="${p.id}">➕ Estatísticas manuais</button>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-head"><h3>Temporada ${U.seasonLabel(c.seasonYear)}</h3></div>
          <div class="stat-grid">
            ${[['Jogos', s.apps], ['Titular', s.starts], ['Gols', s.goals], ['Assist.', s.assists], ['Nota média', s.avg ? s.avg.toFixed(2) : '—'], ['MOTM', s.motm], [p.pos === 'GOL' ? 'Jogos sem sofrer' : 'Clean sheets', s.cs], ['Cartões', `${s.yellow}🟨 ${s.red}🟥`]].map(([l, v]) => `<div><small>${l}</small><b>${v}</b></div>`).join('')}
          </div>
          <h4 class="mt">Carreira no clube</h4>
          <div class="stat-grid">
            ${[['Jogos', all.apps], ['Gols', all.goals], ['Assist.', all.assists], ['Nota', all.avg ? all.avg.toFixed(2) : '—'], ['MOTM', all.motm], ['Desde', U.seasonLabel(p.joined)]].map(([l, v]) => `<div><small>${l}</small><b>${v}</b></div>`).join('')}
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Evolução de overall</h3></div>
          ${UI.lineChart([{ name: 'OVR', color: 'var(--accent)', points: ovrSeries, area: true }], { labels: ovrSeries.map((x) => x.label), height: 160 })}
          <div class="card-head mt"><h3>Notas nos últimos jogos</h3></div>
          ${ratingSeries.length ? UI.lineChart([{ name: 'Nota', color: '#38bdf8', points: ratingSeries }], { yMin: 4, yMax: 10, height: 140 }) : '<p class="muted">Sem notas registradas.</p>'}
        </div>
      </div>

      ${seasons.length ? `<div class="card"><div class="card-head"><h3>Por temporada</h3></div>
        <div class="table-wrap"><table class="tbl"><thead><tr><th>Temporada</th><th class="num">J</th><th class="num">G</th><th class="num">A</th><th class="num">Nota</th><th class="num">MOTM</th><th class="num">CS</th></tr></thead><tbody>
        ${seasons.map((y) => { const x = E.playerStats(c, p.id, y); return `<tr><td>${U.seasonLabel(y)}</td><td class="num">${x.apps}</td><td class="num">${x.goals}</td><td class="num">${x.assists}</td><td class="num">${UI.rating(x.avg)}</td><td class="num">${x.motm}</td><td class="num">${x.cs}</td></tr>`; }).join('')}
        </tbody></table></div></div>` : ''}

      <div class="grid-2">
        <div class="card">
          <div class="card-head"><h3>Últimas partidas</h3></div>
          ${matches.length ? `<div class="table-wrap"><table class="tbl compact"><tbody>${matches.slice(0, 12).map((m) => {
            const g = m.goals.filter((x) => x.pid === p.id && !x.og).length, a = m.goals.filter((x) => x.assist === p.id).length;
            return `<tr><td>${UI.res(E.result(m))}</td><td><a href="#/match/${m.id}">${U.esc(m.opponent)}</a> <small class="muted">${m.gf}x${m.ga}</small></td><td class="muted">${U.fmtDate(m.date)}</td><td>${'⚽'.repeat(g)}${'🅰️'.repeat(a)}${m.motm === p.id ? '⭐' : ''}</td><td class="num">${UI.rating(m.ratings[p.id])}</td></tr>`;
          }).join('')}</tbody></table></div>` : '<p class="muted">Ainda não entrou em campo.</p>'}
        </div>
        <div class="card">
          <div class="card-head"><h3>Notas e histórico</h3></div>
          ${p.notes ? `<p class="prewrap">${U.esc(p.notes)}</p>` : '<p class="muted">Sem anotações.</p>'}
          <ul class="timeline">
            <li><b>${U.seasonLabel(p.joined)}</b> Chegou ${p.youth ? 'da base' : p.joinedFrom ? 'do ' + U.esc(p.joinedFrom) : ''}${p.fee ? ' por ' + U.money(p.fee) : ''}</li>
            ${transfers.map((t) => `<li><b>${U.fmtDate(t.date)}</b> ${U.esc(E.TRANSFER_TYPES[t.type].label)} ${t.club ? '— ' + U.esc(t.club) : ''} ${t.fee ? '(' + U.money(t.fee) + ')' : ''}</li>`).join('')}
            ${p.ovrHistory.length > 1 ? `<li><b>OVR</b> ${p.ovrHistory.map((h) => h.ovr).join(' → ')}</li>` : ''}
          </ul>
        </div>
      </div>`;
    },
  };

  A.healPlayer = (el) => { const p = E.player(S.career(), el.dataset.id); p.injury = { active: false, note: '', until: '' }; App().commit(`${p.name} recuperado!`); };
  A.quickOvr = (el) => {
    const c = S.career();
    const p = E.player(c, el.dataset.id);
    const d = Number(el.dataset.d);
    p.ovr = U.clamp(p.ovr + d, 1, 99);
    if (p.pot < p.ovr) p.pot = p.ovr;
    const h = p.ovrHistory, last = h[h.length - 1];
    if (last && last.date === c.gameDate) last.ovr = p.ovr;
    else h.push({ season: c.seasonYear, ovr: p.ovr, date: c.gameDate });
    App().commit(`${p.name}: OVR ${p.ovr}`);
  };
  A.renewContract = (el) => {
    const c = S.career();
    const p = E.player(c, el.dataset.id);
    const m = UI.modal({
      title: `Renovar contrato — ${U.esc(p.name)}`, size: 'sm',
      body: `${UI.field('Novo contrato até', `<input type="number" id="rc-y" value="${Math.max(p.contractUntil, c.seasonYear) + 2}">`)}${UI.field('Novo salário semanal', `<input id="rc-w" value="${U.moneyInput(p.wage)}">`)}${UI.field('Luvas / bônus de assinatura (opcional)', '<input id="rc-b" placeholder="ex.: 2m">')}`,
      actions: `<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="rc-ok">Renovar</button>`,
    });
    m.$('#rc-ok').onclick = () => {
      p.contractUntil = U.num(m.$('#rc-y').value, p.contractUntil);
      p.wage = U.parseMoney(m.$('#rc-w').value);
      const b = U.parseMoney(m.$('#rc-b').value);
      if (b) E.addTransaction(c, { type: 'out', category: 'Luvas / bônus', amount: b, desc: `Renovação de ${p.name}` });
      p.morale = U.clamp(p.morale + 8, 0, 100);
      E.addNews(c, { type: 'mercado', icon: '📝', title: `${p.name} renova com o ${c.club.name} até ${p.contractUntil}`, body: `Novo vínculo assinado. ${c.manager.name} comemorou a permanência do jogador.` });
      m.close();
      App().commit('Contrato renovado');
    };
  };
  A.promoteYouth = (el) => {
    const c = S.career();
    E.registerTransfer(c, { type: 'base', playerId: el.dataset.id, playerName: E.player(c, el.dataset.id).name });
    E.player(c, el.dataset.id).youth = true;
    App().commit('Promovido ao time principal!');
  };
  A.returnLoan = (el) => {
    const c = S.career();
    const p = E.player(c, el.dataset.id);
    E.registerTransfer(c, { type: 'retorno', playerId: p.id, playerName: p.name, club: p.loanedTo });
    p.loanedTo = '';
    App().commit('Jogador reintegrado');
  };
  A.statAdj = (el) => {
    const c = S.career();
    const p = E.player(c, el.dataset.id);
    const y = c.seasonYear;
    const a = (p.statAdj && p.statAdj[y]) || {};
    const m = UI.modal({
      title: `Estatísticas manuais — ${U.esc(p.name)}`, size: 'md',
      body: `<p class="hint">Use para lançar números que não vieram de partidas registradas aqui (ex.: jogos antes de começar a usar o app). Somados às partidas.</p>
      ${UI.field('Temporada', `<select id="sa-y">${UI.options(Array.from({ length: c.seasonYear - c.startSeasonYear + 1 }, (_, i) => ({ v: c.startSeasonYear + i, l: U.seasonLabel(c.startSeasonYear + i) })), y)}</select>`)}
      <div class="grid-4" id="sa">${['apps:Jogos', 'goals:Gols', 'assists:Assist.', 'cs:Clean sheets', 'yellow:Amarelos', 'red:Vermelhos', 'motm:MOTM', 'avg:Nota média'].map((x) => { const [k, l] = x.split(':'); return UI.field(l, `<input type="number" step="${k === 'avg' ? '0.1' : '1'}" name="${k}" value="${a[k] || ''}">`); }).join('')}</div>`,
      actions: `<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="sa-ok">Salvar</button>`,
    });
    m.$('#sa-y').onchange = () => {
      const aa = (p.statAdj && p.statAdj[m.$('#sa-y').value]) || {};
      m.$$('#sa input').forEach((i) => (i.value = aa[i.name] || ''));
    };
    m.$('#sa-ok').onclick = () => {
      const yy = m.$('#sa-y').value;
      p.statAdj = p.statAdj || {};
      p.statAdj[yy] = UI.formData(m.$('#sa'));
      Object.keys(p.statAdj[yy]).forEach((k) => (p.statAdj[yy][k] = U.num(p.statAdj[yy][k], 0)));
      m.close();
      App().commit('Estatísticas atualizadas');
    };
  };
})(window);
