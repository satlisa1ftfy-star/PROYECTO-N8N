// Traduce los codigos de error del orquestador n8n a mensajes para el usuario.

const MENSAJES = {
  AUTH_001: 'Su sesión no es válida. Ingrese de nuevo.',
  AUTH_002: 'Su sesión venció. Ingrese de nuevo.',
  PERMISO_001: 'Su perfil no puede hacer esta consulta.',
  NO_ENCONTRADO: 'No encontré ese expediente.',
  API_001: 'El servicio de expedientes no está disponible. Intente más tarde.',
  API_002: 'El servicio de expedientes dio una respuesta inesperada.',
  API_003: 'El servicio de expedientes devolvió información incompleta.',
  API_004: 'El servicio rechazó los filtros enviados. Revise los valores.',
  IA_001: 'El servicio de IA no está disponible ahora. Use los botones o intente luego.',
  IA_002: 'No pude interpretar la pregunta. Reformúlela o use los botones.',
  RED_001: 'No hay conexión con el orquestador. Verifique que n8n esté levantado.',
  RED_002: 'La consulta tardó demasiado. Intente de nuevo.',
  N8N_001: 'El orquestador no está activo. En n8n, active el workflow (Active).',
}

export const CODIGOS_SESION = ['AUTH_001', 'AUTH_002']

export const mensajeDeError = (data) => {
  const codigo = data?.codigo
  if (codigo && codigo.startsWith('VALIDACION_')) {
    return `Revise los datos: ${data.detalle || data.mensaje || 'valor no válido'}`
  }
  if (codigo && MENSAJES[codigo]) return MENSAJES[codigo]
  return data?.mensaje || 'No se pudo completar la consulta.'
}

// Detalle tecnico para diagnosticar (codigo + detalle que devuelve el orquestador)
export const detalleTecnico = (data) => {
  const partes = [data?.codigo, data?.detalle].filter(Boolean)
  return partes.join(' · ')
}

export const exigeNuevoLogin =(data) => CODIGOS_SESION.includes(data?.codigo)
