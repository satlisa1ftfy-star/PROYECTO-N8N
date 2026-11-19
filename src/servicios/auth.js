// Login contra el servicio de seguridad (a traves del proxy /seguridad de Vite).
// La clave NO se guarda en ningun lado. El token vive en sessionStorage (se borra al cerrar la pestana).

const CLAVE_SESION = 'ragflow_chat_sesion'
export const PERFILES_CHAT = ['tecnico', 'supervisor', 'jefe']

// Misma regla que el front institucional (authService.ts), limitada a los perfiles que consultan expedientes
export const rolDePerfil = (codigo, nombre) => {
  const texto = `${codigo || ''} ${nombre || ''}`.toUpperCase()
  if (texto.includes('ADMIN') || texto.includes('ARCHIVO CENTRAL') || texto.includes('ARCHIVOCENTRAL')) return null
  if (texto.includes('JEFE')) return 'jefe'
  if (texto.includes('SUPERVISOR') || texto.includes('SECRETARIA')) return 'supervisor'
  if (texto.includes('TECNICO') || texto.includes('TÉCNICO')) return 'tecnico'
  return null
}

const aEnteroPositivo = (v) => {
  const n = Number(String(v ?? '').trim())
  return Number.isInteger(n) && n >= 1 ? n : null
}

// Convierte la respuesta del login en la sesion del chat. Devuelve { sesion } o { error }
export const construirSesion = (data, usuarioIngresado) => {
  const principal = Array.isArray(data?.usuario) ? data.usuario[0] : null
  if (!data?.accessToken || !principal) {
    return { error: 'Respuesta de login no válida.' }
  }
  const perfiles = []
  for (const p of principal.perfiles ?? []) {
    if (p.activoAsignacion === false || p.activoPerfil === false) continue
    const rol = rolDePerfil(p.codigo, p.nombre)
    if (rol && !perfiles.some((x) => x.rol === rol)) perfiles.push({ rol, nombre: p.nombre || p.codigo })
  }
  if (perfiles.length === 0) {
    return { error: 'Su usuario no tiene un perfil de consulta (técnico, supervisor o jefe).' }
  }
  return {
    sesion: {
      token: data.accessToken,
      usuario: String(usuarioIngresado).toUpperCase(),
      nombre: `${principal.nombres ?? ''} ${principal.apellidos ?? ''}`.trim() || String(usuarioIngresado).toUpperCase(),
      perfiles,
      perfil: perfiles[0].rol,
      siIdUniOrga: aEnteroPositivo(principal.idUniOrganica),
    },
  }
}

export const iniciarSesion = async (usuario, clave) => {
  const u = String(usuario ?? '').trim()
  if (u === '' || String(clave ?? '') === '') return { error: 'Ingrese usuario y clave.' }

  let respuesta
  try {
    respuesta = await fetch('/seguridad/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ usuario: u.toUpperCase(), clave }),
    })
  } catch {
    return { error: 'No se pudo conectar con el servicio de seguridad. Revise SEGURIDAD_URL en el archivo .env.' }
  }
  if (respuesta.status === 401 || respuesta.status === 403 || respuesta.status === 400) {
    return { error: 'Usuario o clave incorrectos.' }
  }
  if (!respuesta.ok) {
    return { error: `El servicio de seguridad respondió ${respuesta.status}.` }
  }
  let data = null
  try {
    data = await respuesta.json()
  } catch {
    return { error: 'Respuesta de login no válida.' }
  }
  const resultado = construirSesion(data, u)
  if (resultado.sesion) guardarSesion(resultado.sesion)
  return resultado
}

export const guardarSesion = (sesion) => {
  try {
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion))
  } catch {
    /* sin almacenamiento: la sesion vive solo en memoria */
  }
}

export const leerSesion = () => {
  try {
    const crudo = sessionStorage.getItem(CLAVE_SESION)
    const s = crudo ? JSON.parse(crudo) : null
    return s?.token && PERFILES_CHAT.includes(s.perfil) ? s : null
  } catch {
    return null
  }
}

export const cerrarSesion = () => {
  try {
    sessionStorage.removeItem(CLAVE_SESION)
  } catch {
    /* nada que hacer */
  }
}
