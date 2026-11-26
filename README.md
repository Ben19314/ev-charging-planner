# ⚡ EV Charging Planner (Malaysia)

Find EV chargers along your route — JomCharge, ChargEV, Gentari, Shell Recharge, TNB Electron, Tesla, DC Handal, ChargeSini and more — with typical prices per kWh, estimated cost, and a range check for the trip.

**Open the app:** https://ben19314.github.io/ev-charging-planner/

## Features
- Plan a trip (start → destination) and see every charger within 2–20 km of the route, in driving order
- Price per kWh and estimated cost for each charger (`public/prices.js`)
- DC-fast filter, brand filters, cheapest-first sort
- Trip check: longest stretch without a charger vs. your car's range
- One-tap navigation and full trip (with charging stops) in Google Maps
- 📍 Me button (phone GPS; on the PC app it can also ask Windows for the location)
- Saved places (HOME buttons) — stored only on your own device, never in this code

## Add to iPhone home screen
Open the link above in **Safari** → tap **Share** → **Add to Home Screen** → **Add**.

## Data
- Charger locations: © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, refreshed every Monday by GitHub Actions (`.github/workflows/deploy.yml`). Optional: add a free [Open Charge Map](https://openchargemap.org) key in Settings for more chargers.
- Prices: typical published 2026 brand rates — always confirm in the operator's app.

## Run on a PC
Needs [Node.js](https://nodejs.org/) 18+. Double-click `Start App.bat` (or run `node server.js`) and open http://localhost:3100.
