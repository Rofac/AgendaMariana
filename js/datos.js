/* Agenda de guardias — datos y cuentas (sin pantalla).
   Todo queda guardado en el celular (localStorage 'rofac_agenda'). */
(function (raiz) {
  const CLAVE = 'rofac_agenda';
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  // ---------- fechas 'AAAA-MM-DD' (se cuentan en UTC para que no haya corrimientos de horario)
  const aD = f => { const [a, m, d] = f.split('-').map(Number); return new Date(Date.UTC(a, m - 1, d)); };
  const aF = d => d.toISOString().slice(0, 10);
  const sumar = (f, n) => { const d = aD(f); d.setUTCDate(d.getUTCDate() + n); return aF(d); };
  const entre = (a, b) => Math.round((aD(b) - aD(a)) / 864e5);
  const diaSemana = f => aD(f).getUTCDay();                       // 0 = domingo
  const lunesDe = f => sumar(f, -((diaSemana(f) + 6) % 7));
  const hoyLocal = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const finDeMes = (a, m) => new Date(Date.UTC(a, m, 0)).getUTCDate();   // m 1..12
  const fechaLarga = f => { const d = aD(f); return DIAS[d.getUTCDay()] + ' ' + d.getUTCDate() + ' de ' + MESES[d.getUTCMonth()]; };
  const fechaCorta = f => { const d = aD(f); return d.getUTCDate() + '/' + (d.getUTCMonth() + 1); };
  const valida = f => typeof f === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(f) && aF(aD(f)) === f;

  // ---------- estado inicial: el listado de turnos de la farmacia (rotación de 8, empieza el 1/11/2026 con Cristal)
  function inicial() {
    return {
      v: 1,
      farmacias: [
        { id: 'cristal', nombre: 'Cristal', corto: 'Cristal' },
        { id: 'sanjose', nombre: 'San José', corto: 'S. José' },
        { id: 'villaberthet', nombre: 'Villa Berthet', corto: 'V. Berthet' },
        { id: 'roma2', nombre: 'Roma II', corto: 'Roma II', nuestra: true },
        { id: 'sanmartin', nombre: 'San Martín', corto: 'S. Martín' },
        { id: 'roma', nombre: 'Roma', corto: 'Roma', nuestra: true },
        { id: 'delcarmen', nombre: 'Del Carmen', corto: 'D. Carmen' },
        { id: 'charytonow', nombre: 'Charytonow', corto: 'Charyt.' },
      ],
      rotaciones: [{ desde: '2026-11-01', orden: ['cristal', 'sanjose', 'villaberthet', 'roma2', 'sanmartin', 'roma', 'delcarmen', 'charytonow'] }],
      confirmadoHasta: '2027-12-31', mig2027: 1,
      cambios: {},          // fecha → { f: farmacia que hace la guardia, nota, par: fecha del intercambio }
      recordatorios: [],    // { id, titulo, fecha, hora, nota, repetir: no|semana|mes|anio, hechos: [fechas] }
      dias: {},             // fecha → { foco, pendientes: [{t, ok}], notas, agua, animo }
      cfg: { verTodas: true },
    };
  }

  function crear(guardado) {
    let E = guardado && typeof guardado === 'object' && Array.isArray(guardado.farmacias) ? guardado : inicial();
    E.cambios = E.cambios || {}; E.recordatorios = E.recordatorios || []; E.dias = E.dias || {}; E.cfg = E.cfg || {};
    E.citas = E.citas || []; E.tareas = E.tareas || []; E.notas = E.notas || []; E.habitos = E.habitos || []; E.habHechos = E.habHechos || {}; E.metas = E.metas || [];
    const atras = [];                                    // para "Deshacer"

    // listado 2027 confirmado (13/11/2026): si seguía con la fecha original, pasa al 31/12/2027 (una sola vez)
    let migro = false;
    if (!E.mig2027) { if (E.confirmadoHasta === '2026-12-31') E.confirmadoHasta = '2027-12-31'; E.mig2027 = 1; migro = !!guardado; }

    const farmacia = id => E.farmacias.find(x => x.id === id) || { id, nombre: id || '—', corto: id || '—' };
    const esNuestra = id => !!farmacia(id).nuestra;
    const nuestras = () => E.farmacias.filter(x => x.nuestra);

    function rotacionDe(f) {
      const rs = E.rotaciones.slice().sort((a, b) => a.desde < b.desde ? -1 : 1);
      let r = rs[0];
      for (const x of rs) if (x.desde <= f) r = x;
      return r;
    }
    function oficial(f) {
      const r = rotacionDe(f); if (!r || !r.orden.length) return null;
      const n = r.orden.length, i = ((entre(r.desde, f) % n) + n) % n;
      return r.orden[i];
    }
    function info(f) {
      const of = oficial(f), c = E.cambios[f], t = c ? c.f : of;
      const ofN = esNuestra(of), tN = esNuestra(t);
      return {
        fecha: f, oficial: of, turno: t, nuestra: tN, cambio: c || null,
        cedida: !!c && ofN && !tN,                 // era nuestra y la hace otra
        tomada: !!c && !ofN && tN,                 // era de otra y la hacemos nosotros
        estimado: f > E.confirmadoHasta,
      };
    }
    function guardiasNuestras(desde, hasta) {
      const out = []; for (let f = desde; f <= hasta; f = sumar(f, 1)) { const i = info(f); if (i.nuestra) out.push(i); }
      return out;
    }
    function proximasNuestras(desde, cuantas) {
      const out = []; let f = desde;
      for (let k = 0; k < 400 && out.length < cuantas; k++, f = sumar(f, 1)) { const i = info(f); if (i.nuestra) out.push(i); }
      return out;
    }
    function resumenMes(a, m) {
      const d = `${a}-${String(m).padStart(2, '0')}-01`, h = `${a}-${String(m).padStart(2, '0')}-${finDeMes(a, m)}`;
      const r = { total: 0, porFarmacia: {}, cedidas: 0, tomadas: 0 };
      for (let f = d; f <= h; f = sumar(f, 1)) {
        const i = info(f);
        if (i.cedida) r.cedidas++;
        if (i.nuestra) { r.total++; r.porFarmacia[i.turno] = (r.porFarmacia[i.turno] || 0) + 1; if (i.tomada) r.tomadas++; }
      }
      return r;
    }

    // ---------- guardar / deshacer
    let alGuardar = null;
    function guardar() { try { raiz.localStorage && raiz.localStorage.setItem(CLAVE, JSON.stringify(E)); } catch (e) {} alGuardar && alGuardar(); }
    function antes(que) { atras.push({ que, foto: JSON.stringify(E) }); if (atras.length > 30) atras.shift(); }
    function deshacer() {
      const u = atras.pop(); if (!u) return null;
      const nuevo = JSON.parse(u.foto); Object.keys(E).forEach(k => delete E[k]); Object.assign(E, nuevo); guardar(); return u.que;
    }

    // ---------- cambios de guardia
    function cambiar(f, quien, nota, par) {
      if (!valida(f)) throw new Error('Fecha inválida');
      if (!E.farmacias.some(x => x.id === quien)) throw new Error('Elegí la farmacia');
      if (par && !valida(par)) throw new Error('Fecha del intercambio inválida');
      if (par === f) throw new Error('El intercambio tiene que ser otro día');
      const of = oficial(f);
      if (par) {
        // intercambio: el otro día hacemos nosotros la guardia de la farmacia a la que le cedimos ésta
        if (!esNuestra(of) || quien === of || esNuestra(quien)) throw new Error('El intercambio es para cuando le cedés una guardia nuestra a otra farmacia');
        const ofPar = oficial(par);
        if (ofPar !== quien) throw new Error('El ' + fechaCorta(par) + ' no está de turno ' + farmacia(quien).nombre + ' (está ' + farmacia(ofPar).nombre + ')');
      }
      antes('el cambio de guardia');
      quitarSinGuardar(f);
      const n = (nota || '').trim();
      if (quien !== of) E.cambios[f] = { f: quien, nota: n };
      else if (n) E.cambios[f] = { f: of, nota: n };          // sólo una nota en el día
      if (par) {
        quitarSinGuardar(par);
        E.cambios[par] = { f: of, nota: n, par: f };
        E.cambios[f].par = par;
      }
      guardar();
    }
    function quitarSinGuardar(f) {
      const c = E.cambios[f]; if (!c) return;
      delete E.cambios[f];
      if (c.par && E.cambios[c.par] && E.cambios[c.par].par === f) delete E.cambios[c.par];
    }
    function volverOriginal(f) { if (!E.cambios[f]) return; antes('volver a la guardia original'); quitarSinGuardar(f); guardar(); }

    // ---------- recordatorios (con un emoji según qué es: turno médico, trámite, cumpleaños…)
    const TIPOS_REC = { medico: '🩺', tramite: '📄', cumple: '🎂', salida: '🎉', recordar: '🔔', otro: '📌' };
    const emojiRec = r => TIPOS_REC[r && r.tipo] || '';
    const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    function guardarRecordatorio(r) {
      const t = (r.titulo || '').trim(); if (!t) throw new Error('Escribí qué hay que recordar');
      if (!valida(r.fecha)) throw new Error('Elegí la fecha');
      if (r.hora && !/^\d{2}:\d{2}$/.test(r.hora)) throw new Error('Hora inválida');
      const rep = ['no', 'semana', 'mes', 'anio'].includes(r.repetir) ? r.repetir : 'no';
      antes(r.id ? 'el cambio del recordatorio' : 'el recordatorio nuevo');
      const x = { id: r.id || nuevoId(), titulo: t, fecha: r.fecha, hora: r.hora || '', nota: (r.nota || '').trim(), repetir: rep, hechos: [], tipo: TIPOS_REC[r.tipo] ? r.tipo : '' };
      const i = E.recordatorios.findIndex(y => y.id === x.id);
      if (i >= 0) { x.hechos = E.recordatorios[i].hechos || []; E.recordatorios[i] = x; } else E.recordatorios.push(x);
      guardar(); return x;
    }
    function borrarRecordatorio(id) { const i = E.recordatorios.findIndex(y => y.id === id); if (i < 0) return; antes('el recordatorio borrado'); E.recordatorios.splice(i, 1); guardar(); }
    function marcarHecho(id, f, si) {
      const r = E.recordatorios.find(y => y.id === id); if (!r) return;
      antes(si ? 'marcar hecho' : 'desmarcar'); r.hechos = (r.hechos || []).filter(x => x !== f); if (si) r.hechos.push(f); guardar();
    }
    function ocurre(r, f) {
      if (f < r.fecha) return false; if (f === r.fecha) return true;
      const a = aD(r.fecha), b = aD(f);
      if (r.repetir === 'semana') return entre(r.fecha, f) % 7 === 0;
      if (r.repetir === 'mes') { const dia = Math.min(a.getUTCDate(), finDeMes(b.getUTCFullYear(), b.getUTCMonth() + 1)); return b.getUTCDate() === dia; }
      if (r.repetir === 'anio') { if (b.getUTCMonth() !== a.getUTCMonth()) return false; const dia = Math.min(a.getUTCDate(), finDeMes(b.getUTCFullYear(), b.getUTCMonth() + 1)); return b.getUTCDate() === dia; }
      return false;
    }
    function recordatoriosDe(f) {
      return E.recordatorios.filter(r => ocurre(r, f)).map(r => ({ ...r, dia: f, hecho: (r.hechos || []).includes(f) }))
        .sort((x, y) => (x.hora || '99') < (y.hora || '99') ? -1 : 1);
    }
    function recordatoriosEntre(d, h) { const out = []; for (let f = d; f <= h; f = sumar(f, 1)) out.push(...recordatoriosDe(f)); return out; }


    // ---------- listas (citas, tareas, notas, hábitos, metas): guardar / borrar con "Deshacer"
    function upsert(lista, x, que) {
      antes(que); x.id = x.id || nuevoId(); const L = E[lista], i = L.findIndex(y => y.id === x.id);
      if (i >= 0) L[i] = { ...L[i], ...x }; else L.push(x); guardar(); return L.find(y => y.id === x.id);
    }
    function borrarDe(lista, id, que) { const L = E[lista], i = L.findIndex(y => y.id === id); if (i < 0) return; antes(que); L.splice(i, 1); guardar(); }
    const txt = (v, max) => String(v == null ? '' : v).trim().slice(0, max || 500);

    // citas médicas
    function guardarCita(c) {
      const titulo = txt(c.titulo, 80); if (!titulo) throw new Error('Escribí con quién es la cita (médico o especialidad)');
      if (!valida(c.fecha)) throw new Error('Elegí la fecha'); if (c.hora && !/^\d{2}:\d{2}$/.test(c.hora)) throw new Error('Hora inválida');
      return upsert('citas', { id: c.id || null, titulo, fecha: c.fecha, hora: c.hora || '', lugar: txt(c.lugar, 120), nota: txt(c.nota, 400), fui: !!c.fui }, c.id ? 'el cambio de la cita' : 'la cita nueva');
    }
    const ordCita = (a, b) => (a.fecha + (a.hora || '99')) < (b.fecha + (b.hora || '99')) ? -1 : 1;
    const citasDe = f => E.citas.filter(c => c.fecha === f).sort(ordCita);
    const citasEntre = (d, h) => E.citas.filter(c => c.fecha >= d && c.fecha <= h).sort(ordCita);
    function icsCita(c) {
      return ics([{ uid: 'cita-' + c.id, titulo: c.titulo, fecha: c.fecha, hora: c.hora, nota: [c.lugar, c.nota].filter(Boolean).join(' · '), aviso: c.hora ? '-PT2H' : '-PT15H' }]);
    }

    // tareas
    function guardarTarea(t) {
      const tx = txt(t.t, 160); if (!tx) throw new Error('Escribí la tarea');
      if (t.fecha && !valida(t.fecha)) throw new Error('Fecha inválida');
      const viejo = t.id ? E.tareas.find(y => y.id === t.id) : null;
      return upsert('tareas', { id: t.id || null, t: tx, fecha: t.fecha || '', nota: txt(t.nota, 400), ok: viejo ? viejo.ok : false, hecha: viejo ? viejo.hecha : '', creada: viejo ? viejo.creada : hoyLocal() }, t.id ? 'el cambio de la tarea' : 'la tarea nueva');
    }
    function tareaOk(id, si) { const x = E.tareas.find(y => y.id === id); if (!x) return; antes(si ? 'tarea hecha' : 'desmarcar'); x.ok = !!si; x.hecha = si ? hoyLocal() : ''; guardar(); }
    function tareasPendientes() {
      return E.tareas.filter(x => !x.ok).sort((a, b) => (a.fecha || '9999') < (b.fecha || '9999') ? -1 : (a.fecha || '9999') > (b.fecha || '9999') ? 1 : (a.creada < b.creada ? -1 : 1));
    }
    const tareasDe = f => E.tareas.filter(x => x.fecha === f);
    function borrarHechas() { if (!E.tareas.some(x => x.ok)) return; antes('las tareas hechas'); E.tareas = E.tareas.filter(x => !x.ok); guardar(); }

    // notas
    function guardarNota(n) {
      const titulo = txt(n.titulo, 80), texto = txt(n.texto, 5000); if (!titulo && !texto) throw new Error('La nota está vacía');
      const viejo = n.id ? E.notas.find(y => y.id === n.id) : null;
      return upsert('notas', { id: n.id || null, titulo, texto, fijada: viejo ? !!viejo.fijada : false, color: viejo ? viejo.color : E.notas.length % 4, mod: new Date().toISOString() }, n.id ? 'el cambio de la nota' : 'la nota nueva');
    }
    function fijarNota(id) { const x = E.notas.find(y => y.id === id); if (!x) return; antes('fijar'); x.fijada = !x.fijada; guardar(); }
    const notasOrdenadas = () => E.notas.slice().sort((a, b) => (b.fijada ? 1 : 0) - (a.fijada ? 1 : 0) || (a.mod < b.mod ? 1 : -1));

    // hábitos
    function guardarHabito(h) {
      const nombre = txt(h.nombre, 40); if (!nombre) throw new Error('Escribí el hábito');
      if (E.habitos.some(y => y.id !== h.id && y.nombre.toLowerCase() === nombre.toLowerCase())) throw new Error('Ya tenés ese hábito');
      return upsert('habitos', { id: h.id || null, nombre, emoji: txt(h.emoji, 8) || '🌱' }, h.id ? 'el cambio del hábito' : 'el hábito nuevo');
    }
    function borrarHabito(id) {
      const i = E.habitos.findIndex(y => y.id === id); if (i < 0) return; antes('el hábito borrado'); E.habitos.splice(i, 1);
      for (const f of Object.keys(E.habHechos)) { E.habHechos[f] = E.habHechos[f].filter(x => x !== id); if (!E.habHechos[f].length) delete E.habHechos[f]; }
      guardar();
    }
    const habitoHecho = (id, f) => (E.habHechos[f] || []).includes(id);
    function tildarHabito(id, f, si) {
      if (!valida(f)) throw new Error('Fecha inválida'); antes(si ? 'el hábito' : 'desmarcar');
      const l = (E.habHechos[f] || []).filter(x => x !== id); if (si) l.push(id);
      if (l.length) E.habHechos[f] = l; else delete E.habHechos[f]; guardar();
    }
    function racha(id, hasta) {   // días seguidos hasta hoy (si hoy todavía no lo hizo, cuenta hasta ayer)
      let f = hasta, n = 0; if (!habitoHecho(id, f)) f = sumar(f, -1);
      while (habitoHecho(id, f) && n < 3660) { n++; f = sumar(f, -1); }
      return n;
    }

    // metas
    function guardarMeta(m) {
      const titulo = txt(m.titulo, 80); if (!titulo) throw new Error('Escribí la meta');
      if (m.fecha && !valida(m.fecha)) throw new Error('Fecha inválida');
      const av = Math.max(0, Math.min(100, Math.round(+m.avance || 0)));
      return upsert('metas', { id: m.id || null, titulo, fecha: m.fecha || '', avance: av, nota: txt(m.nota, 400) }, m.id ? 'el cambio de la meta' : 'la meta nueva');
    }
    function avanceMeta(id, n) { const x = E.metas.find(y => y.id === id); if (!x) return; antes('el avance'); x.avance = Math.max(0, Math.min(100, Math.round(n))); guardar(); }

    // ---------- mi día
    function dia(f) { return E.dias[f] || { foco: '', pendientes: [], notas: '', agua: 0, animo: 0 }; }
    function guardarDia(f, cambios, que) {
      antes(que || 'el cambio'); const d = { ...dia(f), ...cambios };
      const vacio = !d.foco && !d.notas && !(d.pendientes || []).length && !d.agua && !d.animo;
      if (vacio) delete E.dias[f]; else E.dias[f] = d;
      guardar();
    }

    // ---------- farmacias y listado
    function guardarFarmacias(lista) {
      const ids = new Set(), nombres = new Set();
      for (const x of lista) {
        x.nombre = (x.nombre || '').trim(); x.corto = (x.corto || '').trim() || x.nombre;
        if (!x.nombre) throw new Error('Hay una farmacia sin nombre');
        const k = x.nombre.toLowerCase(); if (nombres.has(k)) throw new Error('Hay dos farmacias "' + x.nombre + '"'); nombres.add(k);
        if (!x.id) { let b = k.normalize('NFD').replace(/[^a-z0-9]/g, '') || 'f', id = b, n = 2; while (ids.has(id) || E.farmacias.some(y => y.id === id && !lista.includes(y))) id = b + n++; x.id = id; }
        ids.add(x.id);
      }
      if (!lista.length) throw new Error('Tiene que haber al menos una farmacia');
      const usadas = new Set(E.rotaciones.flatMap(r => r.orden).concat(Object.values(E.cambios).map(c => c.f)));
      for (const u of usadas) if (!ids.has(u)) throw new Error('No se puede sacar "' + farmacia(u).nombre + '": está en el listado de turnos o en un cambio');
      antes('el cambio de farmacias'); E.farmacias = lista.map(x => ({ id: x.id, nombre: x.nombre, corto: x.corto, nuestra: !!x.nuestra })); guardar();
    }
    function nuevoListado(desde, orden, confirmadoHasta) {
      if (!valida(desde)) throw new Error('Elegí desde qué día');
      if (!orden.length) throw new Error('El listado está vacío');
      if (new Set(orden).size !== orden.length) throw new Error('Hay una farmacia repetida en el listado');
      for (const id of orden) if (!E.farmacias.some(x => x.id === id)) throw new Error('Farmacia desconocida');
      if (confirmadoHasta && !valida(confirmadoHasta)) throw new Error('Fecha "confirmado hasta" inválida');
      antes('el listado de turnos');
      E.rotaciones = E.rotaciones.filter(r => r.desde !== desde); E.rotaciones.push({ desde, orden: orden.slice() });
      E.rotaciones.sort((a, b) => a.desde < b.desde ? -1 : 1);
      if (confirmadoHasta) E.confirmadoHasta = confirmadoHasta;
      guardar();
    }
    function borrarListado(desde) {
      if (E.rotaciones.length < 2) throw new Error('Tiene que quedar al menos un listado');
      antes('el listado borrado'); E.rotaciones = E.rotaciones.filter(r => r.desde !== desde); guardar();
    }
    function setConfirmado(f) { if (!valida(f)) throw new Error('Fecha inválida'); antes('la fecha confirmada'); E.confirmadoHasta = f; guardar(); }
    function setCfg(k, v) { E.cfg[k] = v; guardar(); }

    // ---------- copia de seguridad
    function exportar() { return JSON.stringify({ app: 'rofac-agenda', guardado: new Date().toISOString(), datos: E }, null, 1); }
    function importar(texto) {
      let o; try { o = JSON.parse(texto); } catch (e) { throw new Error('El archivo no es una copia de la agenda'); }
      const d = o && o.app === 'rofac-agenda' ? o.datos : null;
      if (!d || !Array.isArray(d.farmacias) || !Array.isArray(d.rotaciones)) throw new Error('El archivo no es una copia de la agenda');
      antes('restaurar la copia'); Object.keys(E).forEach(k => delete E[k]); Object.assign(E, crear(d).E); guardar();
    }

    // ---------- calendario del iPhone (.ics)
    const icsTxt = s => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    const sinGuion = f => f.replace(/-/g, '');
    function ics(eventos) {
      const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//RoFac//Agenda//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
      const sello = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
      for (const e of eventos) {
        L.push('BEGIN:VEVENT', 'UID:' + e.uid + '@rofac-agenda', 'DTSTAMP:' + sello, 'SUMMARY:' + icsTxt(e.titulo));
        if (e.hora) {
          const ini = sinGuion(e.fecha) + 'T' + e.hora.replace(':', '') + '00', [h, m] = e.hora.split(':').map(Number);
          const finM = h * 60 + m + 60, finF = finM >= 1440 ? sumar(e.fecha, 1) : e.fecha, fm = finM % 1440;
          L.push('DTSTART:' + ini, 'DTEND:' + sinGuion(finF) + 'T' + String(Math.floor(fm / 60)).padStart(2, '0') + String(fm % 60).padStart(2, '0') + '00');
        } else L.push('DTSTART;VALUE=DATE:' + sinGuion(e.fecha), 'DTEND;VALUE=DATE:' + sinGuion(sumar(e.fecha, 1)));
        if (e.rrule) L.push('RRULE:' + e.rrule);
        if (e.nota) L.push('DESCRIPTION:' + icsTxt(e.nota));
        if (e.aviso) L.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsTxt(e.titulo), 'TRIGGER:' + e.aviso, 'END:VALARM');
        L.push('END:VEVENT');
      }
      L.push('END:VCALENDAR'); return L.join('\r\n') + '\r\n';
    }
    function icsRecordatorio(r) {
      const rr = { semana: 'FREQ=WEEKLY', mes: 'FREQ=MONTHLY', anio: 'FREQ=YEARLY' }[r.repetir];
      return ics([{ uid: r.id, titulo: (emojiRec(r) ? emojiRec(r) + ' ' : '') + r.titulo, fecha: r.fecha, hora: r.hora, nota: r.nota, rrule: rr, aviso: r.hora ? '-PT30M' : '-PT15H' }]);
    }
    function icsGuardias(desde, hasta) {
      return ics(guardiasNuestras(desde, hasta).map(i => ({
        uid: 'guardia-' + i.fecha, titulo: 'Guardia ' + farmacia(i.turno).nombre + (i.tomada ? ' (cambio)' : ''), fecha: i.fecha,
        nota: i.cambio && i.cambio.nota ? i.cambio.nota : '', aviso: '-PT15H',
      })));
    }

    if (migro) { try { raiz.localStorage && raiz.localStorage.setItem(CLAVE, JSON.stringify(E)); } catch (e) {} }
    return {
      E, farmacia, esNuestra, nuestras, oficial, info, guardiasNuestras, proximasNuestras, resumenMes,
      cambiar, volverOriginal, guardarRecordatorio, borrarRecordatorio, marcarHecho, recordatoriosDe, recordatoriosEntre,
      dia, guardarDia, guardarFarmacias, nuevoListado, borrarListado, setConfirmado, setCfg, exportar, importar,
      icsRecordatorio, icsGuardias, deshacer, emojiRec,
      guardarCita, citasDe, citasEntre, icsCita, borrarCita: id => borrarDe('citas', id, 'la cita borrada'),
      guardarTarea, tareaOk, tareasPendientes, tareasDe, borrarHechas, borrarTarea: id => borrarDe('tareas', id, 'la tarea borrada'),
      guardarNota, fijarNota, notasOrdenadas, borrarNota: id => borrarDe('notas', id, 'la nota borrada'),
      guardarHabito, borrarHabito, habitoHecho, tildarHabito, racha,
      guardarMeta, avanceMeta, borrarMeta: id => borrarDe('metas', id, 'la meta borrada'), hayDeshacer: () => atras.length > 0, set alGuardar(fn) { alGuardar = fn; },
    };
  }

  function cargar() {
    let g = null; try { g = JSON.parse(raiz.localStorage.getItem(CLAVE) || 'null'); } catch (e) {}
    return crear(g);
  }

  const F = { aD, aF, sumar, entre, diaSemana, lunesDe, hoyLocal, finDeMes, fechaLarga, fechaCorta, valida, MESES, DIAS };
  const api = { crear, cargar, inicial, F, CLAVE };
  if (typeof module !== 'undefined') module.exports = api; else raiz.Agenda = api;
})(typeof window !== 'undefined' ? window : globalThis);
