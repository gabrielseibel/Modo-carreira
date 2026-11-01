/* =========================================================
   Motor: regras, estatísticas, notícias, imersão
   ========================================================= */
(function (global) {
  'use strict';
  const MC = (global.MC = global.MC || {});
  const U = MC.U;

  const POSITIONS = ['GOL', 'LD', 'ZAG', 'LE', 'ADD', 'ADE', 'VOL', 'MC', 'MEI', 'MD', 'ME', 'PD', 'PE', 'SA', 'ATA'];
  const POS_GROUP = {
    GOL: 'GOL',
    LD: 'DEF', ZAG: 'DEF', LE: 'DEF', ADD: 'DEF', ADE: 'DEF',
    VOL: 'MEI', MC: 'MEI', MEI: 'MEI', MD: 'MEI', ME: 'MEI',
    PD: 'ATA', PE: 'ATA', SA: 'ATA', ATA: 'ATA',
  };
  const GROUP_ORDER = { GOL: 0, DEF: 1, MEI: 2, ATA: 3 };
  const POS_ORDER = POSITIONS.reduce((o, p, i) => ((o[p] = i), o), {});

  const COMP_TYPES = {
    liga: 'Liga',
    copa: 'Copa Nacional',
    continental: 'Continental',
    supercopa: 'Supercopa',
    mundial: 'Mundial de Clubes',
    amistoso: 'Amistoso',
  };

  const COMP_STATUS = ['Em andamento', 'Campeão', 'Vice-campeão', 'Semifinal', 'Quartas de final', 'Oitavas de final', 'Fase de grupos', 'Eliminado', 'Não disputou'];

  const STATUS_LABEL = {
    elenco: 'Elenco',
    base: 'Base',
    emprestado: 'Emprestado',
    vendido: 'Vendido',
    dispensado: 'Dispensado',
    aposentado: 'Aposentado',
  };

  const ROLES = ['Craque', 'Titular', 'Rotação', 'Reserva', 'Promessa'];

  const FORMATIONS = {
    '4-3-3': [['GOL', 50, 92], ['LE', 15, 72], ['ZAG', 37, 76], ['ZAG', 63, 76], ['LD', 85, 72], ['MC', 30, 52], ['VOL', 50, 58], ['MC', 70, 52], ['PE', 18, 25], ['ATA', 50, 18], ['PD', 82, 25]],
    '4-2-3-1': [['GOL', 50, 92], ['LE', 15, 72], ['ZAG', 37, 76], ['ZAG', 63, 76], ['LD', 85, 72], ['VOL', 37, 58], ['VOL', 63, 58], ['ME', 18, 36], ['MEI', 50, 38], ['MD', 82, 36], ['ATA', 50, 16]],
    '4-4-2': [['GOL', 50, 92], ['LE', 15, 72], ['ZAG', 37, 76], ['ZAG', 63, 76], ['LD', 85, 72], ['ME', 15, 47], ['MC', 38, 52], ['MC', 62, 52], ['MD', 85, 47], ['ATA', 38, 20], ['ATA', 62, 20]],
    '4-1-2-1-2': [['GOL', 50, 92], ['LE', 15, 72], ['ZAG', 37, 76], ['ZAG', 63, 76], ['LD', 85, 72], ['VOL', 50, 62], ['MC', 28, 48], ['MC', 72, 48], ['MEI', 50, 36], ['ATA', 38, 18], ['ATA', 62, 18]],
    '4-3-2-1': [['GOL', 50, 92], ['LE', 15, 72], ['ZAG', 37, 76], ['ZAG', 63, 76], ['LD', 85, 72], ['MC', 28, 56], ['VOL', 50, 60], ['MC', 72, 56], ['SA', 33, 33], ['SA', 67, 33], ['ATA', 50, 16]],
    '3-5-2': [['GOL', 50, 92], ['ZAG', 28, 76], ['ZAG', 50, 78], ['ZAG', 72, 76], ['ME', 10, 46], ['VOL', 36, 58], ['VOL', 64, 58], ['MD', 90, 46], ['MEI', 50, 38], ['ATA', 38, 18], ['ATA', 62, 18]],
    '3-4-3': [['GOL', 50, 92], ['ZAG', 28, 76], ['ZAG', 50, 78], ['ZAG', 72, 76], ['ME', 12, 50], ['MC', 38, 54], ['MC', 62, 54], ['MD', 88, 50], ['PE', 20, 24], ['ATA', 50, 18], ['PD', 80, 24]],
    '5-3-2': [['GOL', 50, 92], ['ADE', 10, 66], ['ZAG', 30, 76], ['ZAG', 50, 78], ['ZAG', 70, 76], ['ADD', 90, 66], ['MC', 30, 50], ['VOL', 50, 56], ['MC', 70, 50], ['ATA', 38, 20], ['ATA', 62, 20]],
    '5-2-1-2': [['GOL', 50, 92], ['ADE', 10, 64], ['ZAG', 30, 76], ['ZAG', 50, 78], ['ZAG', 70, 76], ['ADD', 90, 64], ['MC', 36, 54], ['MC', 64, 54], ['MEI', 50, 38], ['ATA', 38, 18], ['ATA', 62, 18]],
    '4-2-4': [['GOL', 50, 92], ['LE', 15, 72], ['ZAG', 37, 76], ['ZAG', 63, 76], ['LD', 85, 72], ['MC', 38, 54], ['MC', 62, 54], ['PE', 12, 26], ['ATA', 38, 18], ['ATA', 62, 18], ['PD', 88, 26]],
  };

  const Engine = (MC.Engine = {
    POSITIONS, POS_GROUP, GROUP_ORDER, POS_ORDER, COMP_TYPES, COMP_STATUS, STATUS_LABEL, ROLES, FORMATIONS,
  });

  /* ---------------- Criação / migração ---------------- */
  Engine.newCareer = function (o) {
    const year = Number(o.seasonYear) || 2026;
    const c = {
      id: U.uid('car_'),
      name: o.name || `${o.clubName} — ${o.managerName}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      game: 'EA SPORTS FC 27',
      currency: o.currency || '€',
      difficulty: o.difficulty || 'Profissional',
      seasonYear: year,
      startSeasonYear: year,
      gameDate: `${year}-07-01`,
      manager: {
        name: o.managerName || 'Treinador',
        nationality: o.managerNat || 'Brasil',
        age: Number(o.managerAge) || 40,
        style: o.style || 'Equilibrado',
        reputation: 50,
        avatarColor: o.colorA || '#22c55e',
        bio: '',
      },
      club: {
        name: o.clubName || 'Meu Clube',
        short: (o.clubShort || o.clubName || 'MCL').slice(0, 3).toUpperCase(),
        league: o.league || 'Liga',
        country: o.country || '',
        stadium: o.stadium || '',
        colorA: o.colorA || '#22c55e',
        colorB: o.colorB || '#0f172a',
        rivals: o.rivals || '',
        badge: o.badge || '',
      },
      board: { confidence: 60, fans: 60 },
      finances: {
        balance: U.parseMoney(o.balance) || 0,
        transferBudget: U.parseMoney(o.transferBudget) || 0,
        wageBudget: U.parseMoney(o.wageBudget) || 0,
      },
      transactions: [],
      players: [],
      matches: [],
      competitions: [],
      transfers: [],
      shortlist: [],
      objectives: [],
      trophies: [],
      news: [],
      journal: [],
      seasons: [],
      achievements: {},
      press: [],
      events: [],
      challenges: [],
      tactics: { formation: '4-3-3', slots: {}, style: o.style || 'Equilibrado', notes: '' },
      managerHistory: [{ club: o.clubName || 'Meu Clube', from: year, to: null }],
      youth: { scouts: [] },
    };
    // Competições iniciais
    const comps = [];
    comps.push(Engine.newCompetition(c, { name: o.league || 'Liga', type: 'liga', teams: o.leagueTeams }));
    if (o.cup) comps.push(Engine.newCompetition(c, { name: o.cup, type: 'copa' }));
    if (o.continental) comps.push(Engine.newCompetition(c, { name: o.continental, type: 'continental' }));
    c.competitions = comps;
    if (Array.isArray(o.objectives)) {
      o.objectives.forEach((t) => t && c.objectives.push(Engine.newObjective(c, { text: t })));
    }
    Engine.addNews(c, {
      type: 'oficial',
      title: `${c.club.name} anuncia ${c.manager.name} como novo treinador`,
      body: `O ${c.club.name} oficializou a chegada de ${c.manager.name} para comandar a equipe na temporada ${U.seasonLabel(year)}. A diretoria espera ${o.objectives && o.objectives[0] ? '“' + o.objectives[0] + '”' : 'uma campanha competitiva'} e a torcida já lota as redes sociais com expectativa.`,
      icon: '✍️',
    });
    return c;
  };

  Engine.newCompetition = function (c, o) {
    const comp = {
      id: U.uid('cmp_'),
      season: o.season || c.seasonYear,
      name: o.name || 'Competição',
      type: o.type || 'liga',
      status: 'Em andamento',
      stage: o.stage || '',
      table: [],
      notes: '',
    };
    if (comp.type === 'liga') {
      let teams = o.teams;
      if (typeof teams === 'string') teams = teams.split(/\n|;/).map((s) => s.trim()).filter(Boolean);
      comp.table = [{ id: 'user', name: c.club.name, isUser: true, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, str: 75 }];
      (teams || []).forEach((t) => {
        if (t && t.toLowerCase() !== c.club.name.toLowerCase())
          comp.table.push({ id: U.uid('tm_'), name: t, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, str: 72 });
      });
    }
    return comp;
  };

  Engine.newPlayer = function (c, o) {
    const p = {
      id: U.uid('pl_'),
      name: (o.name || 'Jogador').trim(),
      pos: POSITIONS.includes(o.pos) ? o.pos : 'MC',
      altPos: o.altPos || '',
      age: Number(o.age) || 20,
      nat: o.nat || '',
      ovr: U.clamp(Number(o.ovr) || 60, 1, 99),
      pot: U.clamp(Number(o.pot) || Number(o.ovr) || 60, 1, 99),
      value: U.parseMoney(o.value),
      wage: U.parseMoney(o.wage),
      contractUntil: Number(o.contractUntil) || c.seasonYear + 3,
      number: o.number === '' || o.number == null ? '' : Number(o.number),
      status: o.status || 'elenco',
      role: o.role || 'Rotação',
      foot: o.foot || 'Direito',
      morale: Number(o.morale) || 70,
      injury: { active: false, note: '', until: '' },
      notes: o.notes || '',
      joined: Number(o.joined) || c.seasonYear,
      joinedFrom: o.joinedFrom || '',
      fee: U.parseMoney(o.fee),
      youth: !!o.youth,
      favorite: false,
      captain: false,
      ovrHistory: [{ season: c.seasonYear, ovr: U.clamp(Number(o.ovr) || 60, 1, 99), date: c.gameDate }],
      statAdj: {},
      leftAt: null,
      leftTo: '',
    };
    return p;
  };

  Engine.newObjective = function (c, o) {
    return {
      id: U.uid('obj_'),
      season: o.season || c.seasonYear,
      category: o.category || 'Desempenho',
      text: o.text || '',
      priority: o.priority || 'Alta',
      status: o.status || 'pendente',
    };
  };

  Engine.migrateCareer = function (c) {
    if (!c) return c;
    const def = {
      transactions: [], players: [], matches: [], competitions: [], transfers: [], shortlist: [],
      objectives: [], trophies: [], news: [], journal: [], seasons: [], press: [], events: [], challenges: [],
      managerHistory: [],
    };
    Object.keys(def).forEach((k) => { if (!Array.isArray(c[k])) c[k] = def[k]; });
    c.achievements = c.achievements || {};
    c.board = Object.assign({ confidence: 60, fans: 60 }, c.board || {});
    c.finances = Object.assign({ balance: 0, transferBudget: 0, wageBudget: 0 }, c.finances || {});
    c.tactics = Object.assign({ formation: '4-3-3', slots: {}, style: 'Equilibrado', notes: '' }, c.tactics || {});
    c.manager = Object.assign({ name: 'Treinador', reputation: 50 }, c.manager || {});
    c.club = Object.assign({ name: 'Clube', colorA: '#22c55e', colorB: '#0f172a', rivals: '' }, c.club || {});
    c.youth = c.youth || { scouts: [] };
    c.currency = c.currency || '€';
    c.seasonYear = Number(c.seasonYear) || 2026;
    c.startSeasonYear = Number(c.startSeasonYear) || c.seasonYear;
    c.gameDate = c.gameDate || `${c.seasonYear}-07-01`;
    c.players.forEach((p) => {
      p.statAdj = p.statAdj || {};
      p.injury = p.injury || { active: false, note: '', until: '' };
      p.ovrHistory = p.ovrHistory || [{ season: c.seasonYear, ovr: p.ovr }];
      if (p.morale == null) p.morale = 70;
      if (!p.role) p.role = 'Rotação';
    });
    c.matches.forEach((m) => {
      m.lineup = m.lineup || [];
      m.subs = m.subs || [];
      m.goals = m.goals || [];
      m.ratings = m.ratings || {};
      m.yellows = m.yellows || [];
      m.reds = m.reds || [];
      m.injuries = m.injuries || [];
      m.stats = m.stats || {};
    });
    return c;
  };

  /* ---------------- Consultas ---------------- */
  Engine.player = (c, id) => c.players.find((p) => p.id === id);
  Engine.comp = (c, id) => c.competitions.find((x) => x.id === id);
  Engine.activePlayers = (c) => c.players.filter((p) => p.status === 'elenco' || p.status === 'base' || p.status === 'emprestado');
  Engine.squad = (c) => c.players.filter((p) => p.status === 'elenco');

  Engine.sortPlayers = (list) =>
    list.slice().sort((a, b) => (POS_ORDER[a.pos] ?? 99) - (POS_ORDER[b.pos] ?? 99) || b.ovr - a.ovr);

  Engine.seasonMatches = (c, season = c.seasonYear, playedOnly = true) =>
    c.matches
      .filter((m) => (season === 'all' || m.season === season) && (!playedOnly || m.played))
      .sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.createdAt || '').localeCompare(b.createdAt || ''));

  Engine.upcoming = (c) =>
    c.matches
      .filter((m) => !m.played && m.season === c.seasonYear)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  Engine.result = (m) => {
    if (!m.played) return null;
    if (m.gf > m.ga) return 'V';
    if (m.gf < m.ga) return 'D';
    if (m.pens && m.pens.gf != null && m.pens.ga != null && m.pens.gf !== m.pens.ga)
      return m.pens.gf > m.pens.ga ? 'V' : 'D';
    return 'E';
  };

  Engine.isRival = (c, opp) => {
    if (!c.club.rivals || !opp) return false;
    return c.club.rivals
      .split(/[,;\n]/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .some((r) => opp.toLowerCase().includes(r) || r.includes(opp.toLowerCase()));
  };

  Engine.record = (matches) => {
    const r = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, cs: 0 };
    matches.forEach((m) => {
      if (!m.played) return;
      r.p++;
      r.gf += m.gf;
      r.ga += m.ga;
      if (m.ga === 0) r.cs++;
      const res = Engine.result(m);
      if (res === 'V') r.w++;
      else if (res === 'D') r.l++;
      else r.d++;
    });
    r.winPct = r.p ? Math.round((r.w / r.p) * 100) : 0;
    return r;
  };

  Engine.form = (c, n = 5, season = c.seasonYear) => Engine.seasonMatches(c, season).slice(-n).map(Engine.result);

  /** Estatísticas de um jogador (partidas + ajustes manuais) */
  Engine.playerStats = function (c, pid, season = c.seasonYear) {
    const s = { apps: 0, starts: 0, goals: 0, assists: 0, cs: 0, yellow: 0, red: 0, motm: 0, ratingSum: 0, ratingN: 0, avg: 0 };
    const matches = Engine.seasonMatches(c, season);
    const p = Engine.player(c, pid);
    matches.forEach((m) => {
      const started = m.lineup.includes(pid);
      const sub = m.subs.includes(pid);
      if (started || sub) {
        s.apps++;
        if (started) s.starts++;
        if (m.ga === 0 && p && (p.pos === 'GOL' || POS_GROUP[p.pos] === 'DEF') && started) s.cs++;
      }
      m.goals.forEach((g) => {
        if (g.pid === pid && !g.og) s.goals++;
        if (g.assist === pid) s.assists++;
      });
      if (m.yellows.includes(pid)) s.yellow++;
      if (m.reds.includes(pid)) s.red++;
      if (m.motm === pid) s.motm++;
      const r = Number(m.ratings[pid]);
      if (r > 0) { s.ratingSum += r; s.ratingN++; }
    });
    // Ajustes manuais (estatísticas anteriores ao app etc.)
    const seasons = season === 'all' ? Object.keys((p && p.statAdj) || {}) : [season];
    if (p && p.statAdj) {
      seasons.forEach((y) => {
        const a = p.statAdj[y];
        if (!a) return;
        ['apps', 'goals', 'assists', 'cs', 'yellow', 'red', 'motm'].forEach((k) => (s[k] += Number(a[k]) || 0));
        if (a.avg && a.apps) { s.ratingSum += Number(a.avg) * Number(a.apps); s.ratingN += Number(a.apps); }
      });
    }
    s.avg = s.ratingN ? s.ratingSum / s.ratingN : 0;
    s.ga = s.goals + s.assists;
    return s;
  };

  Engine.allPlayerStats = function (c, season = c.seasonYear, includeGone = false) {
    return c.players
      .filter((p) => includeGone || ['elenco', 'base', 'emprestado'].includes(p.status))
      .map((p) => ({ p, s: Engine.playerStats(c, p.id, season) }));
  };

  Engine.leaders = function (c, season = c.seasonYear) {
    const all = Engine.allPlayerStats(c, season, true).filter((x) => x.s.apps > 0);
    const top = (k, f) => all.slice().sort((a, b) => b.s[k] - a.s[k])[0];
    const rated = all.filter((x) => x.s.ratingN >= 3).sort((a, b) => b.s.avg - a.s.avg)[0];
    return {
      goals: top('goals'),
      assists: top('assists'),
      apps: top('apps'),
      motm: top('motm'),
      rating: rated,
      cs: top('cs'),
    };
  };

  /** Tabela da liga: linha do usuário calculada pelas partidas; demais times manuais */
  Engine.leagueTable = function (c, comp) {
    if (!comp || comp.type !== 'liga') return [];
    const userMatches = c.matches.filter((m) => m.played && m.compId === comp.id);
    const r = Engine.record(userMatches);
    const rows = comp.table.map((t) => {
      const row = Object.assign({}, t);
      if (t.isUser) {
        // usa partidas se houver; senão mantém manual
        if (userMatches.length || !t.manual) {
          // em liga não há pênaltis
          const rr = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 };
          userMatches.forEach((m) => {
            rr.p++; rr.gf += m.gf; rr.ga += m.ga;
            if (m.gf > m.ga) rr.w++; else if (m.gf < m.ga) rr.l++; else rr.d++;
          });
          Object.assign(row, rr);
          row.p += Number(t.adjP) || 0;
        }
        row.name = c.club.name;
      }
      row.pts = row.w * 3 + row.d + (Number(row.ptsAdj) || 0);
      row.gd = row.gf - row.ga;
      return row;
    });
    void r;
    rows.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name));
    rows.forEach((row, i) => (row.pos = i + 1));
    return rows;
  };

  Engine.userLeaguePos = function (c, season = c.seasonYear) {
    const comp = c.competitions.find((x) => x.season === season && x.type === 'liga');
    if (!comp) return null;
    const t = Engine.leagueTable(c, comp);
    if (comp.finalPos) return Number(comp.finalPos);
    const u = t.find((x) => x.isUser);
    return u && t.length > 1 && u.p > 0 ? u.pos : null;
  };

  /** Simula jogos dos outros times da liga (uma rodada) */
  Engine.simulateRound = function (c, comp) {
    const others = comp.table.filter((t) => !t.isUser);
    const sh = U.shuffle(others);
    const goals = (str) => {
      const base = 0.6 + (str - 60) / 25;
      let g = 0;
      for (let i = 0; i < 6; i++) if (Math.random() < Math.max(0.05, base) / 4.2) g++;
      return g;
    };
    const lines = [];
    for (let i = 0; i + 1 < sh.length; i += 2) {
      const a = sh[i], b = sh[i + 1];
      const ga = goals((a.str || 72) + 3), gb = goals(b.str || 72);
      a.p++; b.p++; a.gf += ga; a.ga += gb; b.gf += gb; b.ga += ga;
      if (ga > gb) { a.w++; b.l++; } else if (gb > ga) { b.w++; a.l++; } else { a.d++; b.d++; }
      lines.push(`${a.name} ${ga} x ${gb} ${b.name}`);
    }
    return lines;
  };

  /* ---------------- Finanças ---------------- */
  Engine.addTransaction = function (c, o) {
    const t = {
      id: U.uid('tx_'),
      season: c.seasonYear,
      date: o.date || c.gameDate,
      type: o.type === 'in' ? 'in' : 'out',
      category: o.category || 'Outros',
      amount: Math.abs(U.parseMoney(o.amount)),
      desc: o.desc || '',
      ref: o.ref || null,
    };
    c.transactions.push(t);
    c.finances.balance += t.type === 'in' ? t.amount : -t.amount;
    return t;
  };

  Engine.removeTransaction = function (c, id) {
    const t = c.transactions.find((x) => x.id === id);
    if (!t) return;
    c.finances.balance -= t.type === 'in' ? t.amount : -t.amount;
    c.transactions = c.transactions.filter((x) => x.id !== id);
  };

  Engine.wageBill = (c) => U.sum(Engine.squad(c).concat(c.players.filter((p) => p.status === 'base')), (p) => p.wage);
  Engine.squadValue = (c) => U.sum(Engine.activePlayers(c), (p) => p.value);

  /* ---------------- Transferências ---------------- */
  const TRANSFER_TYPES = {
    compra: { label: 'Contratação', dir: 'in', money: 'out' },
    emprestimo_in: { label: 'Empréstimo (chegada)', dir: 'in', money: 'out' },
    livre: { label: 'Chegada livre', dir: 'in', money: null },
    base: { label: 'Promovido da base', dir: 'in', money: null },
    venda: { label: 'Venda', dir: 'out', money: 'in' },
    emprestimo_out: { label: 'Empréstimo (saída)', dir: 'out', money: 'in' },
    dispensa: { label: 'Dispensa / rescisão', dir: 'out', money: 'out' },
    aposentadoria: { label: 'Aposentadoria', dir: 'out', money: null },
    retorno: { label: 'Retorno de empréstimo', dir: 'in', money: null },
  };
  Engine.TRANSFER_TYPES = TRANSFER_TYPES;

  Engine.registerTransfer = function (c, o) {
    const tt = TRANSFER_TYPES[o.type] || TRANSFER_TYPES.compra;
    const fee = U.parseMoney(o.fee);
    const t = {
      id: U.uid('tr_'),
      season: c.seasonYear,
      date: o.date || c.gameDate,
      type: o.type,
      playerId: o.playerId || null,
      playerName: o.playerName,
      club: o.club || '',
      fee,
      wage: U.parseMoney(o.wage),
      notes: o.notes || '',
      addOns: o.addOns || '',
    };
    let p = o.playerId ? Engine.player(c, o.playerId) : null;

    if (tt.dir === 'in') {
      if (!p && o.type !== 'retorno') {
        p = Engine.newPlayer(c, Object.assign({}, o.playerData || {}, {
          name: o.playerName, joinedFrom: o.club, fee, wage: o.wage,
        }));
        c.players.push(p);
      }
      if (p) {
        p.status = 'elenco';
        if (o.type !== 'retorno') { p.joined = c.seasonYear; p.joinedFrom = o.club; p.fee = fee; }
        if (o.type === 'emprestimo_in') p.onLoanFrom = o.club;
        if (t.wage) p.wage = t.wage;
        t.playerId = p.id;
        t.playerName = p.name;
      }
      if (fee && tt.money === 'out') {
        Engine.addTransaction(c, { type: 'out', category: 'Transferências', amount: fee, desc: `${tt.label}: ${t.playerName} (${o.club || '—'})`, ref: t.id });
        c.finances.transferBudget = Math.max(0, c.finances.transferBudget - fee);
      }
    } else {
      if (p) {
        p.status = o.type === 'emprestimo_out' ? 'emprestado' : o.type === 'aposentadoria' ? 'aposentado' : o.type === 'venda' ? 'vendido' : 'dispensado';
        p.leftAt = c.seasonYear;
        p.leftTo = o.club || '';
        if (o.type === 'emprestimo_out') p.loanedTo = o.club;
        t.playerName = p.name;
        // remove do time tático
        Object.keys(c.tactics.slots).forEach((k) => { if (c.tactics.slots[k] === p.id) delete c.tactics.slots[k]; });
      }
      if (fee && tt.money === 'in') {
        Engine.addTransaction(c, { type: 'in', category: 'Transferências', amount: fee, desc: `${tt.label}: ${t.playerName} (${o.club || '—'})`, ref: t.id });
        if (o.addToBudget !== false) c.finances.transferBudget += Math.round(fee * (o.budgetPct != null ? o.budgetPct : 1));
      }
      if (fee && tt.money === 'out') {
        Engine.addTransaction(c, { type: 'out', category: 'Rescisões', amount: fee, desc: `${tt.label}: ${t.playerName}`, ref: t.id });
      }
    }
    c.transfers.push(t);
    Engine.newsForTransfer(c, t, p);
    Engine.checkAchievements(c);
    return t;
  };

  Engine.undoTransfer = function (c, id) {
    const t = c.transfers.find((x) => x.id === id);
    if (!t) return;
    c.transactions.filter((x) => x.ref === id).forEach((x) => Engine.removeTransaction(c, x.id));
    const tt = TRANSFER_TYPES[t.type];
    const p = Engine.player(c, t.playerId);
    if (p) {
      if (tt.dir === 'out') { p.status = 'elenco'; p.leftAt = null; p.leftTo = ''; }
      else if (t.type !== 'retorno') {
        const hasMatches = c.matches.some((m) => m.lineup.includes(p.id) || m.subs.includes(p.id));
        if (!hasMatches) c.players = c.players.filter((x) => x.id !== p.id);
        else p.status = 'dispensado';
      }
    }
    c.transfers = c.transfers.filter((x) => x.id !== id);
  };

  /* ---------------- Partidas ---------------- */
  Engine.applyMatchEffects = function (c, m, sign = 1) {
    const res = Engine.result(m);
    const rival = Engine.isRival(c, m.opponent);
    const comp = Engine.comp(c, m.compId);
    const weight = (rival ? 1.8 : 1) * (comp && (comp.type === 'continental' || comp.type === 'mundial') ? 1.3 : comp && comp.type === 'amistoso' ? 0.2 : 1);
    const diff = m.gf - m.ga;
    let board = 0, fans = 0;
    if (res === 'V') { board = 1.5 + Math.min(diff, 4) * 0.4; fans = 2 + Math.min(diff, 4) * 0.6; }
    else if (res === 'E') { board = -0.3; fans = -0.5; }
    else { board = -2.5 + Math.max(diff, -4) * 0.4; fans = -3 + Math.max(diff, -4) * 0.6; }
    c.board.confidence = U.clamp(c.board.confidence + sign * board * weight, 0, 100);
    c.board.fans = U.clamp(c.board.fans + sign * fans * weight, 0, 100);
    c.manager.reputation = U.clamp((c.manager.reputation || 50) + sign * (res === 'V' ? 0.3 : res === 'D' ? -0.25 : 0) * weight, 1, 99);

    // Moral
    const played = new Set([...m.lineup, ...m.subs]);
    Engine.squad(c).forEach((p) => {
      let d = 0;
      if (played.has(p.id)) {
        d += res === 'V' ? 3 : res === 'E' ? 0.5 : -2;
        const r = Number(m.ratings[p.id]);
        if (r >= 8) d += 2; else if (r && r < 6) d -= 1.5;
        if (m.motm === p.id) d += 2;
      } else if (!p.injury.active && (p.role === 'Titular' || p.role === 'Craque')) {
        d -= 2;
      } else if (!p.injury.active) d -= 0.3;
      p.morale = U.clamp((p.morale || 70) + sign * d, 0, 100);
    });
  };

  Engine.saveMatch = function (c, m, isNew) {
    const wasPlayed = !isNew && m._wasPlayed;
    delete m._wasPlayed;
    if (wasPlayed && m._prev) Engine.applyMatchEffects(c, m._prev, -1);
    delete m._prev;
    if (isNew) {
      m.id = m.id || U.uid('m_');
      m.createdAt = new Date().toISOString();
      c.matches.push(m);
    } else {
      const i = c.matches.findIndex((x) => x.id === m.id);
      if (i >= 0) c.matches[i] = m;
    }
    if (m.played) {
      if (m.date && m.date > c.gameDate) c.gameDate = m.date;
      Engine.applyMatchEffects(c, m, 1);
      // Lesões
      (m.injuries || []).forEach((pid) => {
        const p = Engine.player(c, pid);
        if (p && !p.injury.active) {
          p.injury = { active: true, note: 'Lesionado na partida contra ' + m.opponent, until: '' };
        }
      });
      if (!wasPlayed) Engine.newsForMatch(c, m);
      Engine.checkAchievements(c);
    }
    return m;
  };

  Engine.deleteMatch = function (c, id) {
    const m = c.matches.find((x) => x.id === id);
    if (!m) return;
    if (m.played) Engine.applyMatchEffects(c, m, -1);
    c.matches = c.matches.filter((x) => x.id !== id);
  };

  /* ---------------- Notícias ---------------- */
  Engine.addNews = function (c, o) {
    const n = {
      id: U.uid('n_'),
      season: c.seasonYear,
      date: o.date || c.gameDate,
      at: new Date().toISOString(),
      type: o.type || 'geral',
      title: o.title,
      body: o.body || '',
      icon: o.icon || '📰',
      source: o.source || U.pick(Engine.SOURCES),
      ref: o.ref || null,
      pinned: false,
    };
    c.news.unshift(n);
    if (c.news.length > 400) c.news.length = 400;
    return n;
  };

  Engine.SOURCES = ['Diário Esportivo', 'Jornal da Bola', 'Rádio Arquibancada', 'Gazeta do Futebol', 'Portal Toque de Bola', 'Canal Tático', 'Revista Camisa 10', 'Blog do Setorista'];

  const T = {
    winBig: [
      '{club} atropela o {opp} e vence por {score}',
      'Show de bola! {club} goleia o {opp} ({score})',
      'Massacre: {club} não toma conhecimento do {opp}',
      '{coach} vê equipe implacável em {score} contra o {opp}',
    ],
    win: [
      '{club} vence o {opp} por {score}',
      'Três pontos: {club} supera o {opp}',
      '{club} bate o {opp} e segue firme',
      'Vitória importante do {club} diante do {opp}',
    ],
    winRival: [
      'Clássico é nosso! {club} vence o rival {opp} por {score}',
      'Festa da torcida: {club} derruba o {opp} no clássico',
    ],
    draw: [
      '{club} e {opp} ficam no empate ({score})',
      'Igualdade no placar: {club} {score} {opp}',
      '{club} tropeça e só empata com o {opp}',
    ],
    loss: [
      '{club} perde para o {opp} por {score}',
      'Derrota amarga: {opp} vence o {club}',
      'Noite para esquecer: {club} cai diante do {opp}',
    ],
    lossBig: [
      'Vexame! {club} é goleado pelo {opp} ({score})',
      'Crise? {club} sofre goleada do {opp} e torcida protesta',
    ],
    lossRival: [
      'Dor no clássico: {club} perde para o rival {opp}',
      'Torcida na bronca após derrota do {club} no clássico',
    ],
  };

  function fill(tpl, map) {
    return tpl.replace(/\{(\w+)\}/g, (_, k) => (map[k] != null ? map[k] : ''));
  }

  Engine.newsForMatch = function (c, m) {
    const res = Engine.result(m);
    const rival = Engine.isRival(c, m.opponent);
    const diff = m.gf - m.ga;
    const comp = Engine.comp(c, m.compId);
    const score = `${m.gf}x${m.ga}`;
    const map = { club: c.club.name, opp: m.opponent, score, coach: c.manager.name };
    let pool, icon;
    if (res === 'V') { pool = rival ? T.winRival : diff >= 3 ? T.winBig : T.win; icon = diff >= 3 ? '🔥' : '✅'; }
    else if (res === 'D') { pool = rival ? T.lossRival : diff <= -3 ? T.lossBig : T.loss; icon = '❌'; }
    else { pool = T.draw; icon = '🤝'; }
    if (m.pens && m.pens.gf != null && m.gf === m.ga) {
      map.score += ` (${m.pens.gf}x${m.pens.ga} pên.)`;
    }
    const scorers = {};
    m.goals.forEach((g) => { if (g.pid && !g.og) scorers[g.pid] = (scorers[g.pid] || 0) + 1; });
    const scorerTxt = Object.entries(scorers)
      .map(([pid, n]) => { const p = Engine.player(c, pid); return p ? p.name + (n > 1 ? ` (${n})` : '') : null; })
      .filter(Boolean).join(', ');
    const motm = Engine.player(c, m.motm);
    let body = `Pela ${comp ? comp.name : 'competição'}${m.round ? ' (' + m.round + ')' : ''}, ${m.venue === 'F' ? 'fora de casa' : m.venue === 'N' ? 'em campo neutro' : 'diante da sua torcida'}, o ${c.club.name} ${res === 'V' ? 'venceu' : res === 'D' ? 'perdeu para' : 'empatou com'} o ${m.opponent}: ${map.score}.`;
    if (scorerTxt) body += ` Gols do ${c.club.short || c.club.name}: ${scorerTxt}.`;
    if (motm) body += ` Melhor em campo: ${motm.name}${m.ratings[motm.id] ? ' (nota ' + m.ratings[motm.id] + ')' : ''}.`;
    if (m.stats && m.stats.possession) body += ` Posse de bola: ${m.stats.possession}%.`;
    Engine.addNews(c, { type: 'partida', title: fill(U.pick(pool), map), body, icon, date: m.date, ref: m.id });

    // Hat-trick
    Object.entries(scorers).forEach(([pid, n]) => {
      const p = Engine.player(c, pid);
      if (p && n >= 3) {
        Engine.addNews(c, {
          type: 'destaque', icon: '⚽', date: m.date,
          title: n >= 4 ? `${p.name} marca ${n} vezes e entra para a história` : `Hat-trick! ${p.name} leva a bola para casa`,
          body: `${p.name} foi o grande nome da partida contra o ${m.opponent}, anotando ${n} gols.`,
        });
      }
    });

    // Sequências
    const form = Engine.seasonMatches(c).map(Engine.result);
    let streakW = 0; for (let i = form.length - 1; i >= 0 && form[i] === 'V'; i--) streakW++;
    let unbeaten = 0; for (let i = form.length - 1; i >= 0 && form[i] !== 'D'; i--) unbeaten++;
    let streakL = 0; for (let i = form.length - 1; i >= 0 && form[i] === 'D'; i--) streakL++;
    if ([5, 8, 10, 15, 20].includes(streakW))
      Engine.addNews(c, { type: 'destaque', icon: '📈', title: `${c.club.name} chega a ${streakW} vitórias seguidas`, body: `A equipe de ${c.manager.name} vive grande fase e não para de vencer.` });
    else if ([10, 15, 20, 25, 30].includes(unbeaten) && res !== 'V')
      Engine.addNews(c, { type: 'destaque', icon: '🛡️', title: `Invencibilidade: ${unbeaten} jogos sem perder`, body: `O ${c.club.name} segue invicto há ${unbeaten} partidas.` });
    if (streakL === 3)
      Engine.addNews(c, { type: 'crise', icon: '⚠️', title: `Pressão sobre ${c.manager.name} após 3 derrotas seguidas`, body: 'Diretoria acompanha de perto o momento ruim da equipe. Os próximos jogos serão decisivos.' });
    if (streakL >= 5 && streakL % 1 === 0 && streakL <= 6)
      Engine.addNews(c, { type: 'crise', icon: '🚨', title: `Crise instalada: ${streakL} derrotas consecutivas`, body: 'Rumores de reunião de emergência no conselho. Torcida organizada protesta no CT.' });

    // Marcos de gols
    Object.keys(scorers).forEach((pid) => {
      const p = Engine.player(c, pid);
      if (!p) return;
      const total = Engine.playerStats(c, pid, 'all').goals;
      [25, 50, 100, 150, 200, 300].forEach((mark) => {
        if (total >= mark && total - scorers[pid] < mark)
          Engine.addNews(c, { type: 'destaque', icon: '🏅', title: `${p.name} alcança ${mark} gols pelo clube`, body: `Marca histórica para ${p.name}, que vira referência na história recente do ${c.club.name}.` });
      });
    });

    // Estreia da base
    m.lineup.concat(m.subs).forEach((pid) => {
      const p = Engine.player(c, pid);
      if (p && p.youth && Engine.playerStats(c, pid, 'all').apps === 1)
        Engine.addNews(c, { type: 'base', icon: '🌱', title: `Cria da base, ${p.name} estreia pelo profissional`, body: `Aos ${p.age} anos, ${p.name} realizou sua primeira partida pelo time principal.` });
    });
  };

  Engine.newsForTransfer = function (c, t, p) {
    const fee = t.fee ? U.money(t.fee, c.currency) : null;
    const map = {
      compra: [
        { title: `OFICIAL: ${t.playerName} é o novo reforço do ${c.club.name}`, body: `O ${c.club.name} acertou a contratação de ${t.playerName}, que chega do ${t.club || 'mercado'}${fee ? ' por ' + fee : ''}. ${p ? `O ${p.pos} de ${p.age} anos (${p.ovr} OVR) assina até ${p.contractUntil}.` : ''}`, icon: '✍️' },
      ],
      emprestimo_in: [{ title: `${t.playerName} chega por empréstimo`, body: `Vindo do ${t.club}, ${t.playerName} reforça o elenco por empréstimo${fee ? ' (custo de ' + fee + ')' : ''}.`, icon: '🔁' }],
      livre: [{ title: `${t.playerName} assina sem custos`, body: `Livre no mercado, ${t.playerName} acertou com o ${c.club.name}.`, icon: '🆓' }],
      base: [{ title: `${t.playerName} é promovido ao time principal`, body: `Destaque das categorias de base, ${t.playerName} ganha oportunidade com ${c.manager.name}.`, icon: '🌱' }],
      venda: [{ title: `${t.playerName} deixa o ${c.club.name} rumo ao ${t.club}`, body: `Negócio fechado${fee ? ' por ' + fee : ''}. ${p && Engine.playerStats(c, p.id, 'all').apps ? `Pelo clube, foram ${Engine.playerStats(c, p.id, 'all').apps} jogos e ${Engine.playerStats(c, p.id, 'all').goals} gols.` : ''}`, icon: '💰' }],
      emprestimo_out: [{ title: `${t.playerName} é emprestado ao ${t.club}`, body: `O jogador vai ganhar minutos e retorna ao fim do empréstimo.`, icon: '🔁' }],
      dispensa: [{ title: `${t.playerName} deixa o clube`, body: `O ${c.club.name} anunciou a saída de ${t.playerName}.`, icon: '👋' }],
      aposentadoria: [{ title: `${t.playerName} anuncia aposentadoria`, body: `Uma carreira chega ao fim. ${t.playerName} pendura as chuteiras.`, icon: '🧤' }],
      retorno: [{ title: `${t.playerName} retorna de empréstimo`, body: `De volta ao clube, ${t.playerName} se reapresenta a ${c.manager.name}.`, icon: '↩️' }],
    };
    const n = U.pick(map[t.type] || map.compra);
    Engine.addNews(c, Object.assign({ type: 'mercado', date: t.date, ref: t.id }, n));
    // Recorde de contratação
    if (t.type === 'compra' && t.fee) {
      const prev = c.transfers.filter((x) => x.type === 'compra' && x.id !== t.id).map((x) => x.fee);
      if (prev.length && t.fee > Math.max(...prev))
        Engine.addNews(c, { type: 'mercado', icon: '💎', title: `${t.playerName} se torna a contratação mais cara da era ${c.manager.name}`, body: `O investimento de ${fee} supera todas as contratações anteriores.` });
    }
  };

  /* ---------------- Rumores ---------------- */
  Engine.generateRumor = function (c) {
    const squad = Engine.squad(c).sort((a, b) => b.ovr - a.ovr);
    const short = c.shortlist.filter((s) => s.status !== 'contratado' && s.status !== 'descartado');
    const bigClubs = ['Real Madrid', 'Manchester City', 'Bayern', 'PSG', 'Barcelona', 'Arsenal', 'Liverpool', 'Juventus', 'Inter', 'Al-Hilal', 'Chelsea', 'Atlético de Madrid', 'Milan', 'Manchester United', 'Napoli', 'Dortmund'];
    const opts = [];
    if (squad.length) {
      const star = U.pick(squad.slice(0, 5));
      const club = U.pick(bigClubs);
      opts.push({ title: `${club} monitora ${star.name}`, body: `Segundo fontes, olheiros do ${club} acompanharam ${star.name} nas últimas partidas. O ${c.club.name} não pretende negociar por menos de ${U.money(Math.round(star.value * U.rand(12, 18) / 10), c.currency)}.` });
      const young = squad.filter((p) => p.age <= 22).sort((a, b) => b.pot - a.pot)[0];
      if (young) opts.push({ title: `Joia do ${c.club.name}, ${young.name} desperta interesse`, body: `Com potencial apontado como ${young.pot >= 85 ? 'de classe mundial' : 'muito alto'}, ${young.name} está na mira de clubes europeus.` });
      const unhappy = squad.filter((p) => p.morale < 45)[0];
      if (unhappy) opts.push({ title: `${unhappy.name} insatisfeito com poucos minutos?`, body: `Pessoas próximas ao jogador dizem que ${unhappy.name} quer mais protagonismo e pode pedir para sair na próxima janela.` });
      const exp = squad.filter((p) => p.contractUntil <= c.seasonYear + 1)[0];
      if (exp) opts.push({ title: `Contrato de ${exp.name} preocupa a diretoria`, body: `O vínculo de ${exp.name} termina em ${exp.contractUntil}. Empresário já conversa com outros clubes.` });
    }
    if (short.length) {
      const s = U.pick(short);
      opts.push({ title: `${c.club.name} sonda ${s.name}`, body: `${c.manager.name} teria pedido a contratação de ${s.name}${s.club ? ' (' + s.club + ')' : ''}. Valor estimado: ${s.value ? U.money(s.value, c.currency) : 'não divulgado'}.` });
    }
    opts.push({ title: `${c.manager.name} na mira de outro clube?`, body: `Após bom trabalho, o nome de ${c.manager.name} aparece em uma lista de técnicos de um clube rival. O treinador desconversa.` });
    const r = U.pick(opts);
    return Engine.addNews(c, { type: 'rumor', icon: '🗣️', title: r.title, body: r.body, source: U.pick(['Fonte anônima', 'Jornalista insider', 'Rede social', ...Engine.SOURCES]) });
  };

  /* ---------------- Coletivas de imprensa ---------------- */
  Engine.pressQuestions = function (c) {
    const form = Engine.form(c, 5);
    const last = Engine.seasonMatches(c).slice(-1)[0];
    const next = Engine.upcoming(c)[0];
    const squad = Engine.squad(c);
    const star = squad.slice().sort((a, b) => b.ovr - a.ovr)[0];
    const top = Engine.leaders(c).goals;
    const unhappy = squad.find((p) => p.morale < 45);
    const qs = [];
    const lastRes = last ? Engine.result(last) : null;

    if (last && lastRes === 'V') qs.push({
      q: `Grande vitória contra o ${last.opponent}. O que explica o bom desempenho?`,
      a: [
        { t: 'O mérito é todo dos jogadores, executaram o plano perfeitamente.', fx: { morale: 3, board: 0, fans: 1 } },
        { t: 'Trabalhamos muito a semana toda; é fruto do método.', fx: { morale: 1, board: 2, fans: 1 } },
        { t: 'Ainda estamos longe do ideal. Vou cobrar mais.', fx: { morale: -2, board: 1, fans: 0 } },
      ],
    });
    if (last && lastRes === 'D') qs.push({
      q: `Derrota para o ${last.opponent}. A torcida está preocupada. O que deu errado?`,
      a: [
        { t: 'A responsabilidade é minha. Eu escolhi errado.', fx: { morale: 2, board: -1, fans: 2 } },
        { t: 'Alguns jogadores não renderam o esperado e vão saber disso.', fx: { morale: -4, board: 1, fans: 0 } },
        { t: 'Arbitragem e detalhes decidiram. Seguimos confiantes.', fx: { morale: 1, board: -1, fans: -1 } },
      ],
    });
    if (next) qs.push({
      q: `Próximo adversário é o ${next.opponent}. Qual a expectativa?`,
      a: [
        { t: 'Vamos para vencer, sem medo. Jogamos para ganhar sempre.', fx: { morale: 2, board: 1, fans: 2 } },
        { t: 'Adversário muito qualificado; vamos respeitar.', fx: { morale: 0, board: 0, fans: -1 } },
        { t: 'Sinceramente, o foco é na recuperação do elenco.', fx: { morale: 1, board: 0, fans: -1 } },
      ],
    });
    if (star) qs.push({
      q: `Há rumores de que grandes clubes querem ${star.name}. Ele fica?`,
      a: [
        { t: `${star.name} é inegociável. Projeto passa por ele.`, fx: { morale: 3, board: -1, fans: 3, player: star.id, pm: 6 } },
        { t: 'No futebol tudo pode acontecer; ouviremos propostas.', fx: { morale: -1, board: 2, fans: -2, player: star.id, pm: -5 } },
        { t: 'Não falo de jogadores de outros clubes nem de rumores.', fx: { morale: 0, board: 0, fans: 0 } },
      ],
    });
    if (top && top.s.goals > 0) qs.push({
      q: `${top.p.name} já tem ${top.s.goals} gols na temporada. Ele pode chegar à seleção?`,
      a: [
        { t: 'Sem dúvida. Está entre os melhores do país.', fx: { morale: 1, fans: 1, player: top.p.id, pm: 5 } },
        { t: 'Ele precisa manter os pés no chão e continuar trabalhando.', fx: { morale: 0, board: 1, player: top.p.id, pm: -1 } },
      ],
    });
    if (unhappy) qs.push({
      q: `${unhappy.name} parece insatisfeito. Ele terá mais chances?`,
      a: [
        { t: 'Sim, conto com ele. Terá oportunidades em breve.', fx: { morale: 1, player: unhappy.id, pm: 8 } },
        { t: 'Quem quiser jogar precisa mostrar nos treinos.', fx: { morale: -1, board: 1, player: unhappy.id, pm: -6 } },
        { t: 'Assunto interno. Não vou expor ninguém.', fx: { morale: 1, player: unhappy.id, pm: 2 } },
      ],
    });
    qs.push({
      q: 'A diretoria vai liberar dinheiro para reforços na próxima janela?',
      a: [
        { t: 'Precisamos de reforços se quisermos brigar por títulos.', fx: { morale: -2, board: -2, fans: 2 } },
        { t: 'Confio no elenco que tenho. Estamos bem servidos.', fx: { morale: 3, board: 2, fans: -1 } },
        { t: 'Estamos atentos ao mercado, sempre em sintonia com a diretoria.', fx: { morale: 0, board: 1, fans: 0 } },
      ],
    });
    if (form.length >= 3) {
      const w = form.filter((x) => x === 'V').length;
      qs.push({
        q: w >= 3 ? 'O time vive grande fase. Já dá para falar em título?' : 'O time oscila. O seu cargo está ameaçado?',
        a: w >= 3
          ? [
              { t: 'Sim! Este elenco tem cara de campeão.', fx: { morale: 2, board: 1, fans: 3 } },
              { t: 'Pé no chão. É jogo a jogo.', fx: { morale: 1, board: 1, fans: 0 } },
            ]
          : [
              { t: 'Tenho total confiança da diretoria e do grupo.', fx: { morale: 1, board: -1, fans: 0 } },
              { t: 'Os resultados vão aparecer. Peço paciência.', fx: { morale: 0, board: 0, fans: 1 } },
              { t: 'Se não for eu, outro virá. O clube é maior que todos.', fx: { morale: -1, board: 1, fans: 2 } },
            ],
      });
    }
    qs.push({
      q: 'Como você descreveria seu estilo de jogo para o torcedor?',
      a: [
        { t: 'Intensidade, pressão alta e gols. Futebol para a torcida.', fx: { fans: 3, morale: 1 } },
        { t: 'Organização. Primeiro não sofrer, depois decidir.', fx: { board: 2, fans: -1 } },
        { t: 'Posse e paciência. Queremos controlar o jogo.', fx: { board: 1, fans: 1 } },
      ],
    });
    return U.shuffle(qs).slice(0, 4);
  };

  Engine.applyPress = function (c, answers) {
    let tot = { morale: 0, board: 0, fans: 0 };
    answers.forEach((a) => {
      const fx = a.fx || {};
      tot.morale += fx.morale || 0;
      tot.board += fx.board || 0;
      tot.fans += fx.fans || 0;
      if (fx.player) {
        const p = Engine.player(c, fx.player);
        if (p) p.morale = U.clamp(p.morale + (fx.pm || 0), 0, 100);
      }
    });
    Engine.squad(c).forEach((p) => (p.morale = U.clamp(p.morale + tot.morale, 0, 100)));
    c.board.confidence = U.clamp(c.board.confidence + tot.board, 0, 100);
    c.board.fans = U.clamp(c.board.fans + tot.fans, 0, 100);
    const entry = { id: U.uid('pr_'), date: c.gameDate, season: c.seasonYear, qa: answers.map((a) => ({ q: a.q, t: a.t })), fx: tot };
    c.press.unshift(entry);
    const quote = answers[Math.floor(Math.random() * answers.length)];
    Engine.addNews(c, {
      type: 'coletiva', icon: '🎙️',
      title: `${c.manager.name}: “${quote.t.length > 70 ? quote.t.slice(0, 68) + '…' : quote.t}”`,
      body: `Em entrevista coletiva, ${c.manager.name} respondeu sobre: ${answers.map((a) => a.q.toLowerCase().replace(/\?$/, '')).join('; ')}.`,
    });
    return tot;
  };

  /* ---------------- Eventos / dilemas ---------------- */
  Engine.generateEvent = function (c) {
    const squad = Engine.squad(c);
    if (!squad.length) return null;
    const star = squad.slice().sort((a, b) => b.ovr - a.ovr)[U.rand(0, Math.min(2, squad.length - 1))];
    const young = squad.filter((p) => p.age <= 21).sort((a, b) => b.pot - a.pot)[0] || U.pick(squad);
    const vet = squad.filter((p) => p.age >= 31)[0] || U.pick(squad);
    const unhappy = squad.slice().sort((a, b) => a.morale - b.morale)[0];
    const raise = Math.round((star.wage || 50000) * 0.3);
    const evs = [
      {
        title: `${star.name} pede aumento salarial`,
        text: `O empresário de ${star.name} procurou a diretoria pedindo um reajuste de ${U.money(raise, c.currency)} por semana. Caso contrário, o jogador "vai ouvir propostas".`,
        options: [
          { t: 'Conceder o aumento', fx: { player: star.id, pm: 12, wage: raise, board: -2 } },
          { t: 'Oferecer meio-termo', fx: { player: star.id, pm: 4, wage: Math.round(raise / 2) } },
          { t: 'Recusar', fx: { player: star.id, pm: -15, board: 2 } },
        ],
      },
      {
        title: `${young.name} flagrado em festa`,
        text: `Fotos de ${young.name} em uma festa na madrugada antes do treino viralizaram. Imprensa e torcida cobram uma posição.`,
        options: [
          { t: 'Multar e afastar por um jogo', fx: { player: young.id, pm: -10, board: 2, fans: 1, morale: 1 } },
          { t: 'Conversa reservada, sem punição pública', fx: { player: young.id, pm: 4, board: -1 } },
          { t: 'Defender o jogador publicamente', fx: { player: young.id, pm: 10, fans: -2, board: -2 } },
        ],
      },
      {
        title: `${vet.name} quer ser referência do vestiário`,
        text: `Experiente, ${vet.name} se ofereceu para ser mentor dos mais jovens e pediu mais voz no grupo.`,
        options: [
          { t: 'Nomear como capitão', fx: { player: vet.id, pm: 10, morale: 2, captain: vet.id } },
          { t: 'Aceitar o papel de mentor, sem braçadeira', fx: { player: vet.id, pm: 5, morale: 1 } },
          { t: 'Agradecer, mas manter a hierarquia', fx: { player: vet.id, pm: -5 } },
        ],
      },
      {
        title: 'Torcida organizada pede reunião',
        text: 'Líderes da torcida querem conversar sobre o momento do time e pedem mais entrega em campo.',
        options: [
          { t: 'Receber a torcida no CT', fx: { fans: 5, board: -1 } },
          { t: 'Enviar o capitão para conversar', fx: { fans: 2, morale: -1 } },
          { t: 'Recusar: “o foco é no campo”', fx: { fans: -4, board: 1 } },
        ],
      },
      {
        title: 'Patrocinador propõe ação comercial',
        text: 'Um patrocinador oferece um bônus para que o elenco participe de uma ação de marketing na semana de jogo.',
        options: [
          { t: 'Aceitar o bônus', fx: { money: U.rand(5, 25) * 100000, morale: -2, board: 3 } },
          { t: 'Negociar para depois do jogo', fx: { money: U.rand(2, 10) * 100000 } },
          { t: 'Recusar para proteger o grupo', fx: { morale: 2, board: -2 } },
        ],
      },
      {
        title: `${unhappy.name} reclama de falta de minutos`,
        text: `${unhappy.name} bateu na porta da sua sala dizendo que merece mais chances e que pensa em sair.`,
        options: [
          { t: 'Prometer mais minutos', fx: { player: unhappy.id, pm: 15 } },
          { t: 'Colocar na lista de transferências', fx: { player: unhappy.id, pm: -10, list: unhappy.id } },
          { t: 'Pedir que mostre mais nos treinos', fx: { player: unhappy.id, pm: -3, board: 1 } },
        ],
      },
      {
        title: 'Diretoria sugere vender um jogador',
        text: `Para equilibrar as contas, a diretoria sugere negociar ${star.name} se aparecer proposta acima de ${U.money(Math.round(star.value * 1.3), c.currency)}.`,
        options: [
          { t: 'Concordar', fx: { board: 4, morale: -2, player: star.id, pm: -6 } },
          { t: 'Bater o pé: ninguém sai', fx: { board: -4, fans: 3, player: star.id, pm: 5 } },
        ],
      },
      {
        title: 'Clima tenso no vestiário',
        text: 'Dois jogadores discutiram no treino e o episódio vazou para a imprensa.',
        options: [
          { t: 'Reunião geral com todo o elenco', fx: { morale: 3 } },
          { t: 'Punir os dois envolvidos', fx: { morale: -1, board: 2 } },
          { t: 'Minimizar: “coisa de futebol”', fx: { morale: -2, fans: -1 } },
        ],
      },
      {
        title: 'Convite para palestra em escola de treinadores',
        text: `${c.manager.name} foi convidado para dar uma palestra sobre seu modelo de jogo.`,
        options: [
          { t: 'Aceitar', fx: { rep: 2, board: 1 } },
          { t: 'Recusar: foco total no clube', fx: { morale: 1 } },
        ],
      },
      {
        title: `${young.name} recebe convocação para a seleção de base`,
        text: `O jovem ${young.name} foi chamado para defender a seleção sub-21 em período de jogos do clube.`,
        options: [
          { t: 'Liberar com orgulho', fx: { player: young.id, pm: 10, fans: 1, ovr: young.id } },
          { t: 'Tentar vetar a convocação', fx: { player: young.id, pm: -12, board: 1 } },
        ],
      },
    ];
    const ev = U.pick(evs);
    ev.id = U.uid('ev_');
    return ev;
  };

  Engine.resolveEvent = function (c, ev, opt) {
    const fx = opt.fx || {};
    const out = [];
    if (fx.player) {
      const p = Engine.player(c, fx.player);
      if (p) { p.morale = U.clamp(p.morale + (fx.pm || 0), 0, 100); out.push(`Moral de ${p.name} ${fx.pm >= 0 ? '+' : ''}${fx.pm}`); }
      if (p && fx.wage) { p.wage += fx.wage; out.push(`Salário de ${p.name} +${U.money(fx.wage, c.currency)}/sem`); }
      if (p && fx.list) { p.transferListed = true; out.push(`${p.name} colocado na lista de transferências`); }
      if (p && fx.ovr === p.id && Math.random() < 0.5) { p.ovr = Math.min(99, p.ovr + 1); out.push(`${p.name} evoluiu +1 OVR`); }
    }
    if (fx.captain) { c.players.forEach((p) => (p.captain = p.id === fx.captain)); }
    if (fx.morale) { Engine.squad(c).forEach((p) => (p.morale = U.clamp(p.morale + fx.morale, 0, 100))); out.push(`Moral do elenco ${fx.morale > 0 ? '+' : ''}${fx.morale}`); }
    if (fx.board) { c.board.confidence = U.clamp(c.board.confidence + fx.board, 0, 100); out.push(`Diretoria ${fx.board > 0 ? '+' : ''}${fx.board}`); }
    if (fx.fans) { c.board.fans = U.clamp(c.board.fans + fx.fans, 0, 100); out.push(`Torcida ${fx.fans > 0 ? '+' : ''}${fx.fans}`); }
    if (fx.money) { Engine.addTransaction(c, { type: 'in', category: 'Patrocínio', amount: fx.money, desc: ev.title }); out.push(`+${U.money(fx.money, c.currency)} em caixa`); }
    if (fx.rep) { c.manager.reputation = U.clamp(c.manager.reputation + fx.rep, 1, 99); out.push(`Reputação +${fx.rep}`); }
    c.events.unshift({ id: ev.id, date: c.gameDate, season: c.seasonYear, title: ev.title, choice: opt.t, effects: out });
    return out;
  };

  /* ---------------- Conquistas ---------------- */
  Engine.ACHIEVEMENTS = [
    { id: 'first_match', icon: '🎬', name: 'Estreia', desc: 'Registre sua primeira partida.', test: (c, x) => x.rec.p >= 1 },
    { id: 'first_win', icon: '✅', name: 'Primeira vitória', desc: 'Vença sua primeira partida.', test: (c, x) => x.rec.w >= 1 },
    { id: 'wins_50', icon: '💪', name: 'Cinquentão', desc: '50 vitórias na carreira.', test: (c, x) => x.rec.w >= 50 },
    { id: 'wins_100', icon: '💯', name: 'Centenário', desc: '100 vitórias na carreira.', test: (c, x) => x.rec.w >= 100 },
    { id: 'matches_100', icon: '📅', name: 'Longevidade', desc: '100 partidas no comando.', test: (c, x) => x.rec.p >= 100 },
    { id: 'matches_300', icon: '🗓️', name: 'Lenda do banco', desc: '300 partidas no comando.', test: (c, x) => x.rec.p >= 300 },
    { id: 'goleada', icon: '🔥', name: 'Goleada histórica', desc: 'Vença por 5 ou mais gols de diferença.', test: (c, x) => x.all.some((m) => m.gf - m.ga >= 5) },
    { id: 'streak_10', icon: '📈', name: 'Embalado', desc: '10 vitórias seguidas.', test: (c, x) => x.maxWin >= 10 },
    { id: 'unbeaten_20', icon: '🛡️', name: 'Muralha', desc: '20 jogos de invencibilidade.', test: (c, x) => x.maxUnb >= 20 },
    { id: 'clean_10', icon: '🧤', name: 'Cadeado', desc: '10 jogos sem sofrer gols na temporada.', test: (c, x) => x.seasonRec.cs >= 10 },
    { id: 'first_trophy', icon: '🏆', name: 'Primeiro título', desc: 'Conquiste seu primeiro troféu.', test: (c) => c.trophies.length >= 1 },
    { id: 'league_title', icon: '👑', name: 'Campeão nacional', desc: 'Vença uma liga.', test: (c) => c.trophies.some((t) => t.type === 'liga') },
    { id: 'continental', icon: '🌍', name: 'Rei do continente', desc: 'Conquiste um título continental.', test: (c) => c.trophies.some((t) => t.type === 'continental') },
    { id: 'double', icon: '✌️', name: 'Dobradinha', desc: 'Dois títulos na mesma temporada.', test: (c) => Object.values(c.trophies.reduce((o, t) => ((o[t.season] = (o[t.season] || 0) + 1), o), {})).some((n) => n >= 2) },
    { id: 'treble', icon: '🔱', name: 'Tríplice coroa', desc: 'Três títulos na mesma temporada.', test: (c) => Object.values(c.trophies.reduce((o, t) => ((o[t.season] = (o[t.season] || 0) + 1), o), {})).some((n) => n >= 3) },
    { id: 'trophies_10', icon: '🏛️', name: 'Galeria cheia', desc: '10 troféus conquistados.', test: (c) => c.trophies.length >= 10 },
    { id: 'big_signing', icon: '💎', name: 'Contratação bombástica', desc: 'Contrate um jogador por 50 mi ou mais.', test: (c) => c.transfers.some((t) => t.type === 'compra' && t.fee >= 50e6) },
    { id: 'big_sale', icon: '💰', name: 'Negociador', desc: 'Venda um jogador por 50 mi ou mais.', test: (c) => c.transfers.some((t) => t.type === 'venda' && t.fee >= 50e6) },
    { id: 'youth', icon: '🌱', name: 'Formador', desc: 'Promova 3 jogadores da base.', test: (c) => c.players.filter((p) => p.youth).length >= 3 },
    { id: 'scorer_30', icon: '⚽', name: 'Artilheiro implacável', desc: 'Um jogador com 30 gols na temporada.', test: (c, x) => x.maxGoals >= 30 },
    { id: 'seasons_5', icon: '⏳', name: 'Projeto de longo prazo', desc: 'Complete 5 temporadas.', test: (c) => c.seasons.length >= 5 },
    { id: 'seasons_10', icon: '🗿', name: 'Monumento', desc: 'Complete 10 temporadas.', test: (c) => c.seasons.length >= 10 },
    { id: 'press_10', icon: '🎙️', name: 'Mestre das coletivas', desc: 'Participe de 10 coletivas.', test: (c) => c.press.length >= 10 },
    { id: 'journal_10', icon: '📓', name: 'Cronista', desc: 'Escreva 10 entradas no diário.', test: (c) => c.journal.length >= 10 },
    { id: 'rival_5', icon: '⚔️', name: 'Dono do clássico', desc: 'Vença 5 clássicos contra rivais.', test: (c, x) => x.all.filter((m) => Engine.isRival(c, m.opponent) && Engine.result(m) === 'V').length >= 5 },
  ];

  Engine.checkAchievements = function (c) {
    const all = Engine.seasonMatches(c, 'all');
    const res = all.map(Engine.result);
    let maxWin = 0, maxUnb = 0, cw = 0, cu = 0;
    res.forEach((r) => {
      cw = r === 'V' ? cw + 1 : 0;
      cu = r !== 'D' ? cu + 1 : 0;
      maxWin = Math.max(maxWin, cw);
      maxUnb = Math.max(maxUnb, cu);
    });
    const leaders = Engine.leaders(c);
    const x = {
      all, rec: Engine.record(all), seasonRec: Engine.record(Engine.seasonMatches(c)), maxWin, maxUnb,
      maxGoals: leaders.goals ? leaders.goals.s.goals : 0,
    };
    const unlocked = [];
    Engine.ACHIEVEMENTS.forEach((a) => {
      if (c.achievements[a.id]) return;
      let ok = false;
      try { ok = a.test(c, x); } catch (e) { ok = false; }
      if (ok) {
        c.achievements[a.id] = { at: new Date().toISOString(), season: c.seasonYear };
        unlocked.push(a);
      }
    });
    if (unlocked.length && MC.UI) unlocked.forEach((a) => MC.UI.achievementToast(a));
    return unlocked;
  };

  /* ---------------- Troféus ---------------- */
  Engine.addTrophy = function (c, o) {
    const t = {
      id: U.uid('tf_'),
      season: Number(o.season) || c.seasonYear,
      name: o.name,
      type: o.type || 'liga',
      compId: o.compId || null,
      notes: o.notes || '',
      final: o.final || '',
    };
    c.trophies.push(t);
    const comp = o.compId && Engine.comp(c, o.compId);
    if (comp) comp.status = 'Campeão';
    Engine.addNews(c, {
      type: 'titulo', icon: '🏆',
      title: U.pick([`É CAMPEÃO! ${c.club.name} conquista ${t.name}`, `${c.club.name} levanta a taça: ${t.name} ${U.seasonLabel(t.season)}`, `Glória! ${c.manager.name} leva o ${c.club.name} ao título de ${t.name}`]),
      body: `Noite histórica. ${t.final ? t.final + '. ' : ''}O título de ${t.name} coroa o trabalho de ${c.manager.name} na temporada ${U.seasonLabel(t.season)}.`,
    });
    c.board.confidence = U.clamp(c.board.confidence + 10, 0, 100);
    c.board.fans = U.clamp(c.board.fans + 12, 0, 100);
    c.manager.reputation = U.clamp(c.manager.reputation + 4, 1, 99);
    Engine.checkAchievements(c);
    return t;
  };

  /* ---------------- Resumo e virada de temporada ---------------- */
  Engine.seasonSummary = function (c, season = c.seasonYear) {
    const matches = Engine.seasonMatches(c, season);
    const rec = Engine.record(matches);
    const leaders = Engine.leaders(c, season);
    const objs = c.objectives.filter((o) => o.season === season);
    const comps = c.competitions.filter((x) => x.season === season).map((x) => ({
      name: x.name, type: x.type, status: x.status, pos: x.type === 'liga' ? (x.finalPos || (Engine.leagueTable(c, x).find((r) => r.isUser) || {}).pos) : null,
    }));
    const tx = c.transactions.filter((t) => t.season === season);
    const transfersIn = c.transfers.filter((t) => t.season === season && TRANSFER_TYPES[t.type] && TRANSFER_TYPES[t.type].dir === 'in');
    const transfersOut = c.transfers.filter((t) => t.season === season && TRANSFER_TYPES[t.type] && TRANSFER_TYPES[t.type].dir === 'out');
    const pick = (x) => (x ? { id: x.p.id, name: x.p.name, val: x.s } : null);
    return {
      season,
      club: c.club.name,
      record: rec,
      leaguePos: Engine.userLeaguePos(c, season),
      comps,
      trophies: c.trophies.filter((t) => t.season === season).map((t) => t.name),
      topScorer: pick(leaders.goals),
      topAssist: pick(leaders.assists),
      bestRated: pick(leaders.rating),
      mostApps: pick(leaders.apps),
      objectives: { total: objs.length, done: objs.filter((o) => o.status === 'concluido').length, failed: objs.filter((o) => o.status === 'falhou').length },
      income: U.sum(tx.filter((t) => t.type === 'in'), (t) => t.amount),
      expense: U.sum(tx.filter((t) => t.type === 'out'), (t) => t.amount),
      spent: U.sum(transfersIn, (t) => t.fee),
      earned: U.sum(transfersOut, (t) => t.fee),
      signings: transfersIn.map((t) => t.playerName),
      departures: transfersOut.map((t) => t.playerName),
      board: Math.round(c.board.confidence),
      fans: Math.round(c.board.fans),
    };
  };

  Engine.advanceSeason = function (c, opts = {}) {
    const summary = Engine.seasonSummary(c);
    summary.notes = opts.notes || '';
    summary.awards = opts.awards || '';
    summary.closedAt = new Date().toISOString();
    c.seasons = c.seasons.filter((s) => s.season !== summary.season);
    c.seasons.push(summary);

    // Avaliação da diretoria
    const { done, failed, total } = summary.objectives;
    const objScore = total ? (done - failed) / total : 0;
    c.board.confidence = U.clamp(c.board.confidence + objScore * 15 + summary.trophies.length * 5, 0, 100);

    const prevYear = c.seasonYear;
    c.seasonYear = prevYear + 1;
    c.gameDate = `${c.seasonYear}-07-01`;

    // Envelhecimento, histórico de OVR, contratos, empréstimos
    const expired = [];
    c.players.forEach((p) => {
      if (['elenco', 'base', 'emprestado'].includes(p.status)) {
        p.age += 1;
        p.ovrHistory.push({ season: c.seasonYear, ovr: p.ovr, date: c.gameDate });
        p.injury = { active: false, note: '', until: '' };
        p.morale = U.clamp(Math.round((p.morale + 70) / 2), 0, 100);
        if (p.contractUntil && p.contractUntil <= prevYear + 1 && p.status !== 'emprestado') expired.push(p);
        if (p.status === 'emprestado' && opts.returnLoans) { p.status = 'elenco'; p.loanedTo = ''; }
        if (p.onLoanFrom && opts.returnLoans) { p.status = 'dispensado'; p.leftAt = prevYear; p.leftTo = p.onLoanFrom + ' (fim do empréstimo)'; p.onLoanFrom = ''; }
      }
    });

    // Novas competições (mesmos nomes; tabela zerada)
    const prevComps = c.competitions.filter((x) => x.season === prevYear);
    prevComps.forEach((x) => {
      if (x.type === 'amistoso') return;
      const nc = Engine.newCompetition(c, { name: x.name, type: x.type, season: c.seasonYear });
      if (x.type === 'liga') {
        nc.table = x.table.map((t) => ({ id: t.isUser ? 'user' : U.uid('tm_'), name: t.name, isUser: !!t.isUser, str: t.str || 72, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 }));
      }
      c.competitions.push(nc);
    });

    // Orçamento
    if (opts.transferBudget != null && opts.transferBudget !== '') c.finances.transferBudget = U.parseMoney(opts.transferBudget);
    if (opts.wageBudget != null && opts.wageBudget !== '') c.finances.wageBudget = U.parseMoney(opts.wageBudget);
    if (opts.balanceAdj) Engine.addTransaction(c, { type: 'in', category: 'Premiações', amount: opts.balanceAdj, desc: 'Premiações / receitas da temporada ' + U.seasonLabel(prevYear) });

    // Objetivos novos
    (opts.objectives || []).forEach((t) => t && c.objectives.push(Engine.newObjective(c, { text: t })));

    Engine.addNews(c, {
      type: 'oficial', icon: '🗓️',
      title: `Começa a temporada ${U.seasonLabel(c.seasonYear)} para o ${c.club.name}`,
      body: `Na temporada passada: ${summary.record.w}V ${summary.record.d}E ${summary.record.l}D${summary.leaguePos ? ', ' + summary.leaguePos + 'º lugar na liga' : ''}${summary.trophies.length ? ' e os títulos de ' + summary.trophies.join(', ') : ''}. ${expired.length ? 'Contratos vencidos/terminando: ' + expired.map((p) => p.name).join(', ') + '.' : ''}`,
    });
    Engine.checkAchievements(c);
    return { summary, expired };
  };

  /** Troca de clube do treinador (mantém a carreira) */
  Engine.changeClub = function (c, o) {
    const last = c.managerHistory[c.managerHistory.length - 1];
    if (last && !last.to) last.to = c.seasonYear;
    c.players.forEach((p) => {
      if (['elenco', 'base', 'emprestado'].includes(p.status)) { p.status = 'dispensado'; p.leftAt = c.seasonYear; p.leftTo = '(troca de clube do treinador)'; p.formerClub = c.club.name; }
    });
    c.club = Object.assign({}, c.club, { name: o.name, short: (o.short || o.name).slice(0, 3).toUpperCase(), league: o.league || c.club.league, stadium: o.stadium || '', colorA: o.colorA || c.club.colorA, colorB: o.colorB || c.club.colorB, rivals: o.rivals || '' });
    c.managerHistory.push({ club: o.name, from: c.seasonYear, to: null });
    c.finances.transferBudget = U.parseMoney(o.transferBudget);
    c.finances.wageBudget = U.parseMoney(o.wageBudget);
    c.board = { confidence: 60, fans: 55 };
    c.tactics.slots = {};
    if (o.league) c.competitions.push(Engine.newCompetition(c, { name: o.league, type: 'liga' }));
    Engine.addNews(c, { type: 'oficial', icon: '🤝', title: `${c.manager.name} é o novo técnico do ${o.name}`, body: `Após passagem marcante pelo ${last ? last.club : 'antigo clube'}, ${c.manager.name} aceita novo desafio.` });
  };

  /* ---------------- Importação CSV de elenco ---------------- */
  Engine.parseSquadCSV = function (c, text) {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return [];
    const sep = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';
    let header = lines[0].split(sep).map((h) => U.slug(h));
    const known = ['nome', 'name', 'pos', 'posicao', 'position', 'idade', 'age', 'ovr', 'geral', 'overall', 'pot', 'potencial', 'potential'];
    let start = 1;
    if (!header.some((h) => known.includes(h))) {
      header = ['nome', 'pos', 'idade', 'ovr', 'pot', 'valor', 'salario', 'contrato', 'numero', 'nacionalidade'];
      start = 0;
    }
    const idx = (...names) => header.findIndex((h) => names.includes(h));
    const ix = {
      name: idx('nome', 'name', 'jogador', 'player'),
      pos: idx('pos', 'posicao', 'position'),
      age: idx('idade', 'age'),
      ovr: idx('ovr', 'geral', 'overall'),
      pot: idx('pot', 'potencial', 'potential'),
      value: idx('valor', 'value'),
      wage: idx('salario', 'wage'),
      contract: idx('contrato', 'contract', 'contrato-ate'),
      number: idx('numero', 'num', 'number', 'camisa'),
      nat: idx('nacionalidade', 'nat', 'nation', 'pais'),
    };
    const POS_MAP = { GK: 'GOL', RB: 'LD', CB: 'ZAG', LB: 'LE', RWB: 'ADD', LWB: 'ADE', CDM: 'VOL', CM: 'MC', CAM: 'MEI', RM: 'MD', LM: 'ME', RW: 'PD', LW: 'PE', CF: 'SA', ST: 'ATA', POR: 'GOL', DFC: 'ZAG', MCD: 'VOL', MCO: 'MEI', DC: 'ATA' };
    const out = [];
    for (let i = start; i < lines.length; i++) {
      const cols = lines[i].split(sep).map((x) => x.trim());
      const get = (k) => (ix[k] >= 0 ? cols[ix[k]] : '');
      const name = get('name');
      if (!name) continue;
      let pos = (get('pos') || 'MC').toUpperCase();
      pos = POS_MAP[pos] || pos;
      out.push(Engine.newPlayer(c, {
        name, pos, age: get('age'), ovr: get('ovr'), pot: get('pot'), value: get('value'), wage: get('wage'),
        contractUntil: get('contract'), number: get('number'), nat: get('nat'),
      }));
    }
    return out;
  };

  /* ---------------- Gerador de base (olheiros) ---------------- */
  const FIRST = ['Lucas', 'Gabriel', 'Mateus', 'Pedro', 'Rafael', 'João', 'Enzo', 'Davi', 'Arthur', 'Miguel', 'Thiago', 'Bruno', 'Vitor', 'Caio', 'Kauã', 'Luan', 'Igor', 'Samuel', 'Nicolas', 'Diego', 'Hugo', 'Alex', 'Marco', 'Leo', 'Yan', 'Ruan', 'Erick', 'Breno', 'Matías', 'Julián', 'Lorenzo', 'Noah', 'Kylian', 'Jamal', 'Kenji', 'Ismael'];
  const LAST = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento', 'Ferreira', 'Barbosa', 'Rocha', 'Carvalho', 'Gomes', 'Martins', 'Araújo', 'Ribeiro', 'Monteiro', 'Teixeira', 'Fernández', 'García', 'Moreau', 'Müller', 'Rossi', 'Diallo', 'Mendes', 'Cardoso', 'Vieira', 'Moura'];
  const NATS = ['Brasil', 'Argentina', 'Portugal', 'Espanha', 'França', 'Uruguai', 'Colômbia', 'Alemanha', 'Itália', 'Inglaterra', 'Holanda', 'Bélgica', 'Senegal', 'Nigéria', 'Japão', 'EUA', 'México', 'Equador'];

  Engine.generateProspect = function (c, o = {}) {
    const pos = o.pos && POSITIONS.includes(o.pos) ? o.pos : U.pick(POSITIONS);
    const age = U.rand(15, 17);
    const quality = o.quality || 'normal';
    const potBase = { baixa: [60, 72], normal: [65, 80], alta: [72, 88], elite: [80, 94] }[quality] || [65, 80];
    const pot = U.rand(potBase[0], potBase[1]);
    const ovr = U.clamp(pot - U.rand(18, 30), 42, 70);
    return {
      id: U.uid('yp_'),
      name: `${U.pick(FIRST)} ${U.pick(LAST)}`,
      pos, age, ovr,
      potMin: Math.max(ovr + 5, pot - U.rand(2, 6)),
      potMax: Math.min(99, pot + U.rand(1, 5)),
      nat: o.nat || (Math.random() < 0.6 && c.club.country ? c.club.country : U.pick(NATS)),
      traits: U.shuffle(['Rápido', 'Driblador', 'Finalizador', 'Visão de jogo', 'Líder', 'Forte no jogo aéreo', 'Incansável', 'Tático', 'Técnico', 'Marcador', 'Bom passe longo', 'Reflexos']).slice(0, U.rand(1, 3)),
      foundAt: c.gameDate,
      region: o.region || '',
    };
  };

  /* ---------------- Desafios ---------------- */
  Engine.CHALLENGES = [
    { id: 'youth', name: 'Prata da casa', desc: 'Pelo menos 5 jogadores da base no elenco principal.' },
    { id: 'nosignings', name: 'Sem contratações', desc: 'Nenhuma compra na primeira temporada. Apenas empréstimos e base.' },
    { id: 'u23', name: 'Revolução jovem', desc: 'Contrate apenas jogadores com até 23 anos.' },
    { id: 'national', name: 'Só da casa', desc: 'Apenas jogadores do país do clube.' },
    { id: 'lowbudget', name: 'Moneyball', desc: 'Nenhuma contratação acima de 10 mi.' },
    { id: 'roadtoglory', name: 'Road to Glory', desc: 'Comece na divisão mais baixa e chegue à elite.' },
    { id: 'onelegend', name: 'Lenda única', desc: 'Nunca venda o melhor jogador do elenco.' },
    { id: 'rotation', name: 'Rodízio total', desc: 'Nenhum jogador pode passar de 70% dos jogos.' },
    { id: 'attack', name: 'Futebol arte', desc: 'Termine a temporada com média de 2+ gols por jogo.' },
    { id: 'defense', name: 'Retranca de ouro', desc: 'Sofra menos de 0,8 gol por jogo.' },
  ];

  /* ---------------- Dados p/ gráficos ---------------- */
  Engine.cumulativePoints = function (c, comp) {
    const ms = c.matches.filter((m) => m.played && m.compId === comp.id).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    let pts = 0;
    return ms.map((m, i) => {
      pts += m.gf > m.ga ? 3 : m.gf === m.ga ? 1 : 0;
      return { x: i + 1, y: pts, label: `${m.opponent} ${m.gf}x${m.ga}` };
    });
  };
})(window);
