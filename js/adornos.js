/* Dibujitos de la agenda (flores, lavanda, mariposa, clip, corazón). Todos propios, en SVG. */
(function () {
  const L1 = '#9a86bd', L2 = '#b9a6d6', L3 = '#7a649f', VERDE = '#8a9a78';
  const flor = (t = 40, c1 = L2, c2 = L1) => {
    let p = '';
    for (let i = 0; i < 6; i++) p += `<ellipse cx="20" cy="10.5" rx="5.2" ry="9" transform="rotate(${i * 60} 20 20)" fill="${c1}" stroke="${c2}" stroke-width=".8"/>`;
    for (let i = 0; i < 6; i++) p += `<path d="M20 20 L20 6" transform="rotate(${i * 60 + 2} 20 20)" stroke="${c2}" stroke-width=".5" opacity=".6"/>`;
    return `<svg viewBox="0 0 40 40" width="${t}" height="${t}" aria-hidden="true">${p}<circle cx="20" cy="20" r="4.2" fill="#e9d9a8" stroke="#c9b278" stroke-width=".8"/><circle cx="19" cy="19" r="1" fill="#fff8" /></svg>`;
  };
  const lavanda = (alto = 90) => {
    const tallo = (x, inc, h) => {
      let s = `<path d="M${x} 100 Q ${x + inc * .3} ${100 - h * .5} ${x + inc} ${100 - h}" stroke="${VERDE}" stroke-width="1.3" fill="none"/>`;
      for (let k = 0; k < 9; k++) {
        const t = k / 9, px = x + inc * (1 - t * .45), py = 100 - h + h * .42 * t;
        s += `<ellipse cx="${px - 2.2}" cy="${py}" rx="2.1" ry="3.4" transform="rotate(-25 ${px - 2.2} ${py})" fill="${k % 2 ? L1 : L2}"/>`;
        s += `<ellipse cx="${px + 2.2}" cy="${py + 1.5}" rx="2.1" ry="3.4" transform="rotate(25 ${px + 2.2} ${py + 1.5})" fill="${k % 2 ? L2 : L3}"/>`;
      }
      return s;
    };
    return `<svg viewBox="0 0 50 100" width="${alto / 2}" height="${alto}" aria-hidden="true">${tallo(18, 4, 88)}${tallo(26, 12, 78)}${tallo(22, -10, 70)}
      <path d="M24 100 q-6 -14 -14 -18" stroke="${VERDE}" stroke-width="1" fill="none"/></svg>`;
  };
  const mariposa = (t = 44) => `<svg viewBox="0 0 60 50" width="${t}" height="${t * 50 / 60}" aria-hidden="true">
    <path d="M29 24 C 20 2, 2 2, 4 16 C 6 26, 18 26, 29 25 Z" fill="${L2}" stroke="${L3}" stroke-width="1.2"/>
    <path d="M31 24 C 40 2, 58 2, 56 16 C 54 26, 42 26, 31 25 Z" fill="${L2}" stroke="${L3}" stroke-width="1.2"/>
    <path d="M29 26 C 18 28, 8 38, 14 44 C 20 48, 27 38, 29 28 Z" fill="${L1}" stroke="${L3}" stroke-width="1.2"/>
    <path d="M31 26 C 42 28, 52 38, 46 44 C 40 48, 33 38, 31 28 Z" fill="${L1}" stroke="${L3}" stroke-width="1.2"/>
    <path d="M12 10 q8 4 15 13 M48 10 q-8 4 -15 13 M17 40 q6 -6 11 -12 M43 40 q-6 -6 -11 -12" stroke="${L3}" stroke-width=".6" fill="none" opacity=".7"/>
    <circle cx="10" cy="12" r="1.6" fill="#fff" opacity=".8"/><circle cx="50" cy="12" r="1.6" fill="#fff" opacity=".8"/>
    <rect x="28.6" y="16" width="2.8" height="24" rx="1.4" fill="#5d4a7c"/>
    <path d="M30 17 q-3 -8 -7 -10 M30 17 q3 -8 7 -10" stroke="#5d4a7c" stroke-width=".9" fill="none"/></svg>`;
  const clip = (alto = 46) => `<svg viewBox="0 0 20 50" width="${alto * .4}" height="${alto}" aria-hidden="true">
    <path d="M6 14 V40 a4 4 0 0 0 8 0 V8 a6 6 0 0 0 -12 0 V38 a8 8 0 0 0 16 0 V16" fill="none" stroke="#b39a74" stroke-width="2.2" stroke-linecap="round"/></svg>`;
  const corazon = (t = 14, c = L1) => `<svg viewBox="0 0 20 18" width="${t}" height="${t * .9}" aria-hidden="true"><path d="M10 17 C 3 11, 0 8, 0 5 A5 5 0 0 1 10 3.5 A5 5 0 0 1 20 5 C 20 8, 17 11, 10 17Z" fill="${c}"/></svg>`;
  const chinche = (t = 22) => `<svg viewBox="0 0 24 24" width="${t}" height="${t}" aria-hidden="true"><circle cx="12" cy="10" r="7" fill="#c8a46a" stroke="#9c7b45" stroke-width="1"/><circle cx="10" cy="8" r="2" fill="#f1dcb0"/><path d="M12 17 L 14 23" stroke="#777" stroke-width="1.4"/></svg>`;
  const ICONOS = {
    hoy: '<path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/><circle cx="12" cy="12" r="4"/>',
    mes: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><circle cx="8" cy="14.5" r=".6"/><circle cx="12" cy="14.5" r=".6"/><circle cx="16" cy="14.5" r=".6"/><circle cx="8" cy="18" r=".6"/><circle cx="12" cy="18" r=".6"/>',
    semana: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M7 14h10M7 17.5h6"/>',
    recordar: '<path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    mas: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.4 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 7.4l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
    mas_: '<path d="M12 5v14M5 12h14"/>',
    izq: '<path d="M15 6l-6 6 6 6"/>', der: '<path d="M9 6l6 6-6 6"/>',
    cambio: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>', lapiz: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/>', basura: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M12 13v5M9.5 15.5h5"/>', check: '<path d="M5 12l4.5 4.5L19 7"/>',
    cruz: '<path d="M6 6l12 12M18 6 6 18"/>', farmacia: '<path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z"/>',
    guardar: '<path d="M12 3v12M7 10l5 5 5-5M4 19h16"/>', subir: '<path d="M12 17V5M7 10l5-5 5 5M4 19h16"/>', arriba: '<path d="M6 15l6-6 6 6"/>', abajo: '<path d="M6 9l6 6 6-6"/>',
    compartir: '<path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
  };
  const icono = (n, t = 22) => `<svg viewBox="0 0 24 24" width="${t}" height="${t}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[n] || ''}</svg>`;
  window.Adorno = { flor, lavanda, mariposa, clip, corazon, chinche, icono };
})();
