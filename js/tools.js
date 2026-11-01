/* Tools page: Value My Property and the instalment calculator */
TE.boot("tools", function (data) {
  var $ = TE.$, set = data.settings;

  /* ---------- tabs ---------- */
  function showTab(name) {
    ["value", "instalment"].forEach(function (t) {
      var on = t === name;
      $("#panel" + (t === "value" ? "Value" : "Emi")).hidden = !on;
      var tab = $("#tab" + (t === "value" ? "Value" : "Emi"));
      tab.classList.toggle("on", on); tab.setAttribute("aria-selected", on);
    });
  }
  TE.$$(".tab").forEach(function (t) {
    t.addEventListener("click", function () { var n = t.getAttribute("data-tab"); showTab(n); try { history.replaceState(null, "", "#" + n); } catch (e) { /* file */ } });
  });
  showTab(location.hash === "#instalment" ? "instalment" : "value");
  window.addEventListener("hashchange", function () { showTab(location.hash === "#instalment" ? "instalment" : "value"); });

  /* ---------- Value My Property ---------- */
  var f = $("#valForm"), loc = TE.geo.get();
  $("#vType").innerHTML = TE.TYPES.map(function (t) { return "<option>" + t + "</option>"; }).join("");
  $("#vArea").innerHTML = data.areas.map(function (a) { return "<option" + (loc && loc.area === a.name ? " selected" : "") + ">" + TE.esc(a.name) + "</option>"; }).join("");
  $("#valArt").innerHTML = TE.art.houseOutline("House");
  $("#vType").addEventListener("change", function () { // flats are usually measured in sq ft
    $("#vUnit").value = this.value === "Flat" ? "Sq Ft" : (this.value === "Farmhouse" ? "Kanal" : "Marla");
    $("#vSize").value = this.value === "Flat" ? 1100 : (this.value === "Farmhouse" ? 1 : 5);
  });

  var lastEstimate = null;
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var size = parseFloat($("#vSize").value);
    var box = $("#valResult");
    if (!(size > 0)) { box.innerHTML = '<p class="form-error" role="alert">Please enter the size of your property.</p>'; return; }
    var o = { purpose: f.purpose.value, type: $("#vType").value, area: $("#vArea").value, size: size, unit: $("#vUnit").value };
    o.marla = TE.toMarla(o.size, o.unit);
    var v = TE.valuation(o);
    var sizeLbl = o.unit === "Sq Ft" ? TE.fmt.num(o.size) + " sq ft" : o.size + " " + o.unit.toLowerCase();
    if (!v.ok) {
      lastEstimate = null;
      box.innerHTML = "<h3>We need a closer look</h3><p>We do not have enough similar " + TE.pluralType(o.type) + " listed right now (only " + v.n + ") to give a fair range. Send us your details below and we will value it for you, free.</p>";
    } else {
      lastEstimate = { low: v.low, mid: v.mid, high: v.high, o: o, text: TE.fmt.price(v.low, o.purpose) + " to " + TE.fmt.price(v.high, o.purpose) };
      box.innerHTML = '<p class="eyebrow">Indicative ' + (o.purpose === "Rent" ? "monthly rent" : "price") + "</p>" +
        '<div class="est-range"><b id="estLow">-</b><span>to</span><b id="estHigh">-</b></div>' +
        '<div class="est-bar"><i></i><em></em></div>' +
        '<p class="est-note">For a ' + TE.esc(sizeLbl) + " " + TE.typeWord(o.type) + " in " + TE.esc(o.area) + ". " +
        (v.wide ? "<b>Only " + v.localN + " similar " + (v.localN === 1 ? "listing is" : "listings are") + " in " + TE.esc(o.area) + ", so this uses all " + v.n + " similar " + TE.pluralType(o.type) + " in Lahore.</b> " : "Based on " + v.n + " similar listings in " + TE.esc(o.area) + ". ") +
        "Middle price per marla used: " + TE.fmt.amount(v.ppm) + ". The range is plus or minus 15%.</p>" +
        '<p class="disclaimer"><b>This is an estimate only.</b> It is not a formal valuation. Condition, street, corner position, legal status and the market on the day all change the real price.</p>';
      TE.roll($("#estLow"), v.low, function (x) { return TE.fmt.price(Math.round(x), o.purpose); }, 1000);
      TE.roll($("#estHigh"), v.high, function (x) { return TE.fmt.price(Math.round(x), o.purpose); }, 1000);
    }
    showLeadForm(o);
    box.scrollIntoView({ behavior: TE.reduced ? "auto" : "smooth", block: "nearest" });
  });

  function showLeadForm(o) {
    var box = $("#valLead");
    box.hidden = false;
    box.innerHTML = "<h3>Get a free valuation</h3><p class=\"muted small\">Optional. One of our agents will look at your property details and call you with a proper opinion.</p>" +
      '<form id="vlForm" novalidate>' +
      '<label class="field"><span>Your name</span><input name="name" type="text" maxlength="60" autocomplete="name"></label>' +
      '<label class="field"><span>Mobile number</span><input name="phone" type="tel" placeholder="03XX-XXXXXXX"></label>' +
      '<label class="field"><span>Email <i>(optional)</i></span><input name="email" type="email" maxlength="80" autocomplete="email"></label>' +
      '<label class="field"><span>Notes <i>(optional)</i></span><textarea name="notes" rows="2" maxlength="500" placeholder="Address, condition, anything useful"></textarea></label>' +
      '<div class="hp" aria-hidden="true"><label>Leave this empty <input name="hp" tabindex="-1" autocomplete="off"></label></div>' +
      '<div class="actions"><button class="btn btn-primary btn-big" type="submit">Get a free valuation</button></div></form>';
    var vl = $("#vlForm");
    TE.phone.attach(vl.phone);
    vl.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = vl.name.value.trim(), phone = vl.phone.value.trim();
      if (name.length < 2) return TE.formError(vl, "Please enter your name.", "name");
      if (!TE.phone.valid(phone)) return TE.formError(vl, "Please enter a mobile number like 0300-1234567.", "phone");
      var btn = vl.querySelector("[type=submit]"); btn.disabled = true; btn.textContent = "Sending...";
      TE.formError(vl, "");
      var fields = { purpose: o.purpose, ptype: o.type, area: o.area, size: o.size, unit: o.unit, price: lastEstimate ? Math.round(lastEstimate.mid) : "", estimate: lastEstimate ? lastEstimate.text : "No estimate (not enough listings)" };
      TE.sendLead({ type: "Valuation", name: name, phone: phone, email: vl.email.value.trim(), notes: vl.notes.value.trim(), fields: fields, hp: vl.hp.value }).then(function (res) {
        if (!res || !res.ok) { btn.disabled = false; btn.textContent = "Get a free valuation"; TE.formError(vl, (res && res.error) || "Something went wrong. Please try again.", res && res.field); return; }
        TE.thanks(box, { ref: res.ref, type: "Free valuation", name: name, phone: phone, notes: vl.notes.value.trim(), demo: res.demo,
          intro: "We have your valuation request.",
          lines: ["Property: " + o.purpose.replace("Sale", "For sale").replace("Rent", "For rent") + ", " + o.type + ", " + o.area + ", " + o.size + " " + o.unit,
            "Website estimate: " + (lastEstimate ? lastEstimate.text : "none")] });
      }, function () {
        btn.disabled = false; btn.textContent = "Get a free valuation";
        TE.formError(vl, "We could not send your request. Please check your internet or WhatsApp us directly.");
      });
    });
  }

  /* ---------- Instalment calculator ---------- */
  var qs = new URLSearchParams(location.search), startPrice = parseFloat(qs.get("price"));
  if (startPrice > 0) $("#ePrice").value = Math.round(startPrice);
  $("#eDown").value = Math.min(90, set.down); $("#eRate").value = set.rate; $("#eYears").value = set.years;
  var shown = null;
  function emi(first) {
    var price = TE.parsePrice($("#ePrice").value), box = $("#emiResult");
    var d = Math.max(0, Math.min(90, +$("#eDown").value || 0)), r = Math.max(0, +$("#eRate").value || 0), y = Math.max(1, Math.min(30, +$("#eYears").value || 1));
    $("#eDownLbl").textContent = d + "%" + (price ? " (" + TE.fmt.amount(price * d / 100) + ")" : "");
    if (!price || price < 100000) { box.innerHTML = '<p class="muted">Type a property price, like <b>2.5 cr</b> or <b>85 lakh</b>.</p>'; shown = null; return; }
    var e = TE.instalment(price, d, r, y), total = e.totalPaid;
    box.innerHTML = '<p class="eyebrow">Monthly instalment</p><div class="est-big"><b id="eMonthly">-</b><span>per month for ' + y + " years</span></div>" +
      '<div class="split-bar" aria-hidden="true"><i class="s-down" style="width:' + (e.down / total * 100) + '%"></i><i class="s-loan" style="width:' + (e.loan / total * 100) + '%"></i><i class="s-int" style="width:' + (e.interest / total * 100) + '%"></i></div>' +
      '<ul class="legend"><li><i class="s-down"></i>Down payment <b>' + TE.fmt.amount(e.down) + '</b></li><li><i class="s-loan"></i>Loan amount <b>' + TE.fmt.amount(e.loan) + '</b></li><li><i class="s-int"></i>Total interest <b>' + TE.fmt.amount(e.interest) + "</b></li></ul>" +
      '<div class="est-total"><span>Total you pay</span><b>' + TE.fmt.amount(total) + "</b></div>" +
      '<p class="disclaimer"><b>This is an estimate only.</b> Banks and developers set their own rates, fees and rules. Ask us for the real terms of a specific property.</p>';
    var m = $("#eMonthly");
    if (first && shown === null) TE.roll(m, e.monthly, function (x) { return "Rs " + TE.fmt.num(x); }, 900); else m.textContent = "Rs " + TE.fmt.num(e.monthly);
    shown = e.monthly;
  }
  ["#ePrice", "#eDown", "#eRate", "#eYears"].forEach(function (s) { $(s).addEventListener("input", function () { emi(false); }); });
  emi(true);
});
