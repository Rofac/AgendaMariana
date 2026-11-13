/* Agenda de guardias — pantallas */
(function () {
  const F = Agenda.F, A = Agenda.cargar(), Ad = Adorno, I = Ad.icono;
  const $ = s => document.querySelector(s), $$ = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const VERSION = 'v1.0';
  const DIAS3 = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  const FRASES = ['Un día a la vez', 'Paso a paso', 'Hoy también suma', 'Respirá, vas bien', 'Pequeños pasos, grandes cambios', 'Lo que hacés con amor se nota'];
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}

  let HOY = F.hoyLocal();
  const V = { pant: 'hoy', mes: HOY.slice(0, 7), lunes: F.lunesDe(HOY) };
  try { const p = sessionStorage.getItem('agenda_pant'); if (p) V.pant = p; } catch (e) {}

  // ---------- utilidades de pantalla
  const nombreF = id => A.farmacia(id).nombre;
  const faltan = f => { const n = F.entre(HOY, f); return n === 0 ? 'hoy' : n === 1 ? 'mañana' : n === -1 ? 'ayer' : n > 0 ? 'en ' + n + ' días' : 'hace ' + (-n) + ' días'; };
  const mesNombre = ym => { const [a, m] = ym.split('-').map(Number); return F.MESES[m - 1] + ' ' + a; };
  const repTxt = { no: '', semana: 'cada semana', mes: 'cada mes', anio: 'cada año' };

  let tToast;
  function toast(msg, deshacer, err) {
    const t = $('#toast'); clearTimeout(tToast);
    t.className = err ? 'err' : ''; t.innerHTML = `<span>${esc(msg)}</span>` + (deshacer ? '<button id="tDes">Deshacer</button>' : '');
    t.hidden = false;
    if (deshacer) $('#tDes').onclick = () => { const q = A.deshacer(); t.hidden = true; if (q) { toast('Listo, deshecho'); pintar(); refrescarHoja(); } };
    tToast = setTimeout(() => { t.hidden = true; }, deshacer ? 6000 : 2600);
  }
  const intentar = (fn, ok, deshacer = true) => { try { fn(); if (ok) toast(ok, deshacer); return true; } catch (e) { toast(e.message || String(e), false, true); return false; } };

  // ---------- hoja de abajo
  let hojaActual = null;
  function abrir(fn) { hojaActual = fn; $('#hoja').innerHTML = fn(); $('#capa').hidden = false; $('#hoja').scrollTop = 0; enganchar($('#hoja')); }
  function refrescarHoja() { if (hojaActual && !$('#capa').hidden) { const s = $('#hoja').scrollTop; $('#hoja').innerHTML = hojaActual(); enganchar($('#hoja')); $('#hoja').scrollTop = s; } }
  function cerrar() { $('#capa').hidden = true; hojaActual = null; }
  $('#capa').addEventListener('click', e => { if (e.target.id === 'capa') cerrar(); });
  const btnCerrar = `<button class="mini cerrar" data-acc="cerrar" aria-label="Cerrar">${I('cruz')}</button>`;

  // ---------- encabezado
  function cab(cinta, titulo, script, extra = '') {
    return `<div class="cab">${extra ? '' : `<span class="flor-izq">${Ad.flor(34)}</span><span class="lav-der">${Ad.lavanda(70)}</span>`}
      ${cinta ? `<span class="cinta papel chica">${esc(cinta)}</span>` : ''}
      ${titulo ? `<h1>${esc(titulo)}</h1>` : ''}${script ? `<div class="script">${esc(script)}</div>` : ''}${extra}</div>`;
  }

  // =================== HOY
  function pHoy() {
    const i = A.info(HOY), d = F.aD(HOY), dd = A.dia(HOY);
    let turno;
    if (i.nuestra) turno = `<div class="msg">¡Hoy tenemos guardia!</div><div class="quien"><span class="resaltado">${esc(nombreF(i.turno))}</span></div>
        <div class="det">${i.tomada ? 'Tomada de ' + esc(nombreF(i.oficial)) : 'Farmacia de turno'}${i.cambio && i.cambio.nota ? ' · ' + esc(i.cambio.nota) : ''}</div>`;
    else turno = `<div class="det">Hoy está de turno</div><div class="quien">${esc(nombreF(i.turno))}</div>
        <div class="det">${i.cedida ? `Era de <span class="tachado">${esc(nombreF(i.oficial))}</span>, se la cedimos` : 'Hoy no tenemos guardia'}${i.cambio && i.cambio.nota ? ' · ' + esc(i.cambio.nota) : ''}</div>`;
    const prox = A.proximasNuestras(F.sumar(HOY, 1), 5);
    const recs = A.recordatoriosEntre(HOY, F.sumar(HOY, 7));
    const frase = FRASES[F.entre('2026-01-01', HOY) % FRASES.length];
    return cab('una guardia a la vez', F.DIAS[d.getUTCDay()], d.getUTCDate() + ' de ' + F.MESES[d.getUTCMonth()]) +
      instalarAviso() +
      `<div class="hoja-p turno-hoy ${i.nuestra ? 'lila' : ''} fila-toca" data-acc="dia" data-f="${HOY}" style="cursor:pointer">
        <span class="cinta">De turno hoy</span><span class="adorno" style="right:-8px;bottom:-14px">${Ad.mariposa(46)}</span>${turno}</div>
      <div class="hoja-p"><span class="cinta cuadros">Próximas guardias</span><span class="adorno" style="left:-10px;top:-16px">${Ad.clip(44)}</span>
        ${prox.map(filaGuardia).join('') || '<div class="vacio">No hay guardias cargadas</div>'}</div>
      <div class="hoja-p"><span class="cinta">Recordatorios</span><span class="adorno" style="right:6px;top:-10px">${Ad.chinche()}</span>
        ${recs.map(r => filaRec(r, true)).join('') || '<div class="vacio">Nada para esta semana ' + Ad.corazon(12) + '</div>'}
        <div class="botones"><button class="btn sec chico" data-acc="nuevoRec" data-f="${HOY}">${I('mas_', 18)} Recordatorio</button></div></div>
      ${miDia(HOY, dd)}
      <div class="frase">“${esc(frase)}” ${Ad.corazon(14)}</div>`;
  }
  function filaGuardia(i) {
    const d = F.aD(i.fecha);
    return `<div class="fila toca" data-acc="dia" data-f="${i.fecha}"><div class="fecha"><small>${DIAS3[d.getUTCDay()]}</small><b>${d.getUTCDate()}</b><small>${F.MESES[d.getUTCMonth()].slice(0, 3)}</small></div>
      <div class="txt"><b>${esc(nombreF(i.turno))}</b> ${i.tomada ? '<span class="chip tom">cambio</span>' : ''} ${i.estimado ? '<span class="chip est">a confirmar</span>' : ''}
      ${i.cambio && i.cambio.nota ? `<small>${esc(i.cambio.nota)}</small>` : ''}</div><div class="falta">${faltan(i.fecha)}</div></div>`;
  }
  function filaRec(r, conFecha) {
    const d = F.aD(r.dia);
    return `<div class="fila ${r.hecho ? 'hecho' : ''}">
      <button class="circ ${r.hecho ? 'ok' : ''}" data-acc="hecho" data-id="${r.id}" data-f="${r.dia}" aria-label="Hecho">${r.hecho ? I('check', 15) : ''}</button>
      <div class="txt toca" data-acc="editRec" data-id="${r.id}" data-f="${r.dia}" style="cursor:pointer"><b>${esc(r.titulo)}</b>
        <small>${conFecha ? (r.dia === HOY ? 'Hoy' : DIAS3[d.getUTCDay()] + ' ' + F.fechaCorta(r.dia)) : ''}${r.hora ? (conFecha ? ' · ' : '') + r.hora + ' h' : ''}${r.repetir !== 'no' ? ' · ' + repTxt[r.repetir] : ''}${r.nota ? ' · ' + esc(r.nota) : ''}</small></div>
      ${conFecha ? `<div class="falta" style="font-size:16px">${r.dia === HOY ? '' : faltan(r.dia)}</div>` : ''}</div>`;
  }
  function miDia(f, dd) {
    const vaso = n => `<svg viewBox="0 0 24 30" width="26" height="32"><path class="${n ? 'lleno' : ''}" d="M5 4h14l-2 23H7z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>${n ? '<path d="M6.3 11h11.4l-1.5 15.4H7.8z" fill="#b9a6d6"/>' : ''}</svg>`;
    const caras = ['😄', '🙂', '😐', '🙁', '😣'];
    return `<div class="hoja-p" style="margin-top:24px"><span class="cinta">Mi día</span><span class="adorno" style="right:-4px;bottom:-6px;opacity:.9">${Ad.lavanda(64)}</span>
      <label class="l">Foco de hoy</label><input class="in renglones" style="min-height:30px" data-dia="foco" data-f="${f}" value="${esc(dd.foco)}" placeholder="Lo más importante de hoy…">
      <label class="l">Pendientes</label>
      ${(dd.pendientes || []).map((p, k) => `<div class="pend ${p.ok ? 'ok' : ''}"><button class="circ ${p.ok ? 'ok' : ''}" data-acc="pend" data-k="${k}" data-f="${f}" aria-label="Hecho">${p.ok ? I('check', 15) : ''}</button><span>${esc(p.t)}</span><button class="mini rojo" data-acc="pendX" data-k="${k}" data-f="${f}" aria-label="Borrar">${I('cruz', 16)}</button></div>`).join('')}
      <form class="add-pend" data-acc="pendAdd" data-f="${f}"><input class="in" name="t" placeholder="Agregar pendiente…" enterkeyhint="done" autocomplete="off"><button class="btn chico" aria-label="Agregar">${I('mas_', 18)}</button></form>
      <div class="dos" style="margin-top:4px"><div><label class="l">Agua (vasos)</label><div class="agua">${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<button data-acc="agua" data-n="${n}" data-f="${f}" aria-label="${n} vasos" style="padding:0">${vaso(n <= (dd.agua || 0))}</button>`).join('')}</div></div></div>
      <label class="l">¿Cómo estoy?</label><div class="animo">${caras.map((c, k) => `<button class="${dd.animo === k + 1 ? 'act' : ''}" data-acc="animo" data-n="${k + 1}" data-f="${f}">${c}</button>`).join('')}</div>
      <label class="l">Notas</label><textarea class="in puntos" data-dia="notas" data-f="${f}" placeholder="Escribí lo que quieras…">${esc(dd.notas)}</textarea></div>`;
  }

  // =================== MES
  function pMes() {
    const [a, m] = V.mes.split('-').map(Number), ini = V.mes + '-01', fin = V.mes + '-' + String(F.finDeMes(a, m)).padStart(2, '0');
    const todas = A.E.cfg.verTodas !== false, r = A.resumenMes(a, m);
    let celdas = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map(x => `<div class="dn">${x}</div>`).join('');
    const vacias = (F.diaSemana(ini) + 6) % 7;
    for (let k = 0; k < vacias; k++) celdas += `<div class="c fuera"></div>`;
    let hayEst = false;
    for (let f = ini; f <= fin; f = F.sumar(f, 1)) {
      const i = A.info(f), recs = A.recordatoriosDe(f), dd = A.E.dias[f]; if (i.estimado) hayEst = true;
      const nombre = A.farmacia(i.turno).corto || nombreF(i.turno);
      let cont = '';
      if (i.cedida) cont = `<span class="f x tachado">${esc(A.farmacia(i.oficial).corto)}</span><span class="f">${todas ? esc(nombre) : ''}</span>`;
      else if (i.nuestra || todas) cont = `<span class="f">${esc(nombre)}</span>`;
      celdas += `<button class="c ${i.nuestra ? 'nuestra' : ''} ${f === HOY ? 'hoy' : ''} ${i.estimado ? 'est' : ''}" data-acc="dia" data-f="${f}" aria-label="${esc(F.fechaLarga(f) + ': ' + nombreF(i.turno))}">
        <span class="n">${F.aD(f).getUTCDate()}</span>${cont}
        <span class="pts">${recs.length ? '<i></i>' : ''}${dd && (dd.notas || dd.foco) ? '<i class="nota"></i>' : ''}</span>${i.cambio && i.cambio.f !== i.oficial ? '<span class="ico-cambio">⇄</span>' : ''}</button>`;
    }
    const resto = (7 - (vacias + F.finDeMes(a, m)) % 7) % 7;
    for (let k = 0; k < resto; k++) celdas += `<div class="c fuera"></div>`;
    const porF = Object.entries(r.porFarmacia).map(([id, n]) => `${esc(nombreF(id))} ${n}`).join(' · ');
    const lista = A.guardiasNuestras(ini, fin);
    return cab('turnos', '', '', `<div class="nav-mes" style="margin-top:4px"><button class="redondo" data-acc="mes" data-d="-1" aria-label="Mes anterior">${I('izq')}</button>
        <div class="medio"><h1 style="font-size:26px">${esc(F.MESES[m - 1])}</h1><div class="script" style="font-size:24px">${a}</div></div>
        <button class="redondo" data-acc="mes" data-d="1" aria-label="Mes siguiente">${I('der')}</button></div>`) +
      `<div class="seg"><button class="${todas ? '' : 'act'}" data-acc="ver" data-v="0">Sólo las nuestras</button><button class="${todas ? 'act' : ''}" data-acc="ver" data-v="1">Todas</button></div>
      ${hayEst ? `<div class="aviso">✎ Desde el ${F.fechaCorta(F.sumar(A.E.confirmadoHasta, 1))} es <b>estimado</b> siguiendo la rotación. Cuando salga el listado, confirmalo en Más.</div>` : ''}
      <div class="hoja-p" style="padding:12px 10px 12px"><div class="grilla">${celdas}</div>
        ${V.mes !== HOY.slice(0, 7) ? `<div style="text-align:center;margin-top:10px"><button class="btn sec chico" data-acc="mesHoy">Volver a este mes</button></div>` : ''}</div>
      <div class="hoja-p lila"><span class="cinta cuadros">Guardias del mes</span><span class="adorno" style="right:-6px;top:-18px">${Ad.flor(36)}</span>
        <div class="resumen-mes"><span><b>${r.total}</b> guardias nuestras</span>${porF ? `<span>${porF}</span>` : ''}
        ${r.cedidas ? `<span class="chip ced">${r.cedidas} cedida${r.cedidas > 1 ? 's' : ''}</span>` : ''}${r.tomadas ? `<span class="chip tom">${r.tomadas} tomada${r.tomadas > 1 ? 's' : ''}</span>` : ''}</div>
        <div class="lista-guardias">${lista.map(i => `<button data-acc="dia" data-f="${i.fecha}">${DIAS3[F.diaSemana(i.fecha)]} ${F.aD(i.fecha).getUTCDate()} · ${esc(nombreF(i.turno))}</button>`).join('')}</div></div>`;
  }

  // =================== SEMANA
  function pSemana() {
    const l = V.lunes, dom = F.sumar(l, 6), dl = F.aD(l), dd = F.aD(dom);
    const titulo = dl.getUTCMonth() === dd.getUTCMonth() ? `${dl.getUTCDate()} al ${dd.getUTCDate()} de ${F.MESES[dd.getUTCMonth()]}` : `${dl.getUTCDate()} ${F.MESES[dl.getUTCMonth()].slice(0, 3)} al ${dd.getUTCDate()} ${F.MESES[dd.getUTCMonth()].slice(0, 3)}`;
    let filas = '';
    for (let k = 0; k < 7; k++) {
      const f = F.sumar(l, k), i = A.info(f), recs = A.recordatoriosDe(f), dia = A.E.dias[f], d = F.aD(f);
      const pend = dia ? (dia.pendientes || []).filter(p => !p.ok).length : 0;
      const tur = i.nuestra ? `<span class="resaltado"><b>Guardia ${esc(nombreF(i.turno))}</b></span>${i.tomada ? ' <span class="chip tom">cambio</span>' : ''}`
        : `<span class="ph">De turno:</span> ${esc(nombreF(i.turno))}${i.cedida ? ` <span class="chip ced">cedida</span>` : ''}`;
      filas += `<div class="dia-sem ${f === HOY ? 'hoy' : ''}" data-acc="dia" data-f="${f}"><div class="izq"><small>${F.DIAS[d.getUTCDay()].slice(0, 3)}</small><b>${d.getUTCDate()}</b></div>
        <div class="der"><div class="tur">${tur}${i.estimado ? ' <span class="chip est">a confirmar</span>' : ''}</div>
        ${recs.map(r => `<div class="rec ${r.hecho ? 'tachado' : ''}">${Ad.corazon(10)} ${r.hora ? `<span class="h">${r.hora}</span> ` : ''}${esc(r.titulo)}</div>`).join('')}
        ${pend ? `<div class="rec" style="color:var(--tenue)">☐ ${pend} pendiente${pend > 1 ? 's' : ''}</div>` : ''}${dia && dia.notas ? `<div class="rec" style="color:var(--tenue)">✎ ${esc(dia.notas)}</div>` : ''}</div></div>`;
    }
    const n = A.guardiasNuestras(l, dom).length;
    return cab('semana', '', '', `<div class="nav-mes" style="margin-top:6px"><button class="redondo" data-acc="sem" data-d="-7" aria-label="Semana anterior">${I('izq')}</button>
        <div class="medio"><h1 style="font-size:19px;letter-spacing:.08em">${esc(titulo)}</h1><div class="script" style="font-size:22px">${n ? n + (n > 1 ? ' guardias' : ' guardia') + ' esta semana' : 'sin guardias esta semana'}</div></div>
        <button class="redondo" data-acc="sem" data-d="7" aria-label="Semana siguiente">${I('der')}</button></div>`) +
      `<div class="hoja-p" style="padding:10px 12px"><span class="cinta">Agenda semanal</span><span class="adorno" style="right:-10px;top:-20px">${Ad.mariposa(40)}</span><div style="margin-top:10px">${filas}</div></div>
      ${V.lunes !== F.lunesDe(HOY) ? `<div style="text-align:center"><button class="btn sec chico" data-acc="semHoy">Volver a esta semana</button></div>` : ''}`;
  }

  // =================== RECORDAR
  function pRecordar() {
    const prox = A.recordatoriosEntre(HOY, F.sumar(HOY, 60));
    const atras = A.recordatoriosEntre(F.sumar(HOY, -30), F.sumar(HOY, -1)).filter(r => !r.hecho);
    const porDia = {}; prox.forEach(r => (porDia[r.dia] = porDia[r.dia] || []).push(r));
    const bloques = Object.keys(porDia).map(f => `<div style="margin-top:10px"><div style="font:600 12px var(--serif);letter-spacing:.1em;text-transform:uppercase;color:var(--lila-osc)">${f === HOY ? 'Hoy' : esc(F.fechaLarga(f))} <span style="color:var(--tenue);font-weight:400;text-transform:none;letter-spacing:0">· ${faltan(f)}</span></div>${porDia[f].map(r => filaRec(r, false)).join('')}</div>`).join('');
    const todos = A.E.recordatorios.slice().sort((x, y) => x.fecha < y.fecha ? -1 : 1);
    return cab('no te olvides', 'Recordar', 'lo importante') +
      `<div style="text-align:center"><button class="btn" data-acc="nuevoRec" data-f="${HOY}">${I('mas_', 20)} Nuevo recordatorio</button></div>
      ${atras.length ? `<div class="hoja-p"><span class="cinta cuadros">Quedaron sin marcar</span>${atras.map(r => filaRec(r, true)).join('')}</div>` : ''}
      <div class="hoja-p"><span class="cinta">Próximos 60 días</span><span class="adorno" style="right:4px;top:-10px">${Ad.chinche()}</span>${bloques || '<div class="vacio">No hay recordatorios</div>'}</div>
      ${todos.length ? `<div class="hoja-p"><span class="cinta papel">Todos (${todos.length})</span>${todos.map(r => `<div class="fila toca" data-acc="editRec" data-id="${r.id}" data-f="${r.fecha}"><div class="txt"><b>${esc(r.titulo)}</b><small>${F.fechaCorta(r.fecha)}/${r.fecha.slice(0, 4)}${r.hora ? ' · ' + r.hora : ''}${r.repetir !== 'no' ? ' · ' + repTxt[r.repetir] : ''}</small></div>${I('lapiz', 18)}</div>`).join('')}</div>` : ''}`;
  }

  // =================== MÁS
  function pMas() {
    const E = A.E, rs = E.rotaciones.slice().sort((a, b) => a.desde < b.desde ? 1 : -1);
    const ultima = E.cfg.ultimaCopia ? F.entre(E.cfg.ultimaCopia, HOY) : null;
    return cab('ajustes', 'Más', 'farmacias y copias') +
      `<div class="hoja-p"><span class="cinta">Farmacias de turno</span>
        ${E.farmacias.map(x => `<div class="fila"><span style="color:${x.nuestra ? 'var(--lila-osc)' : 'var(--tenue2)'}">${I('farmacia', 18)}</span><div class="txt"><b>${x.nuestra ? `<span class="resaltado">${esc(x.nombre)}</span>` : esc(x.nombre)}</b><small>${x.nuestra ? 'Nuestra' : ''}${x.corto && x.corto !== x.nombre ? (x.nuestra ? ' · ' : '') + 'en el calendario: ' + esc(x.corto) : ''}</small></div></div>`).join('')}
        <div class="botones"><button class="btn sec" data-acc="farmacias">${I('lapiz', 18)} Cambiar farmacias</button></div></div>
      <div class="hoja-p"><span class="cinta cuadros">Listado de turnos</span>
        ${rs.map(r => `<div style="margin:8px 0 4px"><b style="font-family:var(--serif)">Desde el ${F.fechaCorta(r.desde)}/${r.desde.slice(0, 4)}</b> <small style="color:var(--tenue)">(cada ${r.orden.length} días se repite)</small>
          <div class="muestra">${r.orden.map(id => A.esNuestra(id) ? `<span class="resaltado">${esc(nombreF(id))}</span>` : esc(nombreF(id))).join(' → ')}</div></div>`).join('')}
        <div style="margin-top:12px;font-size:14px">Confirmado hasta el <b>${F.fechaCorta(E.confirmadoHasta)}/${E.confirmadoHasta.slice(0, 4)}</b>. Después es estimado.</div>
        <div class="botones"><button class="btn sec" data-acc="confirmar">Cambiar fecha confirmada</button><button class="btn sec" data-acc="listado">Cargar listado nuevo</button></div></div>
      <div class="hoja-p lila"><span class="cinta">Calendario del iPhone</span><span class="adorno" style="left:-8px;top:-14px">${Ad.clip(40)}</span>
        <div style="font-size:14px">Pasa nuestras guardias al calendario del iPhone, así te avisa la noche anterior.</div>
        <div class="botones"><button class="btn" data-acc="icsGuardias">${I('cal', 18)} Pasar guardias al calendario</button></div></div>
      <div class="hoja-p"><span class="cinta papel">Copia de seguridad</span>
        <div style="font-size:14px">Todo queda guardado en este celular. Guardá una copia de vez en cuando (en WhatsApp, Drive o Archivos) por si se cambia o se pierde el teléfono.</div>
        <div class="muestra">${ultima == null ? 'Todavía no guardaste ninguna copia.' : 'Última copia: ' + (ultima === 0 ? 'hoy' : 'hace ' + ultima + ' día' + (ultima > 1 ? 's' : ''))}</div>
        <div class="botones"><button class="btn" data-acc="copia">${I('guardar', 18)} Guardar copia</button><label class="btn sec" style="cursor:pointer">${I('subir', 18)} Restaurar copia<input type="file" accept=".json,application/json,text/plain" data-acc="restaurar" hidden></label></div></div>
      <div class="hoja-p"><span class="cinta chica">Instalar en el iPhone</span>
        <ol style="margin:6px 0 0;padding-left:20px;font-size:14px;line-height:1.7"><li>Abrir este link en <b>Safari</b>.</li><li>Tocar <b>Compartir</b> ${I('compartir', 16)} (abajo).</li><li>Elegir <b>“Agregar a inicio”</b> y tocar <b>Agregar</b>.</li><li>Abrirla siempre desde el ícono “Agenda”.</li></ol></div>
      <div class="pie">Agenda de guardias · RoFac ${VERSION}<br>hecha con ${Ad.corazon(10)} para Mariana</div>`;
  }

  function instalarAviso() {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent), suelta = !(navigator.standalone || matchMedia('(display-mode: standalone)').matches);
    let visto = false; try { visto = localStorage.getItem('rofac_agenda_instalar') === '1'; } catch (e) {}
    if (!ios || !suelta || visto) return '';
    return `<div class="aviso instalar">${I('compartir', 22)}<div style="flex:1">Para tenerla como app: tocá <b>Compartir</b> y <b>“Agregar a inicio”</b>.</div><button class="mini" data-acc="noInstalar" aria-label="Cerrar">${I('cruz', 16)}</button></div>`;
  }

  // =================== HOJA DEL DÍA
  function hDia(f) {
    return () => {
      const i = A.info(f), recs = A.recordatoriosDe(f), dd = A.dia(f), cambiado = i.cambio && i.cambio.f !== i.oficial;
      let quien = i.nuestra ? `<div style="font-size:13px;color:var(--tenue)">Tenemos guardia</div><div style="font:600 24px var(--serif)"><span class="resaltado">${esc(nombreF(i.turno))}</span></div>`
        : `<div style="font-size:13px;color:var(--tenue)">Está de turno</div><div style="font:600 24px var(--serif)">${esc(nombreF(i.turno))}</div>`;
      let det = '';
      if (i.cedida) det = `Era nuestra (<span class="tachado">${esc(nombreF(i.oficial))}</span>) y se la cedimos.`;
      else if (i.tomada) det = `Era de ${esc(nombreF(i.oficial))} y la hacemos nosotros.`;
      else if (cambiado) det = `En el listado figuraba ${esc(nombreF(i.oficial))}.`;
      if (i.cambio && i.cambio.par) det += ` Intercambio con el ${esc(F.fechaLarga(i.cambio.par))}.`;
      if (i.cambio && i.cambio.nota) det += ` <i>“${esc(i.cambio.nota)}”</i>`;
      if (i.estimado) det += ' <span class="chip est">a confirmar</span>';
      return `${btnCerrar}<h2>${esc(F.fechaLarga(f))}</h2><div class="sub">${faltan(f) === 'hoy' ? 'Hoy' : faltan(f)}</div>
        <div class="bloque" style="${i.nuestra ? 'background:#efe7f8' : ''}">${quien}${det ? `<div style="font-size:13.5px;margin-top:4px">${det}</div>` : ''}
          <div class="botones" style="margin-top:10px"><button class="btn chico" data-acc="cambiar" data-f="${f}">${I('cambio', 17)} Cambiar guardia</button>
          ${i.cambio ? `<button class="btn sec chico" data-acc="original" data-f="${f}">Volver al listado</button>` : ''}</div></div>
        <div class="bloque"><div class="flex"><b style="font-family:var(--serif);color:var(--lila-osc)">Recordatorios</b><span class="sp"></span><button class="btn sec chico" data-acc="nuevoRec" data-f="${f}">${I('mas_', 16)} Agregar</button></div>
          ${recs.map(r => filaRec(r, false)).join('') || '<div class="vacio" style="font-size:14px">Ninguno</div>'}</div>
        <div class="bloque"><b style="font-family:var(--serif);color:var(--lila-osc)">Nota del día</b>
          <textarea class="in renglones" data-dia="notas" data-f="${f}" placeholder="Escribí algo para este día…">${esc(dd.notas)}</textarea></div>`;
    };
  }

  // ---------- cambiar guardia
  function hCambiar(f, sel) {
    return () => {
      const i = A.info(f), elegido = sel.quien || i.turno, of = i.oficial, nuestraOf = A.esNuestra(of);
      const lista = A.E.farmacias.slice().sort((a, b) => (b.nuestra ? 1 : 0) - (a.nuestra ? 1 : 0));
      const puedeInter = nuestraOf && elegido !== of && !A.esNuestra(elegido);
      let sugs = '';
      if (puedeInter) {
        const dias = []; for (let k = -40; k <= 90 && dias.length < 6; k++) { const g = F.sumar(f, k); if (k !== 0 && g >= F.sumar(HOY, -7) && A.oficial(g) === elegido && !A.E.cambios[g]) dias.push(g); }
        sugs = dias.map(g => `<button type="button" class="${sel.par === g ? 'act' : ''}" data-acc="sugPar" data-g="${g}">${DIAS3[F.diaSemana(g)]} ${F.fechaCorta(g)}</button>`).join('');
      }
      return `${btnCerrar}<h2>Cambiar guardia</h2><div class="sub">${esc(F.fechaLarga(f))} · en el listado: <b>${esc(nombreF(of))}</b></div>
        <label class="l">¿Quién hace la guardia ese día?</label>
        <div class="pills">${lista.map(x => `<button type="button" class="${x.id === elegido ? 'act' : ''} ${x.nuestra ? 'nues' : ''}" data-acc="elegir" data-id="${x.id}">${esc(x.nombre)}${x.id === of ? ' <small>(listado)</small>' : ''}</button>`).join('')}</div>
        ${puedeInter ? `<label class="chk"><input type="checkbox" id="cInter" ${sel.inter ? 'checked' : ''} data-acc="inter"> Nos devuelve otro día (intercambio)</label>
          <div class="${sel.inter ? '' : 'oculto'}" id="cInterBox"><div style="font-size:13px;color:var(--tenue)">Días que está de turno ${esc(nombreF(elegido))}: ese día lo hacemos nosotros (${esc(nombreF(of))}).</div>
            <div class="sug">${sugs || '<span style="font-size:13px;color:var(--tenue)">No hay días cerca: elegí la fecha abajo.</span>'}</div>
            <input class="in" type="date" id="cPar" value="${sel.par || ''}" style="margin-top:8px"></div>` : ''}
        <label class="l">Nota (opcional)</label><input class="in" id="cNota" value="${esc(sel.nota != null ? sel.nota : (i.cambio && i.cambio.nota) || '')}" placeholder="Ej.: a cambio de…, se la pidió Fulano">
        <div class="error" id="cErr"></div>
        <div class="botones"><button class="btn sec" data-acc="dia" data-f="${f}">Volver</button><button class="btn" data-acc="guardarCambio" data-f="${f}">Guardar</button></div>`;
    };
  }

  // ---------- recordatorio
  function hRec(r) {
    return () => `${btnCerrar}<h2>${r.id ? 'Recordatorio' : 'Nuevo recordatorio'}</h2>
      <label class="l">¿Qué hay que recordar?</label><input class="in" id="rT" value="${esc(r.titulo || '')}" placeholder="Ej.: Ginecólogo, pagar luz, cumple de…" autocomplete="off">
      <div class="dos"><div><label class="l">Fecha</label><input class="in" type="date" id="rF" value="${r.fecha || HOY}"></div>
        <div><label class="l">Hora (opcional)</label><input class="in" type="time" id="rH" value="${r.hora || ''}"></div></div>
      <label class="l">Repetir</label><div class="pills" id="rRep">${[['no', 'No'], ['semana', 'Cada semana'], ['mes', 'Cada mes'], ['anio', 'Cada año']].map(([v, t]) => `<button type="button" data-acc="rep" data-v="${v}" class="${(r.repetir || 'no') === v ? 'act' : ''}">${t}</button>`).join('')}</div>
      <label class="l">Nota</label><textarea class="in" id="rN" placeholder="Opcional">${esc(r.nota || '')}</textarea>
      <div class="error" id="rErr"></div>
      <div class="botones"><button class="btn" data-acc="guardarRec" data-id="${r.id || ''}">Guardar</button><button class="btn sec" data-acc="guardarRec" data-id="${r.id || ''}" data-ics="1">${I('cal', 17)} Guardar y al calendario</button></div>
      ${r.id ? `<div class="botones"><button class="btn sec chico" data-acc="icsRec" data-id="${r.id}">${I('cal', 16)} Pasar al calendario del iPhone</button><button class="btn peligro chico" data-acc="borrarRec" data-id="${r.id}">${I('basura', 16)} Borrar</button></div>` : ''}`;
  }

  // ---------- farmacias
  function hFarmacias(lista) {
    return () => `${btnCerrar}<h2>Farmacias</h2><div class="sub">Marcá con ★ las nuestras. “Corto” es como se ve en el calendario del mes.</div>
      ${lista.map((x, k) => `<div class="bloque" style="padding:10px"><div class="flex"><input class="in" data-fk="${k}" data-campo="nombre" value="${esc(x.nombre)}" placeholder="Nombre" style="flex:2">
        <input class="in" data-fk="${k}" data-campo="corto" value="${esc(x.corto || '')}" placeholder="Corto" style="flex:1.2" maxlength="10"></div>
        <div class="flex" style="margin-top:6px"><label class="chk" style="margin:0"><input type="checkbox" data-fk="${k}" data-campo="nuestra" ${x.nuestra ? 'checked' : ''}> ★ Nuestra</label><span class="sp"></span>
        ${x.id ? '' : `<button class="mini rojo" data-acc="farmX" data-k="${k}" aria-label="Quitar">${I('basura', 18)}</button>`}</div></div>`).join('')}
      <div class="botones"><button class="btn sec" data-acc="farmMas">${I('mas_', 18)} Agregar farmacia</button></div>
      <div class="error" id="fErr"></div>
      <div class="botones"><button class="btn" data-acc="farmGuardar">Guardar</button></div>`;
  }
  function leerFarmacias(lista) {
    $$('#hoja [data-fk]').forEach(el => { const x = lista[+el.dataset.fk]; if (!x) return; x[el.dataset.campo] = el.type === 'checkbox' ? el.checked : el.value; });
  }

  // ---------- listado nuevo
  function hListado(s) {
    return () => {
      const prev = s.desde ? A.info(s.desde) : null;
      return `${btnCerrar}<h2>Listado de turnos nuevo</h2><div class="sub">Cuando sale el listado nuevo (o cambia el orden), cargalo desde el día que empieza.</div>
        <label class="l">Empieza el</label><input class="in" type="date" id="lD" value="${s.desde}">
        ${prev ? `<div class="muestra">Con el listado actual ese día está ${esc(nombreF(prev.oficial))}.</div>` : ''}
        <label class="l">Orden (el primero es el de ese día)</label>
        ${s.orden.map((id, k) => `<div class="orden"><span class="nro">${k + 1}</span><span>${A.esNuestra(id) ? `<span class="resaltado">${esc(nombreF(id))}</span>` : esc(nombreF(id))}</span>
          <button class="mini" data-acc="ordMov" data-k="${k}" data-d="-1" ${k ? '' : 'disabled'} aria-label="Subir">${I('arriba', 18)}</button><button class="mini" data-acc="ordMov" data-k="${k}" data-d="1" ${k < s.orden.length - 1 ? '' : 'disabled'} aria-label="Bajar">${I('abajo', 18)}</button>
          <button class="mini rojo" data-acc="ordX" data-k="${k}" aria-label="Sacar">${I('cruz', 16)}</button></div>`).join('')}
        ${A.E.farmacias.filter(x => !s.orden.includes(x.id)).map(x => `<button class="btn sec chico" style="margin:6px 6px 0 0" data-acc="ordAdd" data-id="${x.id}">${I('mas_', 15)} ${esc(x.nombre)}</button>`).join('')}
        <label class="l">Confirmado hasta</label><input class="in" type="date" id="lC" value="${s.hasta}">
        <div class="muestra"><b>Así quedan los primeros días:</b><br>${s.orden.slice(0, 8).map((id, k) => s.desde ? `${F.fechaCorta(F.sumar(s.desde, k))} ${esc(nombreF(id))}` : '').join(' · ')}</div>
        <div class="error" id="lErr"></div>
        <div class="botones"><button class="btn" data-acc="listadoGuardar">Guardar listado</button></div>
        ${A.E.rotaciones.length > 1 ? `<div class="botones">${A.E.rotaciones.map(r => `<button class="btn peligro chico" data-acc="listadoX" data-d="${r.desde}">Borrar listado del ${F.fechaCorta(r.desde)}/${r.desde.slice(2, 4)}</button>`).join('')}</div>` : ''}`;
    };
  }
  function hConfirmar() {
    return () => `${btnCerrar}<h2>Confirmado hasta</h2><div class="sub">Hasta qué día tenés el listado en papel. Después se calcula siguiendo la rotación y se marca “a confirmar”.</div>
      <input class="in" type="date" id="cC" value="${A.E.confirmadoHasta}"><div class="error" id="ccErr"></div>
      <div class="botones"><button class="btn" data-acc="confirmarGuardar">Guardar</button></div>`;
  }

  // ---------- archivos (copia y calendario)
  async function darArchivo(nombre, texto, tipo, compartir) {
    const blob = new Blob([texto], { type: tipo });
    if (compartir) {
      try { const file = new File([blob], nombre, { type: tipo }); if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: nombre }); return true; } }
      catch (e) { if (e && e.name === 'AbortError') return false; }
    }
    const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 30000); return true;
  }
  const alCalendario = (nombre, txt) => { darArchivo(nombre, txt, 'text/calendar', false); toast('Tocá “Agregar” en el calendario que se abre'); };

  // =================== pintar
  const PANT = { hoy: ['Hoy', 'hoy', pHoy], mes: ['Mes', 'mes', pMes], semana: ['Semana', 'semana', pSemana], recordar: ['Recordar', 'recordar', pRecordar], mas: ['Más', 'mas', pMas] };
  function pintar() {
    HOY = F.hoyLocal();
    const s = window.scrollY, p = PANT[V.pant] || PANT.hoy;
    $('#main').innerHTML = p[2](); enganchar($('#main'));
    $('#tabs').innerHTML = '<div class="in-tabs">' + Object.entries(PANT).map(([k, v]) => `<button class="${k === V.pant ? 'act' : ''}" data-acc="ir" data-p="${k}">${I(v[1], 23)}<span>${v[0]}</span></button>`).join('') + '</div>';
    enganchar($('#tabs'));
    return s;
  }
  function ir(p) { V.pant = p; try { sessionStorage.setItem('agenda_pant', p); } catch (e) {} pintar(); window.scrollTo(0, 0); }
  const repintar = () => { const s = window.scrollY; pintar(); window.scrollTo(0, s); };

  // =================== acciones
  let selCambio = {}, recRep = 'no', farmLista = null, lst = null;
  const ACC = {
    ir: d => ir(d.p), cerrar: () => cerrar(),
    dia: d => abrir(hDia(d.f)),
    mes: d => { let [a, m] = V.mes.split('-').map(Number); m += +d.d; if (m < 1) { m = 12; a--; } if (m > 12) { m = 1; a++; } V.mes = a + '-' + String(m).padStart(2, '0'); pintar(); },
    mesHoy: () => { V.mes = HOY.slice(0, 7); pintar(); },
    sem: d => { V.lunes = F.sumar(V.lunes, +d.d); pintar(); }, semHoy: () => { V.lunes = F.lunesDe(HOY); pintar(); },
    ver: d => { A.setCfg('verTodas', d.v === '1'); repintar(); },
    noInstalar: () => { try { localStorage.setItem('rofac_agenda_instalar', '1'); } catch (e) {} repintar(); },
    // guardias
    cambiar: d => { const i = A.info(d.f); selCambio = { quien: i.turno, inter: !!(i.cambio && i.cambio.par), par: i.cambio && i.cambio.par || '', nota: null }; abrir(hCambiar(d.f, selCambio)); },
    elegir: (d, el) => { guardarNotaCambio(); selCambio.quien = d.id; selCambio.par = ''; const f = $('#hoja [data-acc=guardarCambio]').dataset.f; abrir(hCambiar(f, selCambio)); },
    inter: (d, el) => { selCambio.inter = el.checked; $('#cInterBox').classList.toggle('oculto', !el.checked); },
    sugPar: (d, el) => { selCambio.par = d.g; $('#cPar').value = d.g; $$('#hoja .sug button').forEach(b => b.classList.toggle('act', b === el)); },
    guardarCambio: d => {
      const par = selCambio.inter && $('#cPar') ? $('#cPar').value : '';
      if (selCambio.inter && $('#cPar') && !par) { $('#cErr').textContent = 'Elegí qué día nos devuelve la guardia'; return; }
      try { A.cambiar(d.f, selCambio.quien, $('#cNota').value, par || null); } catch (e) { $('#cErr').textContent = e.message; return; }
      toast('Guardia cambiada', true); repintar(); abrir(hDia(d.f));
    },
    original: d => { A.volverOriginal(d.f); toast('Volvió a como está en el listado', true); repintar(); refrescarHoja(); },
    // recordatorios
    nuevoRec: d => { recRep = 'no'; abrir(hRec({ fecha: d.f })); },
    editRec: d => { const r = A.E.recordatorios.find(x => x.id === d.id); if (!r) return; recRep = r.repetir; abrir(hRec(r)); },
    rep: (d, el) => { recRep = d.v; $$('#rRep button').forEach(b => b.classList.toggle('act', b === el)); },
    guardarRec: d => {
      let r; try { r = A.guardarRecordatorio({ id: d.id || null, titulo: $('#rT').value, fecha: $('#rF').value, hora: $('#rH').value, nota: $('#rN').value, repetir: recRep }); }
      catch (e) { $('#rErr').textContent = e.message; return; }
      cerrar(); repintar(); toast(d.id ? 'Recordatorio guardado' : 'Recordatorio agregado', true);
      if (d.ics) alCalendario('recordatorio.ics', A.icsRecordatorio(r));
    },
    borrarRec: d => { A.borrarRecordatorio(d.id); cerrar(); repintar(); toast('Recordatorio borrado', true); },
    icsRec: d => { const r = A.E.recordatorios.find(x => x.id === d.id); if (r) alCalendario('recordatorio.ics', A.icsRecordatorio(r)); },
    hecho: (d, el) => { const si = !el.classList.contains('ok'); A.marcarHecho(d.id, d.f, si); repintar(); refrescarHoja(); if (si) toast('¡Hecho!', true); },
    // mi día
    pend: d => { const dd = A.dia(d.f), p = (dd.pendientes || []).map(x => ({ ...x })); p[+d.k].ok = !p[+d.k].ok; A.guardarDia(d.f, { pendientes: p }, 'el pendiente'); repintar(); },
    pendX: d => { const dd = A.dia(d.f), p = (dd.pendientes || []).slice(); p.splice(+d.k, 1); A.guardarDia(d.f, { pendientes: p }, 'el pendiente borrado'); repintar(); toast('Pendiente borrado', true); },
    agua: d => { const dd = A.dia(d.f), n = +d.n === dd.agua ? n0(d.n) : +d.n; A.guardarDia(d.f, { agua: n }, 'el agua'); repintar(); },
    animo: d => { const dd = A.dia(d.f); A.guardarDia(d.f, { animo: dd.animo === +d.n ? 0 : +d.n }, 'el ánimo'); repintar(); },
    // más
    farmacias: () => { farmLista = A.E.farmacias.map(x => ({ ...x })); abrir(hFarmacias(farmLista)); },
    farmMas: () => { leerFarmacias(farmLista); farmLista.push({ nombre: '', corto: '' }); abrir(hFarmacias(farmLista)); },
    farmX: d => { leerFarmacias(farmLista); farmLista.splice(+d.k, 1); abrir(hFarmacias(farmLista)); },
    farmGuardar: () => { leerFarmacias(farmLista); try { A.guardarFarmacias(farmLista.map(x => ({ ...x }))); } catch (e) { $('#fErr').textContent = e.message; return; } cerrar(); repintar(); toast('Farmacias guardadas', true); },
    listado: () => { const desde = F.sumar(A.E.confirmadoHasta, 1), r = A.E.rotaciones[A.E.rotaciones.length - 1], of = A.oficial(desde), k = r.orden.indexOf(of);
      lst = { desde, orden: r.orden.slice(k).concat(r.orden.slice(0, k)), hasta: F.sumar(desde, 364) }; abrir(hListado(lst)); },
    ordMov: d => { leerListado(); const k = +d.k, j = k + +d.d; [lst.orden[k], lst.orden[j]] = [lst.orden[j], lst.orden[k]]; abrir(hListado(lst)); },
    ordX: d => { leerListado(); lst.orden.splice(+d.k, 1); abrir(hListado(lst)); },
    ordAdd: d => { leerListado(); lst.orden.push(d.id); abrir(hListado(lst)); },
    listadoGuardar: () => { leerListado(); try { A.nuevoListado(lst.desde, lst.orden, lst.hasta); } catch (e) { $('#lErr').textContent = e.message; return; } cerrar(); repintar(); toast('Listado guardado', true); },
    listadoX: d => { try { A.borrarListado(d.d); } catch (e) { $('#lErr').textContent = e.message; return; } cerrar(); repintar(); toast('Listado borrado', true); },
    confirmar: () => abrir(hConfirmar()),
    confirmarGuardar: () => { try { A.setConfirmado($('#cC').value); } catch (e) { $('#ccErr').textContent = e.message; return; } cerrar(); repintar(); toast('Guardado', true); },
    icsGuardias: () => { const d = HOY, h = A.E.confirmadoHasta > HOY ? A.E.confirmadoHasta : F.sumar(HOY, 60), n = A.guardiasNuestras(d, h).length;
      if (!n) return toast('No hay guardias para pasar', false, true); alCalendario('guardias.ics', A.icsGuardias(d, h)); },
    copia: async () => { const ok = await darArchivo('agenda-copia-' + HOY + '.json', A.exportar(), 'application/json', true); if (ok) { A.setCfg('ultimaCopia', HOY); repintar(); toast('Copia guardada'); } },
  };
  const n0 = n => Math.max(0, +n - 1);
  function guardarNotaCambio() { const n = $('#cNota'); if (n) selCambio.nota = n.value; const p = $('#cPar'); if (p) selCambio.par = p.value; }
  function leerListado() { const d = $('#lD'), c = $('#lC'); if (d) lst.desde = d.value; if (c) lst.hasta = c.value; }

  function enganchar(raiz) {
    raiz.querySelectorAll('[data-acc]').forEach(el => {
      const acc = el.dataset.acc;
      if (el.tagName === 'FORM') return el.addEventListener('submit', e => { e.preventDefault(); const t = el.t.value.trim(); if (!t) return; const dd = A.dia(el.dataset.f); A.guardarDia(el.dataset.f, { pendientes: (dd.pendientes || []).concat([{ t, ok: false }]) }, 'el pendiente'); repintar(); setTimeout(() => { const i = $(`form[data-f="${el.dataset.f}"] input`); i && i.focus(); }, 30); });
      if (acc === 'restaurar') return el.addEventListener('change', async () => {
        const f = el.files[0]; if (!f) return; const t = await f.text();
        if (!confirm('¿Reemplazar todo lo de la agenda por esta copia?')) { el.value = ''; return; }
        intentar(() => A.importar(t), 'Copia restaurada'); el.value = ''; repintar();
      });
      if (acc === 'inter') return el.addEventListener('change', () => ACC.inter(el.dataset, el));
      el.addEventListener('click', e => { if (!ACC[acc]) return; if (el.tagName !== 'INPUT') e.preventDefault(); e.stopPropagation(); ACC[acc](el.dataset, el); });
    });
    raiz.querySelectorAll('[data-dia]').forEach(el => {
      el.addEventListener('change', () => { A.guardarDia(el.dataset.f, { [el.dataset.dia]: el.value.trim() }, 'la nota'); toast('Guardado'); if (raiz.id === 'hoja') repintar(); });
      if (el.tagName === 'INPUT') el.addEventListener('keydown', e => { if (e.key === 'Enter') el.blur(); });
    });
    raiz.querySelectorAll('#cPar').forEach(el => el.addEventListener('change', () => { selCambio.par = el.value; $$('#hoja .sug button').forEach(b => b.classList.toggle('act', b.dataset.g === el.value)); }));
    raiz.querySelectorAll('#lD').forEach(el => el.addEventListener('change', () => { leerListado(); abrir(hListado(lst)); }));
  }

  // al volver a la app otro día, se actualiza "hoy"
  document.addEventListener('visibilitychange', () => { if (!document.hidden && F.hoyLocal() !== HOY) { V.lunes = F.lunesDe(F.hoyLocal()); V.mes = F.hoyLocal().slice(0, 7); pintar(); } });
  window.AgendaApp = { A, pintar, ir };
  pintar();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
