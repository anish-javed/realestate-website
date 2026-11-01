/* Browse page: filters, sorting, list and map. Everything runs in the browser on the loaded listings. */
TE.boot("browse", function (data) {
  var $ = TE.$, set = data.settings, props = data.props;
  var S = TE.search.fromQuery(location.search), LIMIT = 24, limit = LIMIT, interacted = false;
  var els = {}, results = [];

  /* ---------- location banner ---------- */
  TE.geo.mount($("#geoBanner"));

  /* ---------- build the filter controls once ---------- */
  function chip(label, on, attr) { return '<button type="button" class="chip' + (on ? " on" : "") + '" ' + attr + ' aria-pressed="' + !!on + '">' + label + "</button>"; }
  $("#fTypes").innerHTML = TE.TYPES.map(function (t) { return chip(t, false, 'data-type="' + t + '"'); }).join("");
  $("#fSizes").innerHTML = TE.SIZE_CHIPS.map(function (c) { return chip(c[1], false, 'data-size="' + c[0] + '"'); }).join("");
  $("#fBeds").innerHTML = [0, 1, 2, 3, 4, 5].map(function (n) { return chip(n ? n + "+" : "Any", false, 'data-beds="' + n + '"'); }).join("");
  $("#fBaths").innerHTML = [0, 1, 2, 3, 4].map(function (n) { return chip(n ? n + "+" : "Any", false, 'data-baths="' + n + '"'); }).join("");
  $("#fAreas").innerHTML = data.areas.map(function (a) { return chip(TE.esc(a.name), false, 'data-area="' + TE.esc(a.name) + '"'); }).join("");
  var TOGGLES = [["furnished", "Furnished"], ["ready", "Ready to move"], ["verified", "Verified only"], ["dropped", "Price dropped"], ["fresh", "Added in last " + set.newDays + " days"]];
  $("#fToggles").innerHTML = TOGGLES.map(function (t) { return chip(t[1], false, 'data-toggle="' + t[0] + '"'); }).join("");
  $("#emptyArt").innerHTML = TE.art.houseOutline("House");

  function sortOptions() {
    var loc = !!TE.geo.get(), cur = S.sort || (loc ? "nearest" : "newest");
    if (cur === "nearest" && !loc) cur = "newest";
    var opts = [["nearest", loc ? "Nearest first" : "Nearest first (turn on location)"], ["newest", "Newest"], ["plow", "Price: low to high"], ["phigh", "Price: high to low"], ["large", "Largest size"], ["ppm", "Lowest price per marla"]];
    $("#sort").innerHTML = opts.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === "nearest" && !loc ? " disabled" : "") + (o[0] === cur ? " selected" : "") + ">" + o[1] + "</option>"; }).join("");
  }

  /* ---------- keep the controls in step with the state ---------- */
  function sliderIndex(max) {
    var steps = TE.PRICE_STEPS[S.purpose];
    if (max === null) return steps.length;
    for (var i = 0; i < steps.length; i++) if (steps[i] >= max) return i;
    return steps.length;
  }
  function updateControls() {
    TE.$$("input[name=fp]").forEach(function (r) { r.checked = r.value === S.purpose; });
    TE.$$("[data-type]").forEach(function (b) { var on = S.types.indexOf(b.getAttribute("data-type")) > -1; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
    TE.$$("[data-size]").forEach(function (b) { var on = S.sizes.indexOf(b.getAttribute("data-size")) > -1; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
    TE.$$("[data-beds]").forEach(function (b) { var on = +b.getAttribute("data-beds") === S.beds; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
    TE.$$("[data-baths]").forEach(function (b) { var on = +b.getAttribute("data-baths") === S.baths; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
    TE.$$("[data-area]").forEach(function (b) { var on = S.areas.indexOf(b.getAttribute("data-area")) > -1; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
    TE.$$("[data-toggle]").forEach(function (b) { var on = !!S[b.getAttribute("data-toggle")]; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
    // price
    var presets = TE.PRICE_PRESETS[S.purpose];
    $("#pPresets").innerHTML = presets.map(function (p, i) { return chip(p[0], S.min === p[1] && S.max === p[2], 'data-preset="' + i + '"'); }).join("");
    var steps = TE.PRICE_STEPS[S.purpose], rng = $("#pRange");
    rng.max = steps.length; rng.value = sliderIndex(S.max);
    $("#priceLabel").textContent = S.max === null ? "(any maximum)" : "(up to " + TE.fmt.price(S.max, S.purpose) + ")";
    if (document.activeElement !== $("#pMin")) $("#pMin").value = S.min === null ? "" : S.min;
    if (document.activeElement !== $("#pMax")) $("#pMax").value = S.max === null ? "" : S.max;
    if (document.activeElement !== $("#sMin")) $("#sMin").value = S.smin === null ? "" : S.smin;
    if (document.activeElement !== $("#sMax")) $("#sMax").value = S.smax === null ? "" : S.smax;
    // radius
    var loc = TE.geo.get();
    $("#radiusGroup").hidden = !loc;
    var ri = S.radius ? TE.geo.RADII.indexOf(S.radius) : 4;
    $("#rRange").value = ri;
    $("#radiusLabel").textContent = S.radius ? "(within " + S.radius + " km)" : "(anywhere)";
    sortOptions();
  }

  /* ---------- active filter chips ---------- */
  function activeChips() {
    var out = [];
    S.types.forEach(function (t) { out.push([t, function () { S.types.splice(S.types.indexOf(t), 1); }]); });
    S.areas.forEach(function (a) { out.push([a, function () { S.areas.splice(S.areas.indexOf(a), 1); }]); });
    if (S.min !== null || S.max !== null) {
      var lbl = S.min !== null && S.max !== null ? TE.fmt.amount(S.min) + " - " + TE.fmt.amount(S.max) : S.max !== null ? "Up to " + TE.fmt.amount(S.max) : "From " + TE.fmt.amount(S.min);
      out.push([lbl, function () { S.min = null; S.max = null; }]);
    }
    S.sizes.forEach(function (k) {
      var l = TE.SIZE_CHIPS.filter(function (c) { return c[0] === k; })[0][1];
      out.push([l, function () { S.sizes.splice(S.sizes.indexOf(k), 1); }]);
    });
    if (S.smin !== null || S.smax !== null) out.push(["Size " + (S.smin !== null ? S.smin : "any") + " - " + (S.smax !== null ? S.smax : "any") + " marla", function () { S.smin = null; S.smax = null; }]);
    if (S.beds) out.push([S.beds + "+ bedrooms", function () { S.beds = 0; }]);
    if (S.baths) out.push([S.baths + "+ bathrooms", function () { S.baths = 0; }]);
    TOGGLES.forEach(function (t) { if (S[t[0]]) out.push([t[1], function () { S[t[0]] = false; }]); });
    if (S.radius) out.push(["Within " + S.radius + " km", function () { S.radius = 0; }]);
    return out;
  }
  var chipActions = [];
  function renderChips() {
    var list = activeChips();
    chipActions = list.map(function (c) { return c[1]; });
    $("#chips").innerHTML = list.map(function (c, i) { return '<button type="button" class="ac" data-rm="' + i + '">' + TE.esc(c[0]) + TE.icon.close + "</button>"; }).join("");
    var n = list.length;
    var pill = $("#filterN"); pill.hidden = !n; pill.textContent = n;
    return n;
  }

  /* ---------- the list (with smooth reordering) ---------- */
  function getEl(p) {
    var el = els[p.id] || (els[p.id] = TE.makeEl(TE.card(p)));
    // a card that was hidden may have missed a heart or compare change: refresh it
    var h = el.querySelector(".heart"), on = TE.fav.has(p.id), c = el.querySelector("input[data-act=cmp]");
    h.classList.toggle("on", on); h.setAttribute("aria-pressed", on);
    c.checked = TE.cmp.has(p.id);
    return el;
  }
  function renderList() {
    var shown = results.slice(0, limit), grid = $("#grid");
    TE.reorder(grid, shown.map(getEl));
    var more = results.length - shown.length;
    $("#moreWrap").innerHTML = more > 0 ? '<button class="btn btn-ghost" id="moreBtn" type="button">Show ' + Math.min(more, LIMIT) + " more homes</button>" : "";
    $("#empty").hidden = results.length > 0;
    grid.hidden = results.length === 0;
  }

  /* ---------- the map ---------- */
  var map = null, markers = {}, layer = null, meMarker = null, meCircle = null, mapShown = false;
  function pinIcon(p) {
    var delay = (parseInt(String(p.id).replace(/\D/g, ""), 10) || 0) % 14 * 30;
    return L.divIcon({ className: "pin-icon", iconSize: [0, 0],
      html: '<div class="pin ' + (p.purpose === "Rent" ? "rent" : "sale") + (p.featured ? " feat" : "") + '" style="animation-delay:' + delay + 'ms">' + TE.esc(TE.fmt.pinLabel(p.price, p.purpose)) + "</div>" });
  }
  function initMap() {
    if (map || !window.L) return;
    map = L.map("map", { scrollWheelZoom: false }).setView([31.48, 74.3], 11);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
    layer = L.layerGroup().addTo(map);
    // the wheel only zooms the map after a click on it, so it never traps page scrolling
    map.on("click", function () { map.scrollWheelZoom.enable(); });
    map.getContainer().addEventListener("mouseleave", function () { map.scrollWheelZoom.disable(); });
    props.forEach(function (p) {
      var m = L.marker([p.lat, p.lng], { icon: pinIcon(p), riseOnHover: true, title: p.title });
      m.bindPopup(function () { return TE.miniCard(p); }, { maxWidth: 300, className: "te-popup" });
      markers[p.id] = m;
    });
  }
  function updateMap(fit) {
    if (!map) return;
    var ids = {};
    results.forEach(function (p) { ids[p.id] = true; });
    props.forEach(function (p) {
      var m = markers[p.id], on = layer.hasLayer(m);
      if (ids[p.id]) { if (!on) layer.addLayer(m); } else if (on) layer.removeLayer(m);
    });
    var loc = TE.geo.get();
    if (meMarker) { map.removeLayer(meMarker); meMarker = null; }
    if (meCircle) { map.removeLayer(meCircle); meCircle = null; }
    if (loc) {
      meMarker = L.marker([loc.lat, loc.lng], { icon: L.divIcon({ className: "me-icon", html: '<div class="me-dot"><i></i></div>', iconSize: [18, 18] }), interactive: false, keyboard: false, zIndexOffset: -500 }).addTo(map);
      if (S.radius) meCircle = L.circle([loc.lat, loc.lng], { radius: S.radius * 1000, color: "#2f6fbd", weight: 1.5, fillColor: "#2f6fbd", fillOpacity: 0.07, interactive: false }).addTo(map);
    }
    if (fit && mapShown) {
      if (meCircle) map.fitBounds(meCircle.getBounds(), { padding: [30, 30], maxZoom: 15 });
      else if (results.length) map.fitBounds(L.latLngBounds(results.map(function (p) { return [p.lat, p.lng]; })), { padding: [40, 40], maxZoom: 15 });
      else if (loc) map.setView([loc.lat, loc.lng], 12);
    }
  }

  /* ---------- apply everything ---------- */
  function apply(fit) {
    results = TE.search.apply(props, S);
    var n = results.length;
    $("#count").innerHTML = "<b>" + n + "</b> " + (n === 1 ? "home" : "homes") + " " + (S.purpose === "Rent" ? "for rent" : "for sale");
    $("#closeCount").textContent = n;
    updateControls();
    renderChips();
    renderList();
    updateMap(fit !== false);
    var qs = TE.search.toQuery(S);
    try { history.replaceState(null, "", "?" + qs); } catch (e) { /* not allowed when opened from a file */ }
    if (interacted || qs !== "purpose=Sale") { if (qs !== "purpose=Sale") TE.store.set("last", { qs: qs, label: TE.search.describe(S), t: Date.now() }); }
    var saved = TE.searches.has(qs), btn = $("#saveSearch");
    btn.textContent = saved ? "Search saved" : "Save this search";
    btn.classList.toggle("is-saved", saved);
  }
  function changed() { interacted = true; limit = LIMIT; apply(); }

  /* ---------- events ---------- */
  var filters = $("#filters");
  filters.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    var v;
    if ((v = b.getAttribute("data-type")) !== null) { toggleIn(S.types, v); }
    else if ((v = b.getAttribute("data-size")) !== null) { toggleIn(S.sizes, v); }
    else if ((v = b.getAttribute("data-area")) !== null) { toggleIn(S.areas, v); }
    else if ((v = b.getAttribute("data-beds")) !== null) { S.beds = +v; }
    else if ((v = b.getAttribute("data-baths")) !== null) { S.baths = +v; }
    else if ((v = b.getAttribute("data-toggle")) !== null) { S[v] = !S[v]; }
    else if ((v = b.getAttribute("data-preset")) !== null) {
      var pr = TE.PRICE_PRESETS[S.purpose][+v];
      if (S.min === pr[1] && S.max === pr[2]) { S.min = null; S.max = null; } else { S.min = pr[1]; S.max = pr[2]; }
    } else return;
    changed();
  });
  function toggleIn(arr, v) { var i = arr.indexOf(v); if (i > -1) arr.splice(i, 1); else arr.push(v); }
  TE.$$("input[name=fp]").forEach(function (r) {
    r.addEventListener("change", function () { if (S.purpose !== r.value) { S.purpose = r.value; S.min = null; S.max = null; changed(); } });
  });
  $("#pRange").addEventListener("input", function () {
    var steps = TE.PRICE_STEPS[S.purpose], v = +this.value;
    S.max = v < steps.length ? steps[v] : null;
    if (S.min !== null && S.max !== null && S.min > S.max) S.min = null;
    changed();
  });
  function priceInput(id, key) {
    var input = $(id);
    input.addEventListener("input", TE.debounce(function () {
      var raw = input.value.trim(), v = TE.parsePrice(raw);
      input.classList.toggle("bad", raw !== "" && v === null);
      if (raw !== "" && v === null) return;
      S[key] = v; changed();
    }, 450));
    input.addEventListener("blur", function () { input.classList.remove("bad"); updateControls(); });
  }
  priceInput("#pMin", "min"); priceInput("#pMax", "max");
  function sizeInput(id, key) {
    $(id).addEventListener("input", TE.debounce(function () { var v = parseFloat(this.value); S[key] = isNaN(v) ? null : Math.max(0, v); changed(); }.bind($(id)), 450));
  }
  sizeInput("#sMin", "smin"); sizeInput("#sMax", "smax");
  $("#rRange").addEventListener("input", function () { var v = +this.value; S.radius = v < 4 ? TE.geo.RADII[v] : 0; changed(); });
  $("#sort").addEventListener("change", function () { S.sort = this.value; changed(); });
  $("#chips").addEventListener("click", function (e) {
    var b = e.target.closest("[data-rm]");
    if (b) { chipActions[+b.getAttribute("data-rm")](); changed(); }
  });
  function reset() { var p = S.purpose; S = TE.search.defaults(); S.purpose = p; changed(); }
  $("#resetBtn").addEventListener("click", reset);
  $("#emptyReset").addEventListener("click", reset);
  $("#moreWrap").addEventListener("click", function (e) { if (e.target.closest("#moreBtn")) { limit += LIMIT; renderList(); } });
  $("#saveSearch").addEventListener("click", function () {
    var qs = TE.search.toQuery(S);
    if (TE.searches.has(qs)) { TE.toast("This search is already saved."); return; }
    TE.searches.add(TE.search.describe(S), qs);
    TE.toast("Search saved. Find it on the Saved page.");
    apply(false);
  });
  $("#openFilters").addEventListener("click", function () { document.body.classList.add("filters-open"); });
  $("#closeFilters").addEventListener("click", function () { document.body.classList.remove("filters-open"); });

  TE.$$("input[name=view]").forEach(function (r) {
    r.addEventListener("change", function () {
      var isMap = r.value === "map" && r.checked;
      if (!r.checked) return;
      $("#listView").hidden = isMap; $("#mapView").hidden = !isMap;
      mapShown = isMap;
      if (isMap) { initMap(); setTimeout(function () { if (map) { map.invalidateSize(); updateMap(true); } }, 60); }
    });
  });
  window.addEventListener("resize", TE.debounce(function () { if (map && mapShown) map.invalidateSize(); }, 200));

  // the visitor's position changed: refresh distances, sorting and the map
  document.addEventListener("te:loc", function () {
    els = {};
    if (!TE.geo.get()) S.radius = 0;
    if (S.sort === "nearest" && !TE.geo.get()) S.sort = "";
    apply();
  });

  apply(false);
});
