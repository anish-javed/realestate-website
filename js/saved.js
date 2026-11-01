/* Saved page: hearts, price-drop alerts, saved searches, new homes since the last visit, compare, recently viewed. */
TE.boot("saved", function (data) {
  var $ = TE.$, props = data.props, set = data.settings, prev = TE.prevVisit;

  function render() {
    var favIds = TE.fav.ids(), favs = TE.fav.all(), searches = TE.searches.list();
    var newAll = prev ? props.filter(function (p) { return p.added > prev; }) : [];

    /* summary tiles */
    var tiles = [[favIds.length, "Saved homes"], [searches.length, "Saved searches"]];
    $("#tiles").innerHTML = tiles.map(function (t) { return '<div class="tile"><b data-roll="' + t[0] + '">0</b><span>' + t[1] + "</span></div>"; }).join("") +
      '<div class="tile accent"><b data-roll="' + newAll.length + '">0</b><span>' + (prev ? "New homes since your last visit (" + TE.esc(TE.fmt.ago(prev)) + ")" : "New homes since your last visit") + "</span>" +
      (prev ? "" : "<small>This is your first visit here. Next time we will count what is new.</small>") + "</div>";
    TE.rollAll($("#tiles"));

    /* price-drop alerts on saved homes */
    var drops = TE.fav.drops();
    $("#alerts").innerHTML = drops.length ? '<div class="alert-box reveal in"><h2>' + TE.icon.heart + " Price drop" + (drops.length > 1 ? "s" : "") + " on your saved homes</h2>" +
      drops.map(function (d) {
        return '<a class="alert-row" href="property.html?id=' + encodeURIComponent(d.p.id) + '"><div><b>' + TE.esc(d.p.title) + "</b><small>" + TE.esc(d.p.area) + "</small></div>" +
          '<div class="alert-price"><s>' + TE.fmt.price(d.was, d.p.purpose) + "</s> <b>" + TE.fmt.price(d.now, d.p.purpose) + '</b><span class="badge b-drop">Save ' + TE.fmt.amount(d.was - d.now) + "</span></div></a>";
      }).join("") + "</div>" : "";

    /* saved homes */
    var cards = [];
    favIds.forEach(function (id) {
      var p = data.byId[id];
      if (p) cards.push(TE.card(p));
      else cards.push('<article class="card gone"><div class="card-body"><span class="badge b-plain">No longer available</span><h3>' + TE.esc(id) + '</h3><p class="small">This home was sold, rented or taken off our list.</p>' +
        '<button class="btn btn-small btn-ghost" data-rmfav="' + TE.esc(id) + '" type="button">Remove</button></div></article>');
    });
    $("#favGrid").innerHTML = cards.join("");
    $("#favEmpty").hidden = favIds.length > 0;
    $("#favArt").innerHTML = TE.art.houseOutline("House");

    /* saved searches: how many homes match now, and how many are new */
    $("#searchList").innerHTML = searches.length ? searches.map(function (s) {
      var st = TE.search.fromQuery(s.qs), now = props.filter(function (p) { return TE.search.match(p, st, set.newDays); });
      var fresh = prev ? now.filter(function (p) { return p.added > prev; }).length : 0;
      return '<div class="search-row"><div><b>' + TE.esc(s.name) + "</b><small>" + now.length + (now.length === 1 ? " home" : " homes") + " now" +
        (prev ? ' &middot; <span class="' + (fresh ? "new-n" : "") + '">' + fresh + " new since your last visit</span>" : "") + "</small></div>" +
        '<div class="sr-actions"><a class="btn btn-small btn-primary" href="browse.html?' + TE.esc(s.qs) + '">Open</a><button class="btn btn-small btn-ghost" data-rmsearch="' + TE.esc(s.id) + '" type="button">Delete</button></div></div>';
    }).join("") : '<div class="note-card"><p>No saved searches yet. On the Browse page, set your filters and tap <b>Save this search</b>. We will count the new matches each time you come back.</p><a class="btn btn-ghost" href="browse.html">Go to Browse</a></div>';

    /* compare */
    renderCompare();

    /* recently viewed (leave out ones already saved so the page stays short) */
    var rec = TE.recent.ids().map(function (id) { return data.byId[id]; }).filter(Boolean).slice(0, 6);
    $("#recentSection").hidden = !rec.length;
    $("#recentGrid").innerHTML = rec.map(function (p) { return TE.card(p); }).join("");
  }

  function renderCompare() {
    var ids = TE.cmp.ids().filter(function (id) { return data.byId[id]; });
    $("#clearCmp").hidden = !ids.length;
    $("#compareBody").innerHTML = ids.length >= 2 ? TE.compareHtml(ids) :
      '<div class="note-card"><p>' + (ids.length === 1 ? "You picked 1 home. Pick one or two more with the <b>Compare</b> tick on any card." : "Tick <b>Compare</b> on up to 3 homes, then see them side by side here.") + '</p><a class="btn btn-ghost" href="browse.html">Find homes to compare</a></div>';
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-rmfav]"), b = e.target.closest("[data-rmsearch]");
    if (a) { var f = TE.fav.all(); delete f[a.getAttribute("data-rmfav")]; TE.store.set("favs", f); TE.updateBadges(); render(); }
    if (b) { TE.searches.remove(b.getAttribute("data-rmsearch")); render(); }
  });
  $("#clearCmp").addEventListener("click", function () { TE.cmp.clear(); });
  document.addEventListener("te:cmp", renderCompare);
  // hearts: re-draw so a removed home disappears
  document.addEventListener("te:fav", function () { setTimeout(render, 250); });

  render();
});
