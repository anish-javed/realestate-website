/*
  THIKANA ESTATES - Google Apps Script (the "back office" of the website)

  What it does:
   1. setup()   - builds the 4 tabs (Properties, Areas, Leads, Settings) with headers, dropdowns and sample data.
   2. doGet()   - the website READS properties, areas and settings from here (public JSON, never any leads).
   3. doPost()  - the website SENDS forms here (viewing, question, alert, valuation, sell/list).
                  Every form is checked again, saved as a row in Leads and emailed to the sheet owner.

  How to use: see SETUP-GOOGLE-SHEET.md. Never move or rename the columns.
*/

var TZ = 'Asia/Karachi'; // Pakistan time, used only for DISPLAY. Exact times are also saved as UTC milliseconds.

var TAB = { PROPS: 'Properties', AREAS: 'Areas', LEADS: 'Leads', SETTINGS: 'Settings' };

var PROP_STATUSES = ['Available', 'Sold', 'Rented', 'Hidden'];
var PURPOSES = ['Sale', 'Rent'];
var TYPES = ['House', 'Plot', 'Flat', 'Commercial', 'Farmhouse'];
var UNITS = ['Marla', 'Kanal', 'Sq Ft'];
var YESNO = ['Yes', 'No'];
var LEAD_TYPES = ['Viewing', 'Question', 'Alert', 'Valuation', 'Sell/List'];
var LEAD_STATUSES = ['New', 'Contacted', 'Done'];

var PROP_HEADERS = ['Property ID', 'Status', 'Purpose', 'Type', 'Title', 'Area', 'Block / Address', 'Latitude', 'Longitude', 'Price PKR', 'Old Price PKR', 'Size Value', 'Size Unit', 'Bedrooms', 'Bathrooms', 'Floors', 'Furnished', 'Possession Ready', 'Features', 'Description', 'Photo URLs', 'Video URL', 'Featured', 'Verified', 'Date Added'];
var AREA_HEADERS = ['Area', 'City', 'Latitude', 'Longitude', 'Description', 'Family Score', 'Budget Score', 'Investment Score', 'Central Score', 'Highlights'];
var LEAD_HEADERS = ['Lead Ref', 'Type', 'Status', 'Created (Pakistan time)', 'Created (UTC ms)', 'Name', 'Phone', 'Email', 'Property ID', 'Details', 'Preferred date/time', 'Notes'];
var SETTING_HEADERS = ['Setting', 'Value', 'What it does'];

// Column positions in the Leads tab (0 = first column)
var LC = { REF: 0, TYPE: 1, STATUS: 2, TIME: 3, MS: 4, NAME: 5, PHONE: 6, EMAIL: 7, PID: 8, DETAILS: 9, WHEN: 10, NOTES: 11 };

var SETTING_ROWS = [
  ['Agency Name', 'Thikana Estates', 'Shown in the header, footer and messages.'],
  ['Phone', '0300 0000000', 'Shown on the website. Replace with the real number.'],
  ['WhatsApp Number', '923000000000', 'The agent WhatsApp number: numbers only, with country code (92...). Leads are sent here.'],
  ['Address', 'Office 12, Main Boulevard, Gulberg III, Lahore', 'Office address shown on the About page and footer.'],
  ['Opening Hours', 'Mon-Sat: 10 am - 7 pm; Sunday: By appointment', 'Separate lines with a semicolon (;).'],
  ['Instalment Annual Rate (%)', '16', 'Default yearly rate in the instalment calculator.'],
  ['Instalment Down Payment (%)', '20', 'Default down payment in the instalment calculator.'],
  ['Instalment Years', '15', 'Default number of years in the instalment calculator.'],
  ['New Listing Days', '7', 'A property shows the NEW badge for this many days after Date Added.'],
  ['Near Me Radius (km)', '10', 'How far the "Near you" row looks on the Home page.']
];

// ============ GENERATOR START ============
var TE_AREA_SEED = [
  { name: 'DHA Phase 6', lat: 31.457, lng: 74.425, house: 38000000, plot: 23000000, rent: 150000, fam: 5, bud: 1, inv: 4, cen: 3,
    desc: 'A planned, gated society with wide roads, big parks and good security. Loved by families who want a calm, orderly neighbourhood.',
    hl: 'Top private schools, Large green parks, Hospitals nearby, Phase 6 commercial market',
    blocks: ['Block A', 'Block C', 'Block D', 'Block H', 'Block K', 'Block L'] },
  { name: 'Gulberg III', lat: 31.520, lng: 74.350, house: 50000000, plot: 32000000, rent: 180000, fam: 4, bud: 1, inv: 4, cen: 5,
    desc: 'The heart of modern Lahore. Offices, cafes, boutiques and the best connections in the city.',
    hl: 'Shopping streets, Cafes and restaurants, Business offices, Quick access to the canal',
    blocks: ['Ali Zeb Road', 'Main Boulevard', 'Zafar Ali Road', 'Block B', 'Tufail Road'] },
  { name: 'Johar Town', lat: 31.470, lng: 74.273, house: 27000000, plot: 18000000, rent: 120000, fam: 4, bud: 3, inv: 4, cen: 4,
    desc: 'A big, lively town with schools in almost every block, busy markets and homes for many budgets.',
    hl: 'Many schools and colleges, Hospitals, Large markets, Parks in most blocks',
    blocks: ['Block A', 'Block E', 'Block G', 'Block J', 'Block R', 'Khayaban-e-Firdousi'] },
  { name: 'Bahria Town', lat: 31.367, lng: 74.183, house: 21500000, plot: 14000000, rent: 90000, fam: 5, bud: 3, inv: 4, cen: 1,
    desc: 'A self-contained gated community with its own parks, mosques and shopping. Far from the centre, but green and peaceful.',
    hl: 'Gated community, Parks and gardens, Hospital and schools inside, Shopping centres',
    blocks: ['Sector A', 'Sector C', 'Sector E', 'Sector F', 'Overseas B'] },
  { name: 'Model Town', lat: 31.482, lng: 74.319, house: 36000000, plot: 24000000, rent: 140000, fam: 4, bud: 2, inv: 3, cen: 5,
    desc: 'One of the older, leafy neighbourhoods of Lahore, with big plots, a central park and tree-lined roads.',
    hl: 'Central park, Old trusted schools, Hospitals close by, Well-known markets',
    blocks: ['Block C', 'Block F', 'Block K', 'Block N', 'Link Road'] },
  { name: 'Wapda Town', lat: 31.437, lng: 74.263, house: 23000000, plot: 15000000, rent: 95000, fam: 4, bud: 3, inv: 3, cen: 3,
    desc: 'A planned town with fair prices, wide streets and everyday shops close to home.',
    hl: 'Good schools, Neighbourhood parks, Clinics and hospitals, Daily-needs markets',
    blocks: ['Phase 1, Block A', 'Phase 1, Block C', 'Phase 2, Block F', 'Phase 2, Block H'] },
  { name: 'Valencia Town', lat: 31.400, lng: 74.230, house: 20000000, plot: 13000000, rent: 80000, fam: 3, bud: 4, inv: 4, cen: 2,
    desc: 'A growing town with fair prices, newer homes and easy access to the main roads.',
    hl: 'New schools, Parks, Local hospitals, Growing shopping area',
    blocks: ['Block A', 'Block C', 'Block E', 'Block H'] },
  { name: 'Garden Town', lat: 31.500, lng: 74.325, house: 34000000, plot: 22000000, rent: 130000, fam: 4, bud: 2, inv: 3, cen: 5,
    desc: 'A calm, settled area close to the canal and the middle of the city. Good for families who want to be near everything.',
    hl: 'Schools nearby, Canal-side walks, Hospitals within minutes, Busy markets',
    blocks: ['Block A', 'Block B', 'Block C', 'Block D'] },
  { name: 'Askari 10', lat: 31.526, lng: 74.417, house: 32000000, plot: 21000000, rent: 130000, fam: 4, bud: 2, inv: 3, cen: 3,
    desc: 'A secure, well-kept society near the airport side of the city, popular with service families.',
    hl: 'Secure gated society, Quality schools, Military hospital close by, Neighbourhood shopping',
    blocks: ['Sector A', 'Sector B', 'Sector C', 'Sector D'] },
  { name: 'Lahore Motorway City', lat: 31.560, lng: 74.130, house: 12000000, plot: 9000000, rent: 60000, fam: 3, bud: 5, inv: 5, cen: 1,
    desc: 'A new, budget-friendly society near the motorway. Early buyers can still find big plots at low prices.',
    hl: 'Motorway access, Open green spaces, New schools planned, Low entry prices',
    blocks: ['Block A', 'Block B', 'Block D', 'Block E'] },
  { name: 'Paragon City', lat: 31.434, lng: 74.439, house: 16000000, plot: 11000000, rent: 75000, fam: 3, bud: 4, inv: 4, cen: 2,
    desc: 'A fast-growing society with new homes and flexible instalment plans.',
    hl: 'New homes, Instalment plans, Parks, Growing local shops',
    blocks: ['Block A', 'Block B', 'Block C', 'Block D'] },
  { name: 'Khayaban-e-Amin', lat: 31.390, lng: 74.290, house: 15000000, plot: 10000000, rent: 65000, fam: 3, bud: 4, inv: 3, cen: 2,
    desc: 'A well-priced society on the southern side. Good for first-time buyers and small investors.',
    hl: 'Affordable plots, Local schools, Clinics, Everyday markets',
    blocks: ['Block A', 'Block B', 'Block C', 'Block D'] }
];

function TE_rng(seed) { // small seeded random generator (mulberry32)
  var a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    var t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function TE_pad2(n) { return n < 10 ? '0' + n : String(n); }
function TE_ymdMinus(ymd, days) {
  var p = ymd.split('-');
  var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]) - days * 86400000);
  return d.getUTCFullYear() + '-' + TE_pad2(d.getUTCMonth() + 1) + '-' + TE_pad2(d.getUTCDate());
}

var TE_POOLS = {
  House: ['Corner', 'Park facing', 'Gas', 'Solar', 'Basement', 'Servant quarter', 'Double kitchen', 'Marble flooring', 'Lawn', 'Car porch', 'Terrace', 'Wooden work'],
  Plot: ['Corner', 'Park facing', 'Main boulevard', 'Level plot', 'Boundary wall', 'Near commercial area', 'Gas', 'Water connection'],
  Flat: ['Lift', 'Parking', 'Generator backup', '24/7 security', 'Balcony', 'Gas', 'Gym', 'Prayer area', 'Solar'],
  Commercial: ['Main road', 'Corner', 'Parking', 'Lift', 'Basement', 'Generator backup', 'High footfall', 'Fire exit'],
  Farmhouse: ['Swimming pool', 'Lawn', 'Tube well', 'Gated', 'Servant quarter', 'Solar', 'Orchard', 'Gas', 'Boundary wall']
};
var TE_ADJ = ['Modern', 'Spacious', 'Elegant', 'Brand New', 'Designer', 'Well-Built', 'Bright', 'Luxurious', 'Cosy', 'Stylish'];
var TE_INTRO = {
  House: ['A well-built {size} house in {area}, ready for a family to move in.', 'This {size} house sits on a quiet street in {area} with plenty of light and fresh air.', 'A smart {size} home in {area} with a practical layout and good finishing.'],
  Plot: ['A clear {size} residential plot in {area} with all papers ready.', 'A good-looking {size} plot in {area}, ideal to build your dream home.', 'A {size} plot in {area}, in a developed and growing block.'],
  Flat: ['A bright {size} apartment in {area} with a smart layout and no wasted space.', 'A neat {size} flat in {area}, close to daily needs and main roads.', 'A comfortable {size} apartment in {area} in a well-managed building.'],
  Commercial: ['A {size} commercial space in {area} with good visibility and steady footfall.', 'A ready-to-use {size} commercial property in {area}, ideal for an office or a shop.', 'A strong business location in {area}: {size} with easy access for customers.'],
  Farmhouse: ['A peaceful {size} farmhouse near {area} for weekends and family gatherings.', 'A green {size} farmhouse near {area} with open space and fresh air.']
};
var TE_CLOSE_SALE = ['The papers are clear and the owner is serious about selling.', 'Fair price and quick possession possible.', 'Viewings are welcome any day this week.'];
var TE_CLOSE_RENT = ['Available for a long-term tenant. Utilities are on separate meters.', 'Good for a small family or a working couple. Viewings are welcome.', 'Well kept by the owner and ready for a new tenant.'];
var TE_OUTER = ['Bahria Town', 'Lahore Motorway City', 'Valencia Town', 'Khayaban-e-Amin', 'Paragon City', 'DHA Phase 6'];

function TE_sample(todayYmd) {
  var rnd = TE_rng(20260101);
  function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
  function chance(p) { return rnd() < p; }
  function weighted(items) {
    var total = 0, i;
    for (i = 0; i < items.length; i++) total += items[i][1];
    var r = rnd() * total;
    for (i = 0; i < items.length; i++) { r -= items[i][1]; if (r < 0) return items[i][0]; }
    return items[items.length - 1][0];
  }
  function some(pool, n) {
    var copy = pool.slice(), out = [];
    while (out.length < n && copy.length) out.push(copy.splice(Math.floor(rnd() * copy.length), 1)[0]);
    return out;
  }
  function roundTo(v, step) { return Math.round(v / step) * step; }
  function roundPrice(v, purpose) {
    if (purpose === 'Rent') return roundTo(v, v < 100000 ? 2500 : 5000);
    return v < 50000000 ? roundTo(v, 100000) : roundTo(v, 500000);
  }
  function scale(m, exp) { return Math.pow(m / 5, exp); }
  function sizeText(marla) { return marla >= 20 && marla % 20 === 0 ? (marla / 20) + ' Kanal' : marla + ' Marla'; }

  var areas = TE_AREA_SEED.map(function (A) {
    return { area: A.name, city: 'Lahore', lat: A.lat, lng: A.lng, description: A.desc, family: A.fam, budget: A.bud, investment: A.inv, central: A.cen, highlights: A.hl };
  });

  var props = [], i;
  for (i = 0; i < 60; i++) {
    var A = TE_AREA_SEED[(i * 7 + Math.floor(i / 12)) % 12];
    var purpose = (i % 3 === 2) ? 'Rent' : 'Sale';
    var type = purpose === 'Sale'
      ? weighted([['House', 30], ['Plot', 30], ['Flat', 16], ['Commercial', 14], ['Farmhouse', 10]])
      : weighted([['House', 45], ['Flat', 35], ['Commercial', 20]]);
    if (type === 'Farmhouse' && TE_OUTER.indexOf(A.name) < 0) type = 'House';
    if (i === 10 || i === 22 || i === 34 || i === 49) type = 'Farmhouse'; // always include a few farmhouses (these are sale slots in outer areas)

    var marla, sizeValue, sizeUnit;
    if (type === 'Flat') {
      sizeUnit = 'Sq Ft'; sizeValue = 650 + 50 * Math.floor(rnd() * 24); marla = sizeValue / 272.25;
    } else if (type === 'Farmhouse') {
      marla = pick([20, 20, 40]); sizeUnit = 'Kanal'; sizeValue = marla / 20;
    } else {
      marla = weighted([[3, 14], [5, 30], [7, 14], [8, 14], [10, 16], [20, 9], [40, 3]]);
      if (purpose === 'Rent' && marla > 20) marla = 20;
      if (marla >= 20) { sizeUnit = 'Kanal'; sizeValue = marla / 20; } else { sizeUnit = 'Marla'; sizeValue = marla; }
    }

    var base;
    if (type === 'House') base = purpose === 'Sale' ? A.house * scale(marla, 0.92) : A.rent * scale(marla, 0.7);
    else if (type === 'Plot') base = A.plot * scale(marla, 0.95);
    else if (type === 'Flat') base = purpose === 'Sale' ? A.house * 0.38 * (sizeValue / 1100) : A.rent * 0.4 * (sizeValue / 1100);
    else if (type === 'Commercial') base = purpose === 'Sale' ? A.plot * 1.7 * scale(marla, 0.95) : A.rent * 1.4 * scale(marla, 0.75);
    else base = A.plot * 0.4 * scale(marla, 0.9);
    var price = roundPrice(base * (0.9 + rnd() * 0.22), purpose);
    var oldPrice = '';
    if (chance(0.26)) {
      oldPrice = roundPrice(price * (1.05 + rnd() * 0.08), purpose);
      if (oldPrice <= price) oldPrice = price + (purpose === 'Rent' ? 5000 : 100000);
    }

    var beds = '', baths = '', floors = '';
    if (type === 'House' || type === 'Farmhouse') {
      var bmap = { 3: [2, 3], 5: [3, 4], 7: [4, 5], 8: [4, 5], 10: [5, 6], 20: [5, 7], 40: [6, 8] };
      var br = bmap[marla];
      beds = br[0] + Math.floor(rnd() * (br[1] - br[0] + 1));
      baths = Math.max(1, beds - (chance(0.35) ? 1 : 0));
      floors = type === 'Farmhouse' ? pick([1, 2]) : (marla <= 5 ? pick([1, 2, 2, 2]) : pick([1, 2, 2, 3]));
    } else if (type === 'Flat') {
      beds = sizeValue < 800 ? 1 : (sizeValue < 1100 ? 2 : (sizeValue < 1600 ? 3 : 4));
      baths = beds <= 1 ? 1 : beds - (chance(0.4) ? 1 : 0);
    } else if (type === 'Commercial') {
      baths = 1 + Math.floor(rnd() * 3);
      floors = 2 + Math.floor(rnd() * 3);
    }

    var furnished = type === 'Plot' ? 'No' : (purpose === 'Rent' ? (chance(0.35) ? 'Yes' : 'No') : (chance(0.08) ? 'Yes' : 'No'));
    var ready = type === 'Plot' ? (chance(0.5) ? 'Yes' : 'No') : (chance(0.7) ? 'Yes' : 'No');
    var verified = chance(0.55) ? 'Yes' : 'No';
    var featured = chance(0.2) ? 'Yes' : 'No';

    var feats = some(TE_POOLS[type], 3 + Math.floor(rnd() * 3));
    if (purpose === 'Sale' && type !== 'Commercial' && feats.indexOf('Installments') < 0 && chance(0.3)) feats.push('Installments');
    var corner = feats.indexOf('Corner') > -1;

    var label = type === 'Flat' ? sizeValue + ' Sq Ft' : sizeText(marla);
    var adj = pick(TE_ADJ), title;
    if (type === 'House') {
      title = (corner ? 'Corner ' : adj + ' ') + label + ' House ' + (purpose === 'Rent' ? 'for Rent ' : '') + 'in ' + A.name;
    } else if (type === 'Plot') {
      title = label + (corner ? ' Corner' : ' Residential') + ' Plot in ' + A.name;
    } else if (type === 'Flat') {
      title = adj + ' ' + beds + '-Bed Apartment ' + (purpose === 'Rent' ? 'for Rent ' : '') + 'in ' + A.name;
    } else if (type === 'Commercial') {
      title = label + ' Commercial ' + pick(['Building', 'Shop', 'Office Floor', 'Plaza Space']) + (purpose === 'Rent' ? ' for Rent' : '') + ' in ' + A.name;
    } else {
      title = label + ' Farmhouse with ' + (feats.indexOf('Swimming pool') > -1 ? 'Pool' : 'Lawn') + ' near ' + A.name;
    }

    var block = pick(A.blocks), addr;
    if (/Road|Boulevard|Link/.test(block)) addr = 'House ' + (1 + Math.floor(rnd() * 90)) + ', ' + block;
    else addr = block + ', Street ' + (1 + Math.floor(rnd() * 30));

    var desc = pick(TE_INTRO[type]).replace('{size}', label).replace('{area}', A.name) +
      ' Features include ' + feats.slice(0, 3).join(', ').toLowerCase() + '. Close to ' + A.hl.split(', ')[0].toLowerCase() + '. ' +
      pick(purpose === 'Sale' ? TE_CLOSE_SALE : TE_CLOSE_RENT);

    var rad = 1500 * Math.sqrt(rnd()), ang = rnd() * Math.PI * 2;
    var lat = A.lat + (rad * Math.cos(ang)) / 111320;
    var lng = A.lng + (rad * Math.sin(ang)) / (111320 * Math.cos(A.lat * Math.PI / 180));
    var daysAgo = Math.floor(Math.pow(rnd(), 1.4) * 61);

    props.push({
      id: 'TE-' + (1001 + i), status: 'Available', purpose: purpose, type: type, title: title, area: A.name, address: addr,
      lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)), price: price, oldPrice: oldPrice,
      sizeValue: sizeValue, sizeUnit: sizeUnit, beds: beds, baths: baths, floors: floors,
      furnished: furnished, ready: ready, features: feats, description: desc, photos: [], video: '',
      featured: featured, verified: verified, added: TE_ymdMinus(todayYmd, daysAgo)
    });
  }
  return { areas: areas, properties: props };
}
// ============ GENERATOR END ============

/* ------------------------------------------------------------------ */
/*  Menu + one-time setup                                              */
/* ------------------------------------------------------------------ */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Thikana Estates')
    .addItem('Set up the sheet (first time)', 'setup')
    .addToUi();
}

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone(TZ);
  var sample = TE_sample(todayPK_());
  setupAreas_(ss, sample.areas);
  setupProperties_(ss, sample.properties);
  setupLeads_(ss);
  setupSettings_(ss);
  var blank = ss.getSheetByName('Sheet1');
  if (blank && blank.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(blank);
  ss.setActiveSheet(ss.getSheetByName(TAB.PROPS));
  SpreadsheetApp.flush();
  try { ss.toast('Done! Now deploy the web app (see SETUP-GOOGLE-SHEET.md).', 'Thikana Estates', 8); } catch (err) { /* ignore */ }
}

function getOrCreate_(ss, name) { return ss.getSheetByName(name) || ss.insertSheet(name); }
function ensureRows_(sh, rows) { if (sh.getMaxRows() < rows) sh.insertRowsAfter(sh.getMaxRows(), rows - sh.getMaxRows()); }
function ensureCols_(sh, cols) { if (sh.getMaxColumns() < cols) sh.insertColumnsAfter(sh.getMaxColumns(), cols - sh.getMaxColumns()); }

function writeHeaders_(sh, headers) {
  ensureCols_(sh, headers.length);
  var r = sh.getRange(1, 1, 1, headers.length);
  r.setValues([headers]);
  r.setFontWeight('bold').setFontColor('#ffffff').setBackground('#1f3d2f').setVerticalAlignment('middle').setWrap(true);
  sh.setFrozenRows(1);
  sh.setRowHeight(1, 36);
}

function listRule_(values) {
  return SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(false).build();
}

function colOf_(headers, name) { return headers.indexOf(name) + 1; }

function setupAreas_(ss, areas) {
  var sh = getOrCreate_(ss, TAB.AREAS);
  ensureRows_(sh, 200);
  writeHeaders_(sh, AREA_HEADERS);
  if (sh.getLastRow() <= 1) {
    var rows = areas.map(function (a) {
      return [a.area, a.city, a.lat, a.lng, a.description, a.family, a.budget, a.investment, a.central, a.highlights];
    });
    sh.getRange(2, 1, rows.length, AREA_HEADERS.length).setValues(rows);
  }
  var scoreRule = SpreadsheetApp.newDataValidation().requireNumberBetween(1, 5).setAllowInvalid(false).setHelpText('Type a number from 1 to 5').build();
  sh.getRange(2, 6, 199, 4).setDataValidation(scoreRule);
  sh.getRange(2, 3, 199, 2).setNumberFormat('0.00000');
  sh.setColumnWidth(1, 170); sh.setColumnWidth(5, 380); sh.setColumnWidth(10, 360);
  sh.getRange(2, 5, 199, 1).setWrap(true);
  sh.getRange(2, 10, 199, 1).setWrap(true);
}

function setupProperties_(ss, props) {
  var sh = getOrCreate_(ss, TAB.PROPS);
  ensureRows_(sh, 2000);
  writeHeaders_(sh, PROP_HEADERS);
  var H = PROP_HEADERS;
  // text columns first, so values like dates and ids are never changed by the sheet
  sh.getRange(2, colOf_(H, 'Property ID'), 1999, 1).setNumberFormat('@');
  sh.getRange(2, colOf_(H, 'Date Added'), 1999, 1).setNumberFormat('@');
  sh.getRange(2, colOf_(H, 'Latitude'), 1999, 2).setNumberFormat('0.00000');
  sh.getRange(2, colOf_(H, 'Price PKR'), 1999, 2).setNumberFormat('#,##0');
  if (sh.getLastRow() <= 1) {
    var rows = props.map(function (p) {
      return [p.id, p.status, p.purpose, p.type, p.title, p.area, p.address, p.lat, p.lng, p.price, p.oldPrice,
        p.sizeValue, p.sizeUnit, p.beds, p.baths, p.floors, p.furnished, p.ready, p.features.join(', '), p.description,
        p.photos.join(', '), p.video, p.featured, p.verified, p.added];
    });
    sh.getRange(2, 1, rows.length, H.length).setValues(rows);
  }
  function rule(name, values) { sh.getRange(2, colOf_(H, name), 1999, 1).setDataValidation(listRule_(values)); }
  rule('Status', PROP_STATUSES);
  rule('Purpose', PURPOSES);
  rule('Type', TYPES);
  rule('Size Unit', UNITS);
  rule('Furnished', YESNO);
  rule('Possession Ready', YESNO);
  rule('Featured', YESNO);
  rule('Verified', YESNO);
  // Area must match a name in the Areas tab
  var areaSheet = ss.getSheetByName(TAB.AREAS);
  var areaRule = SpreadsheetApp.newDataValidation().requireValueInRange(areaSheet.getRange('A2:A200'), true).setAllowInvalid(false)
    .setHelpText('Pick an area from the Areas tab').build();
  sh.getRange(2, colOf_(H, 'Area'), 1999, 1).setDataValidation(areaRule);
  // grey out rows that are not public
  var statusCol = colOf_(H, 'Status');
  var range = sh.getRange(2, 1, 1999, H.length);
  var letter = columnLetter_(statusCol);
  var grey = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND($' + letter + '2<>"",$' + letter + '2<>"Available")')
    .setBackground('#e6e1d6').setFontColor('#7a7a72').setRanges([range]).build();
  sh.setConditionalFormatRules([grey]);
  var widths = { 'Property ID': 90, 'Title': 300, 'Block / Address': 170, 'Features': 240, 'Description': 360, 'Photo URLs': 300, 'Video URL': 200, 'Area': 160 };
  Object.keys(widths).forEach(function (k) { sh.setColumnWidth(colOf_(H, k), widths[k]); });
  sh.getRange(2, colOf_(H, 'Description'), 1999, 1).setWrap(true);
}

function setupLeads_(ss) {
  var sh = getOrCreate_(ss, TAB.LEADS);
  ensureRows_(sh, 3000);
  writeHeaders_(sh, LEAD_HEADERS);
  var H = LEAD_HEADERS;
  [ 'Lead Ref', 'Created (Pakistan time)', 'Phone', 'Property ID', 'Preferred date/time' ].forEach(function (name) {
    sh.getRange(2, colOf_(H, name), 2999, 1).setNumberFormat('@');
  });
  sh.getRange(2, colOf_(H, 'Type'), 2999, 1).setDataValidation(listRule_(LEAD_TYPES));
  var statusCol = colOf_(H, 'Status');
  sh.getRange(2, statusCol, 2999, 1).setDataValidation(listRule_(LEAD_STATUSES));
  var rng = sh.getRange(2, statusCol, 2999, 1);
  var rules = [
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('New').setBackground('#fde7b0').setRanges([rng]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Contacted').setBackground('#cfe3f5').setRanges([rng]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Done').setBackground('#cfe8d5').setRanges([rng]).build()
  ];
  sh.setConditionalFormatRules(rules);
  var widths = { 'Created (Pakistan time)': 150, 'Name': 150, 'Phone': 120, 'Email': 190, 'Details': 360, 'Preferred date/time': 170, 'Notes': 280 };
  Object.keys(widths).forEach(function (k) { sh.setColumnWidth(colOf_(H, k), widths[k]); });
  sh.getRange(2, colOf_(H, 'Details'), 2999, 1).setWrap(true);
  sh.getRange(2, colOf_(H, 'Notes'), 2999, 1).setWrap(true);
}

function setupSettings_(ss) {
  var sh = getOrCreate_(ss, TAB.SETTINGS);
  ensureRows_(sh, 100);
  writeHeaders_(sh, SETTING_HEADERS);
  sh.getRange(2, 2, 99, 1).setNumberFormat('@'); // keep values as plain text (phone numbers, 16, ...)
  if (sh.getLastRow() <= 1) {
    sh.getRange(2, 1, SETTING_ROWS.length, 3).setValues(SETTING_ROWS);
  }
  sh.setColumnWidth(1, 220); sh.setColumnWidth(2, 340); sh.setColumnWidth(3, 460);
}

function columnLetter_(n) {
  var s = '';
  while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */

function norm_(k) { return String(k == null ? '' : k).toLowerCase().replace(/[^a-z0-9]/g, ''); }
function yes_(v) { return ['yes', 'y', 'true', '1'].indexOf(String(v).trim().toLowerCase()) > -1; }
function num_(v, d) { var n = parseFloat(String(v).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? d : n; }
function digits_(v) { return String(v == null ? '' : v).replace(/\D/g, ''); }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function fail_(msg, extra) { var o = { ok: false, error: msg }; if (extra) Object.keys(extra).forEach(function (k) { o[k] = extra[k]; }); return o; }
function pad2_(n) { n = Number(n); return n < 10 ? '0' + n : String(n); }
function money_(n) { return 'Rs ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
var APOS = String.fromCharCode(39);

// Clean text from the website before it goes in a cell: no control characters, a length limit,
// and a leading apostrophe if it could be read as a formula (starts with = + - @).
function safeText_(v, max) {
  var s = String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
  if (max && s.length > max) s = s.slice(0, max);
  if (/^[=+\-@\t\r]/.test(s)) s = APOS + s;
  return s;
}

function todayPK_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'); }
function dayNum_(ymd) { var p = ymd.split('-'); return Math.floor(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000); }
var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function validDate_(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s))) return false;
  var p = s.split('-'), d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
  return d.getUTCFullYear() === +p[0] && d.getUTCMonth() === +p[1] - 1 && d.getUTCDate() === +p[2];
}
function dayLabel_(ymd) {
  var p = ymd.split('-'), d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
  return DAYS[d.getUTCDay()] + ' ' + (+p[2]) + ' ' + MONTHS[+p[1] - 1];
}
function clockText_(hhmm) {
  var h = +hhmm.slice(0, 2), m = hhmm.slice(3, 5), ap = h >= 12 ? 'pm' : 'am';
  h = h % 12; if (h === 0) h = 12;
  return h + ':' + m + ' ' + ap;
}

// A date typed in the sheet can arrive as a real date or as text. Always return yyyy-MM-dd (or empty).
function dateKey_(v) {
  if (v instanceof Date && !isNaN(v.getTime())) return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  var s = String(v == null ? '' : v).trim(), m;
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(s)) { m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); return m[1] + '-' + pad2_(m[2]) + '-' + pad2_(m[3]); }
  m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
  if (m) return m[3] + '-' + pad2_(m[2]) + '-' + pad2_(m[1]); // day/month/year (Pakistan style)
  return '';
}

// Pakistani mobile: returns 03XX-XXXXXXX or '' when not valid.
function normPhone_(v) {
  var d = digits_(v);
  if (d.indexOf('0092') === 0) d = d.slice(4);
  else if (d.indexOf('92') === 0 && d.length === 12) d = d.slice(2);
  if (d.length === 10 && d.charAt(0) === '3') d = '0' + d;
  if (!/^03\d{9}$/.test(d)) return '';
  return d.slice(0, 4) + '-' + d.slice(4);
}

function readTable_(sh) {
  if (!sh) return [];
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var keys = values[0].map(norm_);
  var out = [];
  for (var r = 1; r < values.length; r++) {
    var row = values[r], obj = {}, any = false;
    for (var c = 0; c < keys.length; c++) {
      if (!keys[c]) continue;
      obj[keys[c]] = row[c];
      if (row[c] !== '' && row[c] !== null) any = true;
    }
    if (any) out.push(obj);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  PUBLIC DATA (doGet)                                                */
/* ------------------------------------------------------------------ */

function getAreas_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var out = [];
  readTable_(ss.getSheetByName(TAB.AREAS)).forEach(function (r) {
    var name = String(r.area || '').trim();
    if (!name) return;
    out.push({
      area: name, city: String(r.city || 'Lahore').trim(),
      lat: num_(r.latitude, null), lng: num_(r.longitude, null),
      description: String(r.description || '').slice(0, 600),
      family: num_(r.familyscore, 3), budget: num_(r.budgetscore, 3), investment: num_(r.investmentscore, 3), central: num_(r.centralscore, 3),
      highlights: String(r.highlights || '').slice(0, 400)
    });
  });
  return out;
}

function getProperties_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var out = [];
  readTable_(ss.getSheetByName(TAB.PROPS)).forEach(function (r) {
    var id = String(r.propertyid || '').trim();
    if (!id) return;
    if (String(r.status || '').trim().toLowerCase() !== 'available') return; // only Available is public
    var title = String(r.title || '').trim();
    var price = num_(r.pricepkr, 0);
    if (!title || price <= 0) return;
    var photos = String(r.photourls || '').split(/[,\n]+/).map(function (x) { return x.trim(); })
      .filter(function (x) { return /^https?:\/\//i.test(x); }).slice(0, 8);
    var feats = String(r.features || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 14);
    var video = String(r.videourl || '').trim();
    out.push({
      id: id, status: 'Available',
      purpose: /rent/i.test(String(r.purpose)) ? 'Rent' : 'Sale',
      type: String(r.type || '').trim(), title: title.slice(0, 140),
      area: String(r.area || '').trim(), address: String(r.blockaddress || '').trim().slice(0, 140),
      lat: num_(r.latitude, null), lng: num_(r.longitude, null),
      price: price, oldPrice: num_(r.oldpricepkr, 0) || '',
      sizeValue: num_(r.sizevalue, 0), sizeUnit: String(r.sizeunit || 'Marla').trim(),
      beds: num_(r.bedrooms, '') , baths: num_(r.bathrooms, ''), floors: num_(r.floors, ''),
      furnished: yes_(r.furnished) ? 'Yes' : 'No', ready: yes_(r.possessionready) ? 'Yes' : 'No',
      features: feats, description: String(r.description || '').slice(0, 1500),
      photos: photos, video: /^https?:\/\//i.test(video) ? video : '',
      featured: yes_(r.featured) ? 'Yes' : 'No', verified: yes_(r.verified) ? 'Yes' : 'No',
      added: dateKey_(r.dateadded)
    });
  });
  return out;
}

function getSettings_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var out = {};
  readTable_(ss.getSheetByName(TAB.SETTINGS)).forEach(function (r) {
    var k = String(r.setting || '').trim();
    if (k) out[k] = String(r.value == null ? '' : r.value).trim();
  });
  return out;
}

// The public answer. It never contains leads or any customer data.
function doGet(e) {
  try {
    var action = String((e && e.parameter && e.parameter.action) || 'all');
    if (action === 'ping') return json_({ ok: true, time: Date.now() });
    return json_({ ok: true, properties: getProperties_(), areas: getAreas_(), settings: getSettings_(), generated: Date.now() });
  } catch (err) {
    return json_(fail_('Could not read the sheet.'));
  }
}

/* ------------------------------------------------------------------ */
/*  FORMS (doPost)                                                     */
/* ------------------------------------------------------------------ */

function findProperty_(id) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var rows = readTable_(ss.getSheetByName(TAB.PROPS)), want = String(id).trim().toLowerCase();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].propertyid || '').trim().toLowerCase() === want) {
      return {
        id: String(rows[i].propertyid).trim(), title: String(rows[i].title || '').trim(), area: String(rows[i].area || '').trim(),
        price: num_(rows[i].pricepkr, 0), purpose: /rent/i.test(String(rows[i].purpose)) ? 'Rent' : 'Sale',
        status: String(rows[i].status || '').trim()
      };
    }
  }
  return null;
}

function areaNames_() { return getAreas_().map(function (a) { return a.area; }); }

// Checks the type-specific fields. Returns { text } or { error }.
function leadDetails_(type, f) {
  f = f || {};
  var parts = [];
  function need(cond, msg) { if (!cond) throw new Error(msg); }
  if (type === 'Valuation' || type === 'Sell/List') {
    var purpose = String(f.purpose || ''), ptype = String(f.ptype || ''), area = String(f.area || ''), unit = String(f.unit || '');
    var size = num_(f.size, 0), beds = num_(f.beds, -1), price = num_(f.price, 0);
    need(PURPOSES.indexOf(purpose) > -1, 'Please choose Sale or Rent.');
    need(TYPES.indexOf(ptype) > -1, 'Please choose a property type.');
    need(area === 'Other' || areaNames_().indexOf(area) > -1, 'Please choose an area.');
    need(size > 0 && size < 100000, 'Please enter the size.');
    need(UNITS.indexOf(unit) > -1, 'Please choose a size unit.');
    need(type !== 'Sell/List' || (price > 0 && price < 1e12), 'Please enter your expected price.');
    parts.push(purpose + ' | ' + ptype + ' | ' + area + ' | ' + size + ' ' + unit);
    if (beds >= 0 && beds <= 30) parts.push('Bedrooms: ' + beds);
    if (price > 0) parts.push((type === 'Sell/List' ? 'Expected price: ' : 'Estimate shown: ') + money_(price) + (purpose === 'Rent' ? ' / month' : ''));
    var address = safeText_(f.address, 140);
    if (address) parts.push('Address: ' + address);
    var est = safeText_(f.estimate, 120);
    if (est) parts.push('Website estimate: ' + est);
  } else {
    var topic = safeText_(f.topic, 160);
    if (topic) parts.push(topic);
  }
  return parts.join(' | ');
}

function nextRef_(sh) {
  var last = sh.getLastRow(), max = 1000;
  if (last > 1) {
    var refs = sh.getRange(2, 1, last - 1, 1).getValues();
    for (var i = 0; i < refs.length; i++) {
      var n = parseInt(String(refs[i][0]).replace(/\D/g, ''), 10);
      if (!isNaN(n) && n > max) max = n;
    }
  }
  return 'L-' + (max + 1);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var body = {};
    try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { return json_(fail_('Something went wrong. Please try again.')); }

    // Honeypot: real visitors never fill this hidden field. Pretend it worked.
    if (String(body.website || body.hp || '').trim() !== '') return json_({ ok: true, ref: 'L-0000' });

    var type = String(body.type || '');
    if (LEAD_TYPES.indexOf(type) === -1) return json_(fail_('Unknown request type.'));

    var name = safeText_(body.name, 60);
    if (name.length < 2) return json_(fail_('Please enter your name.', { field: 'name' }));
    var phone = normPhone_(body.phone);
    if (!phone) return json_(fail_('Please enter a valid mobile number like 0300-1234567.', { field: 'phone' }));
    var email = String(body.email || '').trim();
    if (email && (email.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))) return json_(fail_('That email address does not look right.', { field: 'email' }));

    // Property (for Viewing, Question about a home, Alert)
    var prop = null, pid = String(body.propertyId || '').trim();
    if (pid) {
      prop = findProperty_(pid);
      if (!prop) return json_(fail_('We could not find that property. It may have been sold.', { field: 'propertyId' }));
    }

    // Preferred date and time
    var when = '';
    var date = String(body.date || '').trim(), time = String(body.time || '').trim();
    if (date) {
      if (!validDate_(date)) return json_(fail_('Please choose a valid date.', { field: 'date' }));
      var diff = dayNum_(date) - dayNum_(todayPK_());
      if (diff < 0 || diff > 90) return json_(fail_('Please choose a date in the next 90 days.', { field: 'date' }));
      when = dayLabel_(date);
      if (time) {
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return json_(fail_('Please choose a valid time.', { field: 'time' }));
        when += ', ' + clockText_(time);
      }
    }
    if (type === 'Viewing' && !prop) return json_(fail_('Please choose a property to view.'));

    var details;
    try { details = leadDetails_(type, body.fields); } catch (err2) { return json_(fail_(String(err2.message))); }
    var notes = safeText_(body.notes, 500);

    lock.waitLock(20000);

    // Rate limit: one request per minute and at most 6 an hour for each phone number
    var cache = CacheService.getScriptCache(), pd = digits_(phone);
    if (cache.get('rl_' + pd)) return json_(fail_('You have just sent a request. Please wait a minute before sending another.'));
    var hourCount = parseInt(cache.get('rh_' + pd) || '0', 10);
    if (hourCount >= 6) return json_(fail_('Too many requests from this number. Please call or WhatsApp us instead.'));
    cache.put('rl_' + pd, '1', 60);
    cache.put('rh_' + pd, String(hourCount + 1), 3600);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(TAB.LEADS);
    if (!sh) return json_(fail_('The lead sheet is missing. Please call us instead.'));
    var ref = nextRef_(sh);
    var now = new Date();
    var created = Utilities.formatDate(now, TZ, 'yyyy-MM-dd HH:mm');
    var row = [];
    row[LC.REF] = ref; row[LC.TYPE] = type; row[LC.STATUS] = 'New';
    row[LC.TIME] = created; row[LC.MS] = now.getTime();
    row[LC.NAME] = name; row[LC.PHONE] = phone; row[LC.EMAIL] = safeText_(email, 80);
    row[LC.PID] = prop ? prop.id : ''; row[LC.DETAILS] = prop ? safeText_(prop.title + ' | ' + prop.area + ' | ' + money_(prop.price) + (prop.purpose === 'Rent' ? ' / month' : '') + (details ? ' | ' + details : ''), 400) : details;
    row[LC.WHEN] = when; row[LC.NOTES] = notes;
    var target = sh.getLastRow() + 1;
    ensureRows_(sh, target + 5);
    sh.getRange(target, 1, 1, row.length).setNumberFormat('@').setValues([row]);
    sh.getRange(target, LC.MS + 1).setNumberFormat('0');
    sh.getRange(target, LC.MS + 1).setValue(now.getTime());
    SpreadsheetApp.flush();

    sendOwnerEmail_(ref, type, row, prop, ss.getUrl());

    return json_({
      ok: true, ref: ref,
      property: prop ? { id: prop.id, title: prop.title, area: prop.area, price: prop.price, purpose: prop.purpose } : null,
      when: when
    });
  } catch (err3) {
    return json_(fail_('Something went wrong on our side. Please try again or WhatsApp us.'));
  } finally {
    try { lock.releaseLock(); } catch (err4) { /* not locked */ }
  }
}

// Email goes to the owner of this script (their own Google account). No email address is stored in any file.
function sendOwnerEmail_(ref, type, row, prop, sheetUrl) {
  try {
    var to = Session.getEffectiveUser().getEmail() || Session.getActiveUser().getEmail();
    if (!to) return;
    var lines = [
      'New ' + type + ' lead: ' + ref,
      '',
      'Name: ' + row[LC.NAME],
      'Phone: ' + row[LC.PHONE],
      'Email: ' + (row[LC.EMAIL] || '-'),
      'Property: ' + (prop ? prop.id + ' - ' + prop.title + ' (' + prop.area + ')' : '-'),
      'Details: ' + (row[LC.DETAILS] || '-'),
      'Preferred time: ' + (row[LC.WHEN] || '-'),
      'Notes: ' + (row[LC.NOTES] || '-'),
      'Received (Pakistan time): ' + row[LC.TIME],
      '',
      'Open the Leads tab: ' + sheetUrl
    ];
    MailApp.sendEmail({ to: to, subject: 'Thikana Estates ' + ref + ': ' + type + (prop ? ' - ' + prop.id : ''), body: lines.join('\n'), name: 'Thikana Estates website' });
  } catch (err) { /* the lead is already saved; ignore email problems */ }
}
