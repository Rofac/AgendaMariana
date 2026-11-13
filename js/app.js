/* Agenda de guardias — pantallas */
(function () {
  const F = Agenda.F, A = Agenda.cargar(), Ad = Adorno, I = Ad.icono;
  const $ = s => document.querySelector(s), $$ = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const VERSION = 'v1.1';
  const DIAS3 = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  const FRASES = ['Un día a la vez', 'Paso a paso', 'Hoy también suma', 'Respirá, vas bien', 'Pequeños pasos, grandes cambios', 'Lo que hacés con amor se nota'];
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}

  let HOY = F.hoyLocal();
  const V = { pant: 'inicio', mes: HOY.slice(0, 7), lunes: F.lunesDe(HOY) };
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

  // =================== MI DÍA
  function pHoy() {
    const d = F.aD(HOY), dd = A.dia(HOY);
    const recs = A.recordatoriosDe(HOY), citas = A.citasDe(HOY);
    const tareas = A.tareasPendientes().filter(t => t.fecha && t.fecha <= HOY), H = A.E.habitos;
    return volver() + cab('un día a la vez', F.DIAS[d.getUTCDay()], d.getUTCDate() + ' de ' + F.MESES[d.getUTCMonth()]) +
      instalarAviso() + turnoCard() +
      (citas.length ? `<div class="hoja-p"><span class="cinta">Citas de hoy</span>${citas.map(c => filaCita(c, false)).join('')}</div>` : '') +
      `<div class="hoja-p"><span class="cinta cuadros">Para hoy</span><span class="adorno" style="right:6px;top:-10px">${Ad.chinche()}</span>
        ${tareas.map(filaTarea).join('')}${recs.map(r => filaRec(r, true)).join('')}
        ${tareas.length || recs.length ? '' : '<div class="vacio">Nada pendiente para hoy ' + Ad.corazon(12) + '</div>'}
        <div class="botones"><button class="btn sec chico" data-acc="nuevaTarea" data-f="${HOY}">${I('mas_', 18)} Tarea</button><button class="btn sec chico" data-acc="nuevoRec" data-f="${HOY}">${I('mas_', 18)} Recordatorio</button></div></div>
      ${H.length ? `<div class="hoja-p"><span class="cinta">Hábitos de hoy</span><div class="pills" style="margin-top:6px">${H.map(h => `<button class="${A.habitoHecho(h.id, HOY) ? 'act' : ''}" data-acc="habDia" data-id="${h.id}" data-f="${HOY}">${esc(h.emoji)} ${esc(h.nombre)}</button>`).join('')}</div></div>` : ''}
      ${miDia(HOY, dd)}
      <div class="frase">“${esc(FRASES[F.entre('2026-01-01', HOY) % FRASES.length])}” ${Ad.corazon(14)}</div>`;
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
        <span class="pts">${A.citasDe(f).length ? '<i class="cita"></i>' : ''}${recs.length || A.tareasDe(f).some(t => !t.ok) ? '<i></i>' : ''}${dd && (dd.notas || dd.foco) ? '<i class="nota"></i>' : ''}</span>${i.cambio && i.cambio.f !== i.oficial ? '<span class="ico-cambio">⇄</span>' : ''}</button>`;
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
        ${A.citasDe(f).map(c => `<div class="rec">${I('estetos', 13)} ${c.hora ? `<span class="h">${c.hora}</span> ` : ''}${esc(c.titulo)}</div>`).join('')}
        ${A.tareasDe(f).map(t => `<div class="rec ${t.ok ? 'tachado' : ''}">☐ ${esc(t.t)}</div>`).join('')}
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
  function pRecordar() { return volver() + cab('no te olvides', 'Recordar', 'lo importante') + cuerpoRecordar(); }
  function cuerpoRecordar() {
    const prox = A.recordatoriosEntre(HOY, F.sumar(HOY, 60));
    const atras = A.recordatoriosEntre(F.sumar(HOY, -30), F.sumar(HOY, -1)).filter(r => !r.hecho);
    const porDia = {}; prox.forEach(r => (porDia[r.dia] = porDia[r.dia] || []).push(r));
    const bloques = Object.keys(porDia).map(f => `<div style="margin-top:10px"><div style="font:600 12px var(--serif);letter-spacing:.1em;text-transform:uppercase;color:var(--lila-osc)">${f === HOY ? 'Hoy' : esc(F.fechaLarga(f))} <span style="color:var(--tenue);font-weight:400;text-transform:none;letter-spacing:0">· ${faltan(f)}</span></div>${porDia[f].map(r => filaRec(r, false)).join('')}</div>`).join('');
    const todos = A.E.recordatorios.slice().sort((x, y) => x.fecha < y.fecha ? -1 : 1);
    return `<div class="muestra" style="text-align:center;margin:0 0 8px">Los recordatorios tienen día y hora y se pueden repetir (cada semana, mes o año).</div>
      <div style="text-align:center"><button class="btn" data-acc="nuevoRec" data-f="${HOY}">${I('mas_', 20)} Nuevo recordatorio</button></div>
      ${atras.length ? `<div class="hoja-p"><span class="cinta cuadros">Quedaron sin marcar</span>${atras.map(r => filaRec(r, true)).join('')}</div>` : ''}
      <div class="hoja-p"><span class="cinta">Próximos 60 días</span><span class="adorno" style="right:4px;top:-10px">${Ad.chinche()}</span>${bloques || '<div class="vacio">No hay recordatorios</div>'}</div>
      ${todos.length ? `<div class="hoja-p"><span class="cinta papel">Todos (${todos.length})</span>${todos.map(r => `<div class="fila toca" data-acc="editRec" data-id="${r.id}" data-f="${r.fecha}"><div class="txt"><b>${esc(r.titulo)}</b><small>${F.fechaCorta(r.fecha)}/${r.fecha.slice(0, 4)}${r.hora ? ' · ' + r.hora : ''}${r.repetir !== 'no' ? ' · ' + repTxt[r.repetir] : ''}</small></div>${I('lapiz', 18)}</div>`).join('')}</div>` : ''}`;
  }

  // =================== INICIO (accesos rápidos)
  const volver = () => `<button class="volver" data-acc="ir" data-p="inicio">${I('izq', 18)} Inicio</button>`;
  const fechaChica = f => `${DIAS3[F.diaSemana(f)]} ${F.fechaCorta(f)}`;
  function pInicio() {
    const d = F.aD(HOY), i = A.info(HOY), prox = A.proximasNuestras(F.sumar(HOY, 1), 1)[0];
    const cita = A.citasEntre(HOY, F.sumar(HOY, 365)).find(c => !c.fui);
    const pend = A.tareasPendientes(), paraHoy = pend.filter(t => t.fecha && t.fecha <= HOY).length + A.recordatoriosDe(HOY).filter(r => !r.hecho).length;
    const hab = A.E.habitos, hechos = hab.filter(h => A.habitoHecho(h.id, HOY)).length;
    const citas7 = A.citasEntre(HOY, F.sumar(HOY, 7)).filter(c => !c.fui).length;
    const metasAbiertas = A.E.metas.filter(m => m.avance < 100).length;
    const T = [['mes', 'Calendario', 'mes', 'lila', ''], ['hoy', 'Mi Día', 'midia', 'lila', paraHoy || ''], ['semana', 'Mi Semana', 'semana', 'lila', ''],
      ['guardias', 'Guardias', 'guardia', 'lila', i.nuestra ? 'hoy' : ''], ['citas', 'Citas Médicas', 'estetos', 'rosa', citas7 || ''], ['tareas', 'Tareas', 'tareas', 'beige', pend.length || ''],
      ['notas', 'Notas', 'libreta', 'lila', ''], ['habitos', 'Hábitos', 'brote', 'beige', hab.length ? `${hechos}/${hab.length}` : ''], ['metas', 'Metas', 'diana', 'rosa', metasAbiertas || '']];
    const linea = (p, ic, html) => `<div class="ini-l" data-acc="ir" data-p="${p}">${I(ic, 20)}<span>${html}</span></div>`;
    return `<div class="ini-cab"><span class="ini-ramo">${Ad.ramo(112)}</span><button class="mini ini-cfg" data-acc="ir" data-p="mas" aria-label="Ajustes">${I('mas', 24)}</button>
        <div class="ini-tit"><div class="ini-cinta"><span>Mi Agenda</span> ${Ad.corazon(18, '#6f5a96')}</div><div class="ini-sub">personal y de guardias</div></div></div>
      ${instalarAviso()}
      <div class="hoja-p ini-hoy"><span class="cinta">Hoy · ${esc(F.DIAS[d.getUTCDay()])} ${d.getUTCDate()}</span>
        ${linea('guardias', 'guardia', i.nuestra ? `<b>¡Hoy tenemos guardia!</b> <span class="resaltado">${esc(nombreF(i.turno))}</span>` : `De turno: <b>${esc(nombreF(i.turno))}</b>${prox ? ` · próxima nuestra <b>${fechaChica(prox.fecha)}</b> (${faltan(prox.fecha)})` : ''}`)}
        ${cita ? linea('citas', 'estetos', `Próxima cita: <b>${esc(cita.titulo)}</b> · ${cita.fecha === HOY ? 'hoy' : fechaChica(cita.fecha)}${cita.hora ? ' ' + cita.hora : ''}`) : ''}
        ${linea('tareas', 'tareas', pend.length ? `<b>${pend.length}</b> tarea${pend.length > 1 ? 's' : ''} pendiente${pend.length > 1 ? 's' : ''}${paraHoy ? ` · <b>${paraHoy}</b> para hoy` : ''}` : 'Sin tareas pendientes ' + Ad.corazon(11))}
        ${hab.length ? linea('habitos', 'brote', `Hábitos de hoy: <b>${hechos} de ${hab.length}</b>`) : ''}</div>
      <div class="ini-grid">${T.map(([p, t, ic, col, b]) => `<button class="ini-t ${col}" data-acc="ir" data-p="${p}">${b !== '' ? `<span class="ini-b">${b}</span>` : ''}${I(ic, 34)}<span>${t}</span></button>`).join('')}</div>
      <div class="ini-pie">${Ad.libros(150)}<div class="frase" style="padding:0">“${esc(FRASES[F.entre('2026-01-01', HOY) % FRASES.length])}” ${Ad.corazon(13)}</div></div>`;
  }

  // =================== GUARDIAS
  function turnoCard() {
    const i = A.info(HOY);
    const turno = i.nuestra ? `<div class="msg">¡Hoy tenemos guardia!</div><div class="quien"><span class="resaltado">${esc(nombreF(i.turno))}</span></div>
        <div class="det">${i.tomada ? 'Tomada de ' + esc(nombreF(i.oficial)) : 'Farmacia de turno'}${i.cambio && i.cambio.nota ? ' · ' + esc(i.cambio.nota) : ''}</div>`
      : `<div class="det">Hoy está de turno</div><div class="quien">${esc(nombreF(i.turno))}</div>
        <div class="det">${i.cedida ? `Era de <span class="tachado">${esc(nombreF(i.oficial))}</span>, se la cedimos` : 'Hoy no tenemos guardia'}${i.cambio && i.cambio.nota ? ' · ' + esc(i.cambio.nota) : ''}</div>`;
    return `<div class="hoja-p turno-hoy ${i.nuestra ? 'lila' : ''}" data-acc="dia" data-f="${HOY}" style="cursor:pointer">
        <span class="cinta">De turno hoy</span><span class="adorno" style="right:-8px;bottom:-14px">${Ad.mariposa(46)}</span>${turno}</div>`;
  }
  function pGuardias() {
    const [a, m] = HOY.slice(0, 7).split('-').map(Number), r = A.resumenMes(a, m), prox = A.proximasNuestras(F.sumar(HOY, 1), 10);
    const porF = Object.entries(r.porFarmacia).map(([id, n]) => `${esc(nombreF(id))} ${n}`).join(' · ');
    return volver() + cab('la farmacia', 'Guardias', 'una a la vez') + turnoCard() +
      `<div class="hoja-p"><span class="cinta cuadros">Próximas guardias</span><span class="adorno" style="left:-10px;top:-16px">${Ad.clip(44)}</span>
        ${prox.map(filaGuardia).join('') || '<div class="vacio">No hay guardias cargadas</div>'}</div>
      <div class="hoja-p lila"><span class="cinta">Este mes</span><div class="resumen-mes"><span><b>${r.total}</b> guardias nuestras</span>${porF ? `<span>${porF}</span>` : ''}
        ${r.cedidas ? `<span class="chip ced">${r.cedidas} cedida${r.cedidas > 1 ? 's' : ''}</span>` : ''}${r.tomadas ? `<span class="chip tom">${r.tomadas} tomada${r.tomadas > 1 ? 's' : ''}</span>` : ''}</div></div>
      <div class="botones"><button class="btn" data-acc="ir" data-p="mes">${I('mes', 18)} Ver calendario</button><button class="btn sec" data-acc="icsGuardias">${I('cal', 18)} Al calendario del iPhone</button></div>
      <div class="botones"><button class="btn sec chico" data-acc="ir" data-p="mas">Listado de turnos y farmacias</button></div>
      <div class="muestra" style="text-align:center">Para ceder o cambiar una guardia, tocá el día en el calendario.</div>`;
  }

  // =================== CITAS MÉDICAS
  function filaCita(c, conFecha = true) {
    const d = F.aD(c.fecha);
    return `<div class="fila toca ${c.fui ? 'hecho' : ''}" data-acc="editCita" data-id="${c.id}">${conFecha ? `<div class="fecha"><small>${DIAS3[d.getUTCDay()]}</small><b>${d.getUTCDate()}</b><small>${F.MESES[d.getUTCMonth()].slice(0, 3)}</small></div>` : `<span style="color:#b5576b">${I('estetos', 20)}</span>`}
      <div class="txt"><b>${esc(c.titulo)}</b><small>${c.hora ? c.hora + ' h' : 'sin hora'}${c.lugar ? ' · ' + esc(c.lugar) : ''}</small>${c.nota ? `<small>✎ ${esc(c.nota)}</small>` : ''}</div>
      ${conFecha && c.fecha >= HOY ? `<div class="falta">${faltan(c.fecha)}</div>` : ''}</div>`;
  }
  function pCitas() {
    const prox = A.citasEntre(HOY, '9999-12-31'), pas = A.E.citas.filter(c => c.fecha < HOY).sort((a, b) => a.fecha < b.fecha ? 1 : -1).slice(0, 20);
    return volver() + cab('salud', 'Citas médicas', 'cuidarme también') +
      `<div style="text-align:center"><button class="btn" data-acc="nuevaCita" data-f="${HOY}">${I('mas_', 20)} Nueva cita</button></div>
      <div class="hoja-p"><span class="cinta">Próximas</span><span class="adorno" style="right:-6px;top:-16px">${Ad.flor(34, '#ead0dc', '#c98aa6')}</span>${prox.map(c => filaCita(c)).join('') || '<div class="vacio">No hay citas cargadas</div>'}</div>
      ${pas.length ? `<div class="hoja-p"><span class="cinta papel">Anteriores</span>${pas.map(c => filaCita(c)).join('')}</div>` : ''}
      <div class="muestra" style="text-align:center">Al guardar podés pasarla al calendario del iPhone: te avisa 2 horas antes.</div>`;
  }
  function hCita(c) {
    return () => `${btnCerrar}<h2>${c.id ? 'Cita médica' : 'Nueva cita médica'}</h2>
      <label class="l">Médico o especialidad</label><input class="in" id="ciT" value="${esc(c.titulo || '')}" placeholder="Ej.: Ginecóloga, Dr. Pérez, análisis de sangre" autocomplete="off">
      <div class="dos"><div><label class="l">Fecha</label><input class="in" type="date" id="ciF" value="${c.fecha || HOY}"></div><div><label class="l">Hora</label><input class="in" type="time" id="ciH" value="${c.hora || ''}"></div></div>
      <label class="l">Lugar</label><input class="in" id="ciL" value="${esc(c.lugar || '')}" placeholder="Consultorio, sanatorio, dirección…">
      <label class="l">Qué llevar / notas</label><textarea class="in" id="ciN" placeholder="Estudios, orden, carnet de la obra social, ir en ayunas…">${esc(c.nota || '')}</textarea>
      ${c.id && c.fecha <= HOY ? `<label class="chk"><input type="checkbox" id="ciFui" ${c.fui ? 'checked' : ''}> Ya fui</label>` : ''}
      <div class="error" id="ciErr"></div>
      <div class="botones"><button class="btn" data-acc="guardarCita" data-id="${c.id || ''}">Guardar</button><button class="btn sec" data-acc="guardarCita" data-id="${c.id || ''}" data-ics="1">${I('cal', 17)} Guardar y al calendario</button></div>
      ${c.id ? `<div class="botones"><button class="btn peligro chico" data-acc="borrarCita" data-id="${c.id}">${I('basura', 16)} Borrar</button></div>` : ''}`;
  }

  // =================== TAREAS (y recordatorios)
  function filaTarea(t) {
    const venc = t.fecha && t.fecha < HOY && !t.ok, hoy = t.fecha === HOY;
    return `<div class="fila ${t.ok ? 'hecho' : ''}"><button class="circ ${t.ok ? 'ok' : ''}" data-acc="tareaOk" data-id="${t.id}" aria-label="Hecha">${t.ok ? I('check', 15) : ''}</button>
      <div class="txt toca" data-acc="editTarea" data-id="${t.id}" style="cursor:pointer"><b>${esc(t.t)}</b>
        ${t.fecha ? `<small class="${venc ? 'rojo' : ''}">${venc ? 'venció el ' + F.fechaCorta(t.fecha) : hoy ? 'para hoy' : 'para el ' + fechaChica(t.fecha)}</small>` : ''}${t.nota ? `<small>${esc(t.nota)}</small>` : ''}</div></div>`;
  }
  function pTareas() {
    const tab = V.tTab || 'tareas';
    let cuerpo;
    if (tab === 'tareas') {
      const pend = A.tareasPendientes(), hechas = A.E.tareas.filter(t => t.ok).sort((a, b) => a.hecha < b.hecha ? 1 : -1).slice(0, 20);
      cuerpo = `<div class="hoja-p"><span class="cinta">Pendientes (${pend.length})</span><span class="adorno" style="right:4px;top:-10px">${Ad.chinche()}</span>
          <form class="add-pend" data-acc="tareaAdd"><input class="in" name="t" placeholder="Nueva tarea…" enterkeyhint="done" autocomplete="off"><button class="btn chico" aria-label="Agregar">${I('mas_', 18)}</button></form>
          <div class="muestra" style="margin:2px 0 6px">Para ponerle fecha límite, tocá la tarea.</div>
          ${pend.map(filaTarea).join('') || '<div class="vacio">¡Nada pendiente! ' + Ad.corazon(12) + '</div>'}</div>
        ${hechas.length ? `<div class="hoja-p"><span class="cinta papel">Hechas</span>${hechas.map(filaTarea).join('')}<div class="botones"><button class="btn peligro chico" data-acc="borrarHechas">${I('basura', 16)} Borrar las hechas</button></div></div>` : ''}`;
    } else cuerpo = cuerpoRecordar();
    return volver() + cab('no te olvides', 'Tareas', 'paso a paso') +
      `<div class="seg"><button class="${tab === 'tareas' ? 'act' : ''}" data-acc="tTab" data-v="tareas">Tareas</button><button class="${tab === 'rec' ? 'act' : ''}" data-acc="tTab" data-v="rec">Recordatorios</button></div>` + cuerpo;
  }
  function hTarea(t) {
    return () => `${btnCerrar}<h2>${t.id ? 'Tarea' : 'Nueva tarea'}</h2>
      <label class="l">Tarea</label><input class="in" id="taT" value="${esc(t.t || '')}" autocomplete="off">
      <label class="l">Para cuándo (opcional)</label><input class="in" type="date" id="taF" value="${t.fecha || ''}">
      <label class="l">Nota</label><textarea class="in" id="taN" placeholder="Opcional">${esc(t.nota || '')}</textarea>
      <div class="error" id="taErr"></div>
      <div class="botones"><button class="btn" data-acc="guardarTarea" data-id="${t.id || ''}">Guardar</button>${t.id ? `<button class="btn peligro" data-acc="borrarTarea" data-id="${t.id}">${I('basura', 16)} Borrar</button>` : ''}</div>`;
  }

  // =================== NOTAS
  function pNotas() {
    const l = A.notasOrdenadas();
    return volver() + cab('ideas y listas', 'Notas', 'para no olvidar') +
      `<div style="text-align:center;margin-bottom:6px"><button class="btn" data-acc="editNota" data-id="">${I('mas_', 20)} Nueva nota</button></div>
      <div class="notas-grid">${l.map(n => `<button class="nota-c c${n.color || 0}" data-acc="editNota" data-id="${n.id}">${n.fijada ? `<span class="nota-pin">${Ad.chinche(18)}</span>` : ''}
        ${n.titulo ? `<b>${esc(n.titulo)}</b>` : ''}<span>${esc((n.texto || '').slice(0, 160))}${(n.texto || '').length > 160 ? '…' : ''}</span><small>${F.fechaCorta(n.mod.slice(0, 10))}</small></button>`).join('')}</div>
      ${l.length ? '' : `<div class="vacio" style="margin-top:20px">Todavía no hay notas</div>`}`;
  }
  function hNota(n) {
    return () => `${btnCerrar}<h2>${n.id ? 'Nota' : 'Nueva nota'}</h2>
      <input class="in" id="noT" value="${esc(n.titulo || '')}" placeholder="Título" autocomplete="off" style="font-weight:600">
      <textarea class="in renglones" id="noX" placeholder="Escribí acá…" style="min-height:220px;margin-top:10px">${esc(n.texto || '')}</textarea>
      <div class="error" id="noErr"></div>
      <div class="botones"><button class="btn" data-acc="guardarNota" data-id="${n.id || ''}">Guardar</button>
      ${n.id ? `<button class="btn sec" data-acc="fijarNota" data-id="${n.id}">${I('fijar', 16)} ${n.fijada ? 'Desfijar' : 'Fijar arriba'}</button><button class="btn peligro" data-acc="borrarNota" data-id="${n.id}">${I('basura', 16)}</button>` : ''}</div>`;
  }

  // =================== HÁBITOS
  const EMOJIS = ['💧', '🚶‍♀️', '📖', '🧘‍♀️', '🍎', '😴', '💊', '🏋️‍♀️', '🌿', '✍️', '📵', '🙏', '🧴', '🌱'];
  const SUGERIDOS = [['Tomar 8 vasos de agua', '💧'], ['Caminar 30 minutos', '🚶‍♀️'], ['Leer un rato', '📖'], ['Respirar / meditar', '🧘‍♀️'], ['Comer fruta', '🍎'], ['Dormir temprano', '😴']];
  function pHabitos() {
    const H = A.E.habitos, hechos = H.filter(h => A.habitoHecho(h.id, HOY)).length;
    const dias = []; for (let k = 6; k >= 0; k--) dias.push(F.sumar(HOY, -k));
    const sug = SUGERIDOS.filter(([n]) => !H.some(h => h.nombre.toLowerCase() === n.toLowerCase()));
    return volver() + cab('un día a la vez', 'Hábitos', 'pequeños pasos') +
      (H.length ? `<div class="hoja-p lila" style="text-align:center;padding:14px"><span class="cinta">Hoy</span><div class="resumen-mes"><span><b>${hechos}</b> de ${H.length} hechos</span></div>
        <div class="hab-barra"><div style="width:${H.length ? hechos / H.length * 100 : 0}%"></div></div></div>` : '') +
      H.map(h => { const hoyOk = A.habitoHecho(h.id, HOY), r = A.racha(h.id, HOY);
        return `<div class="hoja-p hab"><div class="flex"><span class="hab-e">${esc(h.emoji)}</span><div style="flex:1;min-width:0"><b class="toca" data-acc="editHab" data-id="${h.id}" style="cursor:pointer">${esc(h.nombre)}</b>
          <div class="muestra" style="margin:0">${r ? `🔥 ${r} día${r > 1 ? 's' : ''} seguido${r > 1 ? 's' : ''}` : 'Empezá hoy'}</div></div>
          <button class="hab-hoy ${hoyOk ? 'ok' : ''}" data-acc="habDia" data-id="${h.id}" data-f="${HOY}" aria-label="Hecho hoy">${I('check', 26)}</button></div>
          <div class="hab-dias">${dias.map(f => `<button class="${A.habitoHecho(h.id, f) ? 'ok' : ''} ${f === HOY ? 'hoy' : ''}" data-acc="habDia" data-id="${h.id}" data-f="${f}"><small>${DIAS3[F.diaSemana(f)].slice(0, 2)}</small><i>${F.aD(f).getUTCDate()}</i></button>`).join('')}</div></div>`; }).join('') +
      (sug.length ? `<div class="hoja-p"><span class="cinta cuadros">Ideas${H.length ? '' : ' para empezar'}</span><div class="pills" style="margin-top:6px">${sug.map(([n, e]) => `<button data-acc="habSug" data-n="${esc(n)}" data-e="${e}">${e} ${esc(n)}</button>`).join('')}</div></div>` : '') +
      `<div style="text-align:center"><button class="btn" data-acc="editHab" data-id="">${I('mas_', 20)} Nuevo hábito</button></div>
      <div class="muestra" style="text-align:center">Tocá los días de abajo para marcar o desmarcar días anteriores.</div>`;
  }
  let habEmoji = '🌱';
  function hHabito(h) {
    return () => `${btnCerrar}<h2>${h.id ? 'Hábito' : 'Nuevo hábito'}</h2>
      <label class="l">Hábito</label><input class="in" id="haN" value="${esc(h.nombre || '')}" placeholder="Ej.: Tomar agua, caminar, leer" autocomplete="off">
      <label class="l">Dibujito</label><div class="pills" id="haE">${EMOJIS.map(e => `<button type="button" data-acc="habEmoji" data-e="${e}" class="${e === habEmoji ? 'act' : ''}" style="font-size:20px;padding:6px 10px">${e}</button>`).join('')}</div>
      <div class="error" id="haErr"></div>
      <div class="botones"><button class="btn" data-acc="guardarHab" data-id="${h.id || ''}">Guardar</button>${h.id ? `<button class="btn peligro" data-acc="borrarHab" data-id="${h.id}">${I('basura', 16)} Borrar</button>` : ''}</div>`;
  }

  // =================== METAS
  function pMetas() {
    const M = A.E.metas.slice().sort((a, b) => (a.avance >= 100) - (b.avance >= 100) || ((a.fecha || '9999') < (b.fecha || '9999') ? -1 : 1));
    return volver() + cab('sueños con fecha', 'Metas', 'vamos por más') +
      `<div style="text-align:center"><button class="btn" data-acc="editMeta" data-id="">${I('mas_', 20)} Nueva meta</button></div>` +
      M.map(m => { const ok = m.avance >= 100, n = m.fecha ? F.entre(HOY, m.fecha) : null;
        return `<div class="hoja-p meta ${ok ? 'lila' : ''}">${ok ? `<span class="adorno" style="right:-8px;top:-14px">${Ad.flor(38)}</span>` : ''}
          <div class="flex"><b class="toca" data-acc="editMeta" data-id="${m.id}" style="flex:1;cursor:pointer;font:600 17px var(--serif)">${esc(m.titulo)}</b><span class="meta-p">${m.avance}%</span></div>
          <div class="muestra" style="margin:2px 0 8px">${ok ? '¡Cumplida! 🎉' : m.fecha ? `Para el ${F.fechaCorta(m.fecha)}/${m.fecha.slice(2, 4)} · ${n < 0 ? 'se pasó la fecha' : n === 0 ? 'es hoy' : 'faltan ' + n + ' días'}` : 'Sin fecha'}${m.nota ? ' · ' + esc(m.nota) : ''}</div>
          <div class="hab-barra"><div style="width:${m.avance}%"></div></div>
          ${ok ? '' : `<div class="botones" style="margin-top:10px"><button class="btn sec chico" data-acc="metaMas" data-id="${m.id}" data-n="-10">−10%</button><button class="btn chico" data-acc="metaMas" data-id="${m.id}" data-n="10">+10%</button></div>`}</div>`; }).join('') +
      (M.length ? '' : `<div class="vacio" style="margin-top:20px">Escribí una meta: ahorrar para un viaje, terminar un curso, leer 12 libros…</div>`);
  }
  function hMeta(m) {
    return () => `${btnCerrar}<h2>${m.id ? 'Meta' : 'Nueva meta'}</h2>
      <label class="l">Meta</label><input class="in" id="meT" value="${esc(m.titulo || '')}" placeholder="Ej.: Ahorrar para las vacaciones" autocomplete="off">
      <div class="dos"><div><label class="l">Para cuándo</label><input class="in" type="date" id="meF" value="${m.fecha || ''}"></div>
        <div><label class="l">Avance (%)</label><input class="in" type="number" inputmode="numeric" min="0" max="100" step="5" id="meA" value="${m.avance || 0}"></div></div>
      <label class="l">Nota</label><textarea class="in" id="meN" placeholder="Cómo lo voy a lograr…">${esc(m.nota || '')}</textarea>
      <div class="error" id="meErr"></div>
      <div class="botones"><button class="btn" data-acc="guardarMeta" data-id="${m.id || ''}">Guardar</button>${m.id ? `<button class="btn peligro" data-acc="borrarMeta" data-id="${m.id}">${I('basura', 16)} Borrar</button>` : ''}</div>`;
  }

  // =================== MÁS
  function pMas() {
    const E = A.E, rs = E.rotaciones.slice().sort((a, b) => a.desde < b.desde ? 1 : -1);
    const ultima = E.cfg.ultimaCopia ? F.entre(E.cfg.ultimaCopia, HOY) : null;
    return volver() + cab('ajustes', 'Más', 'farmacias y copias') +
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
      <div class="pie">Mi Agenda · RoFac ${VERSION}<br>hecha con ${Ad.corazon(10)} para Mariana</div>`;
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
        <div class="bloque"><div class="flex"><b style="font-family:var(--serif);color:var(--lila-osc)">Citas médicas</b><span class="sp"></span><button class="btn sec chico" data-acc="nuevaCita" data-f="${f}">${I('mas_', 16)} Cita</button></div>
          ${A.citasDe(f).map(c => filaCita(c, false)).join('') || '<div class="vacio" style="font-size:14px">Ninguna</div>'}</div>
        <div class="bloque"><div class="flex"><b style="font-family:var(--serif);color:var(--lila-osc)">Tareas y recordatorios</b><span class="sp"></span><button class="btn sec chico" data-acc="nuevaTarea" data-f="${f}">${I('mas_', 16)} Tarea</button><button class="btn sec chico" data-acc="nuevoRec" data-f="${f}" style="margin-left:6px">${I('mas_', 16)} Record.</button></div>
          ${A.tareasDe(f).map(filaTarea).join('')}${recs.map(r => filaRec(r, false)).join('')}${A.tareasDe(f).length || recs.length ? '' : '<div class="vacio" style="font-size:14px">Nada</div>'}</div>
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
  const PANT = { inicio: ['Inicio', 'inicio', pInicio], mes: ['Mes', 'mes', pMes], semana: ['Semana', 'semana', pSemana], hoy: ['Mi día', 'midia', pHoy], mas: ['Más', 'mas', pMas] };
  const OTRAS = { guardias: pGuardias, citas: pCitas, tareas: pTareas, notas: pNotas, habitos: pHabitos, metas: pMetas, recordar: pRecordar };
  function pintar() {
    HOY = F.hoyLocal();
    if (!PANT[V.pant] && !OTRAS[V.pant]) V.pant = 'inicio';
    const s = window.scrollY, fn = PANT[V.pant] ? PANT[V.pant][2] : OTRAS[V.pant], tab = PANT[V.pant] ? V.pant : 'inicio';
    $('#main').innerHTML = fn(); enganchar($('#main'));
    $('#tabs').innerHTML = '<div class="in-tabs">' + Object.entries(PANT).map(([k, v]) => `<button class="${k === tab ? 'act' : ''}" data-acc="ir" data-p="${k}">${I(v[1], 23)}<span>${v[0]}</span></button>`).join('') + '</div>';
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
    // citas
    nuevaCita: d => { cerrar(); abrir(hCita({ fecha: d.f })); },
    editCita: d => { const c = A.E.citas.find(x => x.id === d.id); if (c) abrir(hCita(c)); },
    guardarCita: d => {
      let c; try { c = A.guardarCita({ id: d.id || null, titulo: $('#ciT').value, fecha: $('#ciF').value, hora: $('#ciH').value, lugar: $('#ciL').value, nota: $('#ciN').value, fui: $('#ciFui') ? $('#ciFui').checked : false }); }
      catch (e) { $('#ciErr').textContent = e.message; return; }
      cerrar(); repintar(); toast(d.id ? 'Cita guardada' : 'Cita agregada', true); if (d.ics) alCalendario('cita.ics', A.icsCita(c));
    },
    borrarCita: d => { A.borrarCita(d.id); cerrar(); repintar(); toast('Cita borrada', true); },
    // tareas
    tTab: d => { V.tTab = d.v; repintar(); },
    nuevaTarea: d => { cerrar(); abrir(hTarea({ fecha: d.f || '' })); },
    editTarea: d => { const t = A.E.tareas.find(x => x.id === d.id); if (t) abrir(hTarea(t)); },
    guardarTarea: d => { try { A.guardarTarea({ id: d.id || null, t: $('#taT').value, fecha: $('#taF').value, nota: $('#taN').value }); } catch (e) { $('#taErr').textContent = e.message; return; } cerrar(); repintar(); toast('Tarea guardada', true); },
    borrarTarea: d => { A.borrarTarea(d.id); cerrar(); repintar(); toast('Tarea borrada', true); },
    tareaOk: (d, el) => { const si = !el.classList.contains('ok'); A.tareaOk(d.id, si); repintar(); refrescarHoja(); if (si) toast('¡Hecha!', true); },
    borrarHechas: () => { A.borrarHechas(); repintar(); toast('Tareas hechas borradas', true); },
    // notas
    editNota: d => { const n = d.id ? A.E.notas.find(x => x.id === d.id) : {}; if (n) abrir(hNota(n)); },
    guardarNota: d => { try { A.guardarNota({ id: d.id || null, titulo: $('#noT').value, texto: $('#noX').value }); } catch (e) { $('#noErr').textContent = e.message; return; } cerrar(); repintar(); toast('Nota guardada', true); },
    fijarNota: d => { A.fijarNota(d.id); cerrar(); repintar(); },
    borrarNota: d => { A.borrarNota(d.id); cerrar(); repintar(); toast('Nota borrada', true); },
    // hábitos
    habSug: d => { intentar(() => A.guardarHabito({ nombre: d.n, emoji: d.e }), 'Hábito agregado'); repintar(); },
    editHab: d => { const h = d.id ? A.E.habitos.find(x => x.id === d.id) : {}; if (!h) return; habEmoji = h.emoji || '🌱'; abrir(hHabito(h)); },
    habEmoji: (d, el) => { habEmoji = d.e; $$('#haE button').forEach(b => b.classList.toggle('act', b === el)); },
    guardarHab: d => { try { A.guardarHabito({ id: d.id || null, nombre: $('#haN').value, emoji: habEmoji }); } catch (e) { $('#haErr').textContent = e.message; return; } cerrar(); repintar(); toast('Hábito guardado', true); },
    borrarHab: d => { A.borrarHabito(d.id); cerrar(); repintar(); toast('Hábito borrado', true); },
    habDia: d => { const si = !A.habitoHecho(d.id, d.f); A.tildarHabito(d.id, d.f, si); repintar(); },
    // metas
    editMeta: d => { const m = d.id ? A.E.metas.find(x => x.id === d.id) : {}; if (m) abrir(hMeta(m)); },
    guardarMeta: d => { try { A.guardarMeta({ id: d.id || null, titulo: $('#meT').value, fecha: $('#meF').value, avance: $('#meA').value, nota: $('#meN').value }); } catch (e) { $('#meErr').textContent = e.message; return; } cerrar(); repintar(); toast('Meta guardada', true); },
    borrarMeta: d => { A.borrarMeta(d.id); cerrar(); repintar(); toast('Meta borrada', true); },
    metaMas: d => { const m = A.E.metas.find(x => x.id === d.id); if (!m) return; A.avanceMeta(d.id, m.avance + +d.n); repintar(); if (m.avance + +d.n >= 100) toast('¡Meta cumplida! 🎉', true); },
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
      if (el.tagName === 'FORM' && acc === 'tareaAdd') return el.addEventListener('submit', e => { e.preventDefault(); const t = el.t.value.trim(); if (!t) return; intentar(() => A.guardarTarea({ t }), null); repintar(); setTimeout(() => { const i = $('form[data-acc=tareaAdd] input'); i && i.focus(); }, 30); });
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
