/* Shared helpers: formatting, browser storage, favourites, compare, header/footer, toast, modal, forms, page start-up. */
(function () {
  var TE = (window.TE = window.TE || {});
  TE.cfg = window.TE_CONFIG || {};
  TE.reduced = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  TE.isPhone = !!(window.matchMedia && matchMedia("(max-width: 720px)").matches);
  var root = document.documentElement;
  if (TE.reduced) root.classList.add("reduced");
  if (TE.isPhone) root.classList.add("phone");

  var MARLA_SQFT = 272.25;
  TE.MARLA_SQFT = MARLA_SQFT;
  TE.TYPES = ["House", "Plot", "Flat", "Commercial", "Farmhouse"];

  /* ---------- small helpers ---------- */
  TE.esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  };
  TE.$ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  TE.$$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  TE.debounce = function (fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); }; };
  TE.median = function (arr) {
    if (!arr.length) return null;
    var a = arr.slice().sort(function (x, y) { return x - y; }), m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  };
  TE.pluralType = function (t) { return { House: "houses", Plot: "plots", Flat: "flats", Commercial: "commercial properties", Farmhouse: "farmhouses" }[t] || "properties"; };
  TE.typeWord = function (t) { return { House: "house", Plot: "plot", Flat: "flat", Commercial: "commercial property", Farmhouse: "farmhouse" }[t] || "property"; };

  /* ---------- browser storage (never throws) ---------- */
  TE.store = {
    get: function (k, d) { try { var v = localStorage.getItem("te_" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem("te_" + k, JSON.stringify(v)); } catch (e) { /* storage may be blocked */ } },
    del: function (k) { try { localStorage.removeItem("te_" + k); } catch (e) { /* ignore */ } }
  };

  /* ---------- Pakistani-style money and sizes ---------- */
  function trim(n, d) { return String(+n.toFixed(d)); }
  TE.fmt = {
    num: function (n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); },
    price: function (p, purpose) {
      if (purpose === "Rent") return "Rs " + TE.fmt.num(p) + " / month";
      if (p >= 1e7) return "Rs " + trim(p / 1e7, 2) + " Crore";
      if (p >= 1e5) return "Rs " + trim(p / 1e5, 2) + " Lakh";
      return "Rs " + TE.fmt.num(p);
    },
    amount: function (p) { // money without the purpose, for totals
      if (p >= 1e7) return "Rs " + trim(p / 1e7, 2) + " Crore";
      if (p >= 1e5) return "Rs " + trim(p / 1e5, 2) + " Lakh";
      return "Rs " + TE.fmt.num(p);
    },
    pinLabel: function (p, purpose) { // short label for map pins
      if (purpose === "Rent") return p >= 1000 ? trim(p / 1000, 1) + "k" : String(p);
      if (p >= 1e7) return trim(p / 1e7, 2) + " Cr";
      if (p >= 1e5) return trim(p / 1e5, 1) + " L";
      return TE.fmt.num(p);
    },
    marla: function (m) {
      if (m >= 20 && Math.abs(m / 20 - Math.round(m / 20)) < 0.01) return Math.round(m / 20) + " Kanal";
      return trim(m, 1) + " Marla";
    },
    sqft: function (s) { return TE.fmt.num(s) + " sq ft"; },
    km: function (k) { return k < 1 ? Math.max(1, Math.round(k * 100) * 10) + " m" : (k < 10 ? k.toFixed(1) : Math.round(k)) + " km"; },
    clock: function (hhmm) {
      var h = +hhmm.slice(0, 2), m = hhmm.slice(3, 5), ap = h >= 12 ? "pm" : "am";
      h = h % 12; if (h === 0) h = 12;
      return h + ":" + m + " " + ap;
    },
    ago: function (ms) {
      var d = Math.floor((Date.now() - ms) / 86400000);
      if (d <= 0) return "today"; if (d === 1) return "yesterday"; if (d < 30) return d + " days ago";
      var m = Math.floor(d / 30); return m + (m === 1 ? " month ago" : " months ago");
    },
    pct: function (n) { return Math.abs(Math.round(n)) + "%"; }
  };
  // The main size and the other way to say it, e.g. { main: "5 Marla", alt: "1,361 sq ft" }
  TE.sizeText = function (p) {
    if (p.sizeUnit === "sqft") return { main: TE.fmt.sqft(p.sqft), alt: "about " + trim(p.marla, 1) + " marla" };
    return { main: TE.fmt.marla(p.marla), alt: TE.fmt.sqft(p.sqft) };
  };
  // "2.5 cr", "85 lakh", "120k", "1,200,000" -> number (or null)
  TE.parsePrice = function (s) {
    s = String(s == null ? "" : s).toLowerCase().replace(/,/g, "").trim();
    if (!s) return null;
    var m = s.match(/^(\d+(?:\.\d+)?)\s*(crore|cr|lakh|lac|l|k|m)?$/);
    if (!m) return null;
    var v = parseFloat(m[1]), u = m[2];
    if (u === "crore" || u === "cr") v *= 1e7; else if (u === "lakh" || u === "lac" || u === "l") v *= 1e5; else if (u === "k") v *= 1e3; else if (u === "m") v *= 1e6;
    return Math.round(v);
  };
  // Google Drive "share" links do not work inside <img>; turn them into direct links.
  TE.photoUrl = function (u) {
    u = String(u || "").trim();
    var m = u.match(/drive\.google\.com\/file\/d\/([\w-]+)/) || u.match(/drive\.google\.com\/(?:open|uc)\?(?:[^#]*&)?id=([\w-]+)/);
    return m ? "https://drive.google.com/thumbnail?id=" + m[1] + "&sz=w1600" : u;
  };

  /* ---------- icons ---------- */
  TE.icon = {
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.2-4.6-9.4-9.2A5.4 5.4 0 0 1 12 6.3a5.4 5.4 0 0 1 9.4 5.5C19.2 16.4 12 21 12 21z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.6"/></svg>',
    bed: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.6"/></svg>',
    bath: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2zM7 12V6a2 2 0 0 1 4 0M6 19l-1 2M18 19l1 2"/></svg>',
    area: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3z"/><path d="M9 8.5c.3 3 2.7 5.6 5.8 6.3l1.3-1.4-2-1-1 .7a5 5 0 0 1-2.3-2.3l.7-1-1-2z"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    logo: '<svg viewBox="0 0 36 36" aria-hidden="true"><path d="M4 17L18 5l14 12"/><path d="M8 15v16h20V15"/><path d="M18 31v-9M15 22a3 3 0 1 1 6 0"/></svg>'
  };

  /* ---------- visits (for "welcome back" and "new homes since your last visit") ---------- */
  TE.prevVisit = 0;
  try {
    var prev = sessionStorage.getItem("te_prev");
    if (prev === null) {
      prev = localStorage.getItem("te_lastSeen") || "0";
      sessionStorage.setItem("te_prev", prev);
      localStorage.setItem("te_lastSeen", String(Date.now()));
    }
    TE.prevVisit = +prev || 0;
  } catch (e) { /* ignore */ }

  /* ---------- favourites: remember the price when saved, so we can spot a drop ---------- */
  TE.fav = {
    all: function () { return TE.store.get("favs", {}); },
    has: function (id) { return !!TE.fav.all()[id]; },
    ids: function () { var f = TE.fav.all(); return Object.keys(f).sort(function (a, b) { return f[b].t - f[a].t; }); },
    toggle: function (p) {
      var f = TE.fav.all(), on;
      if (f[p.id]) { delete f[p.id]; on = false; } else { f[p.id] = { price: p.price, t: Date.now() }; on = true; }
      TE.store.set("favs", f);
      document.dispatchEvent(new CustomEvent("te:fav", { detail: { id: p.id, on: on } }));
      TE.updateBadges();
      return on;
    },
    drops: function () { // [{ p, was, now }] for saved homes that got cheaper
      var f = TE.fav.all(), out = [];
      if (!TE.data) return out;
      Object.keys(f).forEach(function (id) {
        var p = TE.data.byId[id];
        if (p && p.price < f[id].price) out.push({ p: p, was: f[id].price, now: p.price });
      });
      return out;
    }
  };
  TE.updateBadges = function () {
    var n = TE.fav.ids().length, c = TE.$("#favCount"), a = TE.$("#favAlert");
    if (c) { c.textContent = n; c.hidden = !n; }
    if (a) a.hidden = !TE.fav.drops().length;
  };

  /* ---------- recently viewed, saved searches, last search ---------- */
  TE.recent = {
    ids: function () { return TE.store.get("recent", []); },
    add: function (id) { var l = TE.recent.ids().filter(function (x) { return x !== id; }); l.unshift(id); TE.store.set("recent", l.slice(0, 12)); }
  };
  TE.searches = {
    list: function () { return TE.store.get("searches", []); },
    add: function (name, qs) {
      var l = TE.searches.list().filter(function (s) { return s.qs !== qs; });
      l.unshift({ id: "s" + Date.now(), name: name, qs: qs, t: Date.now() });
      TE.store.set("searches", l.slice(0, 12));
    },
    remove: function (id) { TE.store.set("searches", TE.searches.list().filter(function (s) { return s.id !== id; })); },
    has: function (qs) { return TE.searches.list().some(function (s) { return s.qs === qs; }); }
  };

  /* ---------- compare (up to 3) ---------- */
  TE.cmp = {
    ids: function () { return TE.store.get("cmp", []); },
    has: function (id) { return TE.cmp.ids().indexOf(id) > -1; },
    toggle: function (id) {
      var l = TE.cmp.ids(), i = l.indexOf(id);
      if (i > -1) l.splice(i, 1);
      else { if (l.length >= 3) { TE.toast("You can compare up to 3 homes. Remove one first."); return false; } l.push(id); }
      TE.store.set("cmp", l);
      document.dispatchEvent(new CustomEvent("te:cmp", { detail: { id: id } }));
      TE.renderTray();
      return i === -1;
    },
    clear: function () { TE.store.set("cmp", []); document.dispatchEvent(new CustomEvent("te:cmp", { detail: {} })); TE.renderTray(); }
  };
  TE.renderTray = function () {
    var t = TE.$("#cmpTray");
    if (!t) return;
    var ids = TE.cmp.ids().filter(function (id) { return !TE.data || TE.data.byId[id]; });
    if (!ids.length) { t.hidden = true; return; }
    t.hidden = false;
    t.innerHTML = '<span><b>Compare</b> ' + ids.length + "/3 selected</span>" +
      '<button class="btn btn-small btn-primary" data-act="open"' + (ids.length < 2 ? ' disabled title="Pick at least 2 homes"' : "") + ">Compare now</button>" +
      '<button class="btn btn-small btn-ghost" data-act="clear">Clear</button>';
  };

  /* ---------- toast and modal ---------- */
  TE.toast = function (msg) {
    var box = TE.$("#toasts");
    if (!box) return;
    var el = document.createElement("div");
    el.className = "toast"; el.textContent = msg;
    box.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("in"); });
    setTimeout(function () { el.classList.remove("in"); setTimeout(function () { el.remove(); }, 400); }, 3200);
  };
  TE.modal = {
    open: function (html, cls) {
      TE.modal.close();
      var bg = document.createElement("div");
      bg.className = "modal-bg"; bg.id = "modalBg";
      bg.innerHTML = '<div class="modal ' + (cls || "") + '" role="dialog" aria-modal="true"><button class="modal-x" aria-label="Close">' + TE.icon.close + "</button>" + html + "</div>";
      document.body.appendChild(bg);
      requestAnimationFrame(function () { bg.classList.add("in"); });
      bg.addEventListener("click", function (e) { if (e.target === bg || e.target.closest(".modal-x")) TE.modal.close(); });
      var x = bg.querySelector(".modal-x"); if (x) x.focus();
      return bg;
    },
    close: function () { var b = TE.$("#modalBg"); if (b) b.remove(); }
  };
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") TE.modal.close(); });

  /* ---------- numbers that roll ---------- */
  TE.roll = function (el, to, format, ms) {
    format = format || function (v) { return TE.fmt.num(v); };
    if (!el) return;
    if (TE.reduced || !window.requestAnimationFrame) { el.textContent = format(to); return; }
    var start = null; ms = ms || 900;
    function step(t) {
      if (start === null) start = t;
      var k = Math.min(1, (t - start) / ms), e = 1 - Math.pow(1 - k, 3);
      el.textContent = format(to * e);
      if (k < 1) requestAnimationFrame(step); else el.textContent = format(to);
    }
    requestAnimationFrame(step);
  };
  // roll every element with data-roll="123" once it appears on screen
  TE.rollAll = function (ctx) {
    var els = TE.$$("[data-roll]", ctx);
    function go(el) { TE.roll(el, +el.getAttribute("data-roll"), el.__fmt); }
    if (!("IntersectionObserver" in window)) { els.forEach(go); return; }
    var io = new IntersectionObserver(function (list) { list.forEach(function (en) { if (en.isIntersecting) { io.unobserve(en.target); go(en.target); } }); }, { threshold: 0.3 });
    els.forEach(function (el) { io.observe(el); });
  };

  /* ---------- reveal on scroll ---------- */
  TE.reveal = function (ctx) {
    var els = TE.$$(".reveal:not(.in)", ctx);
    if (!("IntersectionObserver" in window) || TE.reduced) { els.forEach(function (e) { e.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (list) { list.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }); }, { threshold: 0.12 });
    els.forEach(function (e) { io.observe(e); });
  };

  /* ---------- phone: 03XX-XXXXXXX ---------- */
  TE.phone = {
    format: function (v) {
      var d = String(v || "").replace(/\D/g, "");
      if (d.indexOf("0092") === 0) d = d.slice(4); else if (d.indexOf("92") === 0 && d.length > 10) d = d.slice(2);
      if (d.charAt(0) === "3") d = "0" + d;
      d = d.slice(0, 11);
      return d.length > 4 ? d.slice(0, 4) + "-" + d.slice(4) : d;
    },
    valid: function (v) { return /^03\d{2}-\d{7}$/.test(v); },
    attach: function (input) {
      input.addEventListener("input", function () { input.value = TE.phone.format(input.value); });
      input.setAttribute("inputmode", "tel"); input.setAttribute("maxlength", "12"); input.setAttribute("autocomplete", "tel");
    }
  };

  /* ---------- WhatsApp ---------- */
  TE.waNumber = function () { return (TE.data && TE.data.settings.whatsapp) || "923000000000"; };
  TE.waLink = function (text) { return "https://wa.me/" + TE.waNumber() + (text ? "?text=" + encodeURIComponent(text) : ""); };
  TE.pageUrl = function (id) { return new URL("property.html?id=" + encodeURIComponent(id), location.href).href; };
  // The complete message the visitor sends to the agent. It is a normal link: the visitor taps Send.
  TE.waMessage = function (d) {
    var L = ["Hello " + ((TE.data && TE.data.settings.name) || "Thikana Estates") + ", I just sent a request on your website."];
    L.push("Ref: " + d.ref);
    L.push("Request: " + d.type);
    L.push("Name: " + d.name);
    L.push("Phone: " + d.phone);
    if (d.prop) {
      L.push("Property ID: " + d.prop.id);
      L.push("Property: " + d.prop.title);
      L.push("Area: " + d.prop.area);
      L.push("Price: " + TE.fmt.price(d.prop.price, d.prop.purpose));
      L.push("Link: " + TE.pageUrl(d.prop.id));
    }
    (d.lines || []).forEach(function (x) { L.push(x); });
    if (d.when) L.push("Preferred time: " + d.when);
    if (d.notes) L.push("Notes: " + d.notes);
    return L.join("\n");
  };
  // The thank-you screen: the ref and a big WhatsApp button.
  TE.thanks = function (container, d) {
    var msg = TE.waMessage(d);
    container.innerHTML =
      '<div class="thanks"><div class="tick">' + TE.icon.check + "</div>" +
      "<h2>Thank you, " + TE.esc(d.name.split(" ")[0]) + "!</h2>" +
      "<p>" + TE.esc(d.intro || "We have your request.") + "</p>" +
      '<div class="ref-box"><small>Your reference</small><b>' + TE.esc(d.ref) + "</b></div>" +
      "<p><b>One last step:</b> tap the button to send the details to the agent on WhatsApp. You will see the message ready to go. Just tap Send.</p>" +
      '<a class="btn btn-wa btn-big" target="_blank" rel="noopener" href="' + TE.esc(TE.waLink(msg)) + '">' + TE.icon.wa + " Send details on WhatsApp</a>" +
      '<p class="small">' + (d.demo ? "This is a demo website, so nothing was really saved. " : "") + "We have also saved your request. The agent will call you soon.</p></div>";
    container.scrollIntoView({ behavior: TE.reduced ? "auto" : "smooth", block: "center" });
  };
  TE.formError = function (form, msg, field) {
    var box = form.querySelector(".form-error");
    if (!box) { box = document.createElement("p"); box.className = "form-error"; box.setAttribute("role", "alert"); form.insertBefore(box, form.querySelector("[type=submit]").closest(".actions") || form.lastChild); }
    box.textContent = msg || ""; box.hidden = !msg;
    TE.$$(".field.bad", form).forEach(function (f) { f.classList.remove("bad"); });
    if (field) { var el = form.querySelector('[name="' + field + '"]'); if (el) { el.closest(".field").classList.add("bad"); el.focus(); } }
  };

  /* ---------- header, footer and floating bits ---------- */
  var NAV = [
    ["home", "index.html", "Home"], ["browse", "browse.html", "Browse"], ["areas", "areas.html", "Area Guides"],
    ["tools", "tools.html", "Tools"], ["saved", "saved.html", "Saved"], ["about", "about.html", "About &amp; Contact"]
  ];
  TE.layout = function (page) {
    var nav = NAV.map(function (n) { return '<a href="' + n[1] + '"' + (n[0] === page ? ' class="on" aria-current="page"' : "") + ">" + n[2] + "</a>"; }).join("");
    document.body.insertAdjacentHTML("afterbegin",
      '<a class="skip" href="#main">Skip to content</a>' +
      '<header class="site-header"><div class="wrap hdr">' +
      '<a class="logo" href="index.html" aria-label="Thikana Estates, home">' + TE.icon.logo + "<span><b>Thikana</b><small>ESTATES</small></span></a>" +
      '<nav class="nav" id="nav" aria-label="Main">' + nav + '<a class="nav-cta" href="list.html">List your property</a></nav>' +
      '<a class="nav-saved" href="saved.html" aria-label="Saved homes">' + TE.icon.heart + '<span class="count" id="favCount" hidden>0</span><i class="alert-dot" id="favAlert" hidden title="A saved home dropped in price"></i></a>' +
      '<button class="burger" id="burger" aria-label="Open menu" aria-expanded="false" aria-controls="nav"><span></span><span></span><span></span></button>' +
      "</div></header>");
    var main = TE.$("#main");
    document.body.insertAdjacentHTML("beforeend",
      '<footer class="site-footer"><div class="wrap foot-grid">' +
      '<div><a class="logo light" href="index.html">' + TE.icon.logo + "<span><b>Thikana</b><small>ESTATES</small></span></a>" +
      '<p class="muted-l" id="ftAbout">Homes, plots and rentals across Lahore, with honest prices and people who answer the phone.</p></div>' +
      '<div><h4>Explore</h4><a href="browse.html">Browse homes</a><a href="areas.html">Area guides &amp; quiz</a><a href="tools.html">Value my property</a><a href="tools.html#instalment">Instalment calculator</a><a href="list.html">List your property</a></div>' +
      '<div><h4>Contact</h4><p id="ftContact">0300 0000000<br>Lahore, Pakistan</p><p id="ftHours" class="muted-l"></p></div>' +
      '<div><h4>Your privacy</h4><p class="muted-l">Your location stays in your own browser and is never sent to us. Saved homes and searches are also kept only in your browser.</p></div>' +
      "</div>" +
      '<div class="wrap foot-base"><p>' + TE.esc(TE.cfg.DEMO_LINE || "") + '</p><p class="credit">Photos: <a href="https://www.pexels.com" target="_blank" rel="noopener">Pexels</a></p></div></footer>' +
      '<a class="wa-float" id="waFloat" target="_blank" rel="noopener" aria-label="Chat on WhatsApp" href="' + TE.esc(TE.waLink("Hello, I have a question about a property.")) + '">' + TE.icon.wa + "<span>Chat on WhatsApp</span></a>" +
      '<div class="cmp-tray" id="cmpTray" hidden></div><div class="toasts" id="toasts" aria-live="polite"></div>');
    TE.$("#burger").addEventListener("click", function () {
      var open = document.body.classList.toggle("menu-open");
      this.setAttribute("aria-expanded", open ? "true" : "false");
    });
    TE.$("#nav").addEventListener("click", function (e) { if (e.target.closest("a")) document.body.classList.remove("menu-open"); });
    TE.$("#cmpTray").addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.getAttribute("data-act") === "clear") TE.cmp.clear();
      else TE.openCompare();
    });
    TE.updateBadges(); TE.renderTray();
    if (main) main.setAttribute("tabindex", "-1");
  };
  TE.fillFooter = function () {
    var s = TE.data.settings;
    var c = TE.$("#ftContact"), h = TE.$("#ftHours"), w = TE.$("#waFloat");
    if (c) c.innerHTML = TE.esc(s.phone) + "<br>" + TE.esc(s.address);
    if (h) h.innerHTML = s.hours.map(TE.esc).join("<br>");
    if (w) w.href = TE.waLink("Hello " + s.name + ", I have a question about a property.");
    TE.updateBadges(); TE.renderTray();
  };

  /* ---------- page start-up: loader, data, friendly error ---------- */
  TE.boot = function (page, onReady) {
    TE.layout(page);
    var main = TE.$("#main");
    var loader = document.createElement("div");
    loader.className = "loader"; loader.id = "loader";
    loader.innerHTML = '<p><b>Thikana</b> Estates<br><small>Opening the doors&hellip;</small></p><i class="loader-line"></i>';
    document.body.appendChild(loader);
    var t0 = Date.now(), minMs = TE.reduced ? 0 : 700;
    function hideLoader() {
      var wait = Math.max(0, minMs - (Date.now() - t0));
      setTimeout(function () { loader.classList.add("out"); setTimeout(function () { loader.remove(); }, 600); }, wait);
    }
    function start() {
      TE.load().then(function (data) {
        TE.fillFooter();
        hideLoader();
        try { onReady(data); } catch (err) { if (window.console) console.error(err); }
        TE.reveal(document); TE.rollAll(document);
      }).catch(function () {
        hideLoader();
        main.innerHTML = '<div class="wrap section"><div class="state-card"><div class="state-art">' + TE.art.icon("House") + "</div>" +
          "<h2>We could not reach our listings</h2><p>Please check your internet connection and try again. If it keeps happening, call us or send a WhatsApp message.</p>" +
          '<button class="btn btn-primary" id="retry">Try again</button></div></div>';
        TE.$("#retry").addEventListener("click", function () { location.reload(); });
      });
    }
    start();
  };

  /* ---------- gentle card tilt (mouse only, never on phones) ---------- */
  if (!TE.reduced && !TE.isPhone && window.matchMedia && matchMedia("(hover: hover)").matches) {
    var tilting = null;
    document.addEventListener("pointermove", function (e) {
      var card = e.target.closest ? e.target.closest(".card, .area-card") : null;
      if (tilting && tilting !== card) { tilting.style.transform = ""; tilting = null; }
      if (!card || e.pointerType === "touch") return;
      tilting = card;
      var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = "perspective(900px) rotateX(" + (-y * 3).toFixed(2) + "deg) rotateY(" + (x * 4).toFixed(2) + "deg) translateY(-3px)";
    });
    document.addEventListener("pointerleave", function () { if (tilting) { tilting.style.transform = ""; tilting = null; } }, true);
  }
})();
