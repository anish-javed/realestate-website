/* Area guides and the Area Match quiz */
TE.boot("areas", function (data) {
  var $ = TE.$;
  var OUTLINES = ["House", "Flat", "Plot", "Commercial", "Farmhouse"];
  var stats = {};
  data.areas.forEach(function (a) { stats[a.name] = TE.areaStats(a.name); });

  /* ---------- area cards ---------- */
  function meter(label, v) {
    var dots = ""; for (var i = 1; i <= 5; i++) dots += '<i class="' + (i <= v ? "on" : "") + '"></i>';
    return '<div class="meter"><span>' + label + '</span><div class="dots" role="img" aria-label="' + label + ": " + v + ' out of 5">' + dots + "</div></div>";
  }
  function areaCard(a, i) {
    var s = stats[a.name], purpose = s.sale >= s.rent ? "Sale" : "Rent";
    return '<article class="area-card reveal" id="a-' + TE.esc(a.name.replace(/\W+/g, "-").toLowerCase()) + '">' +
      '<div class="ac-art">' + TE.art.houseOutline(OUTLINES[i % OUTLINES.length]) + "</div>" +
      "<h3>" + TE.esc(a.name) + "</h3><p class=\"desc\">" + TE.esc(a.desc) + "</p>" +
      '<div class="ac-stats"><div><small>Average price per marla</small><b>' + (s.avgPpm ? TE.fmt.amount(s.avgPpm) : "n/a") + "</b>" + (s.avgPpm ? "<small>" + s.basis + " for sale</small>" : "") + "</div>" +
      "<div><small>Listings</small><b>" + s.count + "</b><small>" + s.sale + " sale &middot; " + s.rent + " rent</small></div></div>" +
      '<div class="meters">' + meter("Family", a.family) + meter("Budget-friendly", a.budget) + meter("Investment", a.investment) + meter("Central", a.central) + "</div>" +
      (a.highlights.length ? '<div class="chips static">' + a.highlights.map(function (h) { return '<span class="chip on-soft">' + TE.esc(h) + "</span>"; }).join("") + "</div>" : "") +
      '<a class="btn btn-primary" href="browse.html?purpose=' + purpose + "&area=" + encodeURIComponent(a.name) + '">See homes here</a></article>';
  }
  function renderAreas() {
    var mode = $("#aSort").value, list = data.areas.slice();
    list.sort(function (a, b) {
      if (mode === "count") return stats[b.name].count - stats[a.name].count;
      if (mode === "cheap") return (stats[a.name].avgPpm || 1e15) - (stats[b.name].avgPpm || 1e15);
      if (mode === "dear") return (stats[b.name].avgPpm || 0) - (stats[a.name].avgPpm || 0);
      return a.name.localeCompare(b.name);
    });
    $("#areaGrid").innerHTML = list.map(areaCard).join("");
    TE.reveal($("#areaGrid"));
  }
  $("#aSort").addEventListener("change", renderAreas);
  renderAreas();

  /* ---------- the quiz ---------- */
  var step = 0, answers = [[], [], [], []], body = $("#quizBody");
  function progress() {
    var d = ""; for (var i = 0; i < TE.QUIZ.length; i++) d += '<i class="' + (i < step ? "done" : i === step ? "now" : "") + '"></i>';
    return '<div class="q-progress" aria-label="Question ' + (step + 1) + " of " + TE.QUIZ.length + '">' + d + "</div>";
  }
  function renderQuestion() {
    var q = TE.QUIZ[step], sel = answers[step];
    body.innerHTML = progress() + '<h3 class="q-title">' + (step + 1) + ". " + TE.esc(q.q) + "</h3>" +
      '<div class="q-opts" role="' + (q.multi ? "group" : "radiogroup") + '">' + q.opts.map(function (o, i) {
        return '<button type="button" class="q-opt' + (sel.indexOf(i) > -1 ? " on" : "") + '" data-i="' + i + '" aria-pressed="' + (sel.indexOf(i) > -1) + '">' + TE.esc(o[0]) + "</button>";
      }).join("") + "</div>" +
      '<div class="q-nav">' + (step ? '<button class="btn btn-ghost" id="qBack" type="button">Back</button>' : "<span></span>") +
      '<button class="btn btn-primary" id="qNext" type="button"' + (sel.length ? "" : " disabled") + ">" + (step === TE.QUIZ.length - 1 ? "Show my areas" : "Next") + "</button></div>";
  }
  body.addEventListener("click", function (e) {
    var o = e.target.closest(".q-opt");
    if (o) {
      var i = +o.getAttribute("data-i"), q = TE.QUIZ[step], sel = answers[step], at = sel.indexOf(i);
      if (q.multi) { if (at > -1) sel.splice(at, 1); else { if (sel.length >= 2) sel.shift(); sel.push(i); } } else answers[step] = [i];
      renderQuestion();
      if (!q.multi) { var nx = $("#qNext"); if (nx) nx.focus(); }
      return;
    }
    if (e.target.closest("#qNext")) { if (step < TE.QUIZ.length - 1) { step++; renderQuestion(); } else renderResult(); }
    else if (e.target.closest("#qBack")) { step--; renderQuestion(); }
    else if (e.target.closest("#qAgain")) { step = 0; answers = [[], [], [], []]; renderQuestion(); }
  });
  function renderResult() {
    var res = TE.quizScore(answers), word = res.purpose === "Rent" ? "rent" : "sale";
    body.innerHTML = '<div class="q-result"><h3>Your top 3 areas</h3><p class="muted">Matched against the Family, Budget, Investment and Central scores of every area. Counts are live listings for ' + word + ".</p>" +
      '<div class="res-grid">' + res.top.map(function (r, i) {
        var a = r.area;
        return '<article class="res-card" style="--i:' + i + '"><span class="rank">' + (i + 1) + "</span><h4>" + TE.esc(a.name) + "</h4>" +
          '<div class="match"><div class="match-bar"><i style="width:' + r.pct + '%"></i></div><b>' + r.pct + "% match</b></div>" +
          "<p>" + TE.esc(a.desc) + "</p><p class=\"count\"><b>" + r.count + "</b> " + (r.count === 1 ? "home" : "homes") + " for " + word + " right now</p>" +
          '<a class="btn btn-primary" href="browse.html?purpose=' + res.purpose + "&area=" + encodeURIComponent(a.name) + '">See homes here</a></article>';
      }).join("") + '</div><button class="btn btn-ghost" id="qAgain" type="button">Take the quiz again</button></div>';
  }
  renderQuestion();
});
