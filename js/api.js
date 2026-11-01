/* Talks to the Google Apps Script web app: reads properties, areas and settings, and sends forms. Public data only. */
(function () {
  var TE = (window.TE = window.TE || {});
  var cfg = TE.cfg || window.TE_CONFIG || {};
  var CACHE_KEY = "te_data_v1";

  function fetchJson(url, opts, ms) {
    return new Promise(function (resolve, reject) {
      var ctrl = window.AbortController ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); reject(new Error("timeout")); }, ms || 15000);
      opts = opts || {};
      if (ctrl) opts.signal = ctrl.signal;
      fetch(url, opts)
        .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.text(); })
        .then(function (t) {
          clearTimeout(timer);
          var j;
          try { j = JSON.parse(t); } catch (e) { return reject(new Error("bad json")); }
          resolve(j);
        })
        .catch(function (e) { clearTimeout(timer); reject(e); });
    });
  }

  /* ---------- settings: names in the sheet can be typed loosely ---------- */
  function normSettings(raw) {
    var m = {};
    Object.keys(raw || {}).forEach(function (k) { m[k.toLowerCase().replace(/[^a-z0-9]/g, "")] = raw[k]; });
    function s(k, d) { var v = m[k]; return v === undefined || v === null || String(v).trim() === "" ? d : String(v).trim(); }
    function n(k, d) { var v = parseFloat(String(m[k]).replace(/[^0-9.]/g, "")); return isNaN(v) ? d : v; }
    var wa = s("whatsappnumber", "923000000000").replace(/\D/g, "");
    if (wa.charAt(0) === "0") wa = "92" + wa.slice(1);
    return {
      name: s("agencyname", "Thikana Estates"),
      phone: s("phone", "0300 0000000"),
      whatsapp: wa,
      address: s("address", "Lahore, Pakistan"),
      hours: s("openinghours", "Mon-Sat: 10 am - 7 pm").split(";").map(function (x) { return x.trim(); }).filter(Boolean),
      rate: n("instalmentannualrate", 16),
      down: n("instalmentdownpayment", 20),
      years: Math.max(1, Math.floor(n("instalmentyears", 15))),
      newDays: Math.max(1, Math.floor(n("newlistingdays", 7))),
      radius: Math.max(1, n("nearmeradiuskm", 10))
    };
  }

  function score(v) { v = Number(v); return isNaN(v) ? 3 : Math.max(1, Math.min(5, v)); }

  /* ---------- build the data used by every page ---------- */
  function build(raw, source) {
    var areas = (raw.areas || []).map(function (a) {
      return {
        name: String(a.area || "").trim(), city: String(a.city || "Lahore").trim(),
        lat: a.lat === null || a.lat === "" ? null : Number(a.lat), lng: a.lng === null || a.lng === "" ? null : Number(a.lng),
        desc: String(a.description || ""), family: score(a.family), budget: score(a.budget), investment: score(a.investment), central: score(a.central),
        highlights: String(a.highlights || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean)
      };
    }).filter(function (a) { return a.name && isFinite(a.lat) && isFinite(a.lng) && a.lat !== null; });
    var areaByName = {};
    areas.forEach(function (a) { areaByName[a.name.toLowerCase()] = a; });

    var props = (raw.properties || []).map(function (r) {
      var area = areaByName[String(r.area || "").trim().toLowerCase()];
      var unitRaw = String(r.sizeUnit || "Marla").toLowerCase();
      var unit = unitRaw.indexOf("kanal") > -1 ? "kanal" : unitRaw.indexOf("sq") > -1 ? "sqft" : "marla";
      var sv = Number(r.sizeValue) || 0;
      var marla = unit === "kanal" ? sv * 20 : unit === "sqft" ? sv / TE.MARLA_SQFT : sv;
      var price = Math.max(0, Number(r.price) || 0), old = Number(r.oldPrice) || 0;
      var type = TE.TYPES.filter(function (t) { return t.toLowerCase() === String(r.type || "").trim().toLowerCase(); })[0] || "House";
      var lat = r.lat === null || r.lat === "" || isNaN(Number(r.lat)) ? (area ? area.lat : null) : Number(r.lat);
      var lng = r.lng === null || r.lng === "" || isNaN(Number(r.lng)) ? (area ? area.lng : null) : Number(r.lng);
      var added = 0, m = String(r.added || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) added = Date.UTC(+m[1], +m[2] - 1, +m[3]) - 5 * 3600000; // start of that day in Pakistan time (UTC+5)
      function yes(v) { return /^(yes|y|true|1)$/i.test(String(v).trim()); }
      function optNum(v) { var x = parseFloat(v); return isNaN(x) ? null : x; }
      return {
        id: String(r.id || "").trim(), purpose: /rent/i.test(String(r.purpose)) ? "Rent" : "Sale", type: type,
        title: String(r.title || "").trim(), area: area ? area.name : String(r.area || "").trim(), address: String(r.address || "").trim(),
        lat: lat, lng: lng, hasArea: !!area,
        price: price, oldPrice: old > price ? old : 0, dropped: old > price && price > 0,
        dropPct: old > price && price > 0 ? Math.round((old - price) / old * 100) : 0,
        sizeUnit: unit, sizeValue: sv, marla: marla, sqft: marla * TE.MARLA_SQFT,
        ppm: marla > 0 ? price / marla : null,
        beds: optNum(r.beds), baths: optNum(r.baths), floors: optNum(r.floors),
        furnished: yes(r.furnished), ready: yes(r.ready),
        features: Array.isArray(r.features) ? r.features : String(r.features || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean),
        description: String(r.description || ""),
        photos: (Array.isArray(r.photos) ? r.photos : String(r.photos || "").split(",")).map(TE.photoUrl).filter(function (u) { return /^https?:\/\//i.test(u); }).slice(0, 8),
        video: String(r.video || "").trim(),
        featured: yes(r.featured), verified: yes(r.verified), added: added, dist: null
      };
    }).filter(function (p) { return p.id && p.title && p.price > 0 && p.lat !== null && p.lng !== null; });

    var byId = {};
    props.forEach(function (p) { byId[p.id] = p; });
    TE.data = { props: props, byId: byId, areas: areas, areaByName: areaByName, settings: normSettings(raw.settings), source: source, demo: source === "demo" };
    if (TE.geo) TE.geo.annotate(); // distances from the remembered position (kept only in this browser)
    return TE.data;
  }
  TE.areaOf = function (name) { return TE.data.areaByName[String(name).toLowerCase()] || null; };

  /* ---------- load (kept a few minutes in the browser; the old copy is used if the sheet cannot be reached) ---------- */
  var loadPromise = null;
  function readCache() { try { return JSON.parse(localStorage.getItem(CACHE_KEY)); } catch (e) { return null; } }
  function writeCache(raw) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data: { properties: raw.properties, areas: raw.areas, settings: raw.settings } })); } catch (e) { /* ignore */ }
  }
  function doLoad() {
    if (!cfg.SCRIPT_URL) return Promise.resolve(build(TE.demo.raw(), "demo"));
    var cached = readCache(), mins = cfg.CACHE_MINUTES || 5;
    if (cached && cached.data && Date.now() - cached.t < mins * 60000) return Promise.resolve(build(cached.data, "cache"));
    var url = cfg.SCRIPT_URL + (cfg.SCRIPT_URL.indexOf("?") > -1 ? "&" : "?") + "action=all&_=" + Date.now();
    return fetchJson(url, { cache: "no-store" }, 15000)
      .then(function (j) {
        if (!j || !j.ok || !j.properties || !j.areas) throw new Error("bad data");
        writeCache(j);
        return build(j, "live");
      })
      .catch(function (err) {
        if (cached && cached.data) return build(cached.data, "stale");
        throw err;
      });
  }
  TE.load = function () { if (!loadPromise) loadPromise = doLoad(); return loadPromise; };

  /* ---------- forms: POST a lead (the browser location is never part of it) ---------- */
  TE.sendLead = function (payload) {
    if (!cfg.SCRIPT_URL) return TE.demo.lead(payload);
    return fetchJson(cfg.SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) }, 30000);
  };
})();
