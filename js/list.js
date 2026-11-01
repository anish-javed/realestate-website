/* List your property: saved as a Sell/List lead */
TE.boot("list", function (data) {
  var $ = TE.$, f = $("#listForm"), box = $("#listCard");
  $("#listArt").innerHTML = TE.art.houseOutline("House");
  $("#lType").innerHTML = TE.TYPES.map(function (t) { return "<option>" + t + "</option>"; }).join("");
  $("#lArea").innerHTML = data.areas.map(function (a) { return "<option>" + TE.esc(a.name) + "</option>"; }).join("") + "<option>Other</option>";
  TE.phone.attach(f.phone);

  $("#lType").addEventListener("change", function () {
    $("#lUnit").value = this.value === "Flat" ? "Sq Ft" : (this.value === "Farmhouse" ? "Kanal" : "Marla");
    f.size.value = this.value === "Flat" ? 1100 : (this.value === "Farmhouse" ? 1 : 5);
  });
  TE.$$("input[name=purpose]", f).forEach(function (r) {
    r.addEventListener("change", function () { $("#priceLbl").textContent = f.purpose.value === "Rent" ? "Expected monthly rent" : "Expected price"; });
  });

  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = f.name.value.trim(), phone = f.phone.value.trim(), size = parseFloat(f.size.value), price = TE.parsePrice(f.price.value);
    if (name.length < 2) return TE.formError(f, "Please enter your name.", "name");
    if (!TE.phone.valid(phone)) return TE.formError(f, "Please enter a mobile number like 0300-1234567.", "phone");
    if (!(size > 0)) return TE.formError(f, "Please enter the size of your property.", "size");
    if (!price) return TE.formError(f, "Please enter your expected price, like 2.5 cr or 85 lakh.", "price");
    var beds = f.beds.value === "" ? "" : Math.max(0, Math.min(20, Math.floor(+f.beds.value)));
    var btn = f.querySelector("[type=submit]"); btn.disabled = true; btn.textContent = "Sending...";
    TE.formError(f, "");
    var fields = { purpose: f.purpose.value, ptype: f.ptype.value, area: f.area.value, size: size, unit: f.unit.value, beds: beds, price: price, address: f.address.value.trim() };
    TE.sendLead({ type: "Sell/List", name: name, phone: phone, email: f.email.value.trim(), notes: f.notes.value.trim(), fields: fields, hp: f.hp.value }).then(function (res) {
      if (!res || !res.ok) { btn.disabled = false; btn.textContent = "Send my details"; TE.formError(f, (res && res.error) || "Something went wrong. Please try again.", res && res.field); return; }
      var lines = ["I want to " + (fields.purpose === "Rent" ? "rent out" : "sell") + ": " + fields.ptype + " in " + fields.area + ", " + size + " " + fields.unit + (beds !== "" ? ", " + beds + " bedrooms" : ""),
        "Expected " + (fields.purpose === "Rent" ? "rent: " : "price: ") + TE.fmt.price(price, fields.purpose)];
      if (fields.address) lines.push("Address: " + fields.address);
      lines.push("I will send photos here on WhatsApp.");
      TE.thanks(box, { ref: res.ref, type: "List my property", name: name, phone: phone, notes: f.notes.value.trim(), demo: res.demo, lines: lines,
        intro: "We have your property details. Photos will be collected on WhatsApp, so please use the button below." });
    }, function () {
      btn.disabled = false; btn.textContent = "Send my details";
      TE.formError(f, "We could not send your request. Please check your internet or WhatsApp us directly.");
    });
  });
});
