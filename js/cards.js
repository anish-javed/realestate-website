/* Property cards, hearts, compare ticks, the compare table and smooth card reordering. */
(function () {
  var TE = (window.TE = window.TE || {});

  function ppmText(p) {
    if (!p.ppm) return "";
    return p.purpose === "Rent" ? "Rs " + TE.fmt.num(p.ppm) + " per marla / month" : TE.fmt.amount(p.ppm) + " per marla";
  }
  TE.ppmText = ppmText;

  TE.media = function (p, big) { // a photo, or a drawn placeholder when there is none
    var photo = p.photos[0];
    if (!photo) return TE.art.placeholder(p.type, p.id);
    return '<img src="' + TE.esc(photo) + '" alt="' + TE.esc(p.title) + '" loading="' + (big ? "eager" : "lazy") + '" decoding="async" data-ph="' + TE.esc(p.type + "|" + p.id) + '">';
  };
  // a photo that fails to load turns into the drawing
  document.addEventListener("error", function (e) {
    var t = e.target;
    if (t && t.tagName === "IMG" && t.getAttribute("data-ph")) {
      var parts = t.getAttribute("data-ph").split("|");
      var wrap = document.createElement("div"); wrap.innerHTML = TE.art.placeholder(parts[0], parts[1]);
      if (t.parentNode) t.parentNode.replaceChild(wrap.firstChild, t);
    }
  }, true);

  TE.badges = function (p) {
    var b = [];
    if (p.featured) b.push('<span class="badge b-feat">Featured</span>');
    if (p.verified) b.push('<span class="badge b-ver">' + TE.icon.check + "Verified</span>");
    if (p.dropped) b.push('<span class="badge b-drop">Price dropped ' + p.dropPct + "%</span>");
    if (TE.isNew(p, TE.data.settings.newDays)) b.push('<span class="badge b-new">New</span>');
    return b.join("");
  };

  TE.card = function (p, opts) {
    opts = opts || {};
    var size = TE.sizeText(p), saved = TE.fav.has(p.id), cmp = TE.cmp.has(p.id), dist = TE.geo.label(p);
    var href = "property.html?id=" + encodeURIComponent(p.id);
    var specs = '<li title="Size">' + TE.icon.area + "<b>" + size.main + "</b> <small>" + size.alt + "</small></li>";
    if (p.beds) specs += '<li title="Bedrooms">' + TE.icon.bed + "<b>" + p.beds + "</b></li>";
    if (p.baths) specs += '<li title="Bathrooms">' + TE.icon.bath + "<b>" + p.baths + "</b></li>";
    return '<article class="card" data-id="' + TE.esc(p.id) + '" data-purpose="' + p.purpose + '">' +
      '<a class="card-media" href="' + href + '" aria-label="View ' + TE.esc(p.title) + '">' +
      '<div class="media-inner">' + TE.media(p) + "</div>" +
      '<div class="badges">' + TE.badges(p) + "</div>" +
      '<span class="ribbon ' + p.purpose.toLowerCase() + '">For ' + p.purpose.toLowerCase() + "</span>" +
      (dist ? '<span class="dist">' + TE.icon.pin + TE.esc(dist) + "</span>" : "") + "</a>" +
      '<button class="heart' + (saved ? " on" : "") + '" data-act="fav" data-id="' + TE.esc(p.id) + '" aria-pressed="' + saved + '" aria-label="Save this home">' + TE.icon.heart + "</button>" +
      '<label class="cmp-tick"><input type="checkbox" data-act="cmp" data-id="' + TE.esc(p.id) + '"' + (cmp ? " checked" : "") + ' aria-label="Add to compare"><span>Compare</span></label>' +
      '<div class="card-body"><div class="price-row"><span class="price"' + (opts.roll ? ' data-rollprice="' + p.price + '" data-purpose="' + p.purpose + '"' : "") + ">" + TE.fmt.price(p.price, p.purpose) + "</span>" +
      (p.oldPrice ? '<s class="old">' + TE.fmt.price(p.oldPrice, p.purpose) + "</s>" : "") + "</div>" +
      '<div class="ppm">' + ppmText(p) + "</div>" +
      '<h3><a href="' + href + '">' + TE.esc(p.title) + "</a></h3>" +
      '<p class="loc">' + TE.icon.pin + TE.esc(p.area) + (p.address ? " &middot; " + TE.esc(p.address) : "") + "</p>" +
      '<ul class="specs">' + specs + "</ul></div></article>";
  };

  // small card used inside map popups
  TE.miniCard = function (p) {
    var size = TE.sizeText(p), href = "property.html?id=" + encodeURIComponent(p.id), dist = TE.geo.label(p);
    return '<a class="mini" href="' + href + '"><div class="mini-img">' + TE.media(p) + "</div><div class=\"mini-body\"><b>" + TE.fmt.price(p.price, p.purpose) + "</b>" +
      "<span>" + TE.esc(p.title) + "</span><small>" + size.main + (p.beds ? " &middot; " + p.beds + " bed" : "") + " &middot; " + TE.esc(p.area) + (dist ? " &middot; " + TE.esc(dist) : "") + "</small></div></a>";
  };

  TE.makeEl = function (html) { var d = document.createElement("div"); d.innerHTML = html; return d.firstElementChild; };

  // price numbers that roll once when they scroll into view
  TE.rollPrices = function (ctx) {
    var els = TE.$$("[data-rollprice]", ctx);
    if (!els.length) return;
    function go(el) { var purpose = el.getAttribute("data-purpose"); TE.roll(el, +el.getAttribute("data-rollprice"), function (v) { return TE.fmt.price(Math.round(v), purpose); }, 1000); }
    if (!("IntersectionObserver" in window) || TE.reduced) { return; }
    var io = new IntersectionObserver(function (list) { list.forEach(function (en) { if (en.isIntersecting) { io.unobserve(en.target); go(en.target); } }); }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  };

  /* ---------- hearts and compare ticks (works for every card on the page) ---------- */
  document.addEventListener("click", function (e) {
    var h = e.target.closest ? e.target.closest("[data-act=fav]") : null;
    if (!h || !TE.data) return;
    e.preventDefault(); e.stopPropagation();
    var p = TE.data.byId[h.getAttribute("data-id")];
    if (!p) return;
    var on = TE.fav.toggle(p);
    h.classList.remove("pop"); void h.offsetWidth; if (on) h.classList.add("pop");
    TE.toast(on ? "Saved. We will tell you if the price drops." : "Removed from saved homes.");
  });
  document.addEventListener("change", function (e) {
    var c = e.target.closest ? e.target.closest("input[data-act=cmp]") : null;
    if (!c) return;
    var ok = TE.cmp.toggle(c.getAttribute("data-id"));
    if (ok === false && c.checked) c.checked = false;
  });
  function sync() {
    TE.$$(".heart[data-id]").forEach(function (h) { var on = TE.fav.has(h.getAttribute("data-id")); h.classList.toggle("on", on); h.setAttribute("aria-pressed", on); });
    TE.$$("input[data-act=cmp]").forEach(function (c) { c.checked = TE.cmp.has(c.getAttribute("data-id")); });
  }
  document.addEventListener("te:fav", sync);
  document.addEventListener("te:cmp", sync);

  /* ---------- smooth card reordering (FLIP) ---------- */
  TE.reorder = function (grid, els) {
    var first = {}, kids = Array.prototype.slice.call(grid.children);
    var animate = !TE.reduced;
    if (animate) kids.forEach(function (el) { first[el.getAttribute("data-id")] = el.getBoundingClientRect(); });
    var frag = document.createDocumentFragment();
    els.forEach(function (el) { frag.appendChild(el); });
    while (grid.firstChild) grid.removeChild(grid.firstChild);
    grid.appendChild(frag);
    if (!animate) return;
    var moved = [], n = 0;
    els.forEach(function (el) {
      if (n++ > 48) return;
      var id = el.getAttribute("data-id"), f = first[id];
      el.style.transition = "none";
      el.style.transitionDelay = "0ms";
      if (f) {
        var l = el.getBoundingClientRect(), dx = f.left - l.left, dy = f.top - l.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) { el.style.transition = ""; return; }
        el.style.transform = "translate(" + dx + "px," + dy + "px)";
      } else { // a card that was not on screen before: fade up, one after the other
        el.style.opacity = "0"; el.style.transform = "translateY(16px) scale(.98)";
        el.setAttribute("data-delay", Math.min(n * 28, 420));
      }
      moved.push(el);
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        moved.forEach(function (el) {
          el.style.transition = "transform .5s cubic-bezier(.2,.8,.2,1), opacity .4s ease";
          el.style.transitionDelay = (el.getAttribute("data-delay") || 0) + "ms";
          el.removeAttribute("data-delay");
          el.style.transform = ""; el.style.opacity = "";
          setTimeout(function () { el.style.transition = ""; el.style.transitionDelay = ""; }, 1100);
        });
      });
    });
  };

  /* ---------- compare table ---------- */
  TE.compareHtml = function (ids) {
    var list = ids.map(function (id) { return TE.data.byId[id]; }).filter(Boolean);
    if (!list.length) return "";
    function best(fn, low) {
      var vals = list.map(fn).filter(function (v) { return v !== null && v !== undefined && !isNaN(v); });
      if (vals.length < 2) return null;
      return low ? Math.min.apply(null, vals) : Math.max.apply(null, vals);
    }
    var bp = best(function (p) { return p.price; }, true), bm = best(function (p) { return p.ppm; }, true), bs = best(function (p) { return p.marla; }, false);
    function row(label, fn) { return "<tr><th scope=\"row\">" + label + "</th>" + list.map(function (p) { return "<td" + (fn.cls ? fn.cls(p) : "") + ">" + fn(p) + "</td>"; }).join("") + "</tr>"; }
    function tick(v) { return v ? "Yes" : "No"; }
    var priceRow = function (p) { return "<b>" + TE.fmt.price(p.price, p.purpose) + "</b>" + (p.dropped ? "<br><small class=\"drop\">Dropped " + p.dropPct + "%</small>" : ""); };
    priceRow.cls = function (p) { return p.price === bp ? ' class="best"' : ""; };
    var ppmRow = function (p) { return ppmText(p) || "-"; };
    ppmRow.cls = function (p) { return p.ppm && p.ppm === bm ? ' class="best"' : ""; };
    var sizeRow = function (p) { var s = TE.sizeText(p); return s.main + "<br><small>" + s.alt + "</small>"; };
    sizeRow.cls = function (p) { return p.marla === bs ? ' class="best"' : ""; };
    var head = "<tr><th></th>" + list.map(function (p) {
      return '<td class="cmp-head"><button class="cmp-x" data-id="' + TE.esc(p.id) + '" aria-label="Remove from compare">' + TE.icon.close + "</button>" +
        '<a href="property.html?id=' + encodeURIComponent(p.id) + '"><div class="cmp-img">' + TE.media(p) + "</div><b>" + TE.esc(p.title) + "</b></a></td>";
    }).join("") + "</tr>";
    return '<div class="cmp-wrap"><table class="cmp-table">' + head +
      row("Price", priceRow) + row("Price per marla", ppmRow) + row("Size", sizeRow) +
      row("Type", function (p) { return p.type + " for " + p.purpose.toLowerCase(); }) +
      row("Area", function (p) { return TE.esc(p.area); }) +
      row("Bedrooms", function (p) { return p.beds || "-"; }) + row("Bathrooms", function (p) { return p.baths || "-"; }) +
      row("Furnished", function (p) { return tick(p.furnished); }) + row("Ready to move", function (p) { return tick(p.ready); }) + row("Verified", function (p) { return tick(p.verified); }) +
      row("Features", function (p) { return p.features.length ? p.features.map(TE.esc).join(", ") : "-"; }) +
      row("Added", function (p) { return p.added ? TE.fmt.ago(p.added) : "-"; }) +
      "</table></div><p class=\"small\">Green cells are the lowest price, lowest price per marla and biggest size.</p>";
  };
  TE.openCompare = function () {
    var ids = TE.cmp.ids().filter(function (id) { return TE.data && TE.data.byId[id]; });
    if (ids.length < 2) { TE.toast("Pick at least 2 homes to compare."); return; }
    TE.modal.open("<h2>Compare homes</h2><div id=\"cmpBody\"></div>", "wide");
    function fill() {
      var body = TE.$("#cmpBody");
      if (!body) { document.removeEventListener("te:cmp", fill); return; }
      var cur = TE.cmp.ids().filter(function (id) { return TE.data.byId[id]; });
      body.innerHTML = cur.length >= 2 ? TE.compareHtml(cur) : "<p>Pick at least 2 homes to compare.</p>";
    }
    document.addEventListener("te:cmp", fill);
    fill();
  };
  document.addEventListener("click", function (e) {
    var x = e.target.closest ? e.target.closest(".cmp-x") : null;
    if (x) { e.preventDefault(); TE.cmp.toggle(x.getAttribute("data-id")); }
  });
})();
