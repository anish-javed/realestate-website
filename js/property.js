/* Property page: ?id=TE-1001 */
TE.boot("browse", function (data) {
  var $ = TE.$, root = $("#propRoot"), set = data.settings;
  var id = (new URLSearchParams(location.search).get("id") || "").trim();
  var p = data.byId[id] || data.byId[id.toUpperCase()];

  if (!p) {
    document.title = "Property not found | Thikana Estates";
    var latest = data.props.slice().sort(function (a, b) { return b.added - a.added; }).slice(0, 3);
    root.innerHTML = '<div class="state-card"><div class="state-art">' + TE.art.houseOutline("House") + "</div><h2>This property is not available any more</h2>" +
      "<p>It may have been sold or rented, or the link may be wrong. Here are some homes you may like instead.</p>" +
      '<a class="btn btn-primary" href="browse.html">Browse all homes</a></div>' +
      '<div class="grid-cards" style="margin-top:28px">' + latest.map(function (x) { return TE.card(x); }).join("") + "</div>";
    return;
  }
  TE.recent.add(p.id);
  document.title = p.title + " | Thikana Estates";

  var size = TE.sizeText(p), ins = TE.insight(p), photos = p.photos;

  /* ---------- the page ---------- */
  function row(k, v) { return v === "" || v === null || v === undefined ? "" : "<tr><th>" + k + "</th><td>" + v + "</td></tr>"; }
  var yn = function (b) { return b ? "Yes" : "No"; };
  var details = "<table class=\"dtable\">" +
    row("Property ID", TE.esc(p.id)) + row("Purpose", "For " + p.purpose.toLowerCase()) + row("Type", p.type) +
    row("Size", "<b>" + size.main + "</b> &middot; " + size.alt) +
    row("Price per marla", TE.ppmText(p) || "") +
    row("Bedrooms", p.beds || "") + row("Bathrooms", p.baths || "") + row("Floors", p.floors || "") +
    row("Furnished", p.type === "Plot" ? "" : yn(p.furnished)) + row("Ready to move in", yn(p.ready)) +
    row("Area", TE.esc(p.area)) + row("Block / address", TE.esc(p.address)) +
    row("Listed", p.added ? TE.fmt.ago(p.added) : "") + row("Verified by our team", yn(p.verified)) + "</table>";

  var feats = p.features.length ? '<div class="chips static">' + p.features.map(function (f) { return '<span class="chip on-soft">' + TE.icon.check + TE.esc(f) + "</span>"; }).join("") + "</div>" : "";
  var video = p.video ? '<a class="btn btn-ghost" href="' + TE.esc(p.video) + '" target="_blank" rel="noopener">&#9658; Watch the video tour</a>' : "";

  var shareText = p.title + " - " + TE.fmt.price(p.price, p.purpose) + " (" + p.area + ")\n" + TE.pageUrl(p.id);
  var inCmp = TE.cmp.has(p.id), saved = TE.fav.has(p.id);

  root.innerHTML =
    '<nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a> <span>/</span> <a href="browse.html?purpose=' + p.purpose + '">Browse</a> <span>/</span> ' + TE.esc(p.area) + "</nav>" +
    '<div class="prop-head"><div><div class="badges row">' + TE.badges(p) + '<span class="badge b-plain">For ' + p.purpose.toLowerCase() + "</span></div>" +
    "<h1>" + TE.esc(p.title) + '</h1><p class="loc">' + TE.icon.pin + TE.esc(p.area) + (p.address ? " &middot; " + TE.esc(p.address) : "") + (TE.geo.label(p) ? ' &middot; <b>' + TE.esc(TE.geo.label(p)) + "</b>" : "") + "</p></div>" +
    '<div class="prop-price"><div class="big-price" id="bigPrice">' + TE.fmt.price(p.price, p.purpose) + "</div>" +
    (p.oldPrice ? '<div class="was">Was <s>' + TE.fmt.price(p.oldPrice, p.purpose) + '</s> &middot; <b class="drop">down ' + p.dropPct + "%</b></div>" : "") +
    '<div class="ppm">' + TE.ppmText(p) + "</div></div></div>" +
    '<div class="prop-actions">' +
    '<button class="btn btn-ghost heart-btn' + (saved ? " on" : "") + '" id="favBtn" type="button" aria-pressed="' + saved + '">' + TE.icon.heart + '<span>' + (saved ? "Saved" : "Save") + "</span></button>" +
    '<button class="btn btn-ghost' + (inCmp ? " on" : "") + '" id="cmpBtn" type="button">' + TE.icon.check + "<span>" + (inCmp ? "In compare" : "Compare") + "</span></button>" +
    '<a class="btn btn-ghost" id="shareBtn" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(shareText) + '">' + TE.icon.wa + "Share on WhatsApp</a>" + video + "</div>" +
    '<div class="prop-grid"><div class="prop-main">' +
    '<div class="gallery" id="gallery"></div>' +
    '<section class="p-sec"><h2>Details</h2>' + details + "</section>" +
    (feats ? '<section class="p-sec"><h2>Features</h2>' + feats + "</section>" : "") +
    '<section class="p-sec"><h2>About this ' + TE.typeWord(p.type) + "</h2><p class=\"desc\">" + TE.esc(p.description || "Contact us for more details about this property.") + "</p></section>" +
    '<section class="p-sec"><h2>Location</h2><p class="muted" id="distLine"></p><div id="pmap" role="application" aria-label="Map showing this property"></div>' +
    '<p class="small"><a target="_blank" rel="noopener" href="https://www.google.com/maps?q=' + p.lat + "," + p.lng + '">Open in Google Maps</a> &middot; Map data &copy; OpenStreetMap contributors. ' + (p.hasArea ? "" : "") + "</p></section>" +
    "</div>" +
    '<aside class="prop-side">' +
    '<div class="side-card insight" id="insight"></div>' +
    (p.purpose === "Sale" ? '<div class="side-card" id="emi"></div>' : "") +
    '<div class="side-card" id="viewing"></div>' +
    "</aside></div>" +
    '<section class="section"><div class="sec-head"><div><p class="eyebrow">You may also like</p><h2>Similar properties</h2></div></div><div class="grid-cards" id="similar"></div></section>';

  /* ---------- gallery: swipe, thumbnails and a full-screen viewer ---------- */
  (function () {
    var g = $("#gallery"), idx = 0;
    if (!photos.length) {
      g.innerHTML = '<div class="g-main solo">' + TE.art.placeholder(p.type, p.id) + "</div>";
      return;
    }
    g.innerHTML = '<div class="g-main"><div class="g-track" id="gTrack">' +
      photos.map(function (u, i) { return '<div class="g-slide" data-i="' + i + '"><img src="' + TE.esc(u) + '" alt="' + TE.esc(p.title) + " photo " + (i + 1) + '" loading="' + (i ? "lazy" : "eager") + '" data-ph="' + TE.esc(p.type + "|" + p.id) + '"></div>'; }).join("") + "</div>" +
      (photos.length > 1 ? '<button class="g-nav prev" aria-label="Previous photo">&#8249;</button><button class="g-nav next" aria-label="Next photo">&#8250;</button>' : "") +
      '<span class="g-count" id="gCount">1 / ' + photos.length + '</span><button class="g-full" id="gFull" aria-label="Open full screen">&#x26F6;</button></div>' +
      (photos.length > 1 ? '<div class="g-thumbs">' + photos.map(function (u, i) { return '<button class="g-thumb' + (i ? "" : " on") + '" data-i="' + i + '" aria-label="Photo ' + (i + 1) + '"><img src="' + TE.esc(u) + '" alt="" loading="lazy"></button>'; }).join("") + "</div>" : "");
    var track = $("#gTrack");
    function go(i, smooth) {
      idx = (i + photos.length) % photos.length;
      track.scrollTo({ left: idx * track.clientWidth, behavior: smooth === false || TE.reduced ? "auto" : "smooth" });
      mark();
    }
    function mark() {
      $("#gCount").textContent = (idx + 1) + " / " + photos.length;
      TE.$$(".g-thumb", g).forEach(function (t, i) { t.classList.toggle("on", i === idx); });
    }
    track.addEventListener("scroll", TE.debounce(function () {
      var i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      if (i !== idx) { idx = i; mark(); }
    }, 80));
    g.addEventListener("click", function (e) {
      var t = e.target.closest(".g-thumb"), n = e.target.closest(".g-nav");
      if (t) go(+t.getAttribute("data-i"));
      else if (n) go(idx + (n.classList.contains("next") ? 1 : -1));
      else if (e.target.closest("#gFull") || e.target.closest(".g-slide")) openViewer(idx);
    });
    function openViewer(start) {
      var cur = start;
      var v = document.createElement("div");
      v.className = "viewer"; v.setAttribute("role", "dialog"); v.setAttribute("aria-modal", "true"); v.setAttribute("aria-label", "Photo viewer");
      v.innerHTML = '<button class="v-x" aria-label="Close">' + TE.icon.close + '</button><img alt="">' +
        (photos.length > 1 ? '<button class="g-nav prev" aria-label="Previous">&#8249;</button><button class="g-nav next" aria-label="Next">&#8250;</button>' : "") + '<span class="g-count"></span>';
      document.body.appendChild(v);
      var img = v.querySelector("img"), cnt = v.querySelector(".g-count");
      function show() { cur = (cur + photos.length) % photos.length; img.src = photos[cur]; cnt.textContent = (cur + 1) + " / " + photos.length; }
      function close() { v.remove(); document.removeEventListener("keydown", key); idx = cur; go(idx, false); }
      function key(e) { if (e.key === "Escape") close(); else if (e.key === "ArrowLeft") { cur--; show(); } else if (e.key === "ArrowRight") { cur++; show(); } }
      v.addEventListener("click", function (e) {
        if (e.target.closest(".v-x") || e.target === v) close();
        else if (e.target.closest(".prev")) { cur--; show(); } else if (e.target.closest(".next")) { cur++; show(); }
      });
      var x0 = null;
      v.addEventListener("pointerdown", function (e) { x0 = e.clientX; });
      v.addEventListener("pointerup", function (e) { if (x0 === null) return; var dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 50) { cur += dx < 0 ? 1 : -1; show(); } });
      document.addEventListener("keydown", key);
      show();
    }
    window.addEventListener("resize", TE.debounce(function () { go(idx, false); }, 200));
  })();

  /* ---------- price insight ---------- */
  (function () {
    var box = $("#insight");
    if (!ins) {
      box.innerHTML = "<h3>Price insight</h3><p class=\"muted\">There are not enough similar listings yet to compare this price. Ask us for a personal opinion.</p>";
      return;
    }
    var pos = Math.max(4, Math.min(96, 50 + ins.pct * 1.6));
    var cls = ins.level === "below" ? "good" : ins.level === "above" ? "high" : "fair";
    box.innerHTML = "<h3>Price insight</h3>" +
      '<p class="ins-text ' + cls + '">' + (ins.level === "below" ? "&#9660; " : ins.level === "above" ? "&#9650; " : "&#9670; ") + TE.esc(ins.text) + ".</p>" +
      '<div class="gauge"><div class="gauge-bar"></div><div class="gauge-dot ' + cls + '" style="left:' + pos + '%"></div><div class="gauge-labels"><span>Below average</span><span>Average</span><span>Above average</span></div></div>' +
      '<p class="small">Based on ' + ins.n + " similar listings" + (ins.wide ? " across the city" : "") + ". The middle price is " + TE.ppmText({ ppm: ins.median, purpose: p.purpose }) + ". This is a guide only, not a valuation.</p>";
  })();

  /* ---------- instalment estimate (sale only) ---------- */
  (function () {
    var box = $("#emi");
    if (!box) return;
    box.innerHTML = "<h3>Instalment estimate</h3>" +
      '<div class="emi-out"><small>Monthly instalment</small><b id="emiMonthly">-</b></div>' +
      '<div class="three-in"><label><span>Down %</span><input type="number" id="emiDown" min="0" max="90" value="' + set.down + '"></label>' +
      '<label><span>Rate %</span><input type="number" id="emiRate" min="0" max="60" step="0.5" value="' + set.rate + '"></label>' +
      '<label><span>Years</span><input type="number" id="emiYears" min="1" max="30" value="' + set.years + '"></label></div>' +
      '<p class="small" id="emiNote"></p><a class="link-arrow" href="tools.html?price=' + p.price + '#instalment">Open the full calculator</a>';
    function calc() {
      var d = Math.max(0, Math.min(90, +$("#emiDown").value || 0)), r = Math.max(0, +$("#emiRate").value || 0), y = Math.max(1, Math.min(30, +$("#emiYears").value || 1));
      var e = TE.instalment(p.price, d, r, y);
      $("#emiMonthly").textContent = "Rs " + TE.fmt.num(e.monthly);
      $("#emiNote").textContent = "Down payment " + TE.fmt.amount(e.down) + ". Total you pay about " + TE.fmt.amount(e.totalPaid) + ". An estimate only; banks and developers set their own terms.";
    }
    box.addEventListener("input", calc); calc();
  })();

  /* ---------- request a viewing ---------- */
  (function () {
    var box = $("#viewing");
    var slots = []; for (var h = 10; h <= 18; h++) slots.push(("0" + h).slice(-2) + ":00");
    var today = new Date(), pad = function (n) { return n < 10 ? "0" + n : n; };
    var min = today.getFullYear() + "-" + pad(today.getMonth() + 1) + "-" + pad(today.getDate());
    box.innerHTML = '<h3>Request a viewing</h3><p class="small">Free, no obligation. We will call you to confirm.</p>' +
      '<form id="vForm" novalidate>' +
      '<label class="field"><span>Your name</span><input name="name" type="text" maxlength="60" autocomplete="name" required></label>' +
      '<label class="field"><span>Mobile number</span><input name="phone" type="tel" placeholder="03XX-XXXXXXX" required></label>' +
      '<label class="field"><span>Email <i>(optional)</i></span><input name="email" type="email" maxlength="80" autocomplete="email"></label>' +
      '<div class="two-in"><label class="field"><span>Preferred date</span><input name="date" type="date" min="' + min + '"></label>' +
      '<label class="field"><span>Preferred time</span><select name="time"><option value="">Any time</option>' + slots.map(function (s) { return '<option value="' + s + '">' + TE.fmt.clock(s) + "</option>"; }).join("") + "</select></label></div>" +
      '<label class="field"><span>Notes <i>(optional)</i></span><textarea name="notes" rows="2" maxlength="500" placeholder="Anything we should know?"></textarea></label>' +
      '<div class="hp" aria-hidden="true"><label>Leave this empty <input name="hp" tabindex="-1" autocomplete="off"></label></div>' +
      '<div class="actions"><button class="btn btn-primary btn-big" type="submit">Request a viewing</button></div></form>';
    var f = $("#vForm");
    TE.phone.attach(f.phone);
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = f.name.value.trim(), phone = f.phone.value.trim();
      if (name.length < 2) return TE.formError(f, "Please enter your name.", "name");
      if (!TE.phone.valid(phone)) return TE.formError(f, "Please enter a mobile number like 0300-1234567.", "phone");
      var btn = f.querySelector("[type=submit]"); btn.disabled = true; btn.textContent = "Sending...";
      TE.formError(f, "");
      TE.sendLead({ type: "Viewing", name: name, phone: phone, email: f.email.value.trim(), propertyId: p.id, date: f.date.value, time: f.time.value, notes: f.notes.value.trim(), hp: f.hp.value }).then(function (res) {
        if (!res || !res.ok) { btn.disabled = false; btn.textContent = "Request a viewing"; TE.formError(f, (res && res.error) || "Something went wrong. Please try again.", res && res.field); return; }
        TE.thanks(box, { ref: res.ref, type: "Viewing request", name: name, phone: phone, prop: p, when: res.when, notes: f.notes.value.trim(), demo: res.demo, intro: "We have your viewing request for " + p.title + "." });
      }, function () {
        btn.disabled = false; btn.textContent = "Request a viewing";
        TE.formError(f, "We could not send your request. Please check your internet or WhatsApp us directly.");
      });
    });
  })();

  /* ---------- map ---------- */
  (function () {
    var loc = TE.geo.get();
    $("#distLine").innerHTML = loc && p.dist !== null ? TE.icon.pin + " <b>" + TE.fmt.km(p.dist) + "</b> from " + (loc.source === "gps" ? "you" : TE.esc(loc.area)) + "." : "Turn on location on the Browse page to see how far this is from you.";
    if (!window.L) { $("#pmap").innerHTML = '<p class="muted pad">The map could not be loaded.</p>'; return; }
    var m = L.map("pmap", { scrollWheelZoom: false }).setView([p.lat, p.lng], 14);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(m);
    m.on("click", function () { m.scrollWheelZoom.enable(); });
    L.marker([p.lat, p.lng], { icon: L.divIcon({ className: "pin-icon", iconSize: [0, 0], html: '<div class="pin ' + (p.purpose === "Rent" ? "rent" : "sale") + '">' + TE.esc(TE.fmt.pinLabel(p.price, p.purpose)) + "</div>" }) }).addTo(m);
    if (loc) {
      L.marker([loc.lat, loc.lng], { icon: L.divIcon({ className: "me-icon", html: '<div class="me-dot"><i></i></div>', iconSize: [18, 18] }), interactive: false }).addTo(m);
      m.fitBounds([[p.lat, p.lng], [loc.lat, loc.lng]], { padding: [50, 50], maxZoom: 15 });
    }
  })();

  /* ---------- buttons ---------- */
  $("#favBtn").addEventListener("click", function () {
    var on = TE.fav.toggle(p);
    this.classList.toggle("on", on); this.setAttribute("aria-pressed", on); this.querySelector("span").textContent = on ? "Saved" : "Save";
    this.classList.remove("pop"); void this.offsetWidth; if (on) this.classList.add("pop");
    TE.toast(on ? "Saved. We will tell you if the price drops." : "Removed from saved homes.");
  });
  $("#cmpBtn").addEventListener("click", function () {
    var on = TE.cmp.toggle(p.id);
    if (on === false && !TE.cmp.has(p.id) && TE.cmp.ids().length >= 3) return;
    var has = TE.cmp.has(p.id);
    this.classList.toggle("on", has); this.querySelector("span").textContent = has ? "In compare" : "Compare";
  });

  /* ---------- price counter rolls once ---------- */
  var bp = $("#bigPrice");
  if (bp && !TE.reduced) TE.roll(bp, p.price, function (v) { return TE.fmt.price(Math.round(v), p.purpose); }, 1100);

  /* ---------- similar properties ---------- */
  (function () {
    var list = data.props.filter(function (q) { return q.id !== p.id && q.purpose === p.purpose; }).map(function (q) {
      var s = 0;
      if (q.area === p.area) s += 3;
      if (q.type === p.type) s += 2;
      if (Math.abs(q.price - p.price) / p.price <= 0.3) s += 1;
      return { q: q, s: s };
    }).sort(function (a, b) { return b.s - a.s || (a.q.dist !== null && b.q.dist !== null ? a.q.dist - b.q.dist : b.q.added - a.q.added); }).slice(0, 4);
    $("#similar").innerHTML = list.map(function (x) { return TE.card(x.q); }).join("");
  })();
});
