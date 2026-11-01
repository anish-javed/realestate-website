/* Built-in demo data, used only while SCRIPT_URL is empty. It is made by the same seeded generator the Google Sheet setup uses. */
(function () {
  var TE = (window.TE = window.TE || {});
  function pad(n) { return n < 10 ? "0" + n : String(n); }
  function todayYmd() { var d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }

  TE.demo = {
    raw: function () {
      var s = TE_sample(todayYmd());
      return {
        properties: s.properties,
        areas: s.areas,
        settings: {
          "Agency Name": "Thikana Estates", "Phone": "0300 0000000", "WhatsApp Number": "923000000000",
          "Address": "Office 12, Main Boulevard, Gulberg III, Lahore",
          "Opening Hours": "Mon-Sat: 10 am - 7 pm; Sunday: By appointment",
          "Instalment Annual Rate (%)": "16", "Instalment Down Payment (%)": "20", "Instalment Years": "15",
          "New Listing Days": "7", "Near Me Radius (km)": "10"
        }
      };
    },
    // Pretend to save a lead: keep it in this browser only.
    lead: function (payload) {
      var list = TE.store.get("demoLeads", []);
      var ref = "L-" + (1001 + list.length);
      var prop = payload.propertyId && TE.data ? TE.data.byId[payload.propertyId] : null;
      list.push({ ref: ref, type: payload.type, t: Date.now() });
      TE.store.set("demoLeads", list);
      var when = "";
      if (payload.date) {
        var p = payload.date.split("-");
        var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
        when = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()] + " " + (+p[2]) + " " + ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][+p[1] - 1];
        if (payload.time) when += ", " + TE.fmt.clock(payload.time);
      }
      return new Promise(function (resolve) {
        setTimeout(function () {
          resolve({ ok: true, ref: ref, property: prop ? { id: prop.id, title: prop.title, area: prop.area, price: prop.price, purpose: prop.purpose } : null, when: when, demo: true });
        }, 700);
      });
    }
  };
})();
