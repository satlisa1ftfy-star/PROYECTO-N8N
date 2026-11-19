// Helpers de presentacion: deciden que vista mostrar y calculan la cobertura del resumen.

// "Analizados X de Y": sale de los datos del orquestador, NO del texto de la IA.
// Sirve para un RESUMEN directo y para una PREGUNTA cuyos datos son un resumen.
export const coberturaDe = (data) => {
  const resumen = data?.tipoConsulta === 'RESUMEN' ? data : data?.datos?.tipoConsulta === 'RESUMEN' ? data.datos : null
  if (!resumen || !Number.isInteger(resumen.total) || !Number.isInteger(resumen.analizados)) return null
  const completo = resumen.completo === true || resumen.analizados >= resumen.total
  const porcentaje = resumen.total > 0 ? Math.round((resumen.analizados / resumen.total) * 1000) / 10 : 100
  return {
    analizados: resumen.analizados,
    total: resumen.total,
    completo,
    porcentaje,
    texto: completo
      ? `Cobertura completa: ${resumen.total} expedientes`
      : `Analizados ${resumen.analizados} de ${resumen.total} expedientes (${porcentaje}%)`,
  }
}

// Datos a dibujar (para una PREGUNTA, los datos consultados viajan en "datos")
export const datosParaVista = (data) => (data?.tipoConsulta === 'PREGUNTA' ? data.datos ?? null : data)

export const etiquetaTipo = (tipo) =>
  ({
    LISTADO: 'Listado',
    DETALLE: 'Detalle',
    TRAZABILIDAD: 'Trazabilidad',
    RESUMEN: 'Resumen',
    PREGUNTA: 'Pregunta con IA',
  })[tipo] ?? tipo

// Fecha AAAA-MM-DD -> DD/MM/AAAA (los eventos de trazabilidad ya vienen en DD/MM/AAAA)
export const fechaCorta = (f) => {
  if (typeof f !== 'string' || f === '') return '—'
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(f)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : f
}

// Color del estado segun el id (equivalencias del flujo: 11 cerrado, 8/9 validado, 4/5/10 en proceso)
export const claseEstado = (id) => {
  const n = Number(id)
  if (n === 11) return 'ok'
  if (n === 8 || n === 9) return 'info'
  if (n === 4 || n === 5 || n === 10) return 'warn'
  return 'neutral'
}

// Iniciales para el avatar: "Carol Estalla" -> "CE"
export const iniciales = (nombre) => {
  const partes = String(nombre ?? '').trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  const a = partes[0][0]
  const b = partes.length > 1 ? partes[1][0] : ''
  return (a + b).toUpperCase()
}

export const horaActual = () =>
  new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })
