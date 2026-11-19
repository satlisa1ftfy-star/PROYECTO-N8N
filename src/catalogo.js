// Preguntas predeterminadas del chatbot. Son datos: agregar una pregunta = agregar un registro.
// Cada pregunta indica que perfiles la ven y como se arma el body que recibe el orquestador n8n.
//
// parametros: lo que el chat debe pedir al usuario antes de consultar.
//   { campo, etiqueta, placeholder, tipo: 'texto' | 'entero', requerido }

const con = (base, sesion) => {
  // Solo el jefe envia la unidad organica (igual que las pruebas N81/N82 de Postman)
  if (sesion.perfil === 'jefe' && sesion.siIdUniOrga) {
    return { ...base, siIdUniOrga: sesion.siIdUniOrga }
  }
  return base
}

export const PREGUNTAS = [
  // ---------- Consultas estructuradas (sin IA: rapidas y sin costo) ----------
  {
    id: 'listado-bandeja',
    icono: 'inbox',
    descripcion: 'Expedientes de su bandeja pendientes de trabajo.',
    texto: 'Ver mis expedientes pendientes',
    perfiles: ['tecnico'],
    usaIA: false,
    parametros: [],
    construir: (_v, s) => ({ tipoConsulta: 'LISTADO', perfil: s.perfil, pagina: 1, tamano: 15 }),
  },
  {
    id: 'listado-supervisor',
    icono: 'escudo',
    descripcion: 'Expedientes en espera de su validación.',
    texto: 'Ver expedientes por validar',
    perfiles: ['supervisor'],
    usaIA: false,
    parametros: [],
    construir: (_v, s) => ({ tipoConsulta: 'LISTADO', perfil: s.perfil, pagina: 1, tamano: 15 }),
  },
  {
    id: 'listado-jefe',
    icono: 'cerrado',
    descripcion: 'Expedientes cerrados de su unidad orgánica.',
    texto: 'Ver expedientes cerrados de mi unidad',
    perfiles: ['jefe'],
    usaIA: false,
    parametros: [],
    construir: (_v, s) => con({ tipoConsulta: 'LISTADO', perfil: s.perfil, pagina: 1, tamano: 15 }, s),
  },
  {
    id: 'resumen',
    icono: 'grafico',
    descripcion: 'Totales por estado y por serie documental.',
    texto: 'Resumen por estado y serie',
    perfiles: ['supervisor', 'jefe'],
    usaIA: false,
    parametros: [],
    construir: (_v, s) => con({ tipoConsulta: 'RESUMEN', perfil: s.perfil }, s),
  },
  {
    id: 'buscar-numero',
    icono: 'buscar',
    descripcion: 'Encuentre un expediente por su número.',
    texto: 'Buscar por número de expediente',
    perfiles: ['tecnico', 'supervisor', 'jefe'],
    usaIA: false,
    parametros: [
      { campo: 'numeroExpediente', etiqueta: 'Número de expediente (completo o parcial)', placeholder: 'Ej: OAF00020250000005', tipo: 'texto', requerido: true },
    ],
    construir: (v, s) =>
      con({ tipoConsulta: 'LISTADO', perfil: s.perfil, pagina: 1, tamano: 15, numeroExpediente: v.numeroExpediente }, s),
  },
  {
    id: 'buscar-asunto',
    icono: 'documento',
    descripcion: 'Busque por palabras del asunto.',
    texto: 'Buscar por palabras del asunto',
    perfiles: ['tecnico', 'supervisor', 'jefe'],
    usaIA: false,
    parametros: [
      { campo: 'asunto', etiqueta: 'Palabras del asunto', placeholder: 'Ej: contrato', tipo: 'texto', requerido: true },
    ],
    construir: (v, s) =>
      con({ tipoConsulta: 'LISTADO', perfil: s.perfil, pagina: 1, tamano: 15, asunto: v.asunto }, s),
  },

  // ---------- Preguntas con IA (PREGUNTA: mas lentas, 2 llamadas al modelo) ----------
  {
    id: 'ia-por-estado',
    icono: 'chispa',
    descripcion: 'La IA resume cuántos expedientes hay por estado.',
    texto: '¿Cuántos expedientes hay por estado?',
    perfiles: ['supervisor', 'jefe'],
    usaIA: true,
    parametros: [],
    construir: (_v, s) =>
      con({ tipoConsulta: 'PREGUNTA', perfil: s.perfil, pregunta: '¿Cuántos expedientes hay por estado?' }, s),
  },
  {
    id: 'ia-detalle',
    icono: 'chispa',
    descripcion: 'Pida un expediente por su id y la IA lo explica.',
    texto: 'Muéstrame un expediente (con IA)',
    perfiles: ['tecnico', 'supervisor', 'jefe'],
    usaIA: true,
    parametros: [{ campo: 'idExpediente', etiqueta: 'Id del expediente', placeholder: 'Ej: 697', tipo: 'entero', requerido: true }],
    construir: (v, s) =>
      con({ tipoConsulta: 'PREGUNTA', perfil: s.perfil, pregunta: `Muéstrame el expediente ${v.idExpediente}.` }, s),
  },
  {
    id: 'ia-trazabilidad',
    icono: 'chispa',
    descripcion: 'La IA cuenta el recorrido de estados de un expediente.',
    texto: '¿Por qué estados pasó un expediente? (con IA)',
    perfiles: ['tecnico', 'supervisor', 'jefe'],
    usaIA: true,
    parametros: [{ campo: 'idExpediente', etiqueta: 'Id del expediente', placeholder: 'Ej: 697', tipo: 'entero', requerido: true }],
    construir: (v, s) =>
      con({ tipoConsulta: 'PREGUNTA', perfil: s.perfil, pregunta: `¿Por qué estados pasó el expediente ${v.idExpediente}?` }, s),
  },
]

export const preguntasDePerfil = (perfil) => PREGUNTAS.filter((p) => p.perfiles.includes(perfil))

// Texto libre: se envia tal cual como PREGUNTA (3 a 500 caracteres, igual que el orquestador)
export const PREGUNTA_MIN = 3
export const PREGUNTA_MAX = 500

export const armarPreguntaLibre = (texto, sesion) => {
  const t = String(texto ?? '').trim()
  if (t.length < PREGUNTA_MIN || t.length > PREGUNTA_MAX) return null
  return con({ tipoConsulta: 'PREGUNTA', perfil: sesion.perfil, pregunta: t }, sesion)
}

// Acciones de una fila de listado: no obligan al usuario a conocer el id
export const consultaDetalle = (idExpediente) => ({ tipoConsulta: 'DETALLE', idExpediente })
export const consultaTrazabilidad = (idExpediente) => ({ tipoConsulta: 'TRAZABILIDAD', idExpediente })

// Valida los parametros que el usuario escribio; devuelve un mensaje o null
export const validarParametros = (pregunta, valores) => {
  for (const p of pregunta.parametros) {
    const v = String(valores[p.campo] ?? '').trim()
    if (p.requerido && v === '') return `Falta: ${p.etiqueta}.`
    if (p.tipo === 'entero' && v !== '' && !(Number.isInteger(Number(v)) && Number(v) >= 1)) {
      return `${p.etiqueta} debe ser un número entero positivo.`
    }
  }
  return null
}
