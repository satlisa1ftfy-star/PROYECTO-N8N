// Llamada al orquestador n8n (a traves del proxy /n8n de Vite).
// Siempre devuelve un objeto con "resultado": 'EXITOSO' | 'FUERA_DE_ALCANCE' | 'ERROR'.

const TIEMPO_MAXIMO_MS = 60000

export const consultar = async (body, token, { espera = TIEMPO_MAXIMO_MS } = {}) => {
  const control = new AbortController()
  const temporizador = setTimeout(() => control.abort(), espera)
  let respuesta
  try {
    respuesta = await fetch('/n8n', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
      signal: control.signal,
    })
  } catch (error) {
    const vencio = error?.name === 'AbortError'
    return {
      resultado: 'ERROR',
      codigo: vencio ? 'RED_002' : 'RED_001',
      mensaje: vencio ? 'La consulta tardó demasiado.' : 'Sin conexión con el orquestador.',
    }
  } finally {
    clearTimeout(temporizador)
  }

  let data = null
  try {
    data = await respuesta.json()
  } catch {
    data = null
  }
  if (data?.resultado) return data

  // n8n responde 404 con { code, message } cuando el workflow no esta activo
  if (respuesta.status === 404) {
    return { resultado: 'ERROR', codigo: 'N8N_001', mensaje: 'El orquestador no está activo.' }
  }
  return {
    resultado: 'ERROR',
    codigo: 'API_002',
    mensaje: `Respuesta inesperada del orquestador (HTTP ${respuesta.status}).`,
    detalle: `HTTP ${respuesta.status} del orquestador (no es una respuesta del workflow).`,
  }
}
