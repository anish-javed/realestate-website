/* Drawn art: skyline, self-drawing house outlines, photo placeholders and the time-of-day sky. No images, no logos. */
(function () {
  var TE = (window.TE = window.TE || {});
  var art = (TE.art = {});

  /* ---------- skyline that builds itself up ---------- */
  art.skyline = function (cls) {
    var seed = 7, parts = [], x = -10, i = 0;
    function r() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    while (x < 1200) {
      var w = 34 + Math.floor(r() * 46), h = 50 + Math.floor(r() * 140), y = 220 - h, kind = i % 6;
      var lite = i % 2 === 1 ? " lite" : "";
      var g = '<g class="b' + lite + '" style="--i:' + i + '">';
      if (kind === 1 || kind === 4) { // small house with a pitched roof
        h = 40 + Math.floor(r() * 40); y = 220 - h;
        g += '<path d="M' + x + ' ' + y + ' L' + (x + w / 2) + ' ' + (y - 26) + ' L' + (x + w) + ' ' + y + ' Z" class="roof"/>';
        g += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"/>';
        g += '<rect x="' + (x + w / 2 - 6) + '" y="' + (220 - 22) + '" width="12" height="22" class="door"/>';
      } else {
        g += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"/>';
        if (kind === 0) g += '<line x1="' + (x + w / 2) + '" y1="' + y + '" x2="' + (x + w / 2) + '" y2="' + (y - 22) + '" class="ant"/>';
        if (kind === 3) g += '<path d="M' + x + ' ' + y + ' A' + (w / 2) + ' ' + (w / 2) + ' 0 0 1 ' + (x + w) + ' ' + y + '" class="roof"/>';
        var cols = Math.max(2, Math.floor(w / 14)), rows = Math.floor((h - 14) / 20);
        for (var cy = 0; cy < rows; cy++) for (var cx = 0; cx < cols; cx++) {
          g += '<rect class="win" x="' + (x + 6 + cx * ((w - 12) / cols)) + '" y="' + (y + 10 + cy * 20) + '" width="6" height="9"/>';
        }
      }
      g += "</g>";
      parts.push(g);
      if (r() > 0.55) { // a tree between buildings
        var tx = x + w + 10;
        parts.push('<g class="b tree lite" style="--i:' + i + '"><line x1="' + tx + '" y1="220" x2="' + tx + '" y2="200"/><circle cx="' + tx + '" cy="192" r="12"/></g>');
        x += 22;
      }
      x += w + 6 + Math.floor(r() * 10);
      i++;
    }
    return '<svg class="skyline ' + (cls || "") + '" viewBox="0 0 1200 220" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">' +
      parts.join("") + '<line class="ground" x1="0" y1="220" x2="1200" y2="220"/></svg>';
  };

  /* ---------- house outlines that draw themselves ---------- */
  var OUT = {
    House: 'M10 52 L60 14 L110 52 M20 46 V92 H100 V46 M48 92 V66 H72 V92 M26 58 H40 V72 H26 Z M80 58 H94 V72 H80 Z M84 24 V38 H94 V32',
    Flat: 'M30 94 V10 H90 V94 M20 94 H100 M40 22 H50 M58 22 H68 M76 22 H80 M40 38 H50 M58 38 H68 M76 38 H80 M40 54 H50 M58 54 H68 M76 54 H80 M52 94 V74 H68 V94',
    Plot: 'M14 80 L34 30 L96 24 L108 74 Z M14 80 L10 84 M34 30 L30 24 M96 24 L100 18 M108 74 L114 78 M30 94 H92 M30 90 V98 M92 90 V98',
    Commercial: 'M12 94 V36 H108 V94 M6 94 H114 M12 36 L20 22 H100 L108 36 M24 50 H52 V80 H24 Z M68 50 H96 V80 H68 Z M56 94 V76',
    Farmhouse: 'M8 94 H112 M24 94 V56 H66 V94 M18 58 L45 30 L72 58 M36 94 V74 H50 V94 M88 94 V66 M78 66 Q88 38 98 66 Z M104 94 V74 M98 74 Q104 56 110 74'
  };
  art.houseOutline = function (type, cls) {
    return '<svg class="outline draw ' + (cls || "") + '" viewBox="0 0 120 104" aria-hidden="true" focusable="false"><path pathLength="1" d="' + (OUT[type] || OUT.House) + '"/></svg>';
  };

  /* ---------- placeholders when a property has no photo ---------- */
  var PALETTES = [
    ["#efe4cf", "#dccfb3", "#f8f2e6", "#a65a3c", "#1f3d2f"],
    ["#e1e6d6", "#c9d3bd", "#f5f3e8", "#8a6a3b", "#2d5842"],
    ["#ecdcc9", "#d9c3a8", "#faf3e8", "#7d4a33", "#27402f"]
  ];
  art.placeholder = function (type, seed) {
    var n = 0, s = String(seed || type);
    for (var i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) >>> 0;
    var p = PALETTES[n % 3], bg1 = p[0], bg2 = p[1], wall = p[2], roof = p[3], ln = p[4];
    var gid = "pg" + (n % 100000);
    var body = "";
    var common = 'stroke="' + ln + '" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"';
    if (type === "Flat") {
      body = '<rect x="150" y="60" width="100" height="190" fill="' + wall + '" ' + common + '/>' +
        '<rect x="110" y="140" width="40" height="110" fill="' + wall + '" ' + common + '/>' +
        '<rect x="250" y="110" width="44" height="140" fill="' + wall + '" ' + common + '/>';
      for (var r = 0; r < 7; r++) for (var c = 0; c < 3; c++) body += '<rect x="' + (162 + c * 28) + '" y="' + (74 + r * 24) + '" width="14" height="14" fill="' + bg2 + '" ' + common + '/>';
      body += '<rect x="188" y="226" width="24" height="24" fill="' + roof + '" ' + common + '/>';
    } else if (type === "Plot") {
      body = '<path d="M70 230 L130 120 L290 106 L330 214 Z" fill="' + wall + '" fill-opacity=".7" stroke="' + ln + '" stroke-width="1.6" stroke-dasharray="7 5"/>' +
        '<circle cx="70" cy="230" r="4" fill="' + roof + '"/><circle cx="130" cy="120" r="4" fill="' + roof + '"/><circle cx="290" cy="106" r="4" fill="' + roof + '"/><circle cx="330" cy="214" r="4" fill="' + roof + '"/>' +
        '<path d="M70 250 H330 M70 244 V256 M330 244 V256" stroke="' + ln + '" stroke-width="1" fill="none"/>' +
        '<path d="M215 200 V150" stroke="' + ln + '" stroke-width="2"/><rect x="195" y="138" width="46" height="24" fill="' + roof + '" ' + common + '/>';
    } else if (type === "Commercial") {
      body = '<rect x="70" y="100" width="260" height="150" fill="' + wall + '" ' + common + '/>' +
        '<rect x="62" y="88" width="276" height="16" fill="' + roof + '" ' + common + '/>' +
        '<rect x="96" y="130" width="90" height="120" fill="' + bg2 + '" ' + common + '/><rect x="214" y="130" width="90" height="120" fill="' + bg2 + '" ' + common + '/>' +
        '<path d="M96 130 L106 112 H176 L186 130 M214 130 L224 112 H294 L304 130" fill="none" ' + common + '/><rect x="150" y="60" width="100" height="22" fill="none" stroke="' + ln + '" stroke-dasharray="5 4"/>';
    } else if (type === "Farmhouse") {
      body = '<path d="M0 230 Q90 170 180 226 T400 210 V300 H0 Z" fill="' + bg2 + '" opacity=".6"/>' +
        '<rect x="110" y="150" width="130" height="100" fill="' + wall + '" ' + common + '/><path d="M96 154 L175 96 L254 154 Z" fill="' + roof + '" ' + common + '/>' +
        '<rect x="160" y="196" width="30" height="54" fill="' + bg2 + '" ' + common + '/>' +
        '<line x1="290" y1="250" x2="290" y2="190" ' + common + '/><circle cx="290" cy="170" r="34" fill="' + ln + '" opacity=".75"/>' +
        '<line x1="340" y1="250" x2="340" y2="210" ' + common + '/><circle cx="340" cy="196" r="22" fill="' + ln + '" opacity=".6"/>' +
        '<path d="M20 250 V232 M44 250 V232 M68 250 V232 M20 238 H68" stroke="' + ln + '" stroke-width="1.4" fill="none"/>';
    } else { // House
      body = '<rect x="110" y="140" width="180" height="110" fill="' + wall + '" ' + common + '/>' +
        '<path d="M92 146 L200 66 L308 146 Z" fill="' + roof + '" ' + common + '/><rect x="244" y="82" width="20" height="40" fill="' + roof + '" ' + common + '/>' +
        '<rect x="184" y="188" width="32" height="62" fill="' + bg2 + '" ' + common + '/>' +
        '<rect x="128" y="168" width="38" height="34" fill="' + bg2 + '" ' + common + '/><rect x="234" y="168" width="38" height="34" fill="' + bg2 + '" ' + common + '/>' +
        '<path d="M128 185 H166 M147 168 V202 M234 185 H272 M253 168 V202" stroke="' + ln + '" stroke-width="1" fill="none"/>' +
        '<line x1="330" y1="250" x2="330" y2="214" ' + common + '/><circle cx="330" cy="200" r="22" fill="' + ln + '" opacity=".7"/>' +
        '<path d="M40 250 V236 M60 250 V236 M80 250 V236 M40 242 H80" stroke="' + ln + '" stroke-width="1.4" fill="none"/>';
    }
    return '<svg class="ph" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Drawing of a ' + (type || "property").toLowerCase() + ' (photo coming soon)">' +
      '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + bg1 + '"/><stop offset="1" stop-color="' + bg2 + '"/></linearGradient>' +
      '<pattern id="' + gid + 'g" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="' + ln + '" stroke-opacity=".09"/></pattern></defs>' +
      '<rect width="400" height="300" fill="url(#' + gid + ')"/><rect width="400" height="300" fill="url(#' + gid + 'g)"/>' +
      '<path d="M0 250 H400" stroke="' + ln + '" stroke-width="1.6"/>' + body +
      '<text x="200" y="284" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" letter-spacing="2" fill="' + ln + '" opacity=".6">PHOTOS COMING SOON</text></svg>';
  };

  /* ---------- sky that follows the visitor's local time ---------- */
  art.phase = function () {
    var d = new Date(), h = d.getHours() + d.getMinutes() / 60;
    var phase = h >= 5 && h < 8 ? "dawn" : h >= 8 && h < 17 ? "day" : h >= 17 && h < 19.5 ? "dusk" : "night";
    var t, orb;
    if (phase === "night") { t = (h >= 19.5 ? h - 19.5 : h + 4.5) / 9.5; orb = "moon"; }
    else { t = (h - 5) / 14.5; orb = "sun"; }
    return { phase: phase, orb: orb, x: 8 + 84 * t, y: 64 - 52 * Math.sin(Math.PI * t) };
  };
  art.mountSky = function (el) {
    if (!el) return;
    var s = art.phase();
    el.setAttribute("data-sky", s.phase);
    var html = '<div class="sky-orb ' + s.orb + '" style="left:' + s.x.toFixed(1) + "%;top:" + s.y.toFixed(1) + '%"></div>';
    if (s.phase === "night") {
      var seed = 11, i;
      for (i = 0; i < 26; i++) {
        seed = (seed * 9301 + 49297) % 233280;
        var a = seed / 233280; seed = (seed * 9301 + 49297) % 233280; var b = seed / 233280;
        html += '<i class="star" style="left:' + (a * 100).toFixed(1) + "%;top:" + (b * 55).toFixed(1) + "%;animation-delay:" + ((a * 5).toFixed(1)) + 's"></i>';
      }
    } else {
      html += '<span class="cloud c1"></span><span class="cloud c2"></span><span class="cloud c3"></span>';
    }
    el.insertAdjacentHTML("afterbegin", '<div class="sky-layer" aria-hidden="true">' + html + "</div>");
  };
})();
