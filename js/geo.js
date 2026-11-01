/*
  Automatic location. Uses the browser Geolocation API only AFTER the visitor taps a button
  (or after they allowed it once before). The coordinates are rounded and stay in this browser.
  They are never sent to the script or the sheet.
*/
(function () {
  var TE = (window.TE = window.TE || {});
  var geo = (TE.geo = {});
  var FAR_KM = 40;
  geo.FAR_KM = FAR_KM;
  geo.RADII = [5, 10, 20, 50];

  geo.haversine = function (lat1, lng1, lat2, lng2) {
    var R = 6371, rad = Math.PI / 180;
    var dLat = (lat2 - lat1) * rad, dLng = (lng2 - lng1) * rad;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };
  function round3(n) { return Math.round(n * 1000) / 1000; }

  geo.nearest = function (lat, lng) {
    var best = null;
    TE.data.areas.forEach(function (a) {
      var km = geo.haversine(lat, lng, a.lat, a.lng);
      if (!best || km < best.km) best = { area: a, km: km };
    });
    return best;
  };

  /* ---------- the remembered position (this browser only) ---------- */
  geo.get = function () { return TE.store.get("loc", null); };
  geo.set = function (loc) { TE.store.set("loc", loc); geo.annotate(); document.dispatchEvent(new CustomEvent("te:loc")); };
  geo.clear = function () { TE.store.del("loc"); geo.annotate(); document.dispatchEvent(new CustomEvent("te:loc")); };
  geo.setArea = function (name) {
    var a = TE.areaOf(name);
    if (!a) return;
    geo.set({ lat: a.lat, lng: a.lng, source: "area", area: a.name, t: Date.now() });
  };

  // distance in km from the visitor to a property (null when the location is not known)
  geo.annotate = function () {
    var loc = geo.get();
    if (!TE.data) return;
    TE.data.props.forEach(function (p) { p.dist = loc ? geo.haversine(loc.lat, loc.lng, p.lat, p.lng) : null; });
  };
  geo.label = function (p) {
    var loc = geo.get();
    if (!loc || p.dist === null) return "";
    return loc.source === "gps" ? TE.fmt.km(p.dist) + " away" : TE.fmt.km(p.dist) + " from " + loc.area;
  };

  geo.permission = function () {
    if (!navigator.permissions || !navigator.permissions.query) return Promise.resolve("unknown");
    return navigator.permissions.query({ name: "geolocation" }).then(function (r) { return r.state; }, function () { return "unknown"; });
  };

  function getPosition() {
    return new Promise(function (resolve, reject) {
      if (!navigator.geolocation) return reject({ code: "unavailable" });
      navigator.geolocation.getCurrentPosition(
        function (p) { resolve(p.coords); },
        function (e) { reject({ code: e.code === 1 ? "denied" : e.code === 3 ? "timeout" : "unavailable" }); },
        { enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 }
      );
    });
  }

  // Resolves { loc } or { far: true, km, area }. Rejects with { code: denied | timeout | unavailable }.
  geo.detect = function () {
    return getPosition().then(function (c) {
      var lat = round3(c.latitude), lng = round3(c.longitude);
      var n = geo.nearest(lat, lng);
      if (!n || n.km > FAR_KM) return { far: true, km: n ? n.km : null, area: n ? n.area.name : "" };
      var loc = { lat: lat, lng: lng, source: "gps", area: n.area.name, t: Date.now() };
      TE.store.set("geoOk", 1);
      geo.set(loc);
      return { loc: loc };
    });
  };

  /* ---------- the friendly banner (Home and Browse) ---------- */
  geo.mount = function (el) {
    if (!el) return;
    var ui = { state: "ask", msg: "", km: 0 };
    function radar(cls) { return '<div class="radar ' + cls + '"><i></i><i></i><i></i><span>' + TE.icon.pin + "</span></div>"; }
    var privacy = '<p class="geo-privacy">Privacy: your location stays in this browser. It is never sent to us or saved in our sheet.</p>';

    function picker(intro) {
      var popular = TE.data.areas.slice().sort(function (a, b) { return b.central + b.family - (a.central + a.family); });
      return (intro ? "<p>" + intro + "</p>" : "") + '<div class="area-pick">' +
        popular.map(function (a) { return '<button class="chip" data-act="area" data-area="' + TE.esc(a.name) + '">' + TE.esc(a.name) + "</button>"; }).join("") +
        "</div>";
    }
    function render() {
      var loc = geo.get(), html = "";
      if (ui.state === "detecting") {
        html = '<div class="geo-row">' + radar("on") + "<div><h3>Finding your area&hellip;</h3><p>This takes a few seconds.</p></div></div>";
      } else if (ui.state === "found" && loc) {
        var near = loc.source === "gps";
        html = '<div class="geo-row found">' + radar("still") + "<div>" +
          "<h3>" + (near ? "You seem to be near <b>" + TE.esc(loc.area) + "</b>" : "Showing homes around <b>" + TE.esc(loc.area) + "</b>") + "</h3>" +
          "<p>" + (near ? "Homes are sorted nearest first." : "Distances are measured from the middle of " + TE.esc(loc.area) + ".") + "</p></div>" +
          '<div class="geo-actions"><button class="btn btn-small btn-ghost" data-act="choose">Change area</button><button class="btn btn-small btn-ghost" data-act="stop">Stop using location</button></div></div>';
      } else if (ui.state === "picker") {
        html = '<div class="geo-row col"><h3>Choose your area</h3>' + picker(ui.msg || "Pick the area closest to you. We will remember it in this browser.") + '<button class="btn btn-small btn-ghost" data-act="cancel">Cancel</button></div>';
      } else if (ui.state === "far") {
        html = '<div class="geo-row col"><h3>You seem to be a long way from Lahore</h3>' +
          picker("We could not find any of our areas near you (about " + Math.round(ui.km) + " km away). Here are some popular areas to start with:") + "</div>";
      } else { // ask
        html = '<div class="geo-row">' + radar("idle") +
          "<div><h3>Show homes near you?</h3><p>We can sort homes by distance and show you what is close by. Nothing is asked of your browser until you tap.</p></div>" +
          '<div class="geo-actions"><button class="btn btn-primary" data-act="use">Use my location</button><button class="btn btn-ghost" data-act="choose">Choose my area</button></div></div>';
      }
      el.innerHTML = '<div class="geo-card">' + html + privacy + "</div>";
      el.classList.add("geo-banner");
    }

    function run(silent) {
      ui.state = "detecting"; render();
      geo.detect().then(function (res) {
        if (res.far) { ui.state = "far"; ui.km = res.km || 0; render(); return; }
        ui.state = "found"; render();
      }, function (err) {
        var why = err && err.code === "denied" ? "Location is switched off for this site, so please pick your area." :
          err && err.code === "timeout" ? "Finding your location took too long, so please pick your area." : "Your browser could not tell us where you are, so please pick your area.";
        ui.state = "picker"; ui.msg = why; render();
      });
    }

    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]");
      if (!b) return;
      var act = b.getAttribute("data-act");
      if (act === "use") run(false);
      else if (act === "choose") { ui.state = "picker"; ui.msg = ""; render(); }
      else if (act === "cancel") { ui.state = geo.get() ? "found" : "ask"; render(); }
      else if (act === "stop") { geo.clear(); ui.state = "ask"; render(); }
      else if (act === "area") { geo.setArea(b.getAttribute("data-area")); ui.state = "found"; render(); }
    });

    // first paint, then silent detection if the visitor already allowed it before
    var saved = geo.get();
    ui.state = saved ? "found" : "ask";
    render();
    geo.permission().then(function (perm) {
      var allowed = perm === "granted" || (perm === "unknown" && TE.store.get("geoOk"));
      if (!allowed) return;
      if (saved && saved.source !== "gps") return; // they picked an area by hand: respect it
      if (!saved) { ui.state = "detecting"; render(); }
      geo.detect().then(function (res) {
        if (res.far) { ui.state = "far"; ui.km = res.km || 0; } else ui.state = "found";
        render();
      }, function () { ui.state = geo.get() ? "found" : "ask"; render(); });
    });
  };
})();
