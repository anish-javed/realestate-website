/*
  Sample data for Thikana Estates (all fictional).
  The SAME code is copied into google-apps-script.gs (between the GENERATOR markers),
  so the demo website and a freshly set-up Google Sheet show the same listings.
  Plain old JavaScript only, so it runs inside Apps Script too.
*/
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
