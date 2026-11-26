// Typical public charging prices in Malaysia, per brand (RM per kWh).
// Collected from published 2026 rates (EV Sifu, LepakLah, DSF.my, Carlist.my,
// SoyaCincau, Malay Mail, RinggitPlus). Operators set their own prices (no
// government price control), so the brand's own app always has the final price.
// To update: edit the numbers below and reload the app.
//   ac / dc: [lowest, highest] in RM/kWh, or null if that brand has none.
const PRICES_UPDATED = 'Nov 2026';
const PRICES = {
  jomcharge:  { ac: [1.10, 1.10], dc: [1.20, 1.40], note: 'Platinum plan DC ~RM1.05' },
  chargev:    { ac: [1.00, 1.00], dc: [1.60, 1.60], note: 'Pay per use' },
  gentari:    { ac: [1.00, 1.15], dc: [1.30, 1.80], note: 'Highway RM1.70 · off-peak RM1.36 at some sites (12am–7am)' },
  shell:      { ac: null,         dc: [1.65, 2.20], note: 'RM1.65 with Gold membership' },
  tesla:      { ac: [0.88, 0.88], dc: [0.93, 1.80], note: 'Destination (AC) RM0.88 · Supercharger: Tesla cars ~RM0.93, other cars up to RM1.80' },
  tnb:        { ac: [0.90, 1.00], dc: [1.35, 1.80], note: 'Most DC sites RM1.50 · highway 240kW RM1.80' },
  dchandal:   { ac: [1.00, 1.00], dc: [1.00, 1.50], note: 'Varies by site' },
  chargesini: { ac: [1.30, 1.30], dc: [1.19, 1.49], note: 'Most DC sites RM1.19–1.29' },
  evconn:     { ac: [1.10, 1.10], dc: [1.20, 1.40], note: 'Operator of JomCharge' },
  carbrand:   { ac: [0, 0],       dc: null,         note: 'Dealer chargers are often free for that brand’s cars' },
  // No published rate — these use the typical Malaysian range below.
  chargeplus: null,
  capstone:   null,
  total:      null,
  other:      null,
};
// Used when a brand doesn't publish its price. Shown as "est." in the app.
const TYPICAL = { ac: [0.90, 1.30], dc: [1.20, 1.80] };
// Applies at all public chargers in Malaysia since 30 Mar 2026.
const IDLE_FEE_NOTE = 'Idle fee: RM0.40/min if you stay plugged in more than 15 min after charging ends.';
