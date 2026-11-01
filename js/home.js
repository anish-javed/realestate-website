/* Home page */
TE.boot("home", function (data) {
  var $ = TE.$, props = data.props, set = data.settings;

  /* hero: photo with a very subtle time-of-day tint */
  TE.art.mountSky($("#hero"));
  $("#tcQuiz").innerHTML = TE.art.icon("Compass");
  $("#tcValue").innerHTML = TE.art.icon("Tag");
  $("#tcEmi").innerHTML = TE.art.icon("Calc");
  $("#whyA").innerHTML = TE.art.icon("Chart");
  $("#whyB").innerHTML = TE.art.icon("Heart");
  $("#whyC").innerHTML = TE.art.icon("Shield");

  /* quick search */
  var form = $("#quick"), qArea = $("#qArea"), qType = $("#qType"), qBudget = $("#qBudget");
  data.areas.forEach(function (a) { qArea.insertAdjacentHTML("beforeend", '<option>' + TE.esc(a.name) + "</option>"); });
  TE.TYPES.forEach(function (t) { qType.insertAdjacentHTML("beforeend", "<option>" + t + "</option>"); });
  function budgets() {
    var purpose = form.purpose.value, presets = TE.PRICE_PRESETS[purpose];
    qBudget.innerHTML = '<option value="">Any budget</option>' + presets.map(function (p, i) { return '<option value="' + i + '">' + p[0] + "</option>"; }).join("");
  }
  budgets();
  TE.$$("input[name=purpose]", form).forEach(function (r) { r.addEventListener("change", budgets); });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var s = TE.search.defaults();
    s.purpose = form.purpose.value;
    if (qArea.value) s.areas = [qArea.value];
    if (qType.value) s.types = [qType.value];
    if (qBudget.value !== "") { var pr = TE.PRICE_PRESETS[s.purpose][+qBudget.value]; s.min = pr[1]; s.max = pr[2]; }
    location.href = "browse.html?" + TE.search.toQuery(s);
  });

  /* welcome back (returning visitors) */
  (function () {
    var box = $("#welcome"), prev = TE.prevVisit, last = TE.store.get("last", null);
    try { if (!prev || sessionStorage.getItem("te_welcomeHide")) return; } catch (e) { if (!prev) return; }
    var fresh = props.filter(function (p) { return p.added > prev; }).length, html;
    if (last && last.qs) {
      var s = TE.search.fromQuery(last.qs);
      var n = props.filter(function (p) { return p.added > prev && TE.search.match(p, s, set.newDays); }).length;
      html = "<b>Welcome back!</b> Last time you were looking at <b>" + TE.esc(TE.search.describe(s)) + "</b>." +
        (n ? " <b>" + n + "</b> new " + (n === 1 ? "home matches" : "homes match") + " since then." : " Nothing new matches yet, but we are adding homes all the time.") +
        ' <a class="link-arrow" href="browse.html?' + TE.esc(last.qs) + '">Pick up where you left off</a>';
    } else {
      html = "<b>Welcome back!</b> " + (fresh ? "<b>" + fresh + "</b> new " + (fresh === 1 ? "home was" : "homes were") + " added since your last visit." : "Have a look around, we add new homes often.") +
        ' <a class="link-arrow" href="browse.html">Browse homes</a>';
    }
    box.innerHTML = '<div class="welcome reveal">' + '<div class="w-text">' + html + '</div><button class="w-x" aria-label="Close">' + TE.icon.close + "</button></div>";
    box.querySelector(".w-x").addEventListener("click", function () { box.innerHTML = ""; try { sessionStorage.setItem("te_welcomeHide", "1"); } catch (e) { /* ignore */ } });
  })();

  /* location banner and the Near you row */
  TE.geo.mount($("#geoBanner"));
  function renderNear() {
    var sec = $("#nearSection"), loc = TE.geo.get();
    if (!loc) { sec.hidden = true; return; }
    var withDist = props.filter(function (p) { return p.dist !== null; }).sort(function (a, b) { return a.dist - b.dist; });
    var inside = withDist.filter(function (p) { return p.dist <= set.radius; });
    var list = (inside.length >= 3 ? inside : withDist).slice(0, 8);
    $("#nearTitle").textContent = inside.length >= 3 ? "Homes within " + set.radius + " km of you" : "The closest homes we have";
    $("#nearRow").innerHTML = list.map(function (p) { return TE.card(p, { roll: true }); }).join("");
    sec.hidden = false;
    TE.rollPrices(sec);
  }
  renderNear();
  document.addEventListener("te:loc", renderNear);

  /* featured and new */
  var feat = props.filter(function (p) { return p.featured; }).sort(function (a, b) { return b.added - a.added; });
  if (feat.length < 3) feat = feat.concat(props.filter(function (p) { return !p.featured && p.verified; }).sort(function (a, b) { return b.added - a.added; })).slice(0, 6);
  $("#featRow").innerHTML = feat.slice(0, 6).map(function (p) { return TE.card(p, { roll: true }); }).join("");
  var fresh = props.filter(function (p) { return TE.isNew(p, set.newDays); }).sort(function (a, b) { return b.added - a.added; });
  if (!fresh.length) { $("#newTitle").textContent = "Latest listings"; fresh = props.slice().sort(function (a, b) { return b.added - a.added; }); }
  $("#newRow").innerHTML = fresh.slice(0, 6).map(function (p) { return TE.card(p, { roll: true }); }).join("");
  TE.rollPrices(document);

  /* numbers */
  var verified = props.filter(function (p) { return p.verified; }).length;
  var stats = [[props.length, "Homes listed"], [data.areas.length, "Areas covered"], [verified, "Verified homes"], [props.filter(function (p) { return TE.isNew(p, set.newDays); }).length, "New in " + set.newDays + " days"]];
  $("#stats").innerHTML = stats.map(function (s) { return '<div class="stat"><b data-roll="' + s[0] + '">0</b><span>' + s[1] + "</span></div>"; }).join("");
});
