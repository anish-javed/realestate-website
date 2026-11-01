/* Drawn art: thin-line icons, refined photo placeholders and a very subtle time-of-day tint. No logos. */
(function () {
  var TE = (window.TE = window.TE || {});
  var art = (TE.art = {});

  /* ---------- thin-line icons (64 x 64), drawn once as the page opens ---------- */
  var ICONS = {
    House: 'M8 30 L32 10 L56 30 M14 26 V54 H50 V26 M26 54 V38 H38 V54',
    Flat: 'M16 56 V10 H48 V56 M10 56 H54 M24 20 H30 M34 20 H40 M24 30 H30 M34 30 H40 M24 40 H30 M34 40 H40 M28 56 V48 H36 V56',
    Plot: 'M12 44 L20 18 L50 14 L54 40 Z M12 54 H54 M12 50 V58 M54 50 V58',
    Commercial: 'M10 56 V26 H54 V56 M6 56 H58 M10 26 L14 14 H50 L54 26 M18 36 H30 V56 M38 36 H46 V46 H38 Z',
    Farmhouse: 'M6 56 H58 M14 56 V32 H42 V56 M10 34 L28 18 L46 34 M24 56 V44 H32 V56 M50 56 V42 M58 56 V42 M50 46 H58 M50 52 H58',
    Compass: 'M32 8 A24 24 0 1 0 32 56 A24 24 0 1 0 32 8 Z M42 22 L36 36 L22 42 L28 28 Z',
    Tag: 'M8 32 L32 8 H54 V30 L30 54 Z M44 18 A2 2 0 1 0 44.01 18',
    Calc: 'M16 8 H48 V56 H16 Z M22 14 H42 V24 H22 Z M24 32 H26 M32 32 H34 M40 32 H42 M24 40 H26 M32 40 H34 M40 40 H42 M24 48 H26 M32 48 H42',
    Shield: 'M32 8 L52 16 V32 C52 44 44 52 32 58 C20 52 12 44 12 32 V16 Z M24 32 L30 38 L41 25',
    Heart: 'M32 54 C32 54 10 42 10 26 A11 11 0 0 1 32 21 A11 11 0 0 1 54 26 C54 42 32 54 32 54 Z',
    Chat: 'M10 14 H54 V42 H30 L18 54 V42 H10 Z M20 24 H44 M20 32 H36',
    Chart: 'M10 54 H56 M10 54 V10 M18 44 L28 32 L36 38 L52 18 M46 18 H52 V24',
    Search: 'M28 10 A18 18 0 1 0 28 46 A18 18 0 1 0 28 10 Z M41 41 L54 54'
  };
  art.icon = function (name, cls) {
    return '<svg class="outline draw ' + (cls || "") + '" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path pathLength="1" d="' + (ICONS[name] || ICONS.House) + '"/></svg>';
  };

  /* ---------- placeholder when a property has no photo, or the photo does not load ---------- */
  var PALETTES = [
    ["#efe7d6", "#e2d6bd", "#1f3d2f"],
    ["#e7eadb", "#d3dac4", "#2d5842"],
    ["#eee3d3", "#dfcfb6", "#3a4a3c"]
  ];
  /* A plot has no building to draw, so it gets a neat survey sketch: boundary, setback line, corner pegs and a small label. */
  function plotArt(p, gid) {
    var ink = p[2], pegs = [[118, 200], [146, 108], [270, 100], [298, 196]], g = "", i;
    for (i = 0; i < pegs.length; i++) {
      g += '<circle cx="' + pegs[i][0] + '" cy="' + pegs[i][1] + '" r="4.5" fill="#fbf8f1" stroke="' + ink + '" stroke-width="1"/>' +
        '<circle cx="' + pegs[i][0] + '" cy="' + pegs[i][1] + '" r="1.2" fill="#b08d57"/>';
    }
    return '<svg class="ph" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Plot (drawn illustration)">' +
      '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + p[0] + '"/><stop offset="1" stop-color="' + p[1] + '"/></linearGradient></defs>' +
      '<rect width="400" height="300" fill="url(#' + gid + ')"/>' +
      '<g stroke="' + ink + '" stroke-width=".5" opacity=".1"><path d="M0 60 H400 M0 120 H400 M0 180 H400 M0 240 H400 M80 0 V300 M160 0 V300 M240 0 V300 M320 0 V300"/></g>' +
      '<path d="M118 200 L146 108 L270 100 L298 196 Z" fill="' + ink + '" fill-opacity=".05" stroke="' + ink + '" stroke-width="1.1" stroke-linejoin="round"/>' +
      '<path d="M130 184 L153 122 L262 116 L286 182 Z" fill="none" stroke="#b08d57" stroke-width=".8" stroke-dasharray="4 4" stroke-linejoin="round"/>' +
      '<path d="M118 222 H298 M118 217 V227 M298 217 V227" fill="none" stroke="' + ink + '" stroke-width=".8" opacity=".55"/>' +
      '<path d="M350 62 V36 M345 44 L350 36 L355 44" fill="none" stroke="' + ink + '" stroke-width=".9" stroke-linecap="round" stroke-linejoin="round" opacity=".6"/>' +
      '<text x="350" y="78" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="' + ink + '" opacity=".6">N</text>' +
      g +
      '<path d="M184 156 H216" stroke="#b08d57" stroke-width="1.2"/>' +
      '<text x="200" y="146" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" letter-spacing="4" fill="' + ink + '" opacity=".8">PLOT</text></svg>';
  }
  art.placeholder = function (type, seed) {
    var n = 0, s = String(seed || type), i;
    for (i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) >>> 0;
    var p = PALETTES[n % 3], gid = "pg" + (n % 100000);
    var d = ICONS[type] || ICONS.House;
    if (type === "Plot") return plotArt(p, gid);
    return '<svg class="ph" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + (type || "Property") + ' (photo coming soon)">' +
      '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + p[0] + '"/><stop offset="1" stop-color="' + p[1] + '"/></linearGradient></defs>' +
      '<rect width="400" height="300" fill="url(#' + gid + ')"/>' +
      '<g transform="translate(156 86) scale(1.4)" fill="none" stroke="' + p[2] + '" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" opacity=".75"><path d="' + d + '"/></g>' +
      '<path d="M176 218 H224" stroke="#b08d57" stroke-width="1.2"/>' +
      '<text x="200" y="244" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" letter-spacing="3" fill="' + p[2] + '" opacity=".6">PHOTO COMING SOON</text></svg>';
  };

  /* ---------- very subtle colour tint that follows the visitor's local time ---------- */
  art.phase = function () {
    var h = new Date().getHours() + new Date().getMinutes() / 60;
    return h >= 5 && h < 8 ? "dawn" : h >= 8 && h < 17 ? "day" : h >= 17 && h < 19.5 ? "dusk" : "night";
  };
  art.mountSky = function (el) {
    if (!el) return;
    el.setAttribute("data-sky", art.phase());
    el.insertAdjacentHTML("afterbegin", '<div class="hero-tint" aria-hidden="true"></div>');
  };
})();
