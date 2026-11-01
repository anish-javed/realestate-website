/* Calculations that run in the browser on the loaded listings: filters, price insight, valuation, instalments, area stats, quiz. */
(function () {
  var TE = (window.TE = window.TE || {});

  /* ---------- size chips: 3, 5, 7, 8, 10 marla, 1 kanal, 2 kanal+ ---------- */
  TE.SIZE_CHIPS = [["3", "3 Marla"], ["5", "5 Marla"], ["7", "7 Marla"], ["8", "8 Marla"], ["10", "10 Marla"], ["20", "1 Kanal"], ["40", "2 Kanal+"]];
  function sizeBucket(m) { return m < 4 ? "3" : m < 6 ? "5" : m < 7.5 ? "7" : m < 9 ? "8" : m < 15 ? "10" : m < 30 ? "20" : "40"; }
  TE.sizeBucket = sizeBucket;

  TE.PRICE_STEPS = {
    Sale: [2500000, 5000000, 7500000, 10000000, 15000000, 20000000, 30000000, 40000000, 50000000, 75000000, 100000000, 150000000],
    Rent: [25000, 40000, 60000, 80000, 100000, 150000, 200000, 300000, 500000]
  };
  TE.PRICE_PRESETS = {
    Sale: [["Under 1 Cr", null, 1e7], ["1 - 2 Cr", 1e7, 2e7], ["2 - 4 Cr", 2e7, 4e7], ["4 - 8 Cr", 4e7, 8e7], ["8 Cr +", 8e7, null]],
    Rent: [["Under 50k", null, 50000], ["50k - 100k", 50000, 100000], ["100k - 200k", 100000, 200000], ["200k +", 200000, null]]
  };

  /* ---------- the search state, and how it is written in a link ---------- */
  var S = (TE.search = {});
  S.defaults = function () {
    return { purpose: "Sale", types: [], min: null, max: null, sizes: [], smin: null, smax: null, beds: 0, baths: 0, areas: [],
      furnished: false, ready: false, verified: false, dropped: false, fresh: false, radius: 0, sort: "" };
  };
  S.fromQuery = function (qs) {
    var s = S.defaults(), q = new URLSearchParams(qs || "");
    function list(k) { return (q.get(k) || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean); }
    function num(k) { var v = parseFloat(q.get(k)); return isNaN(v) ? null : v; }
    if (/^rent$/i.test(q.get("purpose") || "")) s.purpose = "Rent";
    s.types = list("type").filter(function (t) { return TE.TYPES.indexOf(t) > -1; });
    s.areas = list("area");
    s.sizes = list("size").filter(function (x) { return TE.SIZE_CHIPS.some(function (c) { return c[0] === x; }); });
    s.min = num("min"); s.max = num("max"); s.smin = num("smin"); s.smax = num("smax");
    s.beds = Math.max(0, num("beds") || 0); s.baths = Math.max(0, num("baths") || 0);
    ["furnished", "ready", "verified", "dropped", "fresh"].forEach(function (k) { s[k] = q.get(k) === "1"; });
    var r = num("radius"); s.radius = r && TE.geo.RADII.indexOf(r) > -1 ? r : 0;
    var so = q.get("sort") || ""; s.sort = ["nearest", "newest", "plow", "phigh", "large", "ppm"].indexOf(so) > -1 ? so : "";
    return s;
  };
  S.toQuery = function (s) {
    var q = new URLSearchParams();
    q.set("purpose", s.purpose);
    if (s.types.length) q.set("type", s.types.join(","));
    if (s.areas.length) q.set("area", s.areas.join(","));
    if (s.sizes.length) q.set("size", s.sizes.join(","));
    if (s.min !== null) q.set("min", s.min); if (s.max !== null) q.set("max", s.max);
    if (s.smin !== null) q.set("smin", s.smin); if (s.smax !== null) q.set("smax", s.smax);
    if (s.beds) q.set("beds", s.beds); if (s.baths) q.set("baths", s.baths);
    ["furnished", "ready", "verified", "dropped", "fresh"].forEach(function (k) { if (s[k]) q.set(k, "1"); });
    if (s.radius) q.set("radius", s.radius);
    if (s.sort) q.set("sort", s.sort);
    return q.toString();
  };
  // A short human name for a search, e.g. "Houses for sale in Johar Town, 5 Marla"
  S.describe = function (s) {
    var what = s.types.length ? s.types.map(function (t) { return TE.pluralType(t); }).join(" & ") : "Homes";
    what = what.charAt(0).toUpperCase() + what.slice(1);
    var out = what + (s.purpose === "Rent" ? " for rent" : " for sale");
    if (s.areas.length) out += " in " + (s.areas.length > 2 ? s.areas.length + " areas" : s.areas.join(" & "));
    var bits = [];
    if (s.sizes.length) bits.push(s.sizes.map(function (k) { return TE.SIZE_CHIPS.filter(function (c) { return c[0] === k; })[0][1]; }).join("/"));
    if (s.beds) bits.push(s.beds + "+ beds");
    if (s.min !== null && s.max !== null) bits.push(TE.fmt.amount(s.min) + " - " + TE.fmt.amount(s.max));
    else if (s.max !== null) bits.push("under " + TE.fmt.amount(s.max));
    else if (s.min !== null) bits.push("over " + TE.fmt.amount(s.min));
    if (s.dropped) bits.push("price dropped");
    if (s.fresh) bits.push("new");
    return out + (bits.length ? ", " + bits.join(", ") : "");
  };

  /* ---------- filtering and sorting ---------- */
  S.match = function (p, s, newDays) {
    if (p.purpose !== s.purpose) return false;
    if (s.types.length && s.types.indexOf(p.type) < 0) return false;
    if (s.areas.length && s.areas.indexOf(p.area) < 0) return false;
    if (s.min !== null && p.price < s.min) return false;
    if (s.max !== null && p.price > s.max) return false;
    if (s.sizes.length && s.sizes.indexOf(sizeBucket(p.marla)) < 0) return false;
    if (s.smin !== null && p.marla < s.smin) return false;
    if (s.smax !== null && p.marla > s.smax) return false;
    if (s.beds && !(p.beds !== null && p.beds >= s.beds)) return false;
    if (s.baths && !(p.baths !== null && p.baths >= s.baths)) return false;
    if (s.furnished && !p.furnished) return false;
    if (s.ready && !p.ready) return false;
    if (s.verified && !p.verified) return false;
    if (s.dropped && !p.dropped) return false;
    if (s.fresh && !TE.isNew(p, newDays)) return false;
    if (s.radius && (p.dist === null || p.dist > s.radius)) return false;
    return true;
  };
  TE.isNew = function (p, days) { return p.added > 0 && Date.now() - p.added <= days * 86400000; };
  S.sorter = function (sort) {
    function nul(a, b, f) { if (a === null && b === null) return 0; if (a === null) return 1; if (b === null) return -1; return f; }
    return {
      nearest: function (a, b) { return nul(a.dist, b.dist, a.dist - b.dist); },
      newest: function (a, b) { return b.added - a.added; },
      plow: function (a, b) { return a.price - b.price; },
      phigh: function (a, b) { return b.price - a.price; },
      large: function (a, b) { return b.marla - a.marla; },
      ppm: function (a, b) { return nul(a.ppm, b.ppm, a.ppm - b.ppm); }
    }[sort] || function () { return 0; };
  };
  S.apply = function (list, s) {
    var out = list.filter(function (p) { return S.match(p, s, TE.data.settings.newDays); });
    var sort = s.sort || (TE.geo.get() ? "nearest" : "newest");
    return out.sort(S.sorter(sort));
  };

  /* ---------- price insight (Property page) ---------- */
  // Compares price per marla with the middle value of similar listings.
  TE.insight = function (p) {
    if (!p.ppm) return null;
    var all = TE.data.props.filter(function (q) { return q.id !== p.id && q.purpose === p.purpose && q.type === p.type && q.ppm; });
    function band(q) { return Math.abs(q.marla - p.marla) / p.marla <= 0.3; }
    var inArea = all.filter(function (q) { return q.area === p.area; });
    var tiers = [
      { pool: inArea.filter(band), where: "in " + p.area, sizeWord: true },
      { pool: inArea, where: "in " + p.area + " (all sizes)", sizeWord: false },
      { pool: all.filter(band), where: "across Lahore", sizeWord: true },
      { pool: all, where: "across Lahore (all sizes)", sizeWord: false }
    ];
    for (var i = 0; i < tiers.length; i++) {
      var t = tiers[i];
      if (t.pool.length >= 3) {
        var med = TE.median(t.pool.map(function (q) { return q.ppm; }));
        var diff = (p.ppm - med) / med * 100;
        var kind = (t.sizeWord ? TE.fmt.marla(Math.round(p.marla * 2) / 2) + " " : "") + TE.pluralType(p.type);
        if (p.sizeUnit === "sqft" && t.sizeWord) kind = "similar-sized " + TE.pluralType(p.type);
        var level = diff <= -5 ? "below" : diff >= 5 ? "above" : "fair";
        return { pct: diff, level: level, n: t.pool.length, median: med, wide: i >= 2, kind: kind, where: t.where,
          text: level === "fair" ? "About the same as the average for " + kind + " " + t.where :
            TE.fmt.pct(diff) + " " + level + " the average for " + kind + " " + t.where };
      }
    }
    return null;
  };

  /* ---------- Value My Property ---------- */
  TE.toMarla = function (value, unit) { return unit === "Kanal" ? value * 20 : unit === "Sq Ft" ? value / TE.MARLA_SQFT : value; };
  TE.valuation = function (o) { // { purpose, type, area, marla }
    var match = TE.data.props.filter(function (q) { return q.purpose === o.purpose && q.type === o.type && q.ppm; });
    var local = match.filter(function (q) { return q.area === o.area; });
    var pool = local, wide = false;
    if (local.length < 3) { pool = match; wide = true; }
    if (pool.length < 3) return { ok: false, n: pool.length };
    var med = TE.median(pool.map(function (q) { return q.ppm; }));
    var mid = med * o.marla;
    return { ok: true, n: pool.length, wide: wide, localN: local.length, ppm: med, low: mid * 0.85, mid: mid, high: mid * 1.15 };
  };

  /* ---------- instalments ---------- */
  TE.instalment = function (price, downPct, ratePct, years) {
    var down = price * downPct / 100, loan = price - down, n = Math.max(1, Math.round(years * 12)), r = ratePct / 100 / 12;
    var monthly = r === 0 ? loan / n : loan * r / (1 - Math.pow(1 + r, -n));
    var paid = monthly * n;
    return { down: down, loan: loan, months: n, monthly: monthly, totalPaid: paid + down, interest: paid - loan };
  };

  /* ---------- area stats, calculated from the listings ---------- */
  TE.areaStats = function (name) {
    var inArea = TE.data.props.filter(function (p) { return p.area === name; });
    var sale = inArea.filter(function (p) { return p.purpose === "Sale" && p.ppm; });
    var land = sale.filter(function (p) { return p.type === "House" || p.type === "Plot"; });
    var use = land.length ? land : sale;
    var avg = use.length ? use.reduce(function (t, p) { return t + p.ppm; }, 0) / use.length : null;
    return { count: inArea.length, sale: inArea.filter(function (p) { return p.purpose === "Sale"; }).length,
      rent: inArea.filter(function (p) { return p.purpose === "Rent"; }).length, avgPpm: avg, basis: land.length ? "houses and plots" : "sale listings" };
  };

  /* ---------- Area Match quiz ---------- */
  // Each answer adds weight to these area scores. "quiet" = the opposite of central, "premium" = the opposite of budget.
  TE.QUIZ = [
    { q: "Who will be living there?", multi: false, opts: [
      ["A family with children", { family: 3, central: 1 }], ["A young couple or professional", { central: 2, budget: 1, family: 1 }],
      ["Retired and looking for peace", { family: 2, quiet: 2 }], ["It is an investment", { investment: 3, budget: 1 }]] },
    { q: "What is your budget level?", multi: false, opts: [
      ["Keep it affordable", { budget: 3 }], ["Comfortable, good value", { budget: 1.5 }], ["Premium: I want the best", { premium: 2.5 }]] },
    { q: "What matters most? (pick up to 2)", multi: true, opts: [
      ["Good schools and family life", { family: 2 }], ["Investment growth", { investment: 2 }], ["Being close to the city centre", { central: 2 }],
      ["Green and quiet", { quiet: 2 }], ["Best value for money", { budget: 2 }]] },
    { q: "Are you looking to buy or to rent?", multi: false, opts: [["Buy", { purpose: "Sale" }], ["Rent", { purpose: "Rent" }]] }
  ];
  TE.quizScore = function (answers) { // answers: array (one per question) of arrays of option indexes
    var w = { family: 0, budget: 0, investment: 0, central: 0, quiet: 0, premium: 0 }, purpose = "Sale";
    TE.QUIZ.forEach(function (q, qi) {
      (answers[qi] || []).forEach(function (oi) {
        var o = q.opts[oi][1];
        Object.keys(o).forEach(function (k) { if (k === "purpose") purpose = o[k]; else w[k] += o[k]; });
      });
    });
    var maxTotal = 0;
    var list = TE.data.areas.map(function (a) {
      var v = { family: a.family, budget: a.budget, investment: a.investment, central: a.central, quiet: 6 - a.central, premium: 6 - a.budget };
      var sc = 0, best = 0;
      Object.keys(w).forEach(function (k) { sc += w[k] * v[k]; best += w[k] * 5; });
      var count = TE.data.props.filter(function (p) { return p.area === a.name && p.purpose === purpose; }).length;
      if (!count) sc -= best * 0.15; // nothing to show there right now
      return { area: a, score: sc, best: best || 1, count: count };
    });
    list.sort(function (x, y) { return y.score - x.score; });
    list.forEach(function (r) { r.pct = Math.max(40, Math.min(99, Math.round(r.score / r.best * 100))); });
    return { purpose: purpose, top: list.slice(0, 3) };
  };
})();
