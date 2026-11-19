import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PREGUNTAS, preguntasDePerfil, armarPreguntaLibre, validarParametros, consultaDetalle } from '../src/catalogo.js'
import { construirSesion, rolDePerfil } from '../src/servicios/auth.js'
import { mensajeDeError, exigeNuevoLogin } from '../src/servicios/errores.js'
import { coberturaDe, datosParaVista, fechaCorta } from '../src/presentacion.js'

const sesionJefe = { perfil: 'jefe', siIdUniOrga: 10293 }
const sesionTecnico = { perfil: 'tecnico', siIdUniOrga: 10293 }

test('el tecnico no ve el resumen (el orquestador lo rechaza con PERMISO_001)', () => {
  const ids = preguntasDePerfil('tecnico').map((p) => p.id)
  assert.ok(!ids.includes('resumen'))
  assert.ok(!ids.includes('ia-por-estado'))
})

test('supervisor y jefe ven el resumen', () => {
  assert.ok(preguntasDePerfil('supervisor').some((p) => p.id === 'resumen'))
  assert.ok(preguntasDePerfil('jefe').some((p) => p.id === 'resumen'))
})

test('el listado del jefe envia la unidad organica; el del tecnico no', () => {
  const jefe = PREGUNTAS.find((p) => p.id === 'listado-jefe').construir({}, sesionJefe)
  assert.deepEqual(jefe, { tipoConsulta: 'LISTADO', perfil: 'jefe', pagina: 1, tamano: 15, siIdUniOrga: 10293 })
  const tecnico = PREGUNTAS.find((p) => p.id === 'listado-bandeja').construir({}, sesionTecnico)
  assert.equal(tecnico.siIdUniOrga, undefined)
})

test('el body del resumen coincide con la prueba N81 de Postman', () => {
  const body = PREGUNTAS.find((p) => p.id === 'resumen').construir({}, sesionJefe)
  assert.deepEqual(body, { tipoConsulta: 'RESUMEN', perfil: 'jefe', siIdUniOrga: 10293 })
})

test('la pregunta con IA "por estado" coincide con la prueba N82', () => {
  const body = PREGUNTAS.find((p) => p.id === 'ia-por-estado').construir({}, sesionJefe)
  assert.equal(body.tipoConsulta, 'PREGUNTA')
  assert.equal(body.pregunta, '¿Cuántos expedientes hay por estado?')
})

test('la pregunta libre exige entre 3 y 500 caracteres', () => {
  assert.equal(armarPreguntaLibre('ab', sesionJefe), null)
  assert.equal(armarPreguntaLibre('   ', sesionJefe), null)
  assert.equal(armarPreguntaLibre('a'.repeat(501), sesionJefe), null)
  assert.equal(armarPreguntaLibre('¿Hay expedientes?', sesionJefe).tipoConsulta, 'PREGUNTA')
})

test('validarParametros pide el id como entero positivo', () => {
  const p = PREGUNTAS.find((x) => x.id === 'ia-detalle')
  assert.match(validarParametros(p, {}), /Falta/)
  assert.match(validarParametros(p, { idExpediente: 'abc' }), /entero positivo/)
  assert.match(validarParametros(p, { idExpediente: '0' }), /entero positivo/)
  assert.equal(validarParametros(p, { idExpediente: '697' }), null)
})

test('detalle de una fila usa solo tipo e id', () => {
  assert.deepEqual(consultaDetalle(697), { tipoConsulta: 'DETALLE', idExpediente: 697 })
})

test('rolDePerfil replica el mapeo del front institucional', () => {
  assert.equal(rolDePerfil('JEFE', 'Jefe de oficina'), 'jefe')
  assert.equal(rolDePerfil('SUP', 'SUPERVISOR'), 'supervisor')
  assert.equal(rolDePerfil('', 'Secretaria'), 'supervisor')
  assert.equal(rolDePerfil('TEC', 'TECNICO'), 'tecnico')
  assert.equal(rolDePerfil('ADM', 'ADMINISTRADOR'), null)
})

test('construirSesion toma el token, el perfil activo y la unidad', () => {
  const { sesion } = construirSesion(
    {
      accessToken: 'tok',
      usuario: [
        {
          nombres: 'Ana',
          apellidos: 'Perez',
          idUniOrganica: ' 10293 ',
          perfiles: [
            { codigo: 'JEFE', nombre: 'JEFE', activoPerfil: true, activoAsignacion: true },
            { codigo: 'ADM', nombre: 'ADMIN', activoPerfil: true, activoAsignacion: true },
            { codigo: 'TEC', nombre: 'TECNICO', activoPerfil: true, activoAsignacion: false },
          ],
        },
      ],
    },
    'ana',
  )
  assert.equal(sesion.token, 'tok')
  assert.equal(sesion.perfil, 'jefe')
  assert.equal(sesion.siIdUniOrga, 10293)
  assert.deepEqual(sesion.perfiles.map((p) => p.rol), ['jefe'])
  assert.equal(sesion.usuario, 'ANA')
})

test('construirSesion rechaza un usuario sin perfil de consulta', () => {
  const r = construirSesion(
    { accessToken: 't', usuario: [{ perfiles: [{ codigo: 'ADM', nombre: 'ADMIN', activoAsignacion: true }] }] },
    'x',
  )
  assert.match(r.error, /perfil de consulta/)
})

test('los errores del orquestador se traducen a mensajes claros', () => {
  assert.match(mensajeDeError({ codigo: 'AUTH_002' }), /venció/)
  assert.match(mensajeDeError({ codigo: 'PERMISO_001' }), /perfil/)
  assert.match(mensajeDeError({ codigo: 'VALIDACION_007', detalle: 'pregunta corta' }), /pregunta corta/)
  assert.equal(exigeNuevoLogin({ codigo: 'AUTH_001' }), true)
  assert.equal(exigeNuevoLogin({ codigo: 'API_001' }), false)
})

test('cobertura: 100 de 1192 se muestra como parcial (caso T13)', () => {
  const resumen = { tipoConsulta: 'RESUMEN', total: 1192, analizados: 100, completo: false }
  const c = coberturaDe(resumen)
  assert.equal(c.completo, false)
  assert.equal(c.porcentaje, 8.4)
  assert.equal(c.texto, 'Analizados 100 de 1192 expedientes (8.4%)')
})

test('cobertura tambien se calcula cuando el resumen viene dentro de una PREGUNTA', () => {
  const pregunta = {
    tipoConsulta: 'PREGUNTA',
    respuesta: 'texto de la IA',
    datos: { tipoConsulta: 'RESUMEN', total: 1192, analizados: 100, completo: false },
  }
  assert.equal(coberturaDe(pregunta).total, 1192)
  assert.equal(datosParaVista(pregunta).tipoConsulta, 'RESUMEN')
})

test('cobertura completa y sin cobertura para otros tipos', () => {
  assert.equal(coberturaDe({ tipoConsulta: 'RESUMEN', total: 50, analizados: 50, completo: true }).completo, true)
  assert.equal(coberturaDe({ tipoConsulta: 'LISTADO', total: 5 }), null)
})

test('fechaCorta convierte AAAA-MM-DD a DD/MM/AAAA', () => {
  assert.equal(fechaCorta('2026-11-17'), '17/11/2026')
  assert.equal(fechaCorta(null), '—')
})

test('claseEstado asigna color segun el estado', async () => {
  const { claseEstado } = await import('../src/presentacion.js')
  assert.equal(claseEstado(11), 'ok')
  assert.equal(claseEstado('8'), 'info')
  assert.equal(claseEstado(10), 'warn')
  assert.equal(claseEstado(3), 'neutral')
  assert.equal(claseEstado(null), 'neutral')
})

test('iniciales del avatar', async () => {
  const { iniciales } = await import('../src/presentacion.js')
  assert.equal(iniciales('Carol Estalla'), 'CE')
  assert.equal(iniciales('ana'), 'A')
  assert.equal(iniciales(''), '?')
})

test('cada pregunta del catalogo tiene icono y descripcion', () => {
  for (const p of PREGUNTAS) {
    assert.ok(p.icono, `${p.id} sin icono`)
    assert.ok(p.descripcion, `${p.id} sin descripcion`)
  }
})
