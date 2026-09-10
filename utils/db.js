const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'guard.db');

let db = null;

function loadDb(SQL) {
  if (fs.existsSync(DB_PATH)) {
    const filebuffer = fs.readFileSync(DB_PATH);
    return new SQL.Database(filebuffer);
  }
  return new SQL.Database();
}

function saveDb() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

let ready = false;
let queue = [];

initSqlJs().then(SQL => {
  db = loadDb(SQL);

  const newCols = [
    "ALTER TABLE settings ADD COLUMN guard_link INTEGER DEFAULT 0",
    "ALTER TABLE settings ADD COLUMN guard_raid INTEGER DEFAULT 0",
    "ALTER TABLE settings ADD COLUMN guard_perm INTEGER DEFAULT 1",
    "ALTER TABLE settings ADD COLUMN guard_channel_create INTEGER DEFAULT 0",
    "ALTER TABLE settings ADD COLUMN guard_role_create INTEGER DEFAULT 0",
    "ALTER TABLE settings ADD COLUMN raid_threshold INTEGER DEFAULT 5",
    "ALTER TABLE settings ADD COLUMN raid_interval INTEGER DEFAULT 10",
    "ALTER TABLE settings ADD COLUMN link_whitelist TEXT DEFAULT ''",
    "ALTER TABLE settings ADD COLUMN ceza_tip TEXT DEFAULT 'jail'",
    "ALTER TABLE settings ADD COLUMN guard_spam INTEGER DEFAULT 0",
    "ALTER TABLE settings ADD COLUMN guard_mention INTEGER DEFAULT 0",
    "ALTER TABLE settings ADD COLUMN guard_caps INTEGER DEFAULT 0",
    "ALTER TABLE settings ADD COLUMN guard_slowmode INTEGER DEFAULT 0",
    "ALTER TABLE settings ADD COLUMN slowmode_threshold INTEGER DEFAULT 8",
    "ALTER TABLE settings ADD COLUMN slowmode_seconds INTEGER DEFAULT 10",
    "ALTER TABLE settings ADD COLUMN guard_mass INTEGER DEFAULT 1",
    "ALTER TABLE settings ADD COLUMN guard_channel_update INTEGER DEFAULT 1",
    "ALTER TABLE settings ADD COLUMN guard_wordfilter INTEGER DEFAULT 0",
    "ALTER TABLE settings ADD COLUMN banned_words TEXT DEFAULT ''",
  ];
  for (const sql of newCols) {
    try { db.run(sql); } catch (_) {}
  }

  try {
    db.run("UPDATE settings SET banned_words = '' WHERE banned_words IS NULL OR banned_words = 'null'");
    db.run("UPDATE settings SET guard_wordfilter = 0 WHERE guard_wordfilter IS NULL");
    db.run("UPDATE settings SET guard_mass = 0 WHERE guard_mass IS NULL");
    db.run("UPDATE settings SET guard_channel_update = 0 WHERE guard_channel_update IS NULL");
  } catch (_) {}

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      guild_id TEXT PRIMARY KEY,
      log_channel TEXT,
      jail_role TEXT,
      min_account_age INTEGER DEFAULT 0,
      guard_rol INTEGER DEFAULT 1,
      guard_kanal INTEGER DEFAULT 1,
      guard_sunucu INTEGER DEFAULT 1,
      guard_emoji INTEGER DEFAULT 1,
      guard_sticker INTEGER DEFAULT 1,
      guard_bot INTEGER DEFAULT 1,
      guard_webhook INTEGER DEFAULT 1,
      guard_everyone INTEGER DEFAULT 1,
      guard_davet INTEGER DEFAULT 1,
      guard_hesap_yasi INTEGER DEFAULT 0,
      guard_link INTEGER DEFAULT 0,
      guard_raid INTEGER DEFAULT 0,
      guard_perm INTEGER DEFAULT 1,
      guard_channel_create INTEGER DEFAULT 0,
      guard_role_create INTEGER DEFAULT 0,
      raid_threshold INTEGER DEFAULT 5,
      raid_interval INTEGER DEFAULT 10,
      link_whitelist TEXT DEFAULT '',
      ceza_tip TEXT DEFAULT 'jail'
    );

    CREATE TABLE IF NOT EXISTS whitelist (
      guild_id TEXT,
      user_id TEXT,
      PRIMARY KEY (guild_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS ceza_gecmis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT,
      user_id TEXT,
      mod_id TEXT,
      tip TEXT,
      sebep TEXT,
      tarih INTEGER
    );

    CREATE TABLE IF NOT EXISTS backup (
      id TEXT PRIMARY KEY,
      guild_id TEXT,
      isim TEXT,
      veri TEXT,
      tarih INTEGER
    );

    CREATE TABLE IF NOT EXISTS otorol (
      guild_id TEXT PRIMARY KEY,
      rol_id TEXT
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      kategori TEXT NOT NULL,
      baslik TEXT NOT NULL,
      aciklama TEXT,
      user_id TEXT,
      user_tag TEXT,
      hedef_id TEXT,
      hedef_tag TEXT,
      renk TEXT DEFAULT '#5865f2',
      tarih INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rate_limit (
      guild_id TEXT,
      user_id TEXT,
      eylem TEXT,
      sayac INTEGER DEFAULT 1,
      ilk_tarih INTEGER,
      PRIMARY KEY (guild_id, user_id, eylem)
    );

    CREATE TABLE IF NOT EXISTS uyari (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT,
      user_id TEXT,
      mod_id TEXT,
      sebep TEXT,
      tarih INTEGER
    );
  `);
  saveDb();

  ready = true;
  queue.forEach(fn => fn());
  queue = [];
}).catch(e => console.error('DB init hatası:', e));

function run(sql, params = []) {
  db.run(sql, params);
  saveDb();
}

function get(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

const ALLOWED_SETTINGS = [
  'log_channel', 'jail_role', 'min_account_age',
  'guard_rol', 'guard_kanal', 'guard_sunucu', 'guard_emoji',
  'guard_sticker', 'guard_bot', 'guard_webhook', 'guard_everyone',
  'guard_davet', 'guard_hesap_yasi', 'guard_link', 'guard_raid',
  'guard_perm', 'guard_channel_create', 'guard_role_create',
  'raid_threshold', 'raid_interval', 'link_whitelist', 'ceza_tip',
  'guard_spam', 'guard_mention', 'guard_caps', 'guard_slowmode',
  'slowmode_threshold', 'slowmode_seconds',
  'guard_mass', 'guard_channel_update', 'guard_wordfilter', 'banned_words',
];

function getSettings(guildId) {
  let row = get('SELECT * FROM settings WHERE guild_id = ?', [guildId]);
  if (!row) {
    run('INSERT INTO settings (guild_id) VALUES (?)', [guildId]);
    row = get('SELECT * FROM settings WHERE guild_id = ?', [guildId]);
  }
  return row;
}

function updateSetting(guildId, key, value) {
  if (!ALLOWED_SETTINGS.includes(key)) throw new Error(`Geçersiz ayar: ${key}`);
  getSettings(guildId);
  run(`UPDATE settings SET ${key} = ? WHERE guild_id = ?`, [value, guildId]);
}

function isWhitelisted(guildId, userId) {
  return !!get('SELECT 1 FROM whitelist WHERE guild_id = ? AND user_id = ?', [guildId, userId]);
}
function addWhitelist(guildId, userId) {
  run('INSERT OR IGNORE INTO whitelist (guild_id, user_id) VALUES (?,?)', [guildId, userId]);
}
function removeWhitelist(guildId, userId) {
  run('DELETE FROM whitelist WHERE guild_id = ? AND user_id = ?', [guildId, userId]);
}
function getWhitelist(guildId) {
  return all('SELECT user_id FROM whitelist WHERE guild_id = ?', [guildId]);
}

function addCeza(guildId, userId, modId, tip, sebep) {
  run(
    'INSERT INTO ceza_gecmis (guild_id, user_id, mod_id, tip, sebep, tarih) VALUES (?,?,?,?,?,?)',
    [guildId, userId, modId, tip, sebep, Date.now()]
  );
}
function getCezaGecmis(guildId, userId) {
  return all('SELECT * FROM ceza_gecmis WHERE guild_id = ? AND user_id = ? ORDER BY tarih DESC', [guildId, userId]);
}
function getAllCezalar(guildId, limit = 50) {
  return all('SELECT * FROM ceza_gecmis WHERE guild_id = ? ORDER BY tarih DESC LIMIT ?', [guildId, limit]);
}

function addUyari(guildId, userId, modId, sebep) {
  run('INSERT INTO uyari (guild_id, user_id, mod_id, sebep, tarih) VALUES (?,?,?,?,?)',
    [guildId, userId, modId, sebep, Date.now()]);
}
function getUyarilar(guildId, userId) {
  return all('SELECT * FROM uyari WHERE guild_id = ? AND user_id = ? ORDER BY tarih DESC', [guildId, userId]);
}
function getUyariSayisi(guildId, userId) {
  const r = get('SELECT COUNT(*) as c FROM uyari WHERE guild_id = ? AND user_id = ?', [guildId, userId]);
  return r ? r.c : 0;
}

function saveBackup(id, guildId, isim, veri) {
  run('INSERT OR REPLACE INTO backup (id, guild_id, isim, veri, tarih) VALUES (?,?,?,?,?)',
    [id, guildId, isim, JSON.stringify(veri), Date.now()]);
}
function getBackups(guildId) {
  return all('SELECT id, isim, tarih FROM backup WHERE guild_id = ? ORDER BY tarih DESC', [guildId]);
}
function getBackup(id) {
  const row = get('SELECT * FROM backup WHERE id = ?', [id]);
  if (row) row.veri = JSON.parse(row.veri);
  return row;
}
function deleteBackup(id) {
  run('DELETE FROM backup WHERE id = ?', [id]);
}

function setOtorol(guildId, rolId) {
  run('INSERT OR REPLACE INTO otorol (guild_id, rol_id) VALUES (?,?)', [guildId, rolId]);
}
function getOtorol(guildId) {
  return get('SELECT rol_id FROM otorol WHERE guild_id = ?', [guildId]);
}
function removeOtorol(guildId) {
  run('DELETE FROM otorol WHERE guild_id = ?', [guildId]);
}

function addLog(guildId, kategori, baslik, aciklama, userId, userTag, hedefId, hedefTag, renk) {
  run(
    'INSERT INTO logs (guild_id, kategori, baslik, aciklama, user_id, user_tag, hedef_id, hedef_tag, renk, tarih) VALUES (?,?,?,?,?,?,?,?,?,?)',
    [guildId, kategori, baslik, aciklama || '', userId || '', userTag || '', hedefId || '', hedefTag || '', renk || '#5865f2', Date.now()]
  );
}
function getLogs(guildId, kategori = null, limit = 100) {
  if (kategori) {
    return all('SELECT * FROM logs WHERE guild_id = ? AND kategori = ? ORDER BY tarih DESC LIMIT ?', [guildId, kategori, limit]);
  }
  return all('SELECT * FROM logs WHERE guild_id = ? ORDER BY tarih DESC LIMIT ?', [guildId, limit]);
}
function getLogStats(guildId) {
  const today = Date.now() - 86400000;
  const week  = Date.now() - 604800000;
  const total = get('SELECT COUNT(*) as c FROM logs WHERE guild_id = ?', [guildId]);
  const bugun = get('SELECT COUNT(*) as c FROM logs WHERE guild_id = ? AND tarih > ?', [guildId, today]);
  const hafta = get('SELECT COUNT(*) as c FROM logs WHERE guild_id = ? AND tarih > ?', [guildId, week]);
  const guard = get('SELECT COUNT(*) as c FROM logs WHERE guild_id = ? AND kategori = ?', [guildId, 'guard']);
  return {
    total: total?.c || 0,
    bugun: bugun?.c || 0,
    hafta: hafta?.c || 0,
    guard: guard?.c || 0,
  };
}

function checkRateLimit(guildId, userId, eylem, max, interval) {
  const now = Date.now();
  const row = get('SELECT * FROM rate_limit WHERE guild_id = ? AND user_id = ? AND eylem = ?', [guildId, userId, eylem]);

  if (!row) {
    run('INSERT INTO rate_limit (guild_id, user_id, eylem, sayac, ilk_tarih) VALUES (?,?,?,1,?)', [guildId, userId, eylem, now]);
    return false;
  }

  if (now - row.ilk_tarih > interval * 1000) {
    run('UPDATE rate_limit SET sayac = 1, ilk_tarih = ? WHERE guild_id = ? AND user_id = ? AND eylem = ?', [now, guildId, userId, eylem]);
    return false;
  }

  if (row.sayac >= max) return true;

  run('UPDATE rate_limit SET sayac = sayac + 1 WHERE guild_id = ? AND user_id = ? AND eylem = ?', [guildId, userId, eylem]);
  return false;
}

function deleteCeza(id) {
  run('DELETE FROM ceza_gecmis WHERE id = ?', [id]);
}

function resetDatabase(guildId) {
  run('DELETE FROM ceza_gecmis WHERE guild_id = ?', [guildId]);
  run('DELETE FROM uyari WHERE guild_id = ?', [guildId]);
  run('DELETE FROM logs WHERE guild_id = ?', [guildId]);
  run('DELETE FROM whitelist WHERE guild_id = ?', [guildId]);
  run('DELETE FROM backup WHERE guild_id = ?', [guildId]);
  run('DELETE FROM rate_limit WHERE guild_id = ?', [guildId]);
  run('DELETE FROM otorol WHERE guild_id = ?', [guildId]);
  run('DELETE FROM settings WHERE guild_id = ?', [guildId]);
  run('INSERT INTO settings (guild_id) VALUES (?)', [guildId]);
}

module.exports = {
  get isReady() { return ready; },
  onReady(fn) { if (ready) fn(); else queue.push(fn); },
  getSettings, updateSetting, ALLOWED_SETTINGS,
  isWhitelisted, addWhitelist, removeWhitelist, getWhitelist,
  addCeza, getCezaGecmis, getAllCezalar, deleteCeza,
  addUyari, getUyarilar, getUyariSayisi,
  saveBackup, getBackups, getBackup, deleteBackup,
  setOtorol, getOtorol, removeOtorol,
  addLog, getLogs, getLogStats,
  checkRateLimit,
  resetDatabase,
};
