/* =========================================================
   Modo Carreira Manager — Núcleo (utils + armazenamento)
   Tudo é salvo localmente: localStorage + arquivo no PC.
   ========================================================= */
(function (global) {
  'use strict';

  const MC = (global.MC = global.MC || {});
  const STORAGE_KEY = 'mc_manager_v1';
  const BACKUP_KEY = 'mc_manager_backups_v1';
  const SCHEMA_VERSION = 1;

  /* ---------------- Utils ---------------- */
  const U = (MC.U = {});

  U.uid = (p = '') =>
    p + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  U.esc = (s) =>
    String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  U.clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  U.rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  U.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  U.shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  U.sum = (arr, f = (x) => x) => arr.reduce((t, x) => t + (Number(f(x)) || 0), 0);
  U.num = (v, d = 0) => {
    const n = Number(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : d;
  };
  U.deepClone = (o) => JSON.parse(JSON.stringify(o));

  U.seasonLabel = (y) => {
    y = Number(y);
    return `${String(y).slice(-2)}/${String(y + 1).slice(-2)}`;
  };

  U.today = () => new Date().toISOString().slice(0, 10);

  U.fmtDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso + (iso.length === 10 ? 'T12:00:00' : ''));
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  U.fmtDateTime = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  U.currency = () => (MC.Store && MC.Store.career() && MC.Store.career().currency) || '€';

  /** Formata dinheiro compacto: €12,5 mi | €850 mil */
  U.money = (v, cur) => {
    cur = cur || U.currency();
    v = Number(v) || 0;
    const neg = v < 0;
    const a = Math.abs(v);
    let s;
    if (a >= 1e9) s = (a / 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' bi';
    else if (a >= 1e6) s = (a / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' mi';
    else if (a >= 1e3) s = (a / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mil';
    else s = a.toLocaleString('pt-BR');
    return (neg ? '-' : '') + cur + s;
  };

  /** Converte "12.5m", "12,5 mi", "850k", "850 mil", "1.2bi", "3000000" em número */
  U.parseMoney = (input) => {
    if (input == null) return 0;
    if (typeof input === 'number') return input;
    let s = String(input).trim().toLowerCase().replace(/[€$£r\s]/g, '');
    if (!s) return 0;
    let mult = 1;
    if (/(bi|b)$/.test(s)) { mult = 1e9; s = s.replace(/(bi|b)$/, ''); }
    else if (/(mi|m|mm)$/.test(s)) { mult = 1e6; s = s.replace(/(mi|mm|m)$/, ''); }
    else if (/(mil|k)$/.test(s)) { mult = 1e3; s = s.replace(/(mil|k)$/, ''); }
    // "1.200.000" -> 1200000 ; "12,5" -> 12.5
    if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(',', '.');
    const n = parseFloat(s);
    return Number.isFinite(n) ? Math.round(n * mult) : 0;
  };

  /** Valor bruto para campos de input (ex.: 12500000 -> "12.5m") */
  U.moneyInput = (v) => {
    v = Number(v) || 0;
    if (v === 0) return '';
    if (Math.abs(v) >= 1e6) return +(v / 1e6).toFixed(3) + 'm';
    if (Math.abs(v) >= 1e3) return +(v / 1e3).toFixed(1) + 'k';
    return String(v);
  };

  U.download = (filename, content, mime = 'application/json') => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
  };

  U.slug = (s) =>
    String(s || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();

  U.initials = (name) =>
    String(name || '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');

  U.ordinal = (n) => (n ? n + 'º' : '—');

  U.debounce = (fn, ms) => {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  };

  /* ---------------- Tiny IndexedDB KV (para o handle do arquivo) ---------------- */
  const IDB = {
    db: null,
    open() {
      if (this.db) return Promise.resolve(this.db);
      return new Promise((res, rej) => {
        if (!global.indexedDB) return rej(new Error('IndexedDB indisponível'));
        const r = indexedDB.open('mc_manager_idb', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('kv');
        r.onsuccess = () => res((this.db = r.result));
        r.onerror = () => rej(r.error);
      });
    },
    async get(k) {
      const db = await this.open();
      return new Promise((res, rej) => {
        const t = db.transaction('kv', 'readonly').objectStore('kv').get(k);
        t.onsuccess = () => res(t.result);
        t.onerror = () => rej(t.error);
      });
    },
    async set(k, v) {
      const db = await this.open();
      return new Promise((res, rej) => {
        const t = db.transaction('kv', 'readwrite').objectStore('kv').put(v, k);
        t.onsuccess = () => res();
        t.onerror = () => rej(t.error);
      });
    },
    async del(k) {
      const db = await this.open();
      return new Promise((res) => {
        const t = db.transaction('kv', 'readwrite').objectStore('kv').delete(k);
        t.onsuccess = () => res();
        t.onerror = () => res();
      });
    },
  };
  MC.IDB = IDB;

  /* ---------------- Store ---------------- */
  const listeners = new Set();

  function emptyState() {
    return {
      schema: SCHEMA_VERSION,
      activeCareerId: null,
      careers: {},
      settings: {
        autosaveFile: true,
        theme: 'dark',
        accent: null,
        sound: false,
        lastFileSave: null,
      },
    };
  }

  const Store = (MC.Store = {
    state: emptyState(),
    dirtyFile: false,
    fileHandle: null,
    fileName: null,
    lastSaved: null,

    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.state = Object.assign(emptyState(), parsed);
          this.state.settings = Object.assign(emptyState().settings, parsed.settings || {});
          Object.values(this.state.careers).forEach((c) => MC.Engine && MC.Engine.migrateCareer(c));
        }
      } catch (e) {
        console.error('Falha ao carregar save', e);
        MC.UI && MC.UI.toast('Erro ao carregar o save local. Tente restaurar um backup.', 'error');
      }
      return this.state;
    },

    persist() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        this.lastSaved = new Date();
      } catch (e) {
        console.error(e);
        MC.UI &&
          MC.UI.toast(
            'Armazenamento do navegador cheio! Exporte seu save para o PC e remova carreiras antigas.',
            'error'
          );
      }
    },

    /** Salva no navegador e (se vinculado) agenda gravação no arquivo do PC */
    save() {
      const c = this.career();
      if (c) c.updatedAt = new Date().toISOString();
      this.persist();
      this.dirtyFile = true;
      this._scheduleFile();
      listeners.forEach((fn) => {
        try { fn(); } catch (e) { console.error(e); }
      });
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    career() {
      return this.state.careers[this.state.activeCareerId] || null;
    },

    careersList() {
      return Object.values(this.state.careers).sort((a, b) =>
        (b.updatedAt || '').localeCompare(a.updatedAt || '')
      );
    },

    setActive(id) {
      this.state.activeCareerId = id;
      this.persist();
    },

    addCareer(c) {
      this.state.careers[c.id] = c;
      this.state.activeCareerId = c.id;
      this.save();
    },

    deleteCareer(id) {
      delete this.state.careers[id];
      if (this.state.activeCareerId === id) {
        const first = Object.keys(this.state.careers)[0];
        this.state.activeCareerId = first || null;
      }
      this.save();
    },

    /* ---- Backups automáticos no navegador ---- */
    snapshot(reason = 'auto') {
      try {
        const list = this.backups();
        list.unshift({
          id: U.uid('bk_'),
          at: new Date().toISOString(),
          reason,
          data: JSON.stringify(this.state),
        });
        while (list.length > 6) list.pop();
        localStorage.setItem(BACKUP_KEY, JSON.stringify(list));
      } catch (e) {
        // Se não couber, remove backups antigos
        try { localStorage.removeItem(BACKUP_KEY); } catch (_) {}
      }
    },
    backups() {
      try {
        return JSON.parse(localStorage.getItem(BACKUP_KEY) || '[]');
      } catch (e) {
        return [];
      }
    },
    restoreBackup(id) {
      const b = this.backups().find((x) => x.id === id);
      if (!b) return false;
      this.snapshot('antes de restaurar');
      this.replaceState(JSON.parse(b.data));
      return true;
    },

    replaceState(obj) {
      const st = Object.assign(emptyState(), obj);
      st.settings = Object.assign(emptyState().settings, obj.settings || {});
      Object.values(st.careers || {}).forEach((c) => MC.Engine.migrateCareer(c));
      this.state = st;
      if (!st.careers[st.activeCareerId]) st.activeCareerId = Object.keys(st.careers)[0] || null;
      this.save();
    },

    /* ---- Exportar / Importar ---- */
    exportPayload(onlyActive = false) {
      if (onlyActive && this.career()) {
        const c = this.career();
        return {
          app: 'modo-carreira-manager',
          kind: 'career',
          schema: SCHEMA_VERSION,
          exportedAt: new Date().toISOString(),
          career: c,
        };
      }
      return {
        app: 'modo-carreira-manager',
        kind: 'full',
        schema: SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        state: this.state,
      };
    },

    exportFile(onlyActive = false) {
      const payload = this.exportPayload(onlyActive);
      const c = this.career();
      const name = onlyActive && c
        ? `carreira-${U.slug(c.club.name)}-${U.seasonLabel(c.seasonYear).replace('/', '-')}.json`
        : `modo-carreira-backup-${U.today()}.json`;
      U.download(name, JSON.stringify(payload, null, 2));
      this.state.settings.lastFileSave = new Date().toISOString();
      this.persist();
    },

    /** Importa texto JSON. mode: 'merge' (adiciona) | 'replace' */
    importText(text, mode = 'merge') {
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('Arquivo inválido: não é um JSON.');
      }
      if (!data || (data.app && data.app !== 'modo-carreira-manager')) {
        throw new Error('Este arquivo não é um save do Modo Carreira Manager.');
      }
      this.snapshot('antes de importar');
      let careers = [];
      if (data.kind === 'career' && data.career) careers = [data.career];
      else if (data.state && data.state.careers) careers = Object.values(data.state.careers);
      else if (data.careers) careers = Object.values(data.careers);
      else if (data.club && data.players) careers = [data];
      if (!careers.length) throw new Error('Nenhuma carreira encontrada no arquivo.');

      if (mode === 'replace' && data.state) {
        this.replaceState(data.state);
        return careers.length;
      }
      careers.forEach((c) => {
        MC.Engine.migrateCareer(c);
        if (this.state.careers[c.id]) {
          // Já existe: substitui se o arquivo for mais novo, senão cria cópia
          const cur = this.state.careers[c.id];
          if ((c.updatedAt || '') >= (cur.updatedAt || '')) this.state.careers[c.id] = c;
          else {
            c.id = U.uid('car_');
            c.name = (c.name || c.club.name) + ' (cópia)';
            this.state.careers[c.id] = c;
          }
        } else this.state.careers[c.id] = c;
        this.state.activeCareerId = c.id;
      });
      this.save();
      return careers.length;
    },

    /* ---- Arquivo no PC (File System Access API) ---- */
    fileApiSupported() {
      return 'showSaveFilePicker' in global && global.isSecureContext !== false;
    },

    async restoreFileHandle() {
      if (!this.fileApiSupported()) return;
      try {
        const h = await IDB.get('fileHandle');
        if (h) {
          this.fileHandle = h;
          this.fileName = h.name;
        }
      } catch (e) {
        /* ignore */
      }
    },

    async linkFile() {
      if (!this.fileApiSupported()) throw new Error('Seu navegador não suporta salvar direto em arquivo. Use “Exportar”.');
      const h = await global.showSaveFilePicker({
        suggestedName: `modo-carreira-save.json`,
        types: [{ description: 'Save Modo Carreira', accept: { 'application/json': ['.json'] } }],
      });
      this.fileHandle = h;
      this.fileName = h.name;
      try { await IDB.set('fileHandle', h); } catch (e) {}
      await this.writeFile(true);
      return h.name;
    },

    async openLinkedFile() {
      if (!('showOpenFilePicker' in global)) throw new Error('Seu navegador não suporta abrir arquivos vinculados. Use “Importar”.');
      const [h] = await global.showOpenFilePicker({
        types: [{ description: 'Save Modo Carreira', accept: { 'application/json': ['.json'] } }],
      });
      const file = await h.getFile();
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.state) this.replaceState(data.state);
      else this.importText(text, 'merge');
      this.fileHandle = h;
      this.fileName = h.name;
      try { await IDB.set('fileHandle', h); } catch (e) {}
      return h.name;
    },

    async unlinkFile() {
      this.fileHandle = null;
      this.fileName = null;
      try { await IDB.del('fileHandle'); } catch (e) {}
    },

    async ensurePermission(interactive) {
      const h = this.fileHandle;
      if (!h || !h.queryPermission) return false;
      const opts = { mode: 'readwrite' };
      if ((await h.queryPermission(opts)) === 'granted') return true;
      if (interactive && (await h.requestPermission(opts)) === 'granted') return true;
      return false;
    },

    async writeFile(interactive = false) {
      if (!this.fileHandle) return false;
      try {
        const ok = await this.ensurePermission(interactive);
        if (!ok) {
          this.needsPermission = true;
          MC.UI && MC.UI.refreshSaveStatus();
          return false;
        }
        this.needsPermission = false;
        const w = await this.fileHandle.createWritable();
        await w.write(JSON.stringify(this.exportPayload(false), null, 2));
        await w.close();
        this.dirtyFile = false;
        this.state.settings.lastFileSave = new Date().toISOString();
        this.persist();
        MC.UI && MC.UI.refreshSaveStatus();
        return true;
      } catch (e) {
        console.warn('Falha ao gravar arquivo', e);
        MC.UI && MC.UI.refreshSaveStatus();
        return false;
      }
    },

    _scheduleFile: null,
  });

  Store._scheduleFile = U.debounce(() => {
    if (Store.fileHandle && Store.state.settings.autosaveFile) Store.writeFile(false);
    MC.UI && MC.UI.refreshSaveStatus();
  }, 1500);

  // Backup automático a cada 10 minutos de uso
  setInterval(() => {
    if (Store.career()) Store.snapshot('automático');
  }, 10 * 60 * 1000);

  // Avisa ao fechar se há alterações não gravadas no arquivo vinculado
  global.addEventListener('beforeunload', (e) => {
    if (Store.fileHandle && Store.dirtyFile) {
      Store.writeFile(false);
    }
  });
})(window);
