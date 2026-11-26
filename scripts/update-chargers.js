// Downloads the latest list of EV chargers in Malaysia (and Singapore) from OpenStreetMap
// and saves it to public/data/. Run weekly by GitHub Actions; also works locally:
//   node scripts/update-chargers.js
const fs = require('fs');
const path = require('path');

const QUERY = '[out:json][timeout:120];(nwr["amenity"="charging_station"](1.2,99.6,6.8,104.6);nwr["amenity"="charging_station"](0.8,109.5,7.5,119.4););out center tags;';
const SERVERS = ['https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const OUT = path.join(__dirname, '..', 'public', 'data');

(async () => {
  for (const url of SERVERS) {
    try {
      const r = await fetch(url, {
        method: 'POST', body: 'data=' + encodeURIComponent(QUERY),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'EVChargingPlanner/1.0 (weekly update)' },
        signal: AbortSignal.timeout(150000),
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const text = await r.text();
      const j = JSON.parse(text);
      if (!Array.isArray(j.elements) || j.elements.length < 50) throw new Error('too few results');
      fs.mkdirSync(OUT, { recursive: true });
      fs.writeFileSync(path.join(OUT, 'chargers-osm.json'), text);
      fs.writeFileSync(path.join(OUT, 'info.json'), JSON.stringify({ updated: new Date().toISOString(), count: j.elements.length }));
      console.log(`Saved ${j.elements.length} chargers (from ${new URL(url).host})`);
      return;
    } catch (e) { console.log(`${new URL(url).host} failed: ${e.message}`); }
  }
  console.log('All map servers failed — keeping the existing list.');
})();
