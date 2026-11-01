/* About and contact: a question, or a request to hear about new homes (saved as Question / Alert leads) */
TE.boot("about", function (data) {
  var $ = TE.$, set = data.settings, f = $("#cForm");
  $("#vA").innerHTML = TE.art.icon("Tag");
  $("#vB").innerHTML = TE.art.icon("Chat");
  $("#vC").innerHTML = TE.art.icon("Shield");
  $("#cPhone").textContent = set.phone;
  $("#cAddr").textContent = set.address;
  $("#cHours").innerHTML = set.hours.map(TE.esc).join("<br>");
  $("#cWa").href = TE.waLink("Hello " + set.name + ", I have a question.");
  $("#aType").insertAdjacentHTML("beforeend", TE.TYPES.map(function (t) { return "<option>" + t + "</option>"; }).join(""));
  $("#aArea").insertAdjacentHTML("beforeend", data.areas.map(function (a) { return "<option>" + TE.esc(a.name) + "</option>"; }).join(""));
  TE.phone.attach(f.phone);

  TE.$$("input[name=kind]", f).forEach(function (r) {
    r.addEventListener("change", function () {
      var alert = f.kind.value === "Alert";
      $("#alertExtra").hidden = !alert;
      $("#msgLbl").textContent = alert ? "Anything else we should know? (optional)" : "Your question";
    });
  });

  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var kind = f.kind.value, name = f.name.value.trim(), phone = f.phone.value.trim(), notes = f.notes.value.trim();
    if (name.length < 2) return TE.formError(f, "Please enter your name.", "name");
    if (!TE.phone.valid(phone)) return TE.formError(f, "Please enter a mobile number like 0300-1234567.", "phone");
    if (kind === "Question" && notes.length < 3) return TE.formError(f, "Please type your question.", "notes");
    var topic, lines = [];
    if (kind === "Alert") {
      var b = TE.parsePrice(f.abudget.value);
      topic = "Tell me about new homes: " + (f.apurpose.value === "Rent" ? "rent" : "buy") + ", " + (f.atype.value || "any type") + ", " + (f.aarea.value || "any area") + (b ? ", up to " + TE.fmt.amount(b) : "");
      lines.push(topic);
    } else {
      topic = "General question";
      lines.push("My question is in the notes below.");
    }
    var btn = f.querySelector("[type=submit]"); btn.disabled = true; btn.textContent = "Sending...";
    TE.formError(f, "");
    TE.sendLead({ type: kind, name: name, phone: phone, email: f.email.value.trim(), notes: notes, fields: { topic: topic }, hp: f.hp.value }).then(function (res) {
      if (!res || !res.ok) { btn.disabled = false; btn.textContent = "Send"; TE.formError(f, (res && res.error) || "Something went wrong. Please try again.", res && res.field); return; }
      TE.thanks($("#contactFormCard"), { ref: res.ref, type: kind === "Alert" ? "New homes alert" : "Question", name: name, phone: phone, notes: notes, lines: lines, demo: res.demo,
        intro: kind === "Alert" ? "We will tell you when matching homes arrive." : "We have your question." });
    }, function () {
      btn.disabled = false; btn.textContent = "Send";
      TE.formError(f, "We could not send your message. Please check your internet or WhatsApp us directly.");
    });
  });
});
