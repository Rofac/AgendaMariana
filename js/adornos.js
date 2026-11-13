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
    inicio: '<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/>',
    midia: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3v3M15 3v3M8.5 11.5l1.5 1.5 3-3M8.5 16.5h7"/>',
    estetos: '<path d="M6 3v6a5 5 0 0 0 10 0V3"/><path d="M4 3h4M14 3h4M11 14v2a5 5 0 0 0 10 0v-2"/><circle cx="21" cy="12" r="2"/>',
    tareas: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8l1.5 1.5L12 7M14 8.5h3M8 13l1.5 1.5L12 12M14 13.5h3M8 18h9"/>',
    libreta: '<path d="M6 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6z"/><path d="M6 3v18M4 7h4M4 12h4M4 17h4M10 8h6M10 11h4"/>',
    brote: '<path d="M12 21v-8M12 13c0-4-3-6-7-6 0 4 3 6 7 6zM12 11c0-4 3-6 7-6 0 4-3 6-7 6z"/>',
    diana: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/><path d="M13 11l7-7M17 4h3v3"/>',
    guardia: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/>',
    fijar: '<path d="M9 4h6l-1 5 3 3H7l3-3zM12 15v6"/>',
    compartir: '<path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
  };
  const ramo = (alto = 120) => `<svg viewBox="0 0 90 120" width="${alto * .75}" height="${alto}" aria-hidden="true">
    <g transform="translate(-6 0) rotate(-14 45 80)">${[[-14, 70], [-6, 82], [2, 88], [10, 80], [18, 70]].map(([dx, h]) => {
      let s = `<path d="M${45 + dx * .4} 96 Q ${45 + dx * .7} ${96 - h * .5} ${45 + dx} ${96 - h}" stroke="${VERDE}" stroke-width="1.3" fill="none"/>`;
      for (let k = 0; k < 8; k++) { const px = 45 + dx * (1 - k * .03), py = 96 - h + k * 4.6; s += `<ellipse cx="${px - 2}" cy="${py}" rx="2" ry="3.2" transform="rotate(-25 ${px - 2} ${py})" fill="${k % 2 ? L1 : L2}"/><ellipse cx="${px + 2}" cy="${py + 1.4}" rx="2" ry="3.2" transform="rotate(25 ${px + 2} ${py + 1.4})" fill="${k % 2 ? L2 : L3}"/>`; }
      return s; }).join('')}
    <path d="M38 92 L52 92 L49 116 L41 116 Z" fill="#e8d9bf" stroke="#c4ab84" stroke-width="1"/>
    <path d="M45 98 q-12 -8 -16 2 q8 4 16 -2 q12 -8 16 2 q-8 4 -16 -2" fill="#d9c6e9" stroke="${L3}" stroke-width="1"/>
    <path d="M45 98 q-4 10 -10 16 M45 98 q4 10 10 16" stroke="${L3}" stroke-width="1.2" fill="none"/></g></svg>`;
  const libros = (ancho = 150) => `<svg viewBox="0 0 160 70" width="${ancho}" height="${ancho * 70 / 160}" aria-hidden="true">
    <rect x="6" y="48" width="104" height="16" rx="3" fill="#cbb8e6" stroke="${L3}" stroke-width="1"/><path d="M12 52h88M12 56h88" stroke="#fff" stroke-width="1.2" opacity=".7"/>
    <rect x="14" y="33" width="92" height="15" rx="3" fill="#ead9e4" stroke="#b98aa6" stroke-width="1"/><path d="M20 38h76" stroke="#fff" stroke-width="1.2" opacity=".7"/>
    <rect x="10" y="20" width="96" height="13" rx="3" fill="#b9a6d6" stroke="${L3}" stroke-width="1"/><path d="M16 25h80" stroke="#fff" stroke-width="1.2" opacity=".7"/>
    <path d="M120 34h26v24a8 8 0 0 1-8 8h-10a8 8 0 0 1-8-8z" fill="#fbf7f1" stroke="#9a86bd" stroke-width="1.6"/><path d="M146 40c8 0 8 14 0 14" fill="none" stroke="#9a86bd" stroke-width="1.6"/>
    <path d="M133 50c-3-3-6-1-5 2 1 2 5 4 5 4s4-2 5-4c1-3-2-5-5-2" fill="#c98aa6"/><path d="M128 28q3-4 0-8M136 28q3-4 0-8" stroke="#c9bfd4" stroke-width="1.4" fill="none"/></svg>`;
  const icono = (n, t = 22) => `<svg viewBox="0 0 24 24" width="${t}" height="${t}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[n] || ''}</svg>`;
  window.Adorno = { flor, lavanda, mariposa, clip, corazon, chinche, icono, ramo, libros };
})();
