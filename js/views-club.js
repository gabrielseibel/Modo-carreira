/* =========================================================
   Views: mercado, finanças, diretoria, imprensa, legado, saves
   ========================================================= */
(function (global) {
  'use strict';
  const MC = global.MC;
  const U = MC.U, UI = MC.UI, S = MC.Store, E = MC.Engine, A = MC.A;
  const V = MC.Views;
  const App = () => MC.App;

  /* =============== TRANSFERÊNCIAS =============== */
  const tState = { season: null };
  V.transfers = {
    title: 'Transferências',
    render(c) {
      const season = tState.season || c.seasonYear;
      const seasons = Array.from(new Set([c.seasonYear, ...c.transfers.map((t) => t.season)])).sort((a, b) => b - a);
      const list = c.transfers.filter((t) => season === 'all' || t.season === season).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      const ins = list.filter((t) => E.TRANSFER_TYPES[t.type].dir === 'in');
      const outs = list.filter((t) => E.TRANSFER_TYPES[t.type].dir === 'out');
      const spent = U.sum(ins, (t) => t.fee), earned = U.sum(outs.filter((t) => t.type !== 'dispensa'), (t) => t.fee);
      const listed = E.squad(c).filter((p) => p.transferListed);
      const row = (t) => `<tr>
        <td class="muted">${U.fmtDate(t.date)}</td>
        <td>${t.playerId && E.player(c, t.playerId) ? `<a href="#/player/${t.playerId}">${U.esc(t.playerName)}</a>` : U.esc(t.playerName)}</td>
        <td><span class="tag">${U.esc(E.TRANSFER_TYPES[t.type].label)}</span></td>
        <td>${U.esc(t.club || '—')}</td>
        <td class="num">${t.fee ? U.money(t.fee) : '—'}</td>
        <td class="actions"><button class="icon-btn" data-act="undoTransfer" data-id="${t.id}" title="Desfazer">↩️</button></td>
      </tr>`;
      const all = c.transfers.filter((t) => t.type === 'compra' && t.fee).sort((a, b) => b.fee - a.fee).slice(0, 5);
      const allSales = c.transfers.filter((t) => t.type === 'venda' && t.fee).sort((a, b) => b.fee - a.fee).slice(0, 5);
      return `
      <div class="toolbar">
        <select data-change="tSeason">${UI.options([{ v: 'all', l: 'Todas as temporadas' }, ...seasons.map((y) => ({ v: y, l: 'Temporada ' + U.seasonLabel(y) }))], season)}</select>
        <div class="row gap wrap">
          <button class="btn primary" data-act="newTransfer" data-dir="in">⬇️ Chegada</button>
          <button class="btn" data-act="newTransfer" data-dir="out">⬆️ Saída</button>
        </div>
      </div>
      <div class="summary-strip">
        <div><small>Orçamento disponível</small><b>${U.money(c.finances.transferBudget)}</b></div>
        <div><small>Gasto</small><b class="bad-txt">${U.money(spent)}</b></div>
        <div><small>Arrecadado</small><b class="good-txt">${U.money(earned)}</b></div>
        <div><small>Saldo do mercado</small><b class="${earned - spent >= 0 ? 'good-txt' : 'bad-txt'}">${U.money(earned - spent)}</b></div>
        <div><small>Chegadas / Saídas</small><b>${ins.length} / ${outs.length}</b></div>
      </div>
      ${listed.length ? `<div class="card"><div class="card-head"><h3>Na lista de transferências</h3></div><div class="chips">${listed.map((p) => `<span class="chip">${UI.pos(p.pos)} <a href="#/player/${p.id}">${U.esc(p.name)}</a> · ${U.money(p.value)} <button class="icon-btn sm" data-act="sellPlayer" data-id="${p.id}">💰</button></span>`).join('')}</div></div>` : ''}
      <div class="grid-2">
        <div class="card"><div class="card-head"><h3>⬇️ Chegadas</h3></div>
          ${ins.length ? `<div class="table-wrap"><table class="tbl compact"><tbody>${ins.map(row).join('')}</tbody></table></div>` : '<p class="muted">Nenhuma chegada.</p>'}
        </div>
        <div class="card"><div class="card-head"><h3>⬆️ Saídas</h3></div>
          ${outs.length ? `<div class="table-wrap"><table class="tbl compact"><tbody>${outs.map(row).join('')}</tbody></table></div>` : '<p class="muted">Nenhuma saída.</p>'}
        </div>
        <div class="card"><div class="card-head"><h3>💎 Maiores contratações</h3></div>${all.length ? `<ol class="rank">${all.map((t) => `<li><span>${U.esc(t.playerName)} <small class="muted">${U.esc(t.club)} · ${U.seasonLabel(t.season)}</small></span><b>${U.money(t.fee)}</b></li>`).join('')}</ol>` : '<p class="muted">—</p>'}</div>
        <div class="card"><div class="card-head"><h3>💰 Maiores vendas</h3></div>${allSales.length ? `<ol class="rank">${allSales.map((t) => `<li><span>${U.esc(t.playerName)} <small class="muted">→ ${U.esc(t.club)} · ${U.seasonLabel(t.season)}</small></span><b>${U.money(t.fee)}</b></li>`).join('')}</ol>` : '<p class="muted">—</p>'}</div>
      </div>`;
    },
  };
  A.tSeason = (el) => { tState.season = el.value === 'all' ? 'all' : Number(el.value); App().render(); };
  A.undoTransfer = async (el) => {
    if (!(await UI.confirm('Desfazer esta transferência? O dinheiro será estornado e o jogador volta à situação anterior.', { ok: 'Desfazer' }))) return;
    E.undoTransfer(S.career(), el.dataset.id);
    App().commit('Transferência desfeita');
  };
  A.sellPlayer = (el) => A.newTransfer({ dataset: { dir: 'out', pid: el.dataset.id } });

  A.newTransfer = (el) => {
    const c = S.career();
    const dir = el.dataset.dir || 'in';
    const pre = el.dataset.pid ? E.player(c, el.dataset.pid) : null;
    const sl = el.dataset.sl ? c.shortlist.find((x) => x.id === el.dataset.sl) : null;
    const types = Object.entries(E.TRANSFER_TYPES).filter(([k, v]) => v.dir === dir && k !== 'base' && k !== 'retorno');
    const outPool = E.sortPlayers(c.players.filter((p) => p.status === 'elenco' || p.status === 'base' || p.status === 'emprestado'));
    const m = UI.modal({
      title: dir === 'in' ? 'Registrar chegada' : 'Registrar saída', size: 'lg',
      body: `<form id="tf" class="grid-4" autocomplete="off">
        ${UI.field('Tipo', `<select name="type">${UI.options(types.map(([v, t]) => ({ v, l: t.label })))}</select>`, 'span-2')}
        ${UI.field('Data', `<input type="date" name="date" value="${c.gameDate}">`)}
        ${UI.field(dir === 'in' ? 'Clube de origem' : 'Clube de destino', `<input name="club" value="${U.esc(sl ? sl.club || '' : '')}">`)}
        ${dir === 'in'
          ? `${UI.field('Jogador*', `<input name="playerName" required value="${U.esc(sl ? sl.name : '')}">`, 'span-2')}
             ${UI.field('Posição', `<select name="pos">${UI.options(E.POSITIONS, sl ? sl.pos : 'MC')}</select>`)}
             ${UI.field('Idade', `<input type="number" name="age" value="${sl ? sl.age : 22}">`)}
             ${UI.field('OVR', `<input type="number" name="ovr" value="${sl ? sl.ovr : 70}">`)}
             ${UI.field('POT', `<input type="number" name="pot" value="${sl ? sl.pot : 78}">`)}
             ${UI.field('Nacionalidade', `<input name="nat" value="${U.esc(sl ? sl.nat || '' : '')}">`)}
             ${UI.field('Número', '<input type="number" name="number">')}
             ${UI.field('Valor de mercado', `<input name="value" value="${sl ? U.moneyInput(sl.value) : ''}">`)}
             ${UI.field('Contrato até', `<input type="number" name="contractUntil" value="${c.seasonYear + 4}">`)}`
          : `${UI.field('Jogador*', `<select name="playerId">${outPool.map((p) => `<option value="${p.id}" ${pre && pre.id === p.id ? 'selected' : ''}>${U.esc(p.name)} (${p.pos}, ${p.ovr})</option>`).join('')}</select>`, 'span-2')}
             <label class="check span-2"><input type="checkbox" name="addToBudget" checked> Adicionar valor ao orçamento de transferências</label>`}
        ${UI.field(dir === 'in' ? 'Valor pago' : 'Valor recebido', `<input name="fee" placeholder="ex.: 30m" value="${pre ? U.moneyInput(pre.value) : sl ? U.moneyInput(sl.value) : ''}">`)}
        ${UI.field('Salário semanal', `<input name="wage" placeholder="ex.: 50k" value="${sl ? U.moneyInput(sl.wage) : ''}">`)}
        ${UI.field('Bônus / cláusulas', '<input name="addOns" placeholder="Ex.: 20% de revenda">', 'span-2')}
        ${UI.field('Notas', '<input name="notes">', 'span-4')}
      </form>
      ${dir === 'in' ? `<p class="hint">Orçamento disponível: <b>${U.money(c.finances.transferBudget)}</b></p>` : ''}`,
      actions: `<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="tf-ok">Confirmar</button>`,
    });
    m.$('#tf-ok').onclick = () => {
      const f = UI.formData(m.$('#tf'));
      if (dir === 'in' && !f.playerName.trim()) return UI.toast('Informe o jogador', 'error');
      if (dir === 'in' && U.parseMoney(f.fee) > c.finances.transferBudget && f.type === 'compra') UI.toast('Atenção: valor acima do orçamento de transferências!', 'warn');
      const o = { type: f.type, date: f.date, club: f.club, fee: f.fee, wage: f.wage, notes: f.notes, addOns: f.addOns };
      if (dir === 'in') {
        o.playerName = f.playerName.trim();
        o.playerData = { pos: f.pos, age: f.age, ovr: f.ovr, pot: f.pot, nat: f.nat, number: f.number, value: f.value || f.fee, contractUntil: f.contractUntil, role: 'Rotação' };
      } else {
        o.playerId = f.playerId;
        o.playerName = E.player(c, f.playerId).name;
        o.addToBudget = f.addToBudget;
      }
      E.registerTransfer(c, o);
      if (sl) sl.status = 'contratado';
      m.close();
      App().commit(dir === 'in' ? 'Reforço anunciado! ✍️' : 'Saída registrada');
    };
  };

  /* =============== OBSERVAÇÃO (SHORTLIST) =============== */
  V.scouting = {
    title: 'Observação e alvos',
    render(c) {
      const list = c.shortlist.slice().sort((a, b) => ({ Alta: 0, Média: 1, Baixa: 2 }[a.priority] ?? 3) - ({ Alta: 0, Média: 1, Baixa: 2 }[b.priority] ?? 3) || b.pot - a.pot);
      const st = { observando: 'Observando', negociando: 'Negociando', contratado: 'Contratado', descartado: 'Descartado' };
      return `
      <div class="toolbar"><p class="muted">Monte sua lista de alvos com relatórios de observação. Quando fechar, clique em “Contratar” para registrar a chegada.</p><button class="btn primary" data-act="editTarget">＋ Alvo</button></div>
      ${!list.length ? UI.empty('🔭', 'Nenhum alvo na lista', 'Adicione jogadores que você está observando no mercado do EA FC.') : `
      <div class="target-grid">${list.map((s) => `
        <div class="card target ${s.status}">
          <div class="target-top">${UI.ovr(s.ovr)}<div><b>${U.esc(s.name)}</b><small>${UI.pos(s.pos)} · ${s.age} anos · ${U.esc(s.club || '—')}</small></div><span class="tag ${s.priority === 'Alta' ? 'hot' : ''}">${U.esc(s.priority)}</span></div>
          <div class="kpis sm"><div><small>POT</small><b>${s.pot}</b></div><div><small>Valor</small><b>${U.money(s.value)}</b></div><div><small>Salário</small><b>${U.money(s.wage)}</b></div><div><small>Status</small><b>${st[s.status] || s.status}</b></div></div>
          ${s.notes ? `<p class="muted prewrap">${U.esc(s.notes)}</p>` : ''}
          <div class="row gap">${s.status !== 'contratado' ? `<button class="btn sm primary" data-act="newTransfer" data-dir="in" data-sl="${s.id}">✍️ Contratar</button>` : ''}<button class="btn sm" data-act="editTarget" data-id="${s.id}">✏️</button><button class="btn sm ghost" data-act="delTarget" data-id="${s.id}">🗑️</button></div>
        </div>`).join('')}</div>`}`;
    },
  };
  A.editTarget = (el) => {
    const c = S.career();
    const s = el.dataset.id ? c.shortlist.find((x) => x.id === el.dataset.id) : null;
    const d = s || { pos: 'ATA', age: 21, ovr: 72, pot: 82, priority: 'Média', status: 'observando' };
    const m = UI.modal({
      title: s ? 'Editar alvo' : 'Novo alvo', size: 'md',
      body: `<form id="sf" class="grid-3">
        ${UI.field('Nome*', `<input name="name" value="${U.esc(d.name || '')}">`, 'span-2')}${UI.field('Posição', `<select name="pos">${UI.options(E.POSITIONS, d.pos)}</select>`)}
        ${UI.field('Idade', `<input type="number" name="age" value="${d.age}">`)}${UI.field('OVR', `<input type="number" name="ovr" value="${d.ovr}">`)}${UI.field('POT', `<input type="number" name="pot" value="${d.pot}">`)}
        ${UI.field('Clube', `<input name="club" value="${U.esc(d.club || '')}">`)}${UI.field('Nacionalidade', `<input name="nat" value="${U.esc(d.nat || '')}">`)}${UI.field('Valor', `<input name="value" value="${U.moneyInput(d.value)}">`)}
        ${UI.field('Salário pedido', `<input name="wage" value="${U.moneyInput(d.wage)}">`)}${UI.field('Prioridade', `<select name="priority">${UI.options(['Alta', 'Média', 'Baixa'], d.priority)}</select>`)}${UI.field('Status', `<select name="status">${UI.options([{ v: 'observando', l: 'Observando' }, { v: 'negociando', l: 'Negociando' }, { v: 'contratado', l: 'Contratado' }, { v: 'descartado', l: 'Descartado' }], d.status)}</select>`)}
        ${UI.field('Relatório do olheiro', `<textarea name="notes" rows="3">${U.esc(d.notes || '')}</textarea>`, 'span-3')}
      </form>`,
      actions: `<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="sf-ok">Salvar</button>`,
    });
    m.$('#sf-ok').onclick = () => {
      const f = UI.formData(m.$('#sf'));
      if (!f.name.trim()) return UI.toast('Informe o nome', 'error');
      const t = s || { id: U.uid('sl_') };
      Object.assign(t, { name: f.name.trim(), pos: f.pos, age: U.num(f.age), ovr: U.num(f.ovr), pot: U.num(f.pot), club: f.club, nat: f.nat, value: U.parseMoney(f.value), wage: U.parseMoney(f.wage), priority: f.priority, status: f.status, notes: f.notes });
      if (!s) c.shortlist.push(t);
      m.close();
      App().commit('Alvo salvo');
    };
  };
  A.delTarget = (el) => { const c = S.career(); c.shortlist = c.shortlist.filter((x) => x.id !== el.dataset.id); App().commit(); };

  /* =============== BASE =============== */
  V.youth = {
    title: 'Categoria de base',
    render(c) {
      const youth = E.sortPlayers(c.players.filter((p) => p.status === 'base'));
      const prospects = c.youth.scouts || [];
      const grads = c.players.filter((p) => p.youth && p.status === 'elenco');
      return `
      <div class="toolbar"><p class="muted">Gerencie seus jovens e use a rede de olheiros para revelar talentos (os nomes gerados são fictícios — use os do seu jogo, se preferir).</p>
        <div class="row gap"><button class="btn" data-act="scoutYouth">🔍 Enviar olheiro</button><button class="btn primary" data-act="addYouth">＋ Jovem</button></div></div>
      <div class="grid-2">
        <div class="card"><div class="card-head"><h3>🌱 Elenco sub-19 (${youth.length})</h3></div>
          ${youth.length ? `<table class="tbl compact"><tbody>${youth.map((p) => `<tr><td>${UI.pos(p.pos)}</td><td><a href="#/player/${p.id}">${U.esc(p.name)}</a><small class="sub">${p.age} anos · ${U.esc(p.nat || '')}</small></td><td class="num">${UI.ovr(p.ovr)}</td><td class="num">${UI.ovr(p.pot)}</td><td class="actions"><button class="btn sm" data-act="promoteYouth" data-id="${p.id}">⬆️ Promover</button></td></tr>`).join('')}</tbody></table>` : '<p class="muted">Nenhum jogador na base.</p>'}
        </div>
        <div class="card"><div class="card-head"><h3>🎓 Formados no clube (${grads.length})</h3></div>
          ${grads.length ? `<table class="tbl compact"><tbody>${grads.map((p) => { const s = E.playerStats(c, p.id, 'all'); return `<tr><td>${UI.pos(p.pos)}</td><td><a href="#/player/${p.id}">${U.esc(p.name)}</a></td><td class="num">${UI.ovr(p.ovr)}</td><td class="num muted">${s.apps} J · ${s.goals} G</td></tr>`; }).join('')}</tbody></table>` : '<p class="muted">Promova jovens para vê-los aqui.</p>'}
        </div>
      </div>
      <div class="card"><div class="card-head"><h3>🔭 Relatórios dos olheiros</h3>${prospects.length ? '<button class="btn sm ghost" data-act="clearProspects">Limpar</button>' : ''}</div>
        ${prospects.length ? `<div class="target-grid">${prospects.map((y) => `<div class="card target"><div class="target-top">${UI.ovr(y.ovr)}<div><b>${U.esc(y.name)}</b><small>${UI.pos(y.pos)} · ${y.age} anos · ${U.esc(y.nat)}</small></div><span class="tag gold">POT ${y.potMin}-${y.potMax}</span></div><p class="muted">${y.traits.map(U.esc).join(' · ')}${y.region ? ' · Região: ' + U.esc(y.region) : ''}</p><div class="row gap"><button class="btn sm primary" data-act="signProspect" data-id="${y.id}">Assinar</button><button class="btn sm ghost" data-act="dropProspect" data-id="${y.id}">Dispensar</button></div></div>`).join('')}</div>` : '<p class="muted">Envie olheiros para gerar relatórios de jovens talentos.</p>'}
      </div>`;
    },
  };
  A.addYouth = () => { A.editPlayer({ dataset: {} }); setTimeout(() => { const s = document.querySelector('#pf [name=status]'); if (s) s.value = 'base'; const y = document.querySelector('#pf [name=youth]'); if (y) y.checked = true; const a = document.querySelector('#pf [name=age]'); if (a) a.value = 16; }, 50); };
  A.scoutYouth = () => {
    const c = S.career();
    const m = UI.modal({
      title: 'Missão de observação', size: 'sm',
      body: `${UI.field('Região / país', `<input id="sy-r" value="${U.esc(c.club.country || '')}">`)}${UI.field('Posição desejada', `<select id="sy-p"><option value="">Qualquer</option>${UI.options(E.POSITIONS)}</select>`)}${UI.field('Qualidade do olheiro', `<select id="sy-q">${UI.options([{ v: 'baixa', l: '★ Básico' }, { v: 'normal', l: '★★ Bom' }, { v: 'alta', l: '★★★ Excelente' }, { v: 'elite', l: '★★★★ Elite' }], 'normal')}</select>`)}${UI.field('Quantidade de relatórios', '<input id="sy-n" type="number" min="1" max="6" value="3">')}`,
      actions: `<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="sy-ok">Enviar</button>`,
    });
    m.$('#sy-ok').onclick = () => {
      c.youth.scouts = c.youth.scouts || [];
      const n = U.clamp(U.num(m.$('#sy-n').value, 3), 1, 6);
      for (let i = 0; i < n; i++) c.youth.scouts.unshift(E.generateProspect(c, { region: m.$('#sy-r').value, pos: m.$('#sy-p').value, quality: m.$('#sy-q').value, nat: m.$('#sy-r').value || undefined }));
      m.close();
      App().commit('Olheiros retornaram com relatórios!');
    };
  };
  A.signProspect = (el) => {
    const c = S.career();
    const y = c.youth.scouts.find((x) => x.id === el.dataset.id);
    const p = E.newPlayer(c, { name: y.name, pos: y.pos, age: y.age, ovr: y.ovr, pot: Math.round((y.potMin + y.potMax) / 2), nat: y.nat, status: 'base', role: 'Promessa', notes: 'Características: ' + y.traits.join(', '), wage: 1000, value: y.ovr * 10000 });
    p.youth = true;
    c.players.push(p);
    c.youth.scouts = c.youth.scouts.filter((x) => x.id !== y.id);
    E.addNews(c, { type: 'base', icon: '🌱', title: `${c.club.name} assina com a promessa ${y.name}`, body: `O jovem de ${y.age} anos chega para as categorias de base com potencial apontado entre ${y.potMin} e ${y.potMax}.` });
    App().commit('Jovem assinou com a base!');
  };
  A.dropProspect = (el) => { const c = S.career(); c.youth.scouts = c.youth.scouts.filter((x) => x.id !== el.dataset.id); App().commit(); };
  A.clearProspects = () => { S.career().youth.scouts = []; App().commit(); };

  /* =============== FINANÇAS =============== */
  const fState = { season: null };
  V.finances = {
    title: 'Finanças',
    render(c) {
      const season = fState.season || c.seasonYear;
      const seasons = Array.from(new Set([c.seasonYear, ...c.transactions.map((t) => t.season)])).sort((a, b) => b - a);
      const tx = c.transactions.filter((t) => t.season === season).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      const inc = U.sum(tx.filter((t) => t.type === 'in'), (t) => t.amount);
      const exp = U.sum(tx.filter((t) => t.type === 'out'), (t) => t.amount);
      const cats = {};
      tx.forEach((t) => { const k = (t.type === 'in' ? '+ ' : '− ') + t.category; cats[k] = (cats[k] || 0) + t.amount; });
      // série de saldo
      let bal = c.finances.balance;
      const all = c.transactions.slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      const totalDelta = U.sum(all, (t) => (t.type === 'in' ? t.amount : -t.amount));
      let run = bal - totalDelta;
      const series = [{ y: run, label: 'Início' }].concat(all.map((t) => { run += t.type === 'in' ? t.amount : -t.amount; return { y: run, label: t.desc }; }));
      const wb = E.wageBill(c);
      return `
      <div class="toolbar">
        <select data-change="fSeason">${UI.options(seasons.map((y) => ({ v: y, l: 'Temporada ' + U.seasonLabel(y) })), season)}</select>
        <div class="row gap wrap"><button class="btn" data-act="editBudgets">⚙️ Orçamentos</button><button class="btn primary" data-act="newTx">＋ Lançamento</button></div>
      </div>
      <div class="summary-strip">
        <div><small>Saldo atual</small><b class="${c.finances.balance < 0 ? 'bad-txt' : ''}">${U.money(c.finances.balance)}</b></div>
        <div><small>Orç. transferências</small><b>${U.money(c.finances.transferBudget)}</b></div>
        <div><small>Orç. salarial / folha</small><b class="${wb > c.finances.wageBudget && c.finances.wageBudget ? 'bad-txt' : ''}">${U.money(wb)} / ${U.money(c.finances.wageBudget)}</b></div>
        <div><small>Receitas ${U.seasonLabel(season)}</small><b class="good-txt">${U.money(inc)}</b></div>
        <div><small>Despesas ${U.seasonLabel(season)}</small><b class="bad-txt">${U.money(exp)}</b></div>
      </div>
      <div class="grid-2">
        <div class="card"><div class="card-head"><h3>Evolução do saldo</h3></div>${UI.lineChart([{ name: 'Saldo', color: 'var(--accent)', points: series.slice(-40), area: true }], { height: 180, valueFmt: (v) => U.money(v) })}</div>
        <div class="card"><div class="card-head"><h3>Por categoria</h3></div>${UI.barChart(Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, value]) => ({ label, value, color: label.startsWith('+') ? 'var(--good)' : 'var(--bad)' })), { valueFmt: (v) => U.money(v) })}</div>
      </div>
      <div class="card"><div class="card-head"><h3>Lançamentos</h3></div>
        ${tx.length ? `<div class="table-wrap"><table class="tbl compact"><thead><tr><th>Data</th><th>Categoria</th><th>Descrição</th><th class="num">Valor</th><th></th></tr></thead><tbody>${tx.map((t) => `<tr><td class="muted">${U.fmtDate(t.date)}</td><td><span class="tag">${U.esc(t.category)}</span></td><td>${U.esc(t.desc)}</td><td class="num ${t.type === 'in' ? 'good-txt' : 'bad-txt'}">${t.type === 'in' ? '+' : '−'}${U.money(t.amount)}</td><td class="actions"><button class="icon-btn" data-act="delTx" data-id="${t.id}">🗑️</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Nenhum lançamento. Registre receitas (bilheteria, premiações, patrocínio) e despesas (salários, estrutura) para dar vida às finanças.</p>'}
      </div>`;
    },
  };
  A.fSeason = (el) => { fState.season = Number(el.value); App().render(); };
  A.newTx = () => {
    const c = S.career();
    const m = UI.modal({
      title: 'Novo lançamento', size: 'sm',
      body: `<form id="txf">${UI.field('Tipo', `<select name="type">${UI.options([{ v: 'in', l: 'Receita' }, { v: 'out', l: 'Despesa' }])}</select>`)}
      ${UI.field('Categoria', `<input name="category" list="tx-cats" value="Bilheteria"><datalist id="tx-cats">${['Bilheteria', 'Premiações', 'Patrocínio', 'Direitos de TV', 'Vendas de produtos', 'Salários', 'Estrutura', 'Bônus', 'Transferências', 'Luvas / bônus', 'Outros'].map((x) => `<option value="${x}">`).join('')}</datalist>`)}
      ${UI.field('Valor', '<input name="amount" placeholder="ex.: 2.5m">')}${UI.field('Descrição', '<input name="desc">')}${UI.field('Data', `<input type="date" name="date" value="${c.gameDate}">`)}
      <label class="check"><input type="checkbox" name="budget"> Também ajustar orçamento de transferências</label></form>`,
      actions: `<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="tx-ok">Salvar</button>`,
    });
    m.$('#tx-ok').onclick = () => {
      const f = UI.formData(m.$('#txf'));
      const amount = U.parseMoney(f.amount);
      if (!amount) return UI.toast('Informe o valor', 'error');
      E.addTransaction(c, f);
      if (f.budget) c.finances.transferBudget = Math.max(0, c.finances.transferBudget + (f.type === 'in' ? amount : -amount));
      m.close();
      App().commit('Lançamento registrado');
    };
  };
  A.delTx = (el) => { E.removeTransaction(S.career(), el.dataset.id); App().commit(); };
  A.editBudgets = () => {
    const c = S.career();
    const m = UI.modal({
      title: 'Orçamentos', size: 'sm',
      body: `<p class="hint">Copie os valores da tela de finanças do EA FC.</p>${UI.field('Saldo do clube', `<input id="b-bal" value="${U.moneyInput(c.finances.balance)}">`)}${UI.field('Orçamento de transferências', `<input id="b-tr" value="${U.moneyInput(c.finances.transferBudget)}">`)}${UI.field('Orçamento salarial semanal', `<input id="b-w" value="${U.moneyInput(c.finances.wageBudget)}">`)}`,
      actions: `<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="b-ok">Salvar</button>`,
    });
    m.$('#b-ok').onclick = () => {
      c.finances.balance = U.parseMoney(m.$('#b-bal').value);
      c.finances.transferBudget = U.parseMoney(m.$('#b-tr').value);
      c.finances.wageBudget = U.parseMoney(m.$('#b-w').value);
      m.close();
      App().commit('Orçamentos atualizados');
    };
  };

  /* =============== DIRETORIA =============== */
  V.board = {
    title: 'Diretoria e objetivos',
    render(c) {
      const objs = c.objectives.filter((o) => o.season === c.seasonYear);
      const prev = c.objectives.filter((o) => o.season !== c.seasonYear);
      const ch = c.challenges || [];
      const verdict = c.board.confidence >= 80 ? 'A diretoria está encantada com seu trabalho. Há conversas sobre uma renovação.' : c.board.confidence >= 60 ? 'A diretoria confia no seu trabalho e no projeto.' : c.board.confidence >= 40 ? 'A diretoria espera melhora nos resultados.' : c.board.confidence >= 20 ? 'Seu cargo está em risco. A diretoria exige reação imediata.' : 'Ultimato: mais um tropeço e você será demitido.';
      const objRow = (o) => `<li class="obj-${o.status}"><button class="obj-check" data-act="cycleObjective" data-id="${o.id}">${o.status === 'concluido' ? '✔' : o.status === 'falhou' ? '✖' : ''}</button><span><small class="muted">${U.esc(o.category)}</small> ${U.esc(o.text)}</span><small class="tag ${o.priority === 'Crítica' ? 'hot' : ''}">${U.esc(o.priority)}</small><button class="icon-btn sm" data-act="delObjective" data-id="${o.id}">✕</button></li>`;
      return `
      <div class="grid-2">
        <div class="card">
          <div class="card-head"><h3>Avaliação</h3></div>
          ${UI.meter(c.board.confidence, `Confiança da diretoria · ${UI.boardLabel(c.board.confidence)}`)}
          ${UI.meter(c.board.fans, 'Apoio da torcida')}
          <p class="verdict">${verdict}</p>
          <div class="row gap"><button class="btn sm ghost" data-act="adjustBoard">Ajustar manualmente</button></div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Objetivos ${U.seasonLabel(c.seasonYear)}</h3><button class="btn sm primary" data-act="addObjective">＋ Objetivo</button></div>
          ${objs.length ? `<ul class="obj-list">${objs.map(objRow).join('')}</ul>` : '<p class="muted">Copie os objetivos da diretoria do EA FC (desempenho, financeiro, desenvolvimento, marca…).</p>'}
          <p class="hint">Clique no círculo para alternar: pendente → concluído → falhou.</p>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><h3>🎯 Desafios pessoais</h3></div>
        <p class="muted">Regras extras para deixar a carreira mais difícil e imersiva.</p>
        <div class="chips">${E.CHALLENGES.map((x) => { const on = ch.includes(x.id); return `<button class="chip chip-btn ${on ? 'on' : ''}" data-act="toggleChallenge" data-id="${x.id}" title="${U.esc(x.desc)}">${on ? '✅' : '⬜'} ${U.esc(x.name)}</button>`; }).join('')}</div>
        ${ch.length ? `<ul class="plain mt">${E.CHALLENGES.filter((x) => ch.includes(x.id)).map((x) => `<li><b>${U.esc(x.name)}:</b> ${U.esc(x.desc)}</li>`).join('')}</ul>` : ''}
      </div>
      ${prev.length ? `<div class="card"><div class="card-head"><h3>Objetivos anteriores</h3></div><ul class="obj-list">${prev.sort((a, b) => b.season - a.season).map((o) => objRow(o).replace('<span>', `<span><small class="tag">${U.seasonLabel(o.season)}</small> `)).join('')}</ul></div>` : ''}`;
    },
  };
  A.addObjective = () => {
    const c = S.career();
    const m = UI.modal({
      title: 'Novo objetivo', size: 'sm',
      body: `<form id="of">${UI.field('Objetivo', '<input name="text" placeholder="Ex.: Terminar no top 4">')}${UI.field('Categoria', `<select name="category">${UI.options(['Desempenho', 'Copa', 'Continental', 'Financeiro', 'Desenvolvimento', 'Marca', 'Pessoal'])}</select>`)}${UI.field('Prioridade', `<select name="priority">${UI.options(['Crítica', 'Alta', 'Média', 'Baixa'], 'Alta')}</select>`)}</form>`,
      actions: `<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="of-ok">Adicionar</button>`,
    });
    m.$('#of-ok').onclick = () => {
      const f = UI.formData(m.$('#of'));
      if (!f.text.trim()) return;
      c.objectives.push(E.newObjective(c, f));
      m.close();
      App().commit();
    };
  };
  A.delObjective = (el) => { const c = S.career(); c.objectives = c.objectives.filter((o) => o.id !== el.dataset.id); App().commit(); };
  A.toggleChallenge = (el) => {
    const c = S.career();
    const id = el.dataset.id;
    c.challenges = c.challenges.includes(id) ? c.challenges.filter((x) => x !== id) : c.challenges.concat(id);
    App().commit();
  };
  A.adjustBoard = () => {
    const c = S.career();
    const m = UI.modal({
      title: 'Ajustar clima', size: 'sm',
      body: `${UI.field('Confiança da diretoria', `<input type="range" id="ab-b" min="0" max="100" value="${Math.round(c.board.confidence)}">`)}${UI.field('Apoio da torcida', `<input type="range" id="ab-f" min="0" max="100" value="${Math.round(c.board.fans)}">`)}${UI.field('Reputação do treinador', `<input type="range" id="ab-r" min="1" max="99" value="${Math.round(c.manager.reputation)}">`)}`,
      actions: `<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="ab-ok">Salvar</button>`,
    });
    m.$('#ab-ok').onclick = () => { c.board.confidence = U.num(m.$('#ab-b').value); c.board.fans = U.num(m.$('#ab-f').value); c.manager.reputation = U.num(m.$('#ab-r').value); m.close(); App().commit(); };
  };

  /* =============== NOTÍCIAS =============== */
  const nState = { type: '' };
  const NEWS_TYPES = { '': 'Todas', partida: 'Partidas', mercado: 'Mercado', rumor: 'Rumores', destaque: 'Destaques', coletiva: 'Coletivas', titulo: 'Títulos', crise: 'Crise', base: 'Base', oficial: 'Oficial', diretoria: 'Diretoria', geral: 'Geral' };
  V.news = {
    title: 'Notícias',
    render(c) {
      const list = c.news.filter((n) => !nState.type || n.type === nState.type);
      const pinned = list.filter((n) => n.pinned);
      const rest = list.filter((n) => !n.pinned);
      const card = (n, big) => `<article class="news ${big ? 'big' : ''} type-${n.type}">
        <div class="news-ico">${n.icon}</div>
        <div class="news-body">
          <small class="news-meta">${U.esc(n.source)} · ${U.fmtDate(n.date)} · ${U.esc(NEWS_TYPES[n.type] || n.type)}</small>
          <h3>${U.esc(n.title)}</h3>
          ${n.body ? `<p>${U.esc(n.body)}</p>` : ''}
        </div>
        <div class="news-act"><button class="icon-btn sm" data-act="pinNews" data-id="${n.id}" title="Fixar">${n.pinned ? '📌' : '📍'}</button><button class="icon-btn sm" data-act="delNews" data-id="${n.id}" title="Apagar">✕</button></div>
      </article>`;
      return `
      <div class="toolbar">
        <div class="chips">${Object.entries(NEWS_TYPES).map(([k, l]) => `<button class="chip chip-btn ${nState.type === k ? 'on' : ''}" data-act="newsType" data-k="${k}">${l}</button>`).join('')}</div>
        <div class="row gap"><button class="btn" data-act="genRumor">🗣️ Rumor</button><button class="btn primary" data-act="writeNews">✍️ Escrever matéria</button></div>
      </div>
      ${!list.length ? UI.empty('📰', 'Sem notícias', 'As notícias são geradas automaticamente quando você registra partidas, transferências e títulos.') : `
      <div class="news-feed">${pinned.map((n) => card(n, true)).join('')}${rest.slice(0, 150).map((n, i) => card(n, i === 0 && !pinned.length)).join('')}</div>`}`;
    },
  };
  A.newsType = (el) => { nState.type = el.dataset.k; App().render(); };
  A.pinNews = (el) => { const n = S.career().news.find((x) => x.id === el.dataset.id); n.pinned = !n.pinned; App().commit(); };
  A.delNews = (el) => { const c = S.career(); c.news = c.news.filter((x) => x.id !== el.dataset.id); App().commit(); };
  A.writeNews = () => {
    const c = S.career();
    const m = UI.modal({
      title: 'Escrever matéria', size: 'md',
      body: `<form id="wn">${UI.field('Manchete', '<input name="title">')}${UI.field('Texto', '<textarea name="body" rows="4"></textarea>')}<div class="grid-3">${UI.field('Tipo', `<select name="type">${UI.options(Object.entries(NEWS_TYPES).filter(([k]) => k).map(([v, l]) => ({ v, l })), 'geral')}</select>`)}${UI.field('Ícone', '<input name="icon" value="📰" maxlength="4">')}${UI.field('Veículo', `<input name="source" value="${U.esc(E.SOURCES[0])}">`)}</div></form>`,
      actions: `<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="wn-ok">Publicar</button>`,
    });
    m.$('#wn-ok').onclick = () => {
      const f = UI.formData(m.$('#wn'));
      if (!f.title.trim()) return;
      E.addNews(c, f);
      m.close();
      App().commit('Matéria publicada');
    };
  };

  /* =============== CAIXA DE ENTRADA (coletivas + dilemas) =============== */
  V.inbox = {
    title: 'Caixa de entrada',
    render(c) {
      const press = c.press.slice(0, 10);
      const evs = c.events.slice(0, 20);
      return `
      <div class="grid-2">
        <div class="card cta-card">
          <div class="cta-ico">🎙️</div>
          <h3>Coletiva de imprensa</h3>
          <p class="muted">Responda aos jornalistas. Suas respostas afetam a moral do elenco, a diretoria e a torcida.</p>
          <button class="btn primary" data-act="pressConference">Iniciar coletiva</button>
        </div>
        <div class="card cta-card">
          <div class="cta-ico">📨</div>
          <h3>Acontecimentos no clube</h3>
          <p class="muted">Dilemas do dia a dia: pedidos de aumento, polêmicas, vestiário e patrocinadores. Gere um por semana no jogo para mais imersão.</p>
          <button class="btn primary" data-act="newEvent">Gerar acontecimento</button>
        </div>
      </div>
      <div class="grid-2">
        <div class="card"><div class="card-head"><h3>Decisões tomadas</h3></div>
          ${evs.length ? `<ul class="timeline">${evs.map((e) => `<li><b>${U.esc(e.title)}</b><span>➡️ ${U.esc(e.choice)}</span><small class="muted">${U.fmtDate(e.date)} · ${e.effects.map(U.esc).join(' · ')}</small></li>`).join('')}</ul>` : '<p class="muted">Nenhuma decisão ainda.</p>'}
        </div>
        <div class="card"><div class="card-head"><h3>Coletivas anteriores</h3></div>
          ${press.length ? `<ul class="timeline">${press.map((p) => `<li><b>${U.fmtDate(p.date)}</b>${p.qa.map((x) => `<span class="muted">P: ${U.esc(x.q)}</span><span>R: “${U.esc(x.t)}”</span>`).join('')}</li>`).join('')}</ul>` : '<p class="muted">Nenhuma coletiva ainda.</p>'}
        </div>
      </div>`;
    },
  };

  A.pressConference = () => {
    const c = S.career();
    const qs = E.pressQuestions(c);
    const answers = [];
    let i = 0;
    const m = UI.modal({ title: '🎙️ Coletiva de imprensa', size: 'md', body: '<div id="pc"></div>' });
    const reporters = ['Jornalista do Diário Esportivo', 'Repórter da Rádio Arquibancada', 'Setorista do Portal Toque de Bola', 'Enviado da Gazeta do Futebol', 'Comentarista do Canal Tático'];
    const step = () => {
      if (i >= qs.length) {
        const fx = E.applyPress(c, answers);
        S.save();
        m.$('#pc').innerHTML = `<div class="center-txt"><div class="cta-ico">📰</div><h3>Coletiva encerrada</h3>
          <p>Moral do elenco <b>${fx.morale >= 0 ? '+' : ''}${fx.morale}</b> · Diretoria <b>${fx.board >= 0 ? '+' : ''}${fx.board}</b> · Torcida <b>${fx.fans >= 0 ? '+' : ''}${fx.fans}</b></p>
          <button class="btn primary" data-close>Fechar</button></div>`;
        m.$('[data-close]').onclick = () => { m.close(); App().render(); };
        return;
      }
      const q = qs[i];
      m.$('#pc').innerHTML = `<div class="press-q"><small class="muted">${U.pick(reporters)} · Pergunta ${i + 1} de ${qs.length}</small><h3>“${U.esc(q.q)}”</h3></div>
        <div class="press-a">${q.a.map((a, k) => `<button class="press-opt" data-k="${k}">${U.esc(a.t)}</button>`).join('')}</div>`;
      m.$$('.press-opt').forEach((b) => (b.onclick = () => { const a = q.a[Number(b.dataset.k)]; answers.push({ q: q.q, t: a.t, fx: a.fx }); i++; step(); }));
    };
    step();
  };

  A.newEvent = () => {
    const c = S.career();
    const ev = E.generateEvent(c);
    if (!ev) return UI.toast('Cadastre o elenco primeiro.', 'warn');
    const m = UI.modal({
      title: '📨 ' + U.esc(ev.title), size: 'md',
      body: `<p>${U.esc(ev.text)}</p><div class="press-a">${ev.options.map((o, k) => `<button class="press-opt" data-k="${k}">${U.esc(o.t)}</button>`).join('')}</div>`,
    });
    m.$$('.press-opt').forEach((b) => (b.onclick = () => {
      const out = E.resolveEvent(c, ev, ev.options[Number(b.dataset.k)]);
      m.close();
      App().commit();
      UI.toast(out.join(' · ') || 'Decisão registrada', 'info', 5000);
    }));
  };

  /* =============== SALA DE TROFÉUS =============== */
  V.trophies = {
    title: 'Sala de troféus',
    render(c) {
      const list = c.trophies.slice().sort((a, b) => b.season - a.season);
      const byName = {};
      list.forEach((t) => (byName[t.name] = (byName[t.name] || []).concat(t)));
      const ach = E.ACHIEVEMENTS;
      const unlocked = ach.filter((a) => c.achievements[a.id]).length;
      return `
      <div class="toolbar"><p class="muted">${list.length} título(s) conquistado(s) por ${U.esc(c.manager.name)}.</p><button class="btn primary" data-act="addTrophy">＋ Troféu</button></div>
      ${list.length ? `<div class="cabinet">${Object.entries(byName).map(([name, ts]) => `
        <div class="trophy ${ts[0].type}">
          <div class="trophy-ico">${ts[0].type === 'liga' ? '🏆' : ts[0].type === 'continental' ? '🌍' : ts[0].type === 'supercopa' ? '🥇' : ts[0].type === 'mundial' ? '🌐' : '🏅'}</div>
          <b>${U.esc(name)}</b>
          <span class="trophy-count">×${ts.length}</span>
          <small>${ts.map((t) => `<button class="link-btn" data-act="delTrophy" data-id="${t.id}" title="${U.esc(t.final || '')} — clique para remover">${U.seasonLabel(t.season)}</button>`).join(' ')}</small>
        </div>`).join('')}</div>` : UI.empty('🏆', 'A estante está vazia… por enquanto', 'Quando for campeão, marque em Competições ou adicione aqui.')}
      <div class="card">
        <div class="card-head"><h3>🎖️ Conquistas de carreira</h3><span class="muted">${unlocked}/${ach.length}</span></div>
        <div class="ach-grid">${ach.map((a) => { const u = c.achievements[a.id]; return `<div class="ach ${u ? 'on' : ''}" title="${U.esc(a.desc)}"><span class="ach-ico">${a.icon}</span><b>${U.esc(a.name)}</b><small>${U.esc(a.desc)}</small>${u ? `<small class="muted">${U.seasonLabel(u.season)}</small>` : ''}</div>`; }).join('')}</div>
      </div>`;
    },
  };
  A.addTrophy = () => {
    const c = S.career();
    const m = UI.modal({
      title: 'Adicionar troféu', size: 'sm',
      body: `<form id="tr">${UI.field('Nome', '<input name="name" placeholder="Copa do Brasil">')}${UI.field('Tipo', `<select name="type">${UI.options(Object.entries(E.COMP_TYPES).map(([v, l]) => ({ v, l })))}</select>`)}${UI.field('Temporada', `<select name="season">${UI.options(Array.from({ length: c.seasonYear - c.startSeasonYear + 1 }, (_, i) => ({ v: c.startSeasonYear + i, l: U.seasonLabel(c.startSeasonYear + i) })), c.seasonYear)}</select>`)}${UI.field('Final / detalhe', '<input name="final">')}</form>`,
      actions: `<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="tr-ok">Adicionar</button>`,
    });
    m.$('#tr-ok').onclick = () => {
      const f = UI.formData(m.$('#tr'));
      if (!f.name.trim()) return;
      E.addTrophy(c, f);
      m.close();
      App().commit();
      MC.celebrate(f.name);
    };
  };
  A.delTrophy = async (el) => {
    if (!(await UI.confirm('Remover este troféu?', { danger: true, ok: 'Remover' }))) return;
    const c = S.career();
    c.trophies = c.trophies.filter((t) => t.id !== el.dataset.id);
    App().commit();
  };

  /* =============== HISTÓRIA / TEMPORADAS =============== */
  V.history = {
    title: 'História do clube',
    render(c) {
      const seasons = c.seasons.slice().sort((a, b) => b.season - a.season);
      const legends = E.allPlayerStats(c, 'all', true).filter((x) => x.s.apps > 0);
      const topApps = legends.slice().sort((a, b) => b.s.apps - a.s.apps).slice(0, 10);
      const topGoals = legends.slice().sort((a, b) => b.s.goals - a.s.goals).filter((x) => x.s.goals).slice(0, 10);
      const all = E.seasonMatches(c, 'all');
      const biggestWin = all.filter((m) => m.gf > m.ga).sort((a, b) => b.gf - b.ga - (a.gf - a.ga) || b.gf - a.gf)[0];
      const worstLoss = all.filter((m) => m.gf < m.ga).sort((a, b) => a.gf - a.ga - (b.gf - b.ga))[0];
      const rec = E.record(all);
      const cur = E.seasonSummary(c);
      return `
      <div class="card season-current">
        <div class="card-head"><h3>Temporada atual · ${U.seasonLabel(c.seasonYear)}</h3><button class="btn primary" data-act="advanceSeason">⏭️ Encerrar temporada</button></div>
        <div class="kpis">
          <div><small>Campanha</small><b>${cur.record.w}V ${cur.record.d}E ${cur.record.l}D</b></div>
          <div><small>Liga</small><b>${cur.leaguePos ? cur.leaguePos + 'º' : '—'}</b></div>
          <div><small>Títulos</small><b>${cur.trophies.length}</b></div>
          <div><small>Objetivos</small><b>${cur.objectives.done}/${cur.objectives.total}</b></div>
        </div>
      </div>
      <div class="summary-strip">
        <div><small>Temporadas</small><b>${c.seasons.length + 1}</b></div><div><small>Jogos</small><b>${rec.p}</b></div>
        <div><small>Aproveitamento</small><b>${rec.p ? Math.round(((rec.w * 3 + rec.d) / (rec.p * 3)) * 100) : 0}%</b></div>
        <div><small>Títulos</small><b>${c.trophies.length}</b></div>
        <div><small>Maior goleada</small><b>${biggestWin ? `${biggestWin.gf}x${biggestWin.ga} ${U.esc(biggestWin.opponent)}` : '—'}</b></div>
        <div class="hide-sm"><small>Pior derrota</small><b>${worstLoss ? `${worstLoss.gf}x${worstLoss.ga} ${U.esc(worstLoss.opponent)}` : '—'}</b></div>
      </div>
      ${seasons.length ? `<div class="card"><div class="card-head"><h3>Temporadas encerradas</h3></div>
        <div class="table-wrap"><table class="tbl"><thead><tr><th>Temporada</th><th>Clube</th><th class="num">Liga</th><th>Campanha</th><th>Títulos</th><th>Artilheiro</th><th class="hide-sm">Melhor nota</th><th class="hide-sm">Contratações</th></tr></thead>
        <tbody>${seasons.map((s) => `<tr><td><button class="link-btn" data-act="seasonDetail" data-y="${s.season}">${U.seasonLabel(s.season)}</button></td><td>${U.esc(s.club || c.club.name)}</td><td class="num">${s.leaguePos ? s.leaguePos + 'º' : '—'}</td><td>${s.record.w}V ${s.record.d}E ${s.record.l}D <small class="muted">(${s.record.gf}:${s.record.ga})</small></td><td>${s.trophies.length ? '🏆 ' + s.trophies.map(U.esc).join(', ') : '—'}</td><td>${s.topScorer ? `${U.esc(s.topScorer.name)} (${s.topScorer.val.goals})` : '—'}</td><td class="hide-sm">${s.bestRated ? `${U.esc(s.bestRated.name)} (${s.bestRated.val.avg.toFixed(2)})` : '—'}</td><td class="hide-sm">${s.signings.length}</td></tr>`).join('')}</tbody></table></div></div>
        ${seasons.length > 1 ? `<div class="card"><div class="card-head"><h3>Posição na liga ao longo dos anos</h3></div>${UI.lineChart([{ name: 'Posição', color: 'var(--accent)', points: seasons.slice().reverse().filter((s) => s.leaguePos).map((s) => ({ y: s.leaguePos, label: U.seasonLabel(s.season) })) }], { invert: true, yMin: 1, labels: seasons.slice().reverse().filter((s) => s.leaguePos).map((s) => U.seasonLabel(s.season)), valueFmt: (v) => Math.round(v) + 'º' })}</div>` : ''}` : ''}
      <div class="grid-2">
        <div class="card"><div class="card-head"><h3>👕 Mais jogos</h3></div>${topApps.length ? `<ol class="rank">${topApps.map((x) => `<li><span><a href="#/player/${x.p.id}">${U.esc(x.p.name)}</a> <small class="muted">${U.esc(E.STATUS_LABEL[x.p.status])}</small></span><b>${x.s.apps}</b></li>`).join('')}</ol>` : '<p class="muted">—</p>'}</div>
        <div class="card"><div class="card-head"><h3>⚽ Maiores artilheiros</h3></div>${topGoals.length ? `<ol class="rank">${topGoals.map((x) => `<li><span><a href="#/player/${x.p.id}">${U.esc(x.p.name)}</a> <small class="muted">${x.s.apps} jogos</small></span><b>${x.s.goals}</b></li>`).join('')}</ol>` : '<p class="muted">—</p>'}</div>
      </div>`;
    },
  };

  A.seasonDetail = (el) => {
    const c = S.career();
    const s = c.seasons.find((x) => x.season === Number(el.dataset.y));
    if (!s) return;
    UI.modal({
      title: `Temporada ${U.seasonLabel(s.season)}`, size: 'md',
      body: `<div class="kpis"><div><small>Campanha</small><b>${s.record.w}V ${s.record.d}E ${s.record.l}D</b></div><div><small>Gols</small><b>${s.record.gf}:${s.record.ga}</b></div><div><small>Liga</small><b>${s.leaguePos ? s.leaguePos + 'º' : '—'}</b></div><div><small>Diretoria</small><b>${s.board}%</b></div></div>
      <h4 class="mt">Competições</h4><ul class="plain">${s.comps.map((x) => `<li>${U.esc(x.name)}: <b>${U.esc(x.status)}</b>${x.pos ? ` (${x.pos}º)` : ''}</li>`).join('')}</ul>
      <h4 class="mt">Prêmios internos</h4><ul class="plain">
        <li>⚽ Artilheiro: ${s.topScorer ? `${U.esc(s.topScorer.name)} — ${s.topScorer.val.goals}` : '—'}</li>
        <li>🎯 Assistências: ${s.topAssist ? `${U.esc(s.topAssist.name)} — ${s.topAssist.val.assists}` : '—'}</li>
        <li>⭐ Melhor nota: ${s.bestRated ? `${U.esc(s.bestRated.name)} — ${s.bestRated.val.avg.toFixed(2)}` : '—'}</li>
        <li>👕 Mais jogos: ${s.mostApps ? `${U.esc(s.mostApps.name)} — ${s.mostApps.val.apps}` : '—'}</li></ul>
      <h4 class="mt">Mercado</h4><p>Gasto ${U.money(s.spent)} · Arrecadado ${U.money(s.earned)}</p><p class="muted">Chegadas: ${s.signings.map(U.esc).join(', ') || '—'}<br>Saídas: ${s.departures.map(U.esc).join(', ') || '—'}</p>
      ${s.awards ? `<h4 class="mt">Prêmios individuais</h4><p class="prewrap">${U.esc(s.awards)}</p>` : ''}
      ${s.notes ? `<h4 class="mt">Resumo do treinador</h4><p class="prewrap">${U.esc(s.notes)}</p>` : ''}`,
      actions: '<button class="btn primary" data-close>Fechar</button>',
    });
  };

  A.advanceSeason = () => {
    const c = S.career();
    const sum = E.seasonSummary(c);
    const pend = c.objectives.filter((o) => o.season === c.seasonYear && o.status === 'pendente');
    const m = UI.modal({
      title: `Encerrar temporada ${U.seasonLabel(c.seasonYear)}`, size: 'lg',
      body: `
      <div class="kpis"><div><small>Campanha</small><b>${sum.record.w}V ${sum.record.d}E ${sum.record.l}D</b></div><div><small>Liga</small><b>${sum.leaguePos ? sum.leaguePos + 'º' : '—'}</b></div><div><small>Títulos</small><b>${sum.trophies.join(', ') || '—'}</b></div><div><small>Artilheiro</small><b>${sum.topScorer ? U.esc(sum.topScorer.name) + ' (' + sum.topScorer.val.goals + ')' : '—'}</b></div></div>
      ${pend.length ? `<div class="alert warn">Há ${pend.length} objetivo(s) pendente(s). Marque-os como concluídos ou falhos na Diretoria antes, se quiser que contem na avaliação.</div>` : ''}
      <form id="as" class="grid-2">
        ${UI.field('Resumo da temporada (aparece na História)', '<textarea name="notes" rows="3" placeholder="Como foi a temporada?"></textarea>', 'span-2')}
        ${UI.field('Prêmios individuais (Bola de Ouro, artilheiro da liga…)', '<textarea name="awards" rows="2"></textarea>', 'span-2')}
        ${UI.field('Novo orçamento de transferências', `<input name="transferBudget" placeholder="${U.moneyInput(c.finances.transferBudget)}">`)}
        ${UI.field('Novo orçamento salarial', `<input name="wageBudget" placeholder="${U.moneyInput(c.finances.wageBudget)}">`)}
        ${UI.field('Premiações recebidas (entra no saldo)', '<input name="prize" placeholder="ex.: 15m">')}
        <label class="check"><input type="checkbox" name="returnLoans" checked> Encerrar empréstimos (retornos e devoluções)</label>
        ${UI.field('Objetivos da próxima temporada (um por linha)', '<textarea name="objectives" rows="3"></textarea>', 'span-2')}
      </form>
      <p class="hint">Isso arquiva a temporada, envelhece o elenco em 1 ano, cria as competições da próxima temporada (mesmos nomes e times) e faz um backup automático antes.</p>`,
      actions: `<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="as-ok">Encerrar e começar ${U.seasonLabel(c.seasonYear + 1)} 🚀</button>`,
    });
    m.$('#as-ok').onclick = () => {
      S.snapshot('antes de encerrar temporada ' + U.seasonLabel(c.seasonYear));
      const f = UI.formData(m.$('#as'));
      const { expired } = E.advanceSeason(c, { notes: f.notes, awards: f.awards, transferBudget: f.transferBudget, wageBudget: f.wageBudget, balanceAdj: U.parseMoney(f.prize), returnLoans: f.returnLoans, objectives: f.objectives.split('\n').map((s) => s.trim()).filter(Boolean) });
      m.close();
      App().commit(`Bem-vindo à temporada ${U.seasonLabel(c.seasonYear)}!`);
      if (expired.length) UI.modal({ title: 'Contratos encerrando', size: 'sm', body: `<p>Estes jogadores estão com contrato vencido ou no último ano. Renove ou registre a saída:</p><ul class="plain">${expired.map((p) => `<li><a href="#/player/${p.id}" data-close>${U.esc(p.name)}</a> — até ${p.contractUntil}</li>`).join('')}</ul>`, actions: '<button class="btn primary" data-close>OK</button>' });
    };
  };

  /* =============== TREINADOR =============== */
  V.manager = {
    title: 'Perfil do treinador',
    render(c) {
      const mg = c.manager;
      const all = E.seasonMatches(c, 'all');
      const rec = E.record(all);
      const repLabel = mg.reputation >= 85 ? 'Lenda mundial' : mg.reputation >= 70 ? 'Renomado internacionalmente' : mg.reputation >= 55 ? 'Respeitado nacionalmente' : mg.reputation >= 40 ? 'Promissor' : 'Desconhecido';
      return `
      <div class="player-hero">
        <div class="ph-card manager">${UI.avatar(mg.name, c.club.colorA, 96)}</div>
        <div class="ph-info">
          <h2>${U.esc(mg.name)}</h2>
          <p>${U.esc(mg.nationality || '')} · ${mg.age ? mg.age + ' anos' : ''} · Estilo ${U.esc(mg.style || '')} · Dificuldade ${U.esc(c.difficulty || '')}</p>
          <div class="ph-kpis">
            <div><small>Reputação</small><b>${Math.round(mg.reputation)} · ${repLabel}</b></div>
            <div><small>Jogos</small><b>${rec.p}</b></div>
            <div><small>Vitórias</small><b>${rec.w} (${rec.winPct}%)</b></div>
            <div><small>Títulos</small><b>${c.trophies.length}</b></div>
            <div><small>Conquistas</small><b>${Object.keys(c.achievements).length}/${E.ACHIEVEMENTS.length}</b></div>
          </div>
          ${mg.bio ? `<p class="prewrap">${U.esc(mg.bio)}</p>` : ''}
          <div class="row gap wrap"><button class="btn" data-act="editManager">✏️ Editar perfil e clube</button><button class="btn ghost" data-act="changeClub">🤝 Assumir outro clube</button></div>
        </div>
      </div>
      <div class="card"><div class="card-head"><h3>Trajetória</h3></div>
        <ul class="timeline">${c.managerHistory.slice().reverse().map((h) => `<li><b>${U.seasonLabel(h.from)} → ${h.to ? U.seasonLabel(h.to) : 'atual'}</b><span>${U.esc(h.club)}</span><small class="muted">${c.trophies.filter((t) => t.season >= h.from && (!h.to || t.season <= h.to)).length} título(s)</small></li>`).join('')}</ul>
      </div>`;
    },
  };
  A.editManager = () => {
    const c = S.career();
    const m = UI.modal({
      title: 'Editar treinador e clube', size: 'lg',
      body: `<form id="em" class="grid-3">
        <h4 class="span-3">Treinador</h4>
        ${UI.field('Nome', `<input name="mname" value="${U.esc(c.manager.name)}">`)}${UI.field('Nacionalidade', `<input name="mnat" value="${U.esc(c.manager.nationality || '')}">`)}${UI.field('Idade', `<input type="number" name="mage" value="${c.manager.age || ''}">`)}
        ${UI.field('Estilo', `<input name="mstyle" value="${U.esc(c.manager.style || '')}">`)}${UI.field('Dificuldade', `<input name="diff" value="${U.esc(c.difficulty || '')}">`)}${UI.field('Moeda', `<select name="currency">${UI.options(['€', 'R$', '£', '$'], c.currency)}</select>`)}
        ${UI.field('Biografia', `<textarea name="bio" rows="2">${U.esc(c.manager.bio || '')}</textarea>`, 'span-3')}
        <h4 class="span-3">Clube</h4>
        ${UI.field('Nome', `<input name="cname" value="${U.esc(c.club.name)}">`)}${UI.field('Sigla', `<input name="cshort" maxlength="3" value="${U.esc(c.club.short || '')}">`)}${UI.field('Liga', `<input name="league" value="${U.esc(c.club.league || '')}">`)}
        ${UI.field('País', `<input name="country" value="${U.esc(c.club.country || '')}">`)}${UI.field('Estádio', `<input name="stadium" value="${U.esc(c.club.stadium || '')}">`)}${UI.field('Rivais', `<input name="rivals" value="${U.esc(c.club.rivals || '')}">`)}
        ${UI.field('Cor principal', `<input type="color" name="colorA" value="${U.esc(c.club.colorA)}">`)}${UI.field('Cor secundária', `<input type="color" name="colorB" value="${U.esc(c.club.colorB)}">`)}
        ${UI.field('Escudo (imagem, opcional)', '<input type="file" accept="image/*" id="em-badge">')}
        ${c.club.badge ? '<label class="check"><input type="checkbox" name="rmBadge"> Remover escudo</label>' : ''}
      </form>`,
      actions: `<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="em-ok">Salvar</button>`,
    });
    m.$('#em-ok').onclick = async () => {
      const f = UI.formData(m.$('#em'));
      Object.assign(c.manager, { name: f.mname, nationality: f.mnat, age: U.num(f.mage), style: f.mstyle, bio: f.bio });
      c.difficulty = f.diff; c.currency = f.currency;
      const oldName = c.club.name;
      Object.assign(c.club, { name: f.cname, short: (f.cshort || f.cname).slice(0, 3).toUpperCase(), league: f.league, country: f.country, stadium: f.stadium, rivals: f.rivals, colorA: f.colorA, colorB: f.colorB });
      const last = c.managerHistory[c.managerHistory.length - 1];
      if (last && last.club === oldName) last.club = f.cname;
      if (f.rmBadge) c.club.badge = '';
      const file = m.$('#em-badge').files[0];
      if (file) c.club.badge = await resizeImage(file, 128);
      m.close();
      App().commit('Perfil atualizado');
    };
  };
  function resizeImage(file, max) {
    return new Promise((res) => {
      const r = new FileReader();
      r.onload = () => {
        const img = new Image();
        img.onload = () => {
          const s = Math.min(1, max / Math.max(img.width, img.height));
          const cv = document.createElement('canvas');
          cv.width = Math.round(img.width * s); cv.height = Math.round(img.height * s);
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          res(cv.toDataURL('image/png'));
        };
        img.onerror = () => res('');
        img.src = r.result;
      };
      r.readAsDataURL(file);
    });
  }
  A.changeClub = () => {
    const c = S.career();
    const m = UI.modal({
      title: 'Assumir outro clube', size: 'md',
      body: `<p class="hint">Sua trajetória, troféus e estatísticas permanecem. O elenco atual será marcado como “ex-jogadores”; cadastre o novo elenco depois.</p><form id="cc" class="grid-2">
        ${UI.field('Novo clube*', '<input name="name">')}${UI.field('Sigla', '<input name="short" maxlength="3">')}${UI.field('Liga', '<input name="league">')}${UI.field('Estádio', '<input name="stadium">')}
        ${UI.field('Cor principal', '<input type="color" name="colorA" value="#3b82f6">')}${UI.field('Cor secundária', '<input type="color" name="colorB" value="#0f172a">')}
        ${UI.field('Orç. transferências', '<input name="transferBudget">')}${UI.field('Orç. salarial', '<input name="wageBudget">')}${UI.field('Rivais', '<input name="rivals">', 'span-2')}</form>`,
      actions: `<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="cc-ok">Assinar contrato</button>`,
    });
    m.$('#cc-ok').onclick = () => {
      const f = UI.formData(m.$('#cc'));
      if (!f.name.trim()) return UI.toast('Informe o clube', 'error');
      S.snapshot('antes de trocar de clube');
      E.changeClub(c, f);
      m.close();
      App().commit(`Bem-vindo ao ${f.name}!`);
    };
  };

  /* =============== DIÁRIO =============== */
  V.journal = {
    title: 'Diário do treinador',
    render(c) {
      const list = c.journal.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.at || '').localeCompare(a.at || ''));
      return `
      <div class="toolbar"><p class="muted">Escreva a história da sua carreira: bastidores, decisões, sentimentos. É o seu “livro” do modo carreira.</p><button class="btn primary" data-act="editJournal">✍️ Nova entrada</button></div>
      ${list.length ? `<div class="journal">${list.map((j) => `<article class="jentry"><div class="jdate"><b>${U.fmtDate(j.date)}</b><small>${U.seasonLabel(j.season)}</small><span class="jmood">${j.mood || '📝'}</span></div><div class="jbody"><h3>${U.esc(j.title || 'Sem título')}</h3><p class="prewrap">${U.esc(j.text)}</p><div class="row gap"><button class="btn sm ghost" data-act="editJournal" data-id="${j.id}">Editar</button><button class="btn sm ghost" data-act="delJournal" data-id="${j.id}">Apagar</button></div></div></article>`).join('')}</div>` : UI.empty('📓', 'Diário em branco', 'Comece registrando suas primeiras impressões no clube.')}`;
    },
  };
  A.editJournal = (el) => {
    const c = S.career();
    const j = el.dataset.id ? c.journal.find((x) => x.id === el.dataset.id) : null;
    const m = UI.modal({
      title: j ? 'Editar entrada' : 'Nova entrada', size: 'md',
      body: `<form id="jf">${UI.field('Título', `<input name="title" value="${U.esc(j ? j.title : '')}">`)}<div class="grid-2">${UI.field('Data no jogo', `<input type="date" name="date" value="${j ? j.date : c.gameDate}">`)}${UI.field('Humor', `<select name="mood">${UI.options(['📝', '😀', '🔥', '😤', '😢', '🤔', '🏆', '💔'], j ? j.mood : '📝')}</select>`)}</div>${UI.field('Texto', `<textarea name="text" rows="8">${U.esc(j ? j.text : '')}</textarea>`)}</form>`,
      actions: `<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="jf-ok">Salvar</button>`,
    });
    m.$('#jf-ok').onclick = () => {
      const f = UI.formData(m.$('#jf'));
      if (!f.text.trim() && !f.title.trim()) return;
      if (j) Object.assign(j, f);
      else c.journal.push(Object.assign({ id: U.uid('j_'), season: c.seasonYear, at: new Date().toISOString() }, f));
      E.checkAchievements(c);
      m.close();
      App().commit('Diário salvo');
    };
  };
  A.delJournal = async (el) => {
    if (!(await UI.confirm('Apagar esta entrada?', { danger: true, ok: 'Apagar' }))) return;
    const c = S.career();
    c.journal = c.journal.filter((x) => x.id !== el.dataset.id);
    App().commit();
  };

  /* =============== SAVES E BACKUP =============== */
  V.saves = {
    title: 'Saves e backup',
    render(c) {
      const bks = S.backups();
      const size = (() => { try { return (new Blob([localStorage.getItem('mc_manager_v1') || '']).size / 1024).toFixed(0); } catch (e) { return '?'; } })();
      const st = S.state.settings;
      return `
      <div class="grid-2">
        <div class="card">
          <div class="card-head"><h3>💾 Arquivo no PC</h3></div>
          ${S.fileApiSupported() ? `
            ${S.fileHandle ? `<div class="alert ${S.needsPermission ? 'warn' : 'good'}">${S.needsPermission ? '⚠️' : '✅'} Vinculado a <b>${U.esc(S.fileName)}</b>${S.needsPermission ? ' — clique em “Gravar agora” para autorizar.' : '. Cada alteração é gravada automaticamente.'}</div>` : '<p>Vincule um arquivo <code>.json</code> no seu computador: o app grava nele automaticamente a cada alteração. Seu save fica seguro mesmo se o navegador for limpo.</p>'}
            <div class="row gap wrap">
              ${S.fileHandle ? '<button class="btn primary" data-act="writeNow">💾 Gravar agora</button><button class="btn ghost" data-act="unlinkFile">Desvincular</button>' : '<button class="btn primary" data-act="linkFile">🔗 Criar/vincular arquivo de save</button>'}
              <button class="btn" data-act="openLinkedFile">📂 Abrir save do PC</button>
            </div>
            <label class="check mt"><input type="checkbox" data-change="toggleAutosave" ${st.autosaveFile ? 'checked' : ''}> Gravar automaticamente no arquivo</label>
          ` : `<p>Seu navegador não permite gravar direto em arquivo (recurso disponível no Chrome, Edge e Opera para desktop). Use <b>Exportar</b> para baixar o save e <b>Importar</b> para carregá-lo.</p>`}
          <p class="hint">Atalho: <kbd>Ctrl</kbd> + <kbd>S</kbd> grava no arquivo (ou exporta).</p>
        </div>
        <div class="card">
          <div class="card-head"><h3>⬇️ Exportar / ⬆️ Importar</h3></div>
          <div class="row gap wrap">
            <button class="btn" data-act="exportCareer">⬇️ Exportar esta carreira</button>
            <button class="btn" data-act="exportAll">⬇️ Exportar tudo</button>
            <label class="btn">⬆️ Importar arquivo<input type="file" accept=".json,application/json" hidden data-change="importFile"></label>
          </div>
          <p class="hint">Use para levar seu save para outro PC/navegador ou compartilhar com amigos. Último arquivo salvo: ${st.lastFileSave ? U.fmtDateTime(st.lastFileSave) : 'nunca'}.</p>
          <p class="muted">Uso do armazenamento do navegador: ~${size} KB.</p>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><h3>🕒 Backups automáticos (no navegador)</h3><button class="btn sm" data-act="snapshotNow">Criar backup agora</button></div>
        ${bks.length ? `<table class="tbl compact"><tbody>${bks.map((b) => `<tr><td>${U.fmtDateTime(b.at)}</td><td class="muted">${U.esc(b.reason)}</td><td class="muted">${(b.data.length / 1024).toFixed(0)} KB</td><td class="actions"><button class="btn sm" data-act="restoreBackup" data-id="${b.id}">Restaurar</button></td></tr>`).join('')}</tbody></table>` : '<p class="muted">Nenhum backup ainda. Eles são criados a cada 10 minutos de uso e antes de ações importantes.</p>'}
      </div>
      <div class="grid-2">
        <div class="card">
          <div class="card-head"><h3>🎨 Aparência</h3></div>
          <div class="row gap wrap">
            ${UI.field('Tema', `<select data-change="setTheme">${UI.options([{ v: 'dark', l: 'Escuro' }, { v: 'light', l: 'Claro' }], st.theme)}</select>`)}
            ${UI.field('Cor de destaque', `<input type="color" data-change="setAccent" value="${U.esc(st.accent || c.club.colorA)}">`)}
          </div>
          <button class="btn sm ghost" data-act="resetAccent">Usar cor do clube</button>
        </div>
        <div class="card danger-zone">
          <div class="card-head"><h3>⚠️ Zona de perigo</h3></div>
          <div class="row gap wrap">
            <button class="btn danger ghost" data-act="deleteCareerCurrent">Excluir esta carreira</button>
            <button class="btn danger ghost" data-act="wipeAll">Apagar todos os dados do navegador</button>
          </div>
        </div>
      </div>`;
    },
  };
  A.linkFile = async () => { const n = await S.linkFile(); UI.toast(`Save vinculado: ${n}`, 'success'); App().render(); };
  A.unlinkFile = async () => { await S.unlinkFile(); UI.toast('Arquivo desvinculado'); App().render(); };
  A.writeNow = async () => { const ok = await S.writeFile(true); UI.toast(ok ? 'Gravado no PC!' : 'Não foi possível gravar', ok ? 'success' : 'error'); App().render(); };
  A.toggleAutosave = (el) => { S.state.settings.autosaveFile = el.checked; S.persist(); };
  A.exportCareer = () => { S.exportFile(true); UI.toast('Arquivo baixado', 'success'); };
  A.exportAll = () => { S.exportFile(false); UI.toast('Arquivo baixado', 'success'); };
  A.importFile = async (el) => {
    const f = el.files[0];
    if (!f) return;
    try {
      const n = S.importText(await f.text(), 'merge');
      UI.toast(`${n} carreira(s) importada(s)`, 'success');
      document.getElementById('app').innerHTML = '';
      App().go('dashboard');
    } catch (e) { UI.toast(e.message, 'error'); }
    el.value = '';
  };
  A.snapshotNow = () => { S.snapshot('manual'); UI.toast('Backup criado', 'success'); App().render(); };
  A.restoreBackup = async (el) => {
    if (!(await UI.confirm('Restaurar este backup? O estado atual vira um novo backup antes.', { ok: 'Restaurar' }))) return;
    S.restoreBackup(el.dataset.id);
    document.getElementById('app').innerHTML = '';
    App().render();
    UI.toast('Backup restaurado', 'success');
  };
  A.setTheme = (el) => { S.state.settings.theme = el.value; S.persist(); App().render(); };
  A.setAccent = (el) => { S.state.settings.accent = el.value; S.persist(); App().render(); };
  A.resetAccent = () => { S.state.settings.accent = null; S.persist(); App().render(); };
  A.deleteCareerCurrent = async () => {
    const c = S.career();
    if (!(await UI.confirm(`Excluir a carreira <b>${U.esc(c.club.name)}</b>? Um backup será criado antes.`, { danger: true, ok: 'Excluir' }))) return;
    S.snapshot('antes de excluir carreira');
    S.deleteCareer(c.id);
    S.state.activeCareerId = null; S.persist();
    document.getElementById('app').innerHTML = '';
    App().render();
  };
  A.wipeAll = async () => {
    if (!(await UI.confirm('Apagar TODAS as carreiras e backups deste navegador? Exporte antes! Esta ação não pode ser desfeita.', { danger: true, ok: 'Apagar tudo' }))) return;
    localStorage.removeItem('mc_manager_v1');
    localStorage.removeItem('mc_manager_backups_v1');
    await S.unlinkFile();
    location.reload();
  };
})(window);
