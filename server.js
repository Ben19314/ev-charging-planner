// EV Charging Planner — tiny local web server (no dependencies).
// Serves the app on http://localhost:3100 (change with PORT=xxxx) and keeps a
// saved copy of every Malaysian charger from OpenStreetMap, refreshed weekly.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const PORT = Number(process.env.PORT) || 3100;
const PUBLIC = path.join(__dirname, 'public');
const DATA = path.join(__dirname, 'public', 'data', 'chargers-osm.json');
const INFO = path.join(__dirname, 'public', 'data', 'info.json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json' };

// ── Charger snapshot (Peninsular Malaysia + Singapore, and Sabah/Sarawak) ──
const QUERY = '[out:json][timeout:120];(nwr["amenity"="charging_station"](1.2,99.6,6.8,104.6);nwr["amenity"="charging_station"](0.8,109.5,7.5,119.4););out center tags;';
const SERVERS = ['https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const WEEK = 7 * 24 * 3600 * 1000;
let refreshing = null; // the update in progress, shared by everyone who asks

function refreshChargers() {
  if (!refreshing) refreshing = doRefresh().finally(() => { refreshing = null; });
  return refreshing;
}
// Returns { ok: true, count } or { ok: false, error }.
async function doRefresh() {
    for (const url of SERVERS) {
      try {
        const r = await fetch(url, {
          method: 'POST', body: 'data=' + encodeURIComponent(QUERY),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'EVChargingPlanner/1.0 (personal use)' },
          signal: AbortSignal.timeout(150000),
        });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const text = await r.text();
        const j = JSON.parse(text);
        if (!Array.isArray(j.elements) || j.elements.length < 50) throw new Error('too few results');
        fs.mkdirSync(path.dirname(DATA), { recursive: true });
        fs.writeFileSync(DATA, text);
        fs.writeFileSync(INFO, JSON.stringify({ updated: new Date().toISOString(), count: j.elements.length }));
        console.log(`Charger list updated: ${j.elements.length} stations (from ${new URL(url).host})`);
        return { ok: true, count: j.elements.length };
      } catch (e) { console.log(`Charger update from ${new URL(url).host} failed: ${e.message}`); }
    }
    console.log('Could not update the charger list now — using the saved copy.');
    return { ok: false, error: 'The map servers are busy right now. Your saved list is still being used — try again later.' };
}

// When the saved list was last updated and how many stations it has.
let infoCache = null;
function listInfo() {
  let st;
  try { st = fs.statSync(DATA); } catch { return { updated: null, count: 0 }; }
  if (!infoCache || infoCache.mtime !== st.mtimeMs) {
    let count = 0;
    try { count = JSON.parse(fs.readFileSync(DATA, 'utf8')).elements.length; } catch {}
    infoCache = { mtime: st.mtimeMs, count };
  }
  return { updated: new Date(st.mtimeMs).toISOString(), count: infoCache.count, updating: !!refreshing };
}

// ── This PC's location from Windows Location (Wi-Fi based) ──
// Lets the 📍 Me button work in any browser, even ones that block location.
const PS_LOCATE = `
Add-Type -AssemblyName System.Device
$w = New-Object System.Device.Location.GeoCoordinateWatcher([System.Device.Location.GeoPositionAccuracy]::High)
[void]$w.TryStart($false, [TimeSpan]::FromSeconds(15))
$t0 = Get-Date
while ($w.Status -ne 'Ready' -and ((Get-Date) - $t0).TotalSeconds -lt 20) { Start-Sleep -Milliseconds 300 }
$c = $w.Position.Location
if ($c.IsUnknown) { '{"error":"unknown"}' } else { '{"lat":' + $c.Latitude.ToString([cultureinfo]::InvariantCulture) + ',"lng":' + $c.Longitude.ToString([cultureinfo]::InvariantCulture) + ',"accuracy":' + [int]$c.HorizontalAccuracy + '}' }
$w.Stop()`;
let lastFix = null;
function windowsLocation() {
  if (lastFix && Date.now() - lastFix.at < 60000) return Promise.resolve(lastFix.data);
  return new Promise(resolve => {
    if (process.platform !== 'win32') return resolve({ error: 'not windows' });
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', PS_LOCATE], { timeout: 30000, windowsHide: true }, (err, out) => {
      let data;
      try { data = JSON.parse(String(out).trim().split(/\r?\n/).pop()); } catch { data = { error: err ? err.message : 'no answer' }; }
      if (data.lat != null) lastFix = { at: Date.now(), data };
      resolve(data);
    });
  });
}

function snapshotAge() {
  try { return Date.now() - fs.statSync(DATA).mtimeMs; } catch { return Infinity; }
}

http.createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);

  if (p === '/api/chargers') {
    if (snapshotAge() === Infinity) await refreshChargers();
    else if (snapshotAge() > WEEK) refreshChargers(); // update in background
    return fs.readFile(DATA, (err, data) => {
      if (err) { res.writeHead(503, { 'Content-Type': 'application/json' }); return res.end('{"error":"Charger list not available yet"}'); }
      res.writeHead(200, { 'Content-Type': 'application/json', 'X-Updated': new Date(Date.now() - snapshotAge()).toISOString() });
      res.end(data);
    });
  }
  if (p === '/api/my-location') {
    const data = await windowsLocation();
    res.writeHead(data.lat != null ? 200 : 503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify(data));
  }
  if (p === '/api/chargers/info') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify(listInfo()));
  }
  if (p === '/api/chargers/refresh' && req.method === 'POST') {
    const before = listInfo().count;
    const result = await refreshChargers();
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify({ ...result, before, ...listInfo() }));
  }

  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(PUBLIC, p));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, '127.0.0.1', () => {
  console.log(`EV Charging Planner running at http://localhost:${PORT}`);
  if (snapshotAge() > WEEK) refreshChargers();
});
